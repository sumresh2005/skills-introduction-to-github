import { extractNameFromSummary, parseFacebookBirthdaysIcs, toFetchableUrl } from '@/lib/ics';

const SAMPLE_ICS = [
  'BEGIN:VCALENDAR',
  'PRODID:-//Facebook//Facebook Birthdays//EN',
  'VERSION:2.0',
  'BEGIN:VEVENT',
  'UID:b1@facebook.com',
  'DTSTAMP:20260101T000000Z',
  'DTSTART;VALUE=DATE:20260315',
  'SUMMARY:John Smith\'s Birthday',
  'RRULE:FREQ=YEARLY',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:b2@facebook.com',
  'DTSTAMP:20260101T000000Z',
  'DTSTART;VALUE=DATE:20260701',
  'SUMMARY:Priya Patel\'s Birthday',
  'RRULE:FREQ=YEARLY',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n');

test('parseFacebookBirthdaysIcs extracts name and month/day, dropping the placeholder year', () => {
  expect(parseFacebookBirthdaysIcs(SAMPLE_ICS)).toEqual([
    { name: 'John Smith', dob: { year: null, month: 3, day: 15 }, source: 'facebook-ics' },
    { name: 'Priya Patel', dob: { year: null, month: 7, day: 1 }, source: 'facebook-ics' },
  ]);
});

test("extractNameFromSummary strips the trailing possessive 'Birthday'", () => {
  expect(extractNameFromSummary("Jane Doe's Birthday")).toBe('Jane Doe');
  expect(extractNameFromSummary('Jane Doe’s Birthday')).toBe('Jane Doe');
  expect(extractNameFromSummary('Team Standup')).toBe('Team Standup');
});

test('toFetchableUrl upgrades webcal:// to https://', () => {
  expect(toFetchableUrl('webcal://www.facebook.com/ical/b.php?uid=1&key=2')).toBe(
    'https://www.facebook.com/ical/b.php?uid=1&key=2'
  );
  expect(toFetchableUrl('https://example.com/feed.ics')).toBe('https://example.com/feed.ics');
});

test('parseFacebookBirthdaysIcs handles folded lines per RFC 5545', () => {
  const folded = [
    'BEGIN:VCALENDAR',
    'BEGIN:VEVENT',
    'DTSTART;VALUE=DATE:20260101',
    'SUMMARY:Alexandria Fitzgerald-Montgom',
    " ery's Birthday",
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const result = parseFacebookBirthdaysIcs(folded);
  expect(result[0].name).toBe('Alexandria Fitzgerald-Montgomery');
});
