# Friend CRM

A private, single-user tool for keeping track of friends: birthday
reminders, primary/secondary contact tiers, notes, and a way to message
someone from your own account. It deliberately does **not** pull profile
data (posts, location, details) off Facebook/Instagram/TikTok without each
person's own consent — that access doesn't exist through any official API
since the 2018 friend-graph lockdown, and scraping around it would mean
harvesting personal data about real people without their knowledge. See
"Where the data comes from" below.

## Where the data comes from

Two legitimate, user-authorized sources are wired up, plus manual entry:

1. **Facebook's own birthdays calendar feed.** Facebook publishes an
   `.ics`/`webcal://` export of your own "Upcoming birthdays" list
   (Facebook → Events → Birthdays → Export). This is a feature Facebook
   built for exactly this purpose — subscribing to it isn't scraping. It
   only ever gives month/day (Facebook does not expose real birth years
   through this feed), which the importer respects rather than guessing.
2. **Your own Google Contacts**, via the official People API and a normal
   OAuth consent flow. This only reads what's already saved in your own
   address book (`contacts.readonly` scope) — never someone else's data
   they haven't put there themselves.
3. **Manual entry** for anything else (location beyond what's in your
   contacts, tags, freeform notes, tier).

Imports match by name and only fill in *missing* fields on an existing
friend — they never overwrite a tier, tags, or notes you've set yourself.
A new person created purely from an import is flagged "needs review" so a
name-matching mistake is visible instead of silently merged into the wrong
record.

## Messaging

Sending a message always acts as *you*, never as the friend:

- **Email** (default): the app has no mailbox credentials, so it hands
  back a `mailto:` link that opens in your own mail client, sent from your
  own account.
- **Webhook**: an extension point. Set `socials.webhookUrl` on a friend to
  your own automation (e.g. a Zapier/Make webhook you've wired to the
  Messenger or Instagram DM API using your own OAuth token) and the app
  will POST the message there. There's no built-in integration that posts
  directly to a platform, because that would require holding your own
  verified developer app credentials for each platform — set that up
  yourself and point the webhook at it.

## Setup

```bash
npm install
cp .env.example .env   # fill in Google OAuth credentials if you want contacts import
npm start
```

Then open http://localhost:3000.

- **Facebook import**: paste your `webcal://` birthdays feed URL into the
  box in the UI (or set `FACEBOOK_BIRTHDAYS_ICS_URL` in `.env`) and click
  "Import Facebook birthdays".
- **Google Contacts import**: create an OAuth client in the
  [Google Cloud Console](https://console.cloud.google.com) with the People
  API enabled, add the redirect URI from `.env.example`, fill in
  `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` in `.env`, then click "Connect
  Google" followed by "Import Google contacts".

## Tests

```bash
npm test
```

Covers the pure logic: birthday date math, `.ics` parsing (including
RFC 5545 line folding), and the name-matching merge/dedup rules. The
Facebook feed fetch and Google OAuth flow need real credentials and aren't
covered by automated tests here — verify those manually against your own
account.

## Data storage

Everything is stored locally in `data/*.json` (gitignored) — no external
database, no data leaves your machine except the two API calls you
explicitly trigger (fetching your Facebook feed, fetching your Google
contacts).
