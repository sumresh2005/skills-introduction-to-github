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
(`friendcrm://`) that's registered as part of the app's own bundle
identifier — Expo Go can't do this because it runs every project under its
own shared bundle ID, and Expo's older hosted auth-proxy workaround for
this no longer exists in this SDK. To use this feature:

1. `npx expo prebuild` (or use `eas build --profile development`) to
   produce a development build with your own bundle identifier.
2. In [Google Cloud Console](https://console.cloud.google.com), enable the
   **People API** and create an OAuth client of type **iOS** and/or
   **Android**, using the same bundle identifier / package name as this
   app (see `app.json` → `ios.bundleIdentifier` / `android.package`;
   change these from the `com.example.friendcrm` placeholder to your own
   before building).
3. Put the resulting client ID(s) into `app.json` → `expo.extra`:
   `googleIosClientId`, `googleAndroidClientId`.
4. Rebuild the development build and run the "Sign in & import Google
   contacts" button from there (not from Expo Go).

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
