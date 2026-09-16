# Friend CRM (mobile)

A native Expo/React Native app: birthday reminders, primary/secondary
contact tiers, notes, and messaging — all stored on your phone, no backend
server. This is the mobile counterpart to `../friend-crm` (the web
version), rebuilt from scratch as an installable app rather than a website,
per the same scope agreed for the web version: no scraping or auto-pull of
friends' data from Facebook/Instagram/TikTok. See "Where the data comes
from" below.

## Preview it on your phone right now

```bash
npm install
npx expo start
```

Scan the QR code with the **Expo Go** app (free, on the App Store / Play
Store) on your own phone. No developer account, no build step, no store
submission needed for this. Edits you make reload live on the phone.

## Where the data comes from

Same model as the web version:

1. **Facebook's own birthdays calendar feed** (`.ics`/`webcal://`, from
   Facebook → Events → Birthdays → Export). Works today in Expo Go — the
   app fetches and parses it directly, on-device. Facebook doesn't expose
   real birth years through this feed, so only month/day come through.
2. **Your own Google Contacts**, via OAuth + the People API
   (`contacts.readonly`). **Requires a development build, not Expo Go** —
   see below.
3. **Manual entry** for everything else.

Imports match by name and only fill in missing fields on an existing
friend; new people created purely from an import are flagged "needs
review" in the UI.

## Google Contacts import: needs a development build

Google's OAuth redirect for a native app needs a stable custom URL scheme
tied to the app's real package name/bundle ID and signing key — Expo Go
can't do this because every project runs under Expo Go's own shared
identity, and Expo's older hosted auth-proxy workaround for this no longer
exists in this SDK. None of the steps below can be done from an
environment without your own Google/Expo accounts, so this is written for
you to run yourself (Android first — it's the simpler path: no paid
developer account, no Mac needed).

**1. Get an Expo account and the EAS CLI** (skip if you already have both):

```bash
npm install -g eas-cli
eas login          # free account at expo.dev if you don't have one
```

**2. From `mobile/`, let EAS create/manage the Android signing keystore**
and print its SHA-1 fingerprint — you need this before Google will issue a
client ID:

```bash
eas credentials
# Select: Android -> your project -> Keystore -> Set Up a New Keystore
# (or "Use existing" if you already have one), then view its details.
# Copy the "SHA1 Fingerprint" value shown.
```

**3. In [Google Cloud Console](https://console.cloud.google.com):**

- Create or select a project, then enable the **People API**
  (APIs & Services → Library → search "People API" → Enable).
- Configure the **OAuth consent screen** (External is fine for testing —
  add your own Google account under "Test users" so you can sign in
  without publishing the app for review).
- **Credentials → Create Credentials → OAuth client ID → Android.**
  - Package name: whatever's in `app.json` → `expo.android.package`
    (`com.example.friendcrm` by default — fine for testing; change it to
    something you own before a real store submission).
  - SHA-1 certificate fingerprint: paste the value from step 2.
- Copy the resulting **Client ID**.

**4. Wire the client ID into the app** — edit `app.json`:

```json
"extra": {
  "googleAndroidClientId": "PASTE_YOUR_CLIENT_ID_HERE.apps.googleusercontent.com"
}
```

**5. Build and install the development build:**

```bash
eas build --profile development --platform android
```

This builds in Expo's cloud (a few minutes) and gives you a link/QR code
to download and install the `.apk` directly on your Android phone —
no Play Store step needed for this.

**6. Run against it:**

```bash
npx expo start --dev-client
```

Open the installed dev-build app (not Expo Go) on your phone, scan the QR
code, and the "Sign in & import Google contacts" button on the Import
screen will now complete the OAuth flow correctly.

**iOS** follows the same shape (`eas credentials` → iOS → get the bundle
ID, `eas build --profile development --platform ios --simulator` if you
have a Mac to run the simulator, or a real device build if you have a paid
Apple Developer account for provisioning) — ask if you want the exact
steps once Android is working.

Nothing is persisted from this flow — the access token is used once for
the import and discarded, so there's no refresh token or credential
sitting on the device between imports.

## Birthday reminders

Local notifications via `expo-notifications` — no push server involved.
On first launch (and after every edit/import) the app reschedules a
recurring yearly notification for each friend's birthday, plus a
reminder 3 days ahead. You'll be prompted for notification permission the
first time. These fire even if the app isn't open.

## Messaging

Always sent from your own account, via whatever app you pick — never
posted as the friend:

- **Share…** opens the OS share sheet (Messages, WhatsApp, anything else
  installed).
- **Email** opens the native mail composer, if the friend has an email on
  file.
- **Text** opens the native SMS composer, if the friend has a phone number
  on file.

## Tests

```bash
npm test
```

Covers the pure logic (birthday date math including the Feb 29 edge case,
`.ics` parsing with RFC 5545 line folding, and the name-matching merge/dedup
rules) — the same cases as the web version's test suite, ported to
Jest/TypeScript. Also verified with `npx tsc --noEmit` (clean) and
`npx expo export --platform ios|android` (both bundle without errors) as a
build smoke test, since this environment can't run an iOS/Android
simulator to click through the UI directly.

## Getting this into the App Store / Play Store

This wasn't done as part of building the app — it needs your own
developer accounts and payment, which nobody else can supply for you:

1. **Apple Developer Program** ($99/year) and/or a **Google Play Console**
   account ($25 one-time).
2. Change the placeholder `com.example.friendcrm` bundle identifier /
   package name in `app.json` to something you own (reverse-DNS of a
   domain you control, e.g. `com.yourname.friendcrm`).
3. Install the EAS CLI (`npm install -g eas-cli`) and run `eas login`,
   then `eas build --platform ios` / `--platform android` — this builds in
   Expo's cloud, so you don't need a Mac even for the iOS build.
4. `eas submit` uploads the build to App Store Connect / Play Console
   using your account credentials.
5. Fill in the store listing (screenshots, description, privacy policy —
   required since this app touches Contacts and notifications) and submit
   for review. Apple/Google's review process and timelines are theirs, not
   something that can be sped up from here.

Steps 1 and 4 specifically require you personally — they're tied to your
identity and payment method.
