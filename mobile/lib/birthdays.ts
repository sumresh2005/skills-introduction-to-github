import type { Dob, Friend } from './types';

export type UpcomingBirthday = {
  friend: Friend;
  daysUntil: number;
  turningAge: number | null;
};

function normalizeToLocalMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysUntilNextOccurrence(month: number, day: number, today: Date = new Date()): number {
  const base = normalizeToLocalMidnight(today);
  let next = new Date(base.getFullYear(), month - 1, day);
  if (next < base) {
    next = new Date(base.getFullYear() + 1, month - 1, day);
  }
  const diffMs = next.getTime() - base.getTime();
  return Math.round(diffMs / 86400000);
}

export function turningAge(birthYear: number | null, month: number, day: number, today: Date = new Date()): number | null {
  if (!birthYear) return null;
  const base = normalizeToLocalMidnight(today);
  const next = new Date(base.getFullYear(), month - 1, day);
  const nextYear = next < base ? base.getFullYear() + 1 : base.getFullYear();
  return nextYear - birthYear;
}

export function upcomingBirthdays(
  friends: Friend[],
  { withinDays = 30, today = new Date() }: { withinDays?: number; today?: Date } = {}
): UpcomingBirthday[] {
  return friends
    .map((friend): UpcomingBirthday | null => {
      const dob = friend.dob;
      if (!dob || !dob.month || !dob.day) return null;
      return {
        friend,
        daysUntil: daysUntilNextOccurrence(dob.month, dob.day, today),
        turningAge: turningAge(dob.year, dob.month, dob.day, today),
      };
    })
    .filter((entry): entry is UpcomingBirthday => entry !== null && entry.daysUntil <= withinDays)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

/**
 * Month/day for a reminder N days before a birthday, using a leap-year
 * placeholder so Feb 29 birthdays don't spuriously roll into March when the
 * math runs against a non-leap reference year.
 */
export function reminderMonthDay(dob: Dob, daysBefore: number): { month: number; day: number } {
  const LEAP_YEAR = 2024;
  const date = new Date(LEAP_YEAR, dob.month - 1, dob.day);
  date.setDate(date.getDate() - daysBefore);
  return { month: date.getMonth() + 1, day: date.getDate() };
}
