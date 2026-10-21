import admin from "firebase-admin";

const uid = process.argv[2];

if (!uid) {
  console.error("Usage: node scripts/grant-admin.mjs <UID>");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "hypecast-bb1dd"
});

try {
  const user = await admin.auth().getUser(uid);

  const existingClaims = user.customClaims || {};

  await admin.auth().setCustomUserClaims(uid, {
    ...existingClaims,
    platformAdmin: true
  });

  console.log("SUCCESS: Platform administrator access granted.");
  console.log("UID:", uid);
  console.log("Email:", user.email || "No email associated");
  console.log("Sign out and back in to refresh your permissions.");
} catch (error) {
  console.error("Failed to grant admin access:", error.message);
  process.exitCode = 1;
}
