// Parses the "Upcoming birthdays" calendar feed Facebook publishes for your
// own account (Facebook > Events > Birthdays > Export > webcal:// link).
// This is Facebook's own sanctioned export mechanism, not scraping: it only
// ever contains the same birthday list Facebook already shows you, as
// month/day (Facebook does not include real birth years in this feed).

function unfold(icsText) {
  // RFC 5545 line folding: a continuation line starts with a space or tab.
  return icsText.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
}

function parseIcsEvents(icsText) {
  const lines = unfold(icsText)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const events = [];
  let current = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (current) events.push(current);
      current = null;
      continue;
    }
    if (!current) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).split(";")[0].toUpperCase();
    current[key] = line.slice(idx + 1);
  }
  return events;
}

function extractNameFromSummary(summary) {
  if (!summary) return null;
  return summary
    .replace(/’/g, "'")
    .replace(/'s birthday$/i, "")
    .replace(/\s+birthday$/i, "")
    .trim();
}

function parseDateValue(value) {
  const match = /^(\d{4})(\d{2})(\d{2})/.exec(value || "");
  if (!match) return null;
  const [, year, month, day] = match;
  return { year: Number(year), month: Number(month), day: Number(day) };
}

function parseFacebookBirthdaysIcs(icsText) {
  const results = [];
  for (const event of parseIcsEvents(icsText)) {
    const name = extractNameFromSummary(event.SUMMARY);
    const date = parseDateValue(event.DTSTART);
    if (!name || !date) continue;
    results.push({
      name,
      // Deliberately drop the year: it's just whichever year the feed was
      // generated for, not the friend's real birth year.
      dob: { year: null, month: date.month, day: date.day },
      source: "facebook-ics",
    });
  }
  return results;
}

function toFetchableUrl(feedUrl) {
  if (feedUrl.startsWith("webcal://")) {
    return "https://" + feedUrl.slice("webcal://".length);
  }
  return feedUrl;
}

async function fetchFacebookBirthdays(feedUrl) {
  const url = toFetchableUrl(feedUrl);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch Facebook birthdays feed: ${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  return parseFacebookBirthdaysIcs(text);
}

module.exports = {
  parseFacebookBirthdaysIcs,
  fetchFacebookBirthdays,
  extractNameFromSummary,
  parseDateValue,
  toFetchableUrl,
};
