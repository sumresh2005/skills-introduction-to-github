import { daysUntilNextOccurrence, reminderMonthDay, turningAge, upcomingBirthdays } from '@/lib/birthdays';
import type { Friend } from '@/lib/types';

function makeFriend(overrides: Partial<Friend>): Friend {
  return {
    id: overrides.id ?? 'id',
    name: overrides.name ?? 'Friend',
    dob: overrides.dob ?? null,
    location: null,
    email: null,
    phone: null,
    photoUrl: null,
    tier: 'secondary',
    tags: [],
    notes: '',
    sources: ['manual'],
    needsReview: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

test('daysUntilNextOccurrence: later this year', () => {
  const today = new Date(2026, 0, 1);
  expect(daysUntilNextOccurrence(1, 15, today)).toBe(14);
});

test('daysUntilNextOccurrence: wraps to next year when date has passed', () => {
  const today = new Date(2026, 5, 15);
  expect(daysUntilNextOccurrence(1, 1, today)).toBe(200);
});

test('daysUntilNextOccurrence: today is 0', () => {
  const today = new Date(2026, 2, 3);
  expect(daysUntilNextOccurrence(3, 3, today)).toBe(0);
});

test('turningAge computes the age reached at the next occurrence', () => {
  const today = new Date(2026, 0, 1);
  expect(turningAge(1990, 1, 15, today)).toBe(36);
});

test('turningAge returns null when birth year is unknown', () => {
  expect(turningAge(null, 1, 15, new Date(2026, 0, 1))).toBeNull();
});

test('upcomingBirthdays filters and sorts by soonest, skipping friends with no dob', () => {
  const today = new Date(2026, 0, 1);
  const friends = [
    makeFriend({ id: '1', name: 'No DOB' }),
    makeFriend({ id: '2', name: 'Far away', dob: { year: null, month: 6, day: 1 } }),
    makeFriend({ id: '3', name: 'Soonest', dob: { year: null, month: 1, day: 3 } }),
    makeFriend({ id: '4', name: 'Middle', dob: { year: null, month: 1, day: 10 } }),
  ];
  const result = upcomingBirthdays(friends, { withinDays: 30, today });
  expect(result.map((r) => r.friend.name)).toEqual(['Soonest', 'Middle']);
});

test('reminderMonthDay rolls into the previous month correctly', () => {
  expect(reminderMonthDay({ year: null, month: 1, day: 2 }, 5)).toEqual({ month: 12, day: 28 });
});

test('reminderMonthDay handles a Feb 29 birthday without rolling into March', () => {
  expect(reminderMonthDay({ year: null, month: 2, day: 29 }, 0)).toEqual({ month: 2, day: 29 });
});
