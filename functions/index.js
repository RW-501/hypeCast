import {onCall,HttpsError} from 'firebase-functions/v2/https';
import {initializeApp} from 'firebase-admin/app';
import {getFirestore,FieldValue} from 'firebase-admin/firestore';
initializeApp();const db=getFirestore();
const err=(msg,code='failed-precondition')=>{throw new HttpsError(code,msg)};
const required=(v,max=200)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
async function context(req){if(!req.auth)err('Sign in to continue','unauthenticated');const eventId=req.data?.eventId;if(!required(eventId,128))err('Invalid event');const ref=db.doc(`events/${eventId}`),s=await ref.get();if(!s.exists)err('Event not found','not-found');return {ref,eventId,event:s.data(),uid:req.auth.uid};}
async function staff(c){if(c.event.ownerId===c.uid)return true;const m=await db.doc(`events/${c.eventId}/team/${c.uid}`).get();return m.exists&&['owner','admin','moderator'].includes(m.data().role)}
async function participant(c){const p=await db.doc(`events/${c.eventId}/participants/${c.uid}`).get();if(!p.exists)err('Join event first','permission-denied');return p.data()}
export const joinEvent=onCall({enforceAppCheck:false},async req=>{const c=await context(req);if(c.event.visibility!=='public')err('Event is not public','permission-denied');if(!required(req.data.name,60))err('Enter a display name','invalid-argument');const mode=c.event.access?.mode||'guest',methods=c.event.access?.methods||['guest'];if(c.event.access?.geofence)err('Venue verification is not yet available');if(mode==='verified')err('Verified event access is not enabled in this build');if(mode==='required'&&req.auth.token.firebase.sign_in_provider==='anonymous')err('Account sign-in required','permission-denied');if(!methods.includes('guest')&&req.auth.token.firebase.sign_in_provider==='anonymous')err('Guest access is disabled','permission-denied');const provider=req.auth.token.firebase.sign_in_provider;
if(provider==='google.com'&&!methods.includes('google'))err('Google login is not allowed for this event','permission-denied');
if(provider==='apple.com'&&!methods.includes('apple'))err('Apple login is not allowed for this event','permission-denied');
if(provider==='phone'&&!methods.includes('phone'))err('Phone login is not allowed for this event','permission-denied');
if(provider==='password'&&!methods.includes('email'))err('Email login is not allowed for this event','permission-denied');
const p=db.doc(`events/${c.eventId}/participants/${c.uid}`);await p.set({name:req.data.name.trim(),joinedAt:FieldValue.serverTimestamp(),uid:c.uid},{merge:true});await db.doc(`users/${c.uid}`).set({uid:c.uid,displayName:req.data.name.trim(),isGuest:req.auth.token.firebase.sign_in_provider==='anonymous',updatedAt:FieldValue.serverTimestamp()},{merge:true});await db.doc(`users/${c.uid}/activities/join_${c.eventId}`).set({eventId:c.eventId,eventName:c.event.name,type:'Joined event',createdAt:FieldValue.serverTimestamp()},{merge:true});return {ok:true};});
export const castVote=onCall({enforceAppCheck:false},async req=>{const c=await context(req);await participant(c);const {pollId,optionId}=req.data;if(!required(pollId,128)||!required(optionId,128))err('Invalid option','invalid-argument');const p=db.doc(`events/${c.eventId}/polls/${pollId}`),vote=p.collection('votes').doc(c.uid);await db.runTransaction(async tx=>{const [ps,vs]=await Promise.all([tx.get(p),tx.get(vote)]);if(!ps.exists||ps.data().status!=='open')err('Poll is closed');if(ps.data().endsAt&&ps.data().endsAt.toMillis()<=Date.now())err('Voting time has expired');if(vs.exists)err('You already voted','already-exists');const options=ps.data().options||[];const index=options.findIndex(o=>o.id===optionId);if(index<0)err('Invalid option','invalid-argument');options[index]={...options[index],count:Number(options[index].count||0)+1};tx.create(vote,{optionId,uid:c.uid,createdAt:FieldValue.serverTimestamp()});tx.update(p,{options});});await db.doc(`users/${c.uid}/activities/vote_${c.eventId}_${pollId}`).set({eventId:c.eventId,eventName:c.event.name,type:'Voted',title:(await p.get()).data().title,pollId,createdAt:FieldValue.serverTimestamp()},{merge:true});return {ok:true};});
export const submitMessage=onCall({enforceAppCheck:false},async req=>{const c=await context(req);const p=await participant(c);if(!required(req.data.text,300))err('Message must be 1–300 characters','invalid-argument');const r=await db.collection(`events/${c.eventId}/messages`).add({name:p.name,uid:c.uid,text:req.data.text.trim(),status:'pending',createdAt:FieldValue.serverTimestamp()});return {id:r.id};});
export const moderateContent=onCall({enforceAppCheck:false},async req=>{const c=await context(req);if(!await staff(c))err('Staff only','permission-denied');const {kind,id,status}=req.data;if(!['messages','media'].includes(kind)||!required(id,128)||!['approved','rejected'].includes(status))err('Invalid moderation request','invalid-argument');const ref=db.doc(`events/${c.eventId}/${kind}/${id}`);if(!(await ref.get()).exists)err('Content not found','not-found');await ref.update({status,moderatedBy:c.uid,moderatedAt:FieldValue.serverTimestamp()});return {ok:true};});

