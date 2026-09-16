require("dotenv").config();
const express = require("express");
const path = require("path");
const crypto = require("crypto");

const { JsonStore } = require("./lib/store");
const { upcomingBirthdays } = require("./lib/birthdays");
const { fetchFacebookBirthdays } = require("./lib/ics");
const { mergeImportedEntries } = require("./lib/merge");
const googleContacts = require("./lib/googleContacts");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const DATA_DIR = path.join(__dirname, "data");
const friendsStore = new JsonStore(path.join(DATA_DIR, "friends.json"), []);
const messagesStore = new JsonStore(path.join(DATA_DIR, "messages.json"), []);
const tokensStore = new JsonStore(path.join(DATA_DIR, "google-tokens.json"), {});

// ---- Friends CRUD ----

app.get("/api/friends", (req, res) => {
  const friends = friendsStore.read();
  const { tier } = req.query;
  res.json(tier ? friends.filter((f) => f.tier === tier) : friends);
});

app.get("/api/friends/upcoming-birthdays", (req, res) => {
  const withinDays = Number(req.query.withinDays) || 30;
  res.json(upcomingBirthdays(friendsStore.read(), { withinDays }));
});

app.post("/api/friends", (req, res) => {
  if (!req.body.name || !req.body.name.trim()) {
    return res.status(400).json({ error: "name is required" });
  }
  const friends = friendsStore.read();
  const now = new Date().toISOString();
  const friend = {
    id: crypto.randomUUID(),
    name: req.body.name.trim(),
    dob: req.body.dob || null,
    location: req.body.location || null,
    photoUrl: req.body.photoUrl || null,
    email: req.body.email || null,
    phone: req.body.phone || null,
    tier: req.body.tier === "primary" ? "primary" : "secondary",
    tags: Array.isArray(req.body.tags) ? req.body.tags : [],
    notes: req.body.notes || "",
    socials: req.body.socials || {},
    sources: ["manual"],
    needsReview: false,
    createdAt: now,
    updatedAt: now,
  };
  friends.push(friend);
  friendsStore.write(friends);
  res.status(201).json(friend);
});

app.put("/api/friends/:id", (req, res) => {
  const friends = friendsStore.read();
  const friend = friends.find((f) => f.id === req.params.id);
  if (!friend) return res.status(404).json({ error: "not found" });

  const editable = ["name", "dob", "location", "photoUrl", "email", "phone", "tier", "tags", "notes", "socials"];
  for (const field of editable) {
    if (field in req.body) friend[field] = req.body[field];
  }
  friend.needsReview = false;
  friend.updatedAt = new Date().toISOString();
  friendsStore.write(friends);
  res.json(friend);
});

app.delete("/api/friends/:id", (req, res) => {
  const friends = friendsStore.read();
  const next = friends.filter((f) => f.id !== req.params.id);
  if (next.length === friends.length) return res.status(404).json({ error: "not found" });
  friendsStore.write(next);
  res.status(204).end();
});

// ---- Facebook birthdays (.ics) import ----
// Feed URL comes from the user's own Facebook account: Events > Birthdays
// > Export > "Upcoming birthdays" webcal:// link. This is Facebook's own
// export feature, not scraping.

app.post("/api/import/facebook-ics", async (req, res) => {
  const feedUrl = req.body.feedUrl || process.env.FACEBOOK_BIRTHDAYS_ICS_URL;
  if (!feedUrl) {
    return res.status(400).json({ error: "feedUrl is required (or set FACEBOOK_BIRTHDAYS_ICS_URL)" });
  }
  try {
    const entries = await fetchFacebookBirthdays(feedUrl);
    const friends = friendsStore.read();
    const summary = mergeImportedEntries(friends, entries);
    friendsStore.write(friends);
    res.json({ imported: entries.length, ...summary });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// ---- Google Contacts import (OAuth to the user's own Google account) ----

app.get("/auth/google/start", (req, res) => {
  try {
    res.redirect(googleContacts.getAuthUrl());
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/auth/google/callback", async (req, res) => {
  try {
    const tokens = await googleContacts.exchangeCodeForTokens(req.query.code);
    tokensStore.write(tokens);
    res.redirect("/?googleConnected=1");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/api/import/google-contacts", async (req, res) => {
  const tokens = tokensStore.read();
  if (!tokens.access_token && !tokens.refresh_token) {
    return res.status(400).json({ error: "Google account not connected yet. Visit /auth/google/start first." });
  }
  try {
    const entries = await googleContacts.fetchGoogleContacts(tokens);
    const friends = friendsStore.read();
    const summary = mergeImportedEntries(friends, entries);
    friendsStore.write(friends);
    res.json({ imported: entries.length, ...summary });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// ---- Messaging: always sent from your own account, never posted as the friend ----

app.post("/api/friends/:id/messages", async (req, res) => {
  const friends = friendsStore.read();
  const friend = friends.find((f) => f.id === req.params.id);
  if (!friend) return res.status(404).json({ error: "friend not found" });

  const { channel, body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: "body is required" });

  const entry = { id: crypto.randomUUID(), friendId: friend.id, channel, body, sentAt: new Date().toISOString() };

  if (channel === "webhook") {
    const webhookUrl = friend.socials && friend.socials.webhookUrl;
    if (!webhookUrl) {
      return res.status(400).json({
        error:
          "This friend has no webhookUrl set. Point friend.socials.webhookUrl at your own automation " +
          "(e.g. a Zapier/Make webhook wired to the Messenger or Instagram DM API with your own OAuth token) " +
          "to enable sending from here.",
      });
    }
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: friend.name, body }),
      });
      entry.delivered = response.ok;
      entry.status = response.status;
    } catch (err) {
      entry.delivered = false;
      entry.error = err.message;
    }
  } else {
    // Default "email" channel: the server never holds your email password,
    // so it logs the message and hands back a mailto: link for the browser
    // to open in your own mail client, sent from your own account.
    entry.mailto = friend.email ? `mailto:${encodeURIComponent(friend.email)}?body=${encodeURIComponent(body)}` : null;
    entry.delivered = null;
  }

  const messages = messagesStore.read();
  messages.push(entry);
  messagesStore.write(messages);
  res.status(201).json(entry);
});

app.get("/api/friends/:id/messages", (req, res) => {
  res.json(messagesStore.read().filter((m) => m.friendId === req.params.id));
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`friend-crm listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
