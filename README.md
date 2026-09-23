# Founder's Seat — waitlist site

Landing page and waitlist for **Founder's Seat**, a grand-strategy simulation where MBA students, future founders, founder's office and strategy professionals run a startup from a single command dashboard.

- `index.html`: the whole site, one self-contained page. It's responsive and has no build step.
- `Code.gs`: a Google Apps Script that appends each signup to a Google Sheet.

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
