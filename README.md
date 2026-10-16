# Founder's Seat

A grand-strategy simulation where MBA students, future founders, founder's office and strategy professionals run a startup from a single command dashboard.

**Live: https://fintech.pelicanx.in/founders-seat/**. It is served from the `founders-seat/` folder of the `fintech-dashboard` repo, which hosts fintech.pelicanx.in. This repo's GitHub Pages site (kokosheesh.github.io/founders-seat) only redirects there.

## What's here
The site itself (landing page, `play/`, `admin/` and the policy pages) now lives in `fintech-dashboard/founders-seat/`, and that copy is the one to edit. This repo's `index.html`, `play/index.html` and `admin/index.html` only redirect there; the older JavaScript files under `play/` are kept for history.

The game is made of these files in `fintech-dashboard/founders-seat/play/`:
- `engine.js`: core simulation.
- `systems.js`: growth, experiments, the feature library, ops, partners, deals, crises, goals and reports.
- `auth.js`: email and Google sign-in, play tracking, the 7-day trial and the ₹269 unlock.
- `ui.js`, `ui2.js`: the interface.
- `simple.js`: the Simple view, which keeps only key numbers visible and folds the rest behind a click.
- `fx.js`: celebration and alert graphics and synthesised sounds, with a mute button.

This repo keeps the back end:
- `supabase/schema.sql` then `supabase/v3_paywall.sql`: tables, row-level security, stats, the trial and paywall logic. Run both in the Supabase SQL editor; both are safe to re-run.
- `supabase/functions/phonepe/index.ts`: edge function for PhonePe checkout. Deploy it with "Verify JWT" off; the secrets it needs are listed at the top of the file.
- `Code.gs`: the Google Apps Script behind the waitlist form.

## Accounts, trial and payments
- Players sign in with email and password or with Google. "Confirm email" is off, so a class can sign up at once.
- Every new account gets 7 days of full access. After that, `my_access()` returns `expired` and the game shows the paywall.
- Paying creates a row in `payments`. The edge function marks it `COMPLETED` only after PhonePe's order-status API confirms the payment and the amount.
- Emails in `access_grants` skip the paywall (cohort licences, pilots). Manage them from `/admin/`.
- Price and trial length live in the `app_settings` table.
- The paywall is enforced in the browser. A technical user could bypass it by editing the game's JavaScript. That is acceptable for a ₹269 game; real enforcement would need the game served from behind a server.

## Stats
`/admin/` shows sign-ups, logins per day, games, paid players, revenue and free-access emails. Only the owner email in `app_settings` can load it.

## Waitlist
The landing page form posts to the Apps Script web app, which writes to the `Waitlist` tab of the Sheet. See `Code.gs`.
