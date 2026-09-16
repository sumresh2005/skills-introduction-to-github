// Imports the user's own Google Contacts via the official People API, using
// a standard OAuth consent flow the user grants to their own account. This
// only ever reads what the signed-in Google account already has saved in
// its own address book (contacts.readonly scope) — never another person's
// data without them having put it there themselves.
const { google } = require("googleapis");

const SCOPES = ["https://www.googleapis.com/auth/contacts.readonly"];

function createOAuthClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error(
      "Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI (see .env.example)."
    );
  }
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
}

function getAuthUrl() {
  return createOAuthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

async function exchangeCodeForTokens(code) {
  const { tokens } = await createOAuthClient().getToken(code);
  return tokens;
}

function clientWithTokens(tokens) {
  const client = createOAuthClient();
  client.setCredentials(tokens);
  return client;
}

function pickPrimary(values, field) {
  if (!values || values.length === 0) return null;
  const primary = values.find((v) => v.metadata && v.metadata.primary) || values[0];
  return primary[field] || null;
}

function normalizeGoogleBirthday(person) {
  const withDate = (person.birthdays || []).find((b) => b.date && b.date.month && b.date.day);
  if (!withDate) return null;
  const { year, month, day } = withDate.date;
  return { year: year || null, month, day };
}

function normalizePerson(person) {
  const name = pickPrimary(person.names, "displayName");
  if (!name) return null;
  return {
    name,
    dob: normalizeGoogleBirthday(person),
    email: pickPrimary(person.emailAddresses, "value"),
    phone: pickPrimary(person.phoneNumbers, "value"),
    location: pickPrimary(person.addresses, "formattedValue"),
    photoUrl: pickPrimary(person.photos, "url"),
    source: "google-contacts",
  };
}

async function fetchGoogleContacts(tokens) {
  const auth = clientWithTokens(tokens);
  const people = google.people({ version: "v1", auth });
  const personFields = "names,birthdays,emailAddresses,phoneNumbers,addresses,photos";

  const results = [];
  let pageToken;
  do {
    const { data } = await people.people.connections.list({
      resourceName: "people/me",
      personFields,
      pageSize: 200,
      pageToken,
    });
    for (const person of data.connections || []) {
      const normalized = normalizePerson(person);
      if (normalized) results.push(normalized);
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return results;
}

module.exports = { getAuthUrl, exchangeCodeForTokens, fetchGoogleContacts };
