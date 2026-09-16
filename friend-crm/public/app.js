const state = { tier: "", friends: [] };

const friendGrid = document.getElementById("friendGrid");
const upcomingList = document.getElementById("upcomingList");
const friendDialog = document.getElementById("friendDialog");
const friendForm = document.getElementById("friendForm");
const messageDialog = document.getElementById("messageDialog");
const messageForm = document.getElementById("messageForm");
let messageTargetId = null;

async function api(path, options) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.status === 204 ? null : res.json();
}

function dobLabel(dob) {
  if (!dob || !dob.month || !dob.day) return "No birthday on file";
  const date = new Date(2000, dob.month - 1, dob.day);
  const monthDay = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return dob.year ? `${monthDay}, ${dob.year}` : monthDay;
}

function renderUpcoming(entries) {
  upcomingList.innerHTML = "";
  if (entries.length === 0) {
    upcomingList.innerHTML = "<li>No birthdays in the next 30 days.</li>";
    return;
  }
  for (const { friend, daysUntil, turningAge } of entries) {
    const li = document.createElement("li");
    const label = daysUntil === 0 ? "today" : daysUntil === 1 ? "tomorrow" : `in ${daysUntil} days`;
    const ageLabel = turningAge ? ` (turning ${turningAge})` : "";
    li.innerHTML = `<span>${friend.name}${ageLabel}</span><span class="days">${label}</span>`;
    upcomingList.appendChild(li);
  }
}

function renderFriends() {
  friendGrid.innerHTML = "";
  const list = state.tier ? state.friends.filter((f) => f.tier === state.tier) : state.friends;
  for (const friend of list) {
    const card = document.createElement("div");
    card.className = "friend-card";
    card.innerHTML = `
      <div class="name-row">
        <strong>${friend.name}</strong>
        <span class="badge ${friend.tier === "primary" ? "primary" : ""}">${friend.tier}</span>
      </div>
      ${friend.needsReview ? '<span class="badge review">needs review</span>' : ""}
      <div class="friend-meta">${dobLabel(friend.dob)}</div>
      <div class="friend-meta">${friend.location || "No location on file"}</div>
      <div class="friend-meta">${(friend.tags || []).join(", ")}</div>
      <div class="friend-actions">
        <button data-action="edit">Edit</button>
        <button data-action="message">Message</button>
        <button data-action="delete">Delete</button>
      </div>
    `;
    card.querySelector('[data-action="edit"]').addEventListener("click", () => openFriendDialog(friend));
    card.querySelector('[data-action="message"]').addEventListener("click", () => openMessageDialog(friend));
    card.querySelector('[data-action="delete"]').addEventListener("click", () => deleteFriend(friend.id));
    friendGrid.appendChild(card);
  }
}

async function loadFriends() {
  state.friends = await api("/api/friends");
  renderFriends();
}

async function loadUpcoming() {
  renderUpcoming(await api("/api/friends/upcoming-birthdays?withinDays=30"));
}

function openFriendDialog(friend) {
  friendForm.reset();
  document.getElementById("friendDialogTitle").textContent = friend ? "Edit friend" : "Add friend";
  friendForm.id.value = friend ? friend.id : "";
  if (friend) {
    friendForm.name.value = friend.name || "";
    friendForm.location.value = friend.location || "";
    friendForm.email.value = friend.email || "";
    friendForm.phone.value = friend.phone || "";
    friendForm.dobMonth.value = friend.dob ? friend.dob.month || "" : "";
    friendForm.dobDay.value = friend.dob ? friend.dob.day || "" : "";
    friendForm.dobYear.value = friend.dob ? friend.dob.year || "" : "";
    friendForm.tier.value = friend.tier || "secondary";
    friendForm.tags.value = (friend.tags || []).join(", ");
    friendForm.notes.value = friend.notes || "";
  }
  friendDialog.showModal();
}

async function deleteFriend(id) {
  if (!confirm("Remove this friend?")) return;
  await api(`/api/friends/${id}`, { method: "DELETE" });
  await loadFriends();
  await loadUpcoming();
}

function openMessageDialog(friend) {
  messageTargetId = friend.id;
  messageForm.reset();
  document.getElementById("messageFriendName").textContent = friend.name;
  messageDialog.showModal();
}

friendForm.addEventListener("submit", async (e) => {
  const formData = new FormData(friendForm);
  const id = formData.get("id");
  const month = Number(formData.get("dobMonth")) || null;
  const day = Number(formData.get("dobDay")) || null;
  const year = Number(formData.get("dobYear")) || null;
  const payload = {
    name: formData.get("name"),
    location: formData.get("location") || null,
    email: formData.get("email") || null,
    phone: formData.get("phone") || null,
    dob: month && day ? { month, day, year } : null,
    tier: formData.get("tier"),
    tags: String(formData.get("tags") || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    notes: formData.get("notes") || "",
  };
  if (id) {
    await api(`/api/friends/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  } else {
    await api("/api/friends", { method: "POST", body: JSON.stringify(payload) });
  }
  await loadFriends();
  await loadUpcoming();
});

document.getElementById("cancelFriendBtn").addEventListener("click", () => friendDialog.close());
document.getElementById("addFriendBtn").addEventListener("click", () => openFriendDialog(null));

messageForm.addEventListener("submit", async () => {
  const formData = new FormData(messageForm);
  const payload = { channel: formData.get("channel"), body: formData.get("body") };
  try {
    const result = await api(`/api/friends/${messageTargetId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (result.mailto) {
      window.location.href = result.mailto;
    } else if (result.delivered === false) {
      alert("Message logged, but delivery failed. Check the friend's webhookUrl setup.");
    }
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById("cancelMessageBtn").addEventListener("click", () => messageDialog.close());

document.querySelectorAll(".tier-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tier-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    state.tier = tab.dataset.tier;
    renderFriends();
  });
});

document.getElementById("importFacebookBtn").addEventListener("click", async () => {
  const feedUrl = document.getElementById("fbFeedUrl").value.trim();
  if (!feedUrl) return alert("Paste your Facebook birthdays webcal:// URL first.");
  try {
    const result = await api("/api/import/facebook-ics", { method: "POST", body: JSON.stringify({ feedUrl }) });
    alert(`Imported ${result.imported} birthdays: ${result.created.length} new, ${result.updated.length} updated.`);
    await loadFriends();
    await loadUpcoming();
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById("importGoogleBtn").addEventListener("click", async () => {
  try {
    const result = await api("/api/import/google-contacts", { method: "POST" });
    alert(`Imported ${result.imported} contacts: ${result.created.length} new, ${result.updated.length} updated.`);
    await loadFriends();
    await loadUpcoming();
  } catch (err) {
    alert(err.message);
  }
});

loadFriends();
loadUpcoming();
