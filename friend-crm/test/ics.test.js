const test = require("node:test");
const assert = require("node:assert/strict");
const { parseFacebookBirthdaysIcs, toFetchableUrl, extractNameFromSummary } = require("../lib/ics");

const SAMPLE_ICS = [
  "BEGIN:VCALENDAR",
  "PRODID:-//Facebook//Facebook Birthdays//EN",
  "VERSION:2.0",
  "CALSCALE:GREGORIAN",
  "METHOD:PUBLISH",
  "X-WR-CALNAME:Facebook Birthdays",
  "BEGIN:VEVENT",
  "UID:b1@facebook.com",
  "DTSTAMP:20260101T000000Z",
  "DTSTART;VALUE=DATE:20260315",
  "DTEND;VALUE=DATE:20260316",
  "SUMMARY:John Smith's Birthday",
  "RRULE:FREQ=YEARLY",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "UID:b2@facebook.com",
  "DTSTAMP:20260101T000000Z",
  "DTSTART;VALUE=DATE:20260701",
  "DTEND;VALUE=DATE:20260702",
  "SUMMARY:Priya Patel's Birthday",
  "RRULE:FREQ=YEARLY",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");

test("parseFacebookBirthdaysIcs extracts name and month/day, dropping the placeholder year", () => {
  const result = parseFacebookBirthdaysIcs(SAMPLE_ICS);
  assert.deepEqual(result, [
    { name: "John Smith", dob: { year: null, month: 3, day: 15 }, source: "facebook-ics" },
    { name: "Priya Patel", dob: { year: null, month: 7, day: 1 }, source: "facebook-ics" },
  ]);
});

test("extractNameFromSummary strips the trailing possessive 'Birthday'", () => {
  assert.equal(extractNameFromSummary("Jane Doe's Birthday"), "Jane Doe");
  assert.equal(extractNameFromSummary("Jane Doe’s Birthday"), "Jane Doe");
  assert.equal(extractNameFromSummary("Team Standup"), "Team Standup");
});

test("toFetchableUrl upgrades webcal:// to https://", () => {
  assert.equal(
    toFetchableUrl("webcal://www.facebook.com/ical/b.php?uid=1&key=2"),
    "https://www.facebook.com/ical/b.php?uid=1&key=2"
  );
  assert.equal(toFetchableUrl("https://example.com/feed.ics"), "https://example.com/feed.ics");
});

test("parseFacebookBirthdaysIcs handles folded lines per RFC 5545", () => {
  const folded = [
    "BEGIN:VCALENDAR",
    "BEGIN:VEVENT",
    "DTSTART;VALUE=DATE:20260101",
    "SUMMARY:Alexandria Fitzgerald-Montgom",
    " ery's Birthday",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const result = parseFacebookBirthdaysIcs(folded);
  assert.equal(result[0].name, "Alexandria Fitzgerald-Montgomery");
});
