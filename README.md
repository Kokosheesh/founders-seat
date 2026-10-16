# Founder's Seat

Landing page and waitlist for **Founder's Seat**, a grand-strategy simulation where MBA students, future founders, founder's office and strategy professionals run a startup from a single command dashboard.

- `index.html`: the landing page with the waitlist and the PLAY NOW button. It's responsive and has no build step.
- `Code.gs`: a Google Apps Script that appends each waitlist signup to a Google Sheet.
- `play/`: the playable game (no build step).
  - `engine.js`: core simulation: cash, customers, team, events, fundraising, scoring.
  - `systems.js`: growth channels and funnel, A/B experiments, the feature library, operations, partners, enterprise deals, crises, goals, and the P&L, cash-flow and MIS reports.
  - `auth.js`: player accounts and play tracking through Supabase.
  - `ui.js` and `ui2.js`: the interface.
- `admin/`: owner-only stats dashboard (players, logins per day, games).
- `supabase/schema.sql`: tables, row-level security and the stats function. Run it once in the Supabase SQL editor.

## Player accounts and stats
Players sign up with email and password through Supabase Auth (project `xxdxuuqmftxufvnkkuif`). "Confirm email" is off so a whole class can sign up at once without hitting Supabase's email limits.

- `players`: one row per account (name, email, college or company, last seen).
- `logins`: one row per player per day (India time).
- `games`: one row per game, updated every month played.
- `daily_stats`: a view with sign-ups, players logged in, games started and finished per day.

The dashboard at `/admin/` calls `admin_stats()`, which only returns data to the owner email set in `schema.sql`. The key in `auth.js` is Supabase's publishable key. It is meant to be public, because row-level security limits each player to their own rows.

## How signups work
The form POSTs `email`, `role`, `source` (hero or footer form), UTM params, referrer and page to the Apps Script web app. The script writes one row to the `Waitlist` tab and ignores duplicate emails. A hidden honeypot field filters simple bots.

### Setting up the Sheet (one time)
1. Create a Google Sheet and a new Apps Script project (script.new).
2. Paste in this repo's `Code.gs`, set `SPREADSHEET_ID` to your Sheet's ID (the long string in its URL), and save.
3. Go to **Deploy → New deployment → Web app**. Set *Execute as: Me* and *Who has access: Anyone*, then authorise.
4. Copy the `/exec` URL into `WAITLIST_ENDPOINT` near the bottom of `index.html` and commit.

If you edit the script later, use **Deploy → Manage deployments → Edit → New version** so the URL stays the same.

## Hosting
GitHub Pages serves from `main` / root. To use a custom domain, add a `CNAME` file and point DNS at GitHub Pages.
