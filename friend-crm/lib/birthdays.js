function normalizeToLocalMidnight(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysUntilNextOccurrence(month, day, today = new Date()) {
  const base = normalizeToLocalMidnight(today);
  let next = new Date(base.getFullYear(), month - 1, day);
  if (next < base) {
    next = new Date(base.getFullYear() + 1, month - 1, day);
  }
  const diffMs = next.getTime() - base.getTime();
  return Math.round(diffMs / 86400000);
}

function turningAge(birthYear, month, day, today = new Date()) {
  if (!birthYear) return null;
  const base = normalizeToLocalMidnight(today);
  const next = new Date(base.getFullYear(), month - 1, day);
  const nextYear = next < base ? base.getFullYear() + 1 : base.getFullYear();
  return nextYear - birthYear;
}

function upcomingBirthdays(friends, { withinDays = 30, today = new Date() } = {}) {
  return friends
    .map((f) => {
      const dob = f.dob;
      if (!dob || !dob.month || !dob.day) return null;
      return {
        friend: f,
        daysUntil: daysUntilNextOccurrence(dob.month, dob.day, today),
        turningAge: turningAge(dob.year, dob.month, dob.day, today),
      };
    })
    .filter((entry) => entry && entry.daysUntil <= withinDays)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

module.exports = { daysUntilNextOccurrence, turningAge, upcomingBirthdays };
