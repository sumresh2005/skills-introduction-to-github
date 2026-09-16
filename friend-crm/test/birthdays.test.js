const test = require("node:test");
const assert = require("node:assert/strict");
const { daysUntilNextOccurrence, turningAge, upcomingBirthdays } = require("../lib/birthdays");

test("daysUntilNextOccurrence: later this year", () => {
  const today = new Date(2026, 0, 1); // Jan 1, 2026
  assert.equal(daysUntilNextOccurrence(1, 15, today), 14);
});

test("daysUntilNextOccurrence: wraps to next year when date has passed", () => {
  const today = new Date(2026, 5, 15); // Jun 15, 2026
  const days = daysUntilNextOccurrence(1, 1, today);
  assert.equal(days, 200); // Jun 15 -> Jan 1 next year, non-leap remainder
});

test("daysUntilNextOccurrence: today is 0", () => {
  const today = new Date(2026, 2, 3);
  assert.equal(daysUntilNextOccurrence(3, 3, today), 0);
});

test("turningAge computes the age reached at the next occurrence", () => {
  const today = new Date(2026, 0, 1);
  assert.equal(turningAge(1990, 1, 15, today), 36);
});

test("turningAge returns null when birth year is unknown", () => {
  assert.equal(turningAge(null, 1, 15, new Date(2026, 0, 1)), null);
});

test("upcomingBirthdays filters and sorts by soonest, skipping friends with no dob", () => {
  const today = new Date(2026, 0, 1);
  const friends = [
    { name: "No DOB" },
    { name: "Far away", dob: { month: 6, day: 1 } },
    { name: "Soonest", dob: { month: 1, day: 3 } },
    { name: "Middle", dob: { month: 1, day: 10 } },
  ];
  const result = upcomingBirthdays(friends, { withinDays: 30, today });
  assert.deepEqual(
    result.map((r) => r.friend.name),
    ["Soonest", "Middle"]
  );
});
