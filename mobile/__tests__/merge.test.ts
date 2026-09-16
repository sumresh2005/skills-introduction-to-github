import { mergeImportedEntries, normalizeName } from '@/lib/merge';
import type { Friend } from '@/lib/types';

function makeFriend(overrides: Partial<Friend>): Friend {
  return {
    id: overrides.id ?? 'id',
    name: overrides.name ?? 'Friend',
    dob: overrides.dob ?? null,
    location: overrides.location ?? null,
    email: overrides.email ?? null,
    phone: null,
    photoUrl: null,
    tier: overrides.tier ?? 'secondary',
    tags: [],
    notes: overrides.notes ?? '',
    sources: overrides.sources ?? ['manual'],
    needsReview: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

test('normalizeName is case/accent/punctuation insensitive', () => {
  expect(normalizeName("José  O'Brien")).toBe('jose obrien');
  expect(normalizeName('  Jane   Doe  ')).toBe('jane doe');
});

test('mergeImportedEntries fills in missing fields on an existing friend without overwriting curated data', () => {
  const friends = [
    makeFriend({
      id: '1',
      name: 'Jane Doe',
      dob: { year: null, month: 3, day: 15 },
      location: null,
      tier: 'primary',
      notes: 'met at college',
      sources: ['manual'],
    }),
  ];
  const imported = [
    { name: 'jane doe', dob: { year: 1994, month: 3, day: 15 }, location: 'Austin, TX', source: 'google-contacts' },
  ];

  const summary = mergeImportedEntries(friends, imported);

  expect(summary).toEqual({ created: [], updated: ['1'] });
  expect(friends[0].dob?.year).toBe(1994);
  expect(friends[0].location).toBe('Austin, TX');
  expect(friends[0].tier).toBe('primary');
  expect(friends[0].notes).toBe('met at college');
  expect([...friends[0].sources].sort()).toEqual(['google-contacts', 'manual']);
});

test('mergeImportedEntries creates a new friend flagged needsReview when no name matches', () => {
  const friends: Friend[] = [];
  const imported = [{ name: 'New Person', dob: { year: null, month: 6, day: 1 }, source: 'facebook-ics' }];

  const summary = mergeImportedEntries(friends, imported);

  expect(summary.created).toHaveLength(1);
  expect(friends).toHaveLength(1);
  expect(friends[0].needsReview).toBe(true);
  expect(friends[0].tier).toBe('secondary');
});

test('mergeImportedEntries does not downgrade an existing dob that already has a year', () => {
  const friends = [makeFriend({ id: '1', name: 'Jane Doe', dob: { year: 1994, month: 3, day: 15 } })];
  const imported = [{ name: 'Jane Doe', dob: { year: null, month: 3, day: 15 }, source: 'facebook-ics' }];

  mergeImportedEntries(friends, imported);

  expect(friends[0].dob?.year).toBe(1994);
});
