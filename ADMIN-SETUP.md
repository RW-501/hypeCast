# HypeCast platform administrator setup

This update adds a real, Firebase-custom-claim-protected **Admin Console** at `https://rw-501.github.io/hypeCast/#admin`. It does **not** provide an admin password, impersonation, billing management, or unrestricted Firestore access.

## 1. Sign in to Firebase Authentication

Open your deployed HypeCast site and sign in with an existing **registered** account (Google or email/password). If email/password is not enabled in Firebase, use Google. In Firebase Console > Authentication > Users, find that account and copy its **User UID**. Do not use an anonymous guest UID.

## 2. Grant admin access securely

Download a service-account JSON key from Firebase Console > Project settings > Service accounts > Generate new private key. This key is extremely sensitive: keep it **outside the repository**, never upload it to GitHub or paste it into chat. Prefer a temporary key and delete/revoke it after granting access. This setup uses a service-account key for simplicity; Application Default Credentials with appropriate IAM roles are an alternative.

In PowerShell (replace the file path and UID):

```powershell
cd "$HOME\Downloads\hypeCast-github\functions"
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\secure\hypecast-service-account.json"
node scripts/grant-admin.mjs "PASTE_YOUR_FIREBASE_USER_UID_HERE"
Remove-Item Env:GOOGLE_APPLICATION_CREDENTIALS
```

Do not put the service-account JSON in the project directory. Delete or revoke the key in Google Cloud IAM after use.

## 3. Deploy backend

From the repository root:

```powershell
cd "$HOME\Downloads\hypeCast-github"
firebase use hypecast-bb1dd
firebase deploy --only functions:getPlatformOverview
```

Deploying Cloud Functions may require the Firebase Blaze billing plan and appropriate Google Cloud APIs. The backend must be deployed separately from GitHub Pages.

## 4. Publish frontend

Copy this update's files into your existing cloned repository. Run `npm install`, `npm run build`, then `git add .`, `git commit -m "Add secure HypeCast admin console"`, `git push origin main`. Wait for GitHub Actions.

Your GitHub Pages workflow must inject `VITE_FIREBASE_*` build-time variables; `.env` is intentionally ignored. Add the **public Firebase web config** in the workflow's `env:` block or GitHub Actions Variables. Do not put a service-account private key in the workflow or Vite variables.

Sign out and sign back in to refresh your Firebase ID token, then open `https://rw-501.github.io/hypeCast/#admin`.

## Scope and limitations

The Admin Console displays total Firebase Auth users, anonymous vs registered accounts, event count, and 30 recent events. It is protected on the server by the `platformAdmin` custom claim. The existing organizer studio and demo remain available. Full commercial platform administration, refunds, subscriptions, staff controls, and complete analytics are **not** yet implemented. The overview enumerates Auth users, so for very large user bases it should be replaced with maintained counters.