export const setPollStatus=onCall({enforceAppCheck:false},async req=>{const c=await context(req);if(!await staff(c))err('Staff only','permission-denied');const {pollId,status}=req.data||{};if(!required(pollId,128)||!['open','closed'].includes(status))err('Invalid poll state','invalid-argument');const ref=db.doc(`events/${c.eventId}/polls/${pollId}`);await db.runTransaction(async tx=>{const snap=await tx.get(ref);if(!snap.exists)err('Poll not found','not-found');const p=snap.data();if(status==='open'){const seconds=Number(p.durationSeconds||0);tx.update(ref,{status:'open',startedAt:FieldValue.serverTimestamp(),endsAt:seconds>0?new Date(Date.now()+seconds*1000):null});}else tx.update(ref,{status:'closed',closedAt:FieldValue.serverTimestamp()});});return {ok:true};});


// Platform-wide administration is server-only. Never trust a client-side admin flag.
import {getAuth} from 'firebase-admin/auth';
export const getPlatformOverview=onCall({enforceAppCheck:false},async req=>{
 if(!req.auth || req.auth.token.platformAdmin!==true)err('Platform administrator access required','permission-denied');
 const [authUsers,eventSnap]=await Promise.all([getAuth().listUsers(1000),db.collection('events').orderBy('createdAt','desc').limit(30).get()]);
 // Accurate count across all Firebase Auth pages, not only the first 1,000 users.
 let registeredUsers=0,anonymousUsers=0;
 let pageToken;
 do{
  const page=pageToken?await getAuth().listUsers(1000,pageToken):authUsers;
  for(const user of page.users){
   const anonymous=user.providerData.length===0&&!user.email&&!user.phoneNumber;
   if(anonymous)anonymousUsers++;else registeredUsers++;
  }
  pageToken=page.pageToken;
 }while(pageToken);
 const events=eventSnap.docs.map(s=>{const d=s.data();return {id:s.id,name:d.name||'',ownerId:d.ownerId||'',status:d.status||'',createdAt:d.createdAt?.toDate?.()?.toISOString?.()||''}});
 // Total event count is computed by Firestore's server-side count aggregation.
 const count=await db.collection('events').count().get();
 return {registeredUsers,anonymousUsers,totalUsers:registeredUsers+anonymousUsers,eventCount:count.data().count,events};
});
