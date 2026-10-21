# HypeCast — Turn Your Crowd Into the Show.

A modern Firebase-powered event engagement **starter application** with organizer pages, guest joining, live voting, moderation, demo mode, basic projector scenes, event settings, themes, schedules, sponsors and initial analytics.

## Quick start

1. Install Node.js 22+, then run `npm install` in this folder.
2. Copy `.env.example` to `.env` and populate your Firebase Web App configuration.
3. Create a Firebase project on the Blaze plan (Cloud Functions generally require billing). Enable Firestore, Authentication (Anonymous, Email/Password, Google), and Storage.
4. Install Firebase CLI: `npm install -g firebase-tools`, run `firebase login`, then `firebase use --add` to select your Firebase project.
5. Run `cd functions && npm install && cd ..`.
6. Deploy backend configuration: `firebase deploy --only firestore,functions,storage`.
7. Run `npm run dev` and open the local URL shown. For hosting: `npm run build && firebase deploy --only hosting`.
8. Use `/demo` before configuring Firebase to explore sample screens. For actual multi-device interaction, use a real Firebase project.

## Security and limitations — read before production use

This is a **working foundation, not a complete launch-ready SaaS**. The following are NOT production-complete:
- PayPal checkout, subscription webhooks, refunds, immutable transaction ledger and reconciliation.
- SMS verification, verified invitations, true event geofencing, and secure display pairing.
- Photo processing/approved image delivery; upload is deliberately disabled in the UI.
- Team invitations and role management, automatic schedule execution, sponsor ad rotation, marketplace purchases.
- Real attendance tracking, advanced analytics, robust anti-abuse/rate limiting, App Check enforcement, performance tests, full accessibility audits, and legal/privacy pages.
- Firestore owner poll updates can be used to edit counters by a malicious organizer; if vote integrity matters, restrict organizer updates to a dedicated backend admin function and separate immutable totals.
- Anonymous guest accounts are not proof of a unique human. Use stronger event policies for prize-bearing votes.
- Host-side access configuration is a preview and not all provider combinations are supported; do not advertise unimplemented verification as secure.
- A public event document is readable by anyone. Do not place private secrets, sensitive attendee details or confidential venue information in it.
- Projector route is currently public and must be paired/authorized before commercial deployment.
- Functions have App Check disabled for local ease. Configure and enforce App Check plus rate limits before launch.

## Recommended next build increments

1. Harden event permissions, server-side host actions, multi-tenant organization model, secure display pairing.
2. Build fully verified guest policies, location proof and QR check-in.
3. Add photo moderation/processing and scheduled scene automation.
4. Integrate PayPal server-side Orders/Subscriptions API, signed webhooks, ledger and refunds. Use PayPal sandbox first; keep all secrets server-side.
5. Add invitation acceptance, template marketplace, sponsor rotation, reports, audit logs, billing and usage limits.
6. Add monitoring, load tests, backups, data retention, support workflows, terms and privacy notices.

## Routes

`/` marketing · `/demo` interactive preview · `/login` authentication · `/dashboard` organizer events · `/new` create event · `/host/:id` host control center · `/e/:id` attendee view · `/display/:id` projector view · `/templates` previews · `/pricing` proposed pricing.

## Important setup notes

This project does not include or require any private API keys in the repository. Never commit `.env` or PayPal secrets. Use Firebase Functions secrets for PayPal server credentials. Firebase client config is not a secret, but security rules and App Check still matter. For larger audiences, move poll counts to a scalable aggregation design and load-test before production.
