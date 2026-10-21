import {initializeApp} from 'firebase/app';
import {getAuth,GoogleAuthProvider,OAuthProvider,signInWithPopup,signInAnonymously,signInWithEmailAndPassword,createUserWithEmailAndPassword,onAuthStateChanged,signOut,updateProfile,linkWithPopup} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';
import {getFunctions,connectFunctionsEmulator} from 'firebase/functions';
import {getStorage} from 'firebase/storage';
const config={apiKey:import.meta.env.VITE_FIREBASE_API_KEY,authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,storageBucket:import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,appId:import.meta.env.VITE_FIREBASE_APP_ID,messagingSenderId:import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID};
export const configured=Boolean(config.apiKey&&config.projectId&&config.appId);
export let auth=null,db=null,functions=null,storage=null;
if(configured){const app=initializeApp(config);auth=getAuth(app);db=getFirestore(app);functions=getFunctions(app);storage=getStorage(app);if(import.meta.env.VITE_USE_EMULATORS==='true')connectFunctionsEmulator(functions,'127.0.0.1',5001);}
export {GoogleAuthProvider,OAuthProvider,signInWithPopup,signInAnonymously,signInWithEmailAndPassword,createUserWithEmailAndPassword,onAuthStateChanged,signOut,updateProfile,linkWithPopup};
