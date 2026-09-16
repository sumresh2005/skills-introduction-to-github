const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeName, mergeImportedEntries } = require("../lib/merge");

test("normalizeName is case/accent/punctuation insensitive", () => {
  assert.equal(normalizeName("José  O'Brien"), "jose obrien");
  assert.equal(normalizeName("  Jane   Doe  "), "jane doe");
});

test("mergeImportedEntries fills in missing fields on an existing friend without overwriting curated data", () => {
  const friends = [
    {
      id: "1",
      name: "Jane Doe",
      dob: { year: null, month: 3, day: 15 },
      location: null,
      tier: "primary",
      notes: "met at college",
      sources: ["manual"],
    },
  ];
  const imported = [
    { name: "jane doe", dob: { year: 1994, month: 3, day: 15 }, location: "Austin, TX", source: "google-contacts" },
  ];

  const summary = mergeImportedEntries(friends, imported);

  assert.deepEqual(summary, { created: [], updated: ["1"] });
  assert.equal(friends[0].dob.year, 1994); // filled in the more complete dob
  assert.equal(friends[0].location, "Austin, TX"); // filled in missing field
  assert.equal(friends[0].tier, "primary"); // curated field untouched
  assert.equal(friends[0].notes, "met at college"); // curated field untouched
  assert.deepEqual(friends[0].sources.sort(), ["google-contacts", "manual"]);
});

test("mergeImportedEntries creates a new friend flagged needsReview when no name matches", () => {
  const friends = [];
  const imported = [{ name: "New Person", dob: { year: null, month: 6, day: 1 }, source: "facebook-ics" }];

  const summary = mergeImportedEntries(friends, imported);

  assert.equal(summary.created.length, 1);
  assert.equal(friends.length, 1);
  assert.equal(friends[0].needsReview, true);
  assert.equal(friends[0].tier, "secondary");
});

test("mergeImportedEntries does not downgrade an existing dob that already has a year", () => {
  const friends = [{ id: "1", name: "Jane Doe", dob: { year: 1994, month: 3, day: 15 }, sources: ["manual"] }];
  const imported = [{ name: "Jane Doe", dob: { year: null, month: 3, day: 15 }, source: "facebook-ics" }];

  mergeImportedEntries(friends, imported);

  assert.equal(friends[0].dob.year, 1994);
});
