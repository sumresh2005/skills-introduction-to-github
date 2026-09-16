// Imports the user's own Google Contacts via the official People API, using
// a standard OAuth consent flow (PKCE, no client secret) the user grants to
// their own Google account on-device. This only ever reads what the
// signed-in account already has saved in its own address book
// (contacts.readonly scope) — never another person's data without them
// having put it there themselves. Nothing is persisted: the access token
// is used once for the import and discarded.
import type { ImportedEntry } from './types';

export const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

export const GOOGLE_CONTACTS_SCOPES = ['https://www.googleapis.com/auth/contacts.readonly'];

type GooglePerson = {
  names?: { displayName?: string; metadata?: { primary?: boolean } }[];
  birthdays?: { date?: { year?: number; month?: number; day?: number } }[];
  emailAddresses?: { value?: string; metadata?: { primary?: boolean } }[];
  phoneNumbers?: { value?: string; metadata?: { primary?: boolean } }[];
  addresses?: { formattedValue?: string; metadata?: { primary?: boolean } }[];
  photos?: { url?: string; metadata?: { primary?: boolean } }[];
};

function pickPrimary<T extends { metadata?: { primary?: boolean } }>(
  values: T[] | undefined,
  field: keyof T
): string | null {
  if (!values || values.length === 0) return null;
  const primary = values.find((v) => v.metadata?.primary) || values[0];
  const value = primary[field];
  return typeof value === 'string' ? value : null;
}

function normalizeGoogleBirthday(person: GooglePerson): ImportedEntry['dob'] {
  const withDate = (person.birthdays || []).find((b) => b.date?.month && b.date?.day);
  if (!withDate?.date) return null;
  const { year, month, day } = withDate.date;
  return { year: year || null, month: month!, day: day! };
}

function normalizePerson(person: GooglePerson): ImportedEntry | null {
  const name = pickPrimary(person.names, 'displayName');
  if (!name) return null;
  return {
    name,
    dob: normalizeGoogleBirthday(person),
    email: pickPrimary(person.emailAddresses, 'value'),
    phone: pickPrimary(person.phoneNumbers, 'value'),
    location: pickPrimary(person.addresses, 'formattedValue'),
    photoUrl: pickPrimary(person.photos, 'url'),
    source: 'google-contacts',
  };
}

export async function fetchGoogleContacts(accessToken: string): Promise<ImportedEntry[]> {
  const personFields = 'names,birthdays,emailAddresses,phoneNumbers,addresses,photos';
  const results: ImportedEntry[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL('https://people.googleapis.com/v1/people/me/connections');
    url.searchParams.set('personFields', personFields);
    url.searchParams.set('pageSize', '200');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new Error(`Google People API request failed: ${response.status} ${response.statusText}`);
    }
    const data = (await response.json()) as { connections?: GooglePerson[]; nextPageToken?: string };
    for (const person of data.connections || []) {
      const normalized = normalizePerson(person);
      if (normalized) results.push(normalized);
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return results;
}
