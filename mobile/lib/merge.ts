import { newId } from './id';
import type { Dob, Friend, ImportedEntry } from './types';

export function normalizeName(name: string | undefined | null): string {
  return (name || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isMoreCompleteDob(candidate: Dob | null | undefined, existing: Dob | null | undefined): boolean {
  if (!candidate) return false;
  if (!existing) return true;
  return Boolean(candidate.year) && !existing.year;
}

export type MergeSummary = { created: string[]; updated: string[] };

/**
 * Merges freshly imported entries (from the Facebook birthdays feed or
 * Google Contacts) into the existing friend list, matching by normalized
 * name. Matches fill in only missing fields, so manually-curated notes,
 * tier, and tags are never overwritten by an import. Unmatched entries are
 * created as new friends flagged `needsReview` (defaulted to the secondary
 * tier) so a name-matching mistake surfaces for the user to fix rather than
 * silently merging into the wrong person. Mutates `existingFriends` in
 * place (pushes new entries, edits matched ones) and returns a summary.
 */
export function mergeImportedEntries(
  existingFriends: Friend[],
  importedEntries: ImportedEntry[],
  { defaultTier = 'secondary' as const } = {}
): MergeSummary {
  const byNormalizedName = new Map(existingFriends.map((f) => [normalizeName(f.name), f]));
  const created: string[] = [];
  const updated: string[] = [];

  for (const entry of importedEntries) {
    const key = normalizeName(entry.name);
    if (!key) continue;
    const existing = byNormalizedName.get(key);

    if (existing) {
      let changed = false;
      if (isMoreCompleteDob(entry.dob, existing.dob)) {
        existing.dob = entry.dob!;
        changed = true;
      }
      const stringFields = ['email', 'phone', 'location', 'photoUrl'] as const;
      for (const field of stringFields) {
        if (!existing[field] && entry[field]) {
          existing[field] = entry[field] as string;
          changed = true;
        }
      }
      const sources = new Set(existing.sources || []);
      if (!sources.has(entry.source)) {
        sources.add(entry.source);
        existing.sources = Array.from(sources);
        changed = true;
      }
      if (changed) {
        existing.updatedAt = new Date().toISOString();
        updated.push(existing.id);
      }
    } else {
      const now = new Date().toISOString();
      const friend: Friend = {
        id: newId(),
        name: entry.name,
        dob: entry.dob || null,
        location: entry.location || null,
        photoUrl: entry.photoUrl || null,
        email: entry.email || null,
        phone: entry.phone || null,
        tier: defaultTier,
        tags: [],
        notes: '',
        sources: [entry.source],
        needsReview: true,
        createdAt: now,
        updatedAt: now,
      };
      existingFriends.push(friend);
      byNormalizedName.set(key, friend);
      created.push(friend.id);
    }
  }

  return { created, updated };
}
