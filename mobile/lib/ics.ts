import type { ImportedEntry } from './types';

// Parses the "Upcoming birthdays" calendar feed Facebook publishes for your
// own account (Facebook > Events > Birthdays > Export > webcal:// link).
// This is Facebook's own sanctioned export mechanism, not scraping: it only
// ever contains the same birthday list Facebook already shows you, as
// month/day (Facebook does not include real birth years in this feed).

type IcsEvent = Record<string, string>;

function unfold(icsText: string): string {
  // RFC 5545 line folding: a continuation line starts with a space or tab.
  return icsText.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');
}

function parseIcsEvents(icsText: string): IcsEvent[] {
  const lines = unfold(icsText)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const events: IcsEvent[] = [];
  let current: IcsEvent | null = null;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {};
      continue;
    }
    if (line === 'END:VEVENT') {
      if (current) events.push(current);
      current = null;
      continue;
    }
    if (!current) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).split(';')[0].toUpperCase();
    current[key] = line.slice(idx + 1);
  }
  return events;
}

export function extractNameFromSummary(summary: string | undefined): string | null {
  if (!summary) return null;
  return summary
    .replace(/’/g, "'")
    .replace(/'s birthday$/i, '')
    .replace(/\s+birthday$/i, '')
    .trim();
}

export function parseDateValue(value: string | undefined): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})(\d{2})(\d{2})/.exec(value || '');
  if (!match) return null;
  const [, year, month, day] = match;
  return { year: Number(year), month: Number(month), day: Number(day) };
}

export function parseFacebookBirthdaysIcs(icsText: string): ImportedEntry[] {
  const results: ImportedEntry[] = [];
  for (const event of parseIcsEvents(icsText)) {
    const name = extractNameFromSummary(event.SUMMARY);
    const date = parseDateValue(event.DTSTART);
    if (!name || !date) continue;
    results.push({
      name,
      // Deliberately drop the year: it's just whichever year the feed was
      // generated for, not the friend's real birth year.
      dob: { year: null, month: date.month, day: date.day },
      source: 'facebook-ics',
    });
  }
  return results;
}

export function toFetchableUrl(feedUrl: string): string {
  if (feedUrl.startsWith('webcal://')) {
    return 'https://' + feedUrl.slice('webcal://'.length);
  }
  return feedUrl;
}

export async function fetchFacebookBirthdays(feedUrl: string): Promise<ImportedEntry[]> {
  const url = toFetchableUrl(feedUrl);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch Facebook birthdays feed: ${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  return parseFacebookBirthdaysIcs(text);
}
