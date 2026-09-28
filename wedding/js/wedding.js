const invitation = {
  couple: "Luqman & Nadia",
  date: "2026-12-20T19:00:00+08:00",
  endDate: "2026-12-20T23:00:00+08:00",
  venue: "Ming Garden Ballroom, Ming Garden Hotel & Residences",
  address: "Kota Kinabalu, Sabah",
  rsvpDeadline: "2026-10-20T23:59:59+08:00",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Ming+Garden+Hotel+%26+Residences",
  wazeUrl: "https://www.waze.com/ul?q=Ming%20Garden%20Hotel%20%26%20Residences",
  contacts: [
    { name: "Luqman", phone: "+60168129886" },
    { name: "Nadia", phone: "+60136052405" }
  ]
};


const SUPABASE_URL = "https://vidfateucpdavhzjhndm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Twi-90s2d_8AvVU3W4y6Sg_U0KnDpT-";
const SUPABASE_HEADERS = {
  apikey: SUPABASE_PUBLISHABLE_KEY,
  Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
};

const supabaseRealtimeClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
let rsvpRealtimeRefreshTimer = null;

function setupRSVPRealtime() {
  supabaseRealtimeClient
    .channel("public:rsvp_counts")
    .on("broadcast", { event: "rsvp_changed" }, () => {
      clearTimeout(rsvpRealtimeRefreshTimer);
      rsvpRealtimeRefreshTimer = window.setTimeout(() => {
        renderRSVPData();
      }, 100);
    })
    .subscribe(status => {
      if (status === "SUBSCRIBED") {
        console.log("RSVP realtime connected.");
      }
    });
}

async function fetchSupabase(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      ...SUPABASE_HEADERS,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${detail}`);
  }

  // A successful POST using `Prefer: return=minimal` may return a 201/204
  // response with an empty body. Do not try to parse that empty body as JSON.
  const prefer = String((options.headers && options.headers.Prefer) || "").toLowerCase();
  if (response.status === 204 || response.status === 205 || prefer.includes("return=minimal")) return null;
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) return null;
  return response.json();
}

function renderMessages(records) {
  const messages = document.getElementById("messages");
  messages.innerHTML = "";

  records
    .filter(r => r.message)
    .slice()
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .forEach(r => addMessage(r.full_name, r.message, false));

  setupMessageReveals();
}

async function renderRSVPData() {
  try {
    const [counts, comments] = await Promise.all([
      fetchSupabase("rsvp_counts?select=attending,not_attending"),
      fetchSupabase("rsvp_comments?select=full_name,message,created_at&order=created_at.desc")
    ]);

    const countRow = counts && counts[0] ? counts[0] : { attending: 0, not_attending: 0 };
    document.getElementById("attendingCount").textContent = Number(countRow.attending || 0);
    document.getElementById("notAttendingCount").textContent = Number(countRow.not_attending || 0);
    renderMessages(comments || []);
  } catch (error) {
    console.error("Unable to load RSVP data.", error);
    document.getElementById("attendingCount").textContent = "0";
    document.getElementById("notAttendingCount").textContent = "0";
    renderMessages([]);
  }
}

function addMessage(name, message, prepend = true) {
  const el = document.createElement("article");
  el.className = "message scroll-reveal";
  el.innerHTML = `<strong>${escapeHtml(name)}</strong><p>${escapeHtml(message)}</p>`;
  if (prepend) {
    document.getElementById("messages").prepend(el);
  } else {
    document.getElementById("messages").appendChild(el);
  }
}

const cover = document.getElementById("cover");
const envelope = document.getElementById("envelope");
const invitationEl = document.getElementById("invitation");
const bottomNav = document.getElementById("bottomNav");
const modalLayer = document.getElementById("modalLayer");
const modalContent = document.getElementById("modalContent");
const weddingAudio = document.getElementById("weddingAudio");
const YOUTUBE_MUSIC_URL = "https://www.youtube.com/watch?v=2ibzVUbMfpU";
const LOCAL_MUSIC_PATH = "assets/music/wedding-music.mp3";
let musicMuted = false;
let musicStarted = false;

let autoScrollActive = false;
let autoScrollFrame = null;
let lastAutoScrollTime = 0;
let openingInProgress = false;
const AUTO_SCROLL_SPEED = 16; // px/second: slow, continuous movement

function stopAutoScroll() {
  autoScrollActive = false;
  if (autoScrollFrame) {
    cancelAnimationFrame(autoScrollFrame);
    autoScrollFrame = null;
  }
  lastAutoScrollTime = 0;
}

function runAutoScroll(timestamp) {
  if (!autoScrollActive) return;
  if (!lastAutoScrollTime) lastAutoScrollTime = timestamp;

  const elapsed = Math.min(64, timestamp - lastAutoScrollTime);
  lastAutoScrollTime = timestamp;
  invitationEl.scrollTop += AUTO_SCROLL_SPEED * (elapsed / 1000);

  const maxScroll = invitationEl.scrollHeight - invitationEl.clientHeight;
  if (invitationEl.scrollTop >= maxScroll - 1) {
    invitationEl.scrollTop = maxScroll;
    stopAutoScroll();
    return;
  }
  autoScrollFrame = requestAnimationFrame(runAutoScroll);
}

function startAutoScroll(attempt = 0) {
  stopAutoScroll();
  invitationEl.scrollTop = 0;

  // Wait until the invitation has real scrollable height. This avoids the
  // browser starting the animation while the hidden/transitioning element
  // still reports its old dimensions.
  const maxScroll = invitationEl.scrollHeight - invitationEl.clientHeight;
  if (maxScroll <= 1) {
    if (attempt < 30) {
      window.setTimeout(() => startAutoScroll(attempt + 1), 100);
    }
    return;
  }

  autoScrollActive = true;
  lastAutoScrollTime = 0;
  autoScrollFrame = requestAnimationFrame(runAutoScroll);
}

// Opening sequence. Keep this handler independent of the invitation content so
// the cover can never leave the page in a hidden, non-scrollable state.
const openInvitationButton = document.getElementById("openInvitation");
openInvitationButton.addEventListener("click", () => {
  if (openingInProgress) return;
  openingInProgress = true;
  stopAutoScroll();
  envelope.classList.add("open");

  // Reveal the invitation while the envelope is opening. The automatic scroll
  // starts as soon as the invitation is visible, not after an arbitrary delay.
  window.setTimeout(() => {
    invitationEl.classList.remove("hidden");
    bottomNav.classList.remove("hidden");
    invitationEl.classList.add("visible");
    invitationEl.scrollTop = 0;
    // Start after layout has committed, then retry if the browser has not yet
    // calculated the invitation scroll height.
    requestAnimationFrame(() => startAutoScroll());
  }, 650);

  window.setTimeout(() => {
    cover.classList.add("opened");
    openingInProgress = false;
  }, 1150);

  // The Open Invitation click is the user's direct gesture, so the local
  // audio file can begin playback here without requiring another tap.
  startWeddingMusic();
});

function manualTakeover() {
  if (openingInProgress || !invitationEl.classList.contains("visible")) return;
  stopAutoScroll();
}

// Any real visitor interaction immediately transfers control to the visitor.
["wheel", "touchstart", "pointerdown"].forEach(eventName => {
  invitationEl.addEventListener(eventName, manualTakeover, { passive: true });
});

invitationEl.addEventListener("keydown", event => {
  if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) {
    manualTakeover();
  }
});

function pad(n) { return String(n).padStart(2, "0"); }

function updateCountdown() {
  const target = new Date(invitation.date).getTime();
  const diff = Math.max(0, target - Date.now());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  document.getElementById("days").textContent = days;
  document.getElementById("hours").textContent = pad(hours);
  document.getElementById("minutes").textContent = pad(minutes);
  document.getElementById("seconds").textContent = pad(seconds);
}
updateCountdown();
setInterval(updateCountdown, 1000);
setupRSVPRealtime();

/* Scroll-triggered content reveals.
   The invitation has a central active zone (~2/3 of the viewport). Elements
   reveal while entering that zone and reset when they leave it, so the same
   animation plays again when the visitor scrolls back and down. */
function setupScrollReveals() {
  const revealSelectors = [
    "#page1 .eyebrow",
    "#page1 h1 .hero-word",
    "#page1 h1 .hero-amp",
    "#page1 .date",
    "#page1 .intro",
    "#page2 .bismillah",
    "#page2 .parents-label",
    "#page2 .parent-block:nth-of-type(1)",
    "#page2 .parent-block:nth-of-type(2)",
    "#page2 .invitation-verse",
    "#page2 .couple-names",
    "#page3 .save-date-block > *",
    "#page3 .countdown-block",
    "#page3 .attendance-block",
    "#page4 .eyebrow",
    "#page4 h2",
    "#page4 .messages-rsvp",
  ];

  const elements = document.querySelectorAll(revealSelectors.join(","));
  elements.forEach((el, index) => {
    el.classList.add("scroll-reveal");

    // Page 1 gets a deliberately wider stagger. The final invitation line
    // arrives last, after a little more scrolling, while still belonging
    // to the same first-page sequence.
    if (el.closest("#page1")) {
      const key = el.classList.contains("eyebrow") ? "eyebrow"
        : el.classList.contains("hero-amp") ? "hero-amp"
        : el.classList.contains("hero-word") ? "hero-word"
        : el.classList.contains("date") ? "date"
        : "intro";
      const wordIndex = key === "hero-word"
        ? Array.from(document.querySelectorAll("#page1 .hero-word")).indexOf(el)
        : 0;
      const delay = key === "eyebrow" ? 0
        : key === "hero-word" ? 900 + Math.max(0, wordIndex) * 900
        : key === "hero-amp" ? 1350
        : key === "date" ? 2300
        : 3400;
      el.style.setProperty("--reveal-delay", `${delay}ms`);
    } else {
      el.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 180}ms`);
    }
  });

  if (!("IntersectionObserver" in window)) {
    elements.forEach(el => el.classList.add("is-revealed"));
    return;
  }

  let lastScrollTop = invitationEl.scrollTop;
  let scrollDirection = "down";
  invitationEl.addEventListener("scroll", () => {
    const current = invitationEl.scrollTop;
    if (current > lastScrollTop) scrollDirection = "down";
    else if (current < lastScrollTop) scrollDirection = "up";
    lastScrollTop = current;
  }, { passive: true });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      el.classList.remove("is-leaving-down", "is-leaving-up");

      if (entry.isIntersecting) {
        // Reveal from the side of the viewport the element entered from.
        el.classList.toggle("reveal-up", scrollDirection === "up");
        el.classList.add("is-revealed");
      } else {
        el.classList.remove("is-revealed");
        el.classList.remove("reveal-up");
        el.classList.add(scrollDirection === "down" ? "is-leaving-down" : "is-leaving-up");
      }
    });
  }, {
    root: invitationEl,
    // Central active zone, with a short upper fade area.
    rootMargin: "-15% 0px -15% 0px",
    threshold: 0.01
  });

  elements.forEach(el => observer.observe(el));

  // Page 1 starts at the top of the invitation, so its eyebrow should be
  // visible/revealable immediately rather than being trapped above the zone.
  const page1Eyebrow = document.querySelector("#page1 .eyebrow");
  if (page1Eyebrow) {
    page1Eyebrow.classList.add("is-revealed");
    const eyebrowObserver = new IntersectionObserver(([entry]) => {
      const direction = entry.target._lastRevealDirection || scrollDirection;
      entry.target.classList.remove("is-leaving-down", "is-leaving-up");
      if (entry.isIntersecting) {
        entry.target.classList.toggle("reveal-up", direction === "up");
        entry.target.classList.add("is-revealed");
      } else {
        entry.target.classList.remove("is-revealed", "reveal-up");
        entry.target.classList.add(direction === "down" ? "is-leaving-down" : "is-leaving-up");
      }
      entry.target._lastRevealDirection = scrollDirection;
    }, { root: invitationEl, rootMargin: "-15% 0px -15% 0px", threshold: 0.01 });
    eyebrowObserver.observe(page1Eyebrow);
  }
}

function setupMessageReveals() {
  const messages = document.getElementById("messages");
  if (!messages || !("IntersectionObserver" in window)) return;

  if (messages._revealObserver) messages._revealObserver.disconnect();

  const cards = messages.querySelectorAll(".message");
  cards.forEach((el, i) => {
    el.classList.add("scroll-reveal", "message-reveal");
    // The first cards wait briefly for the Messages heading to settle, while
    // later cards reveal as they enter the same central viewing zone.
    el.style.setProperty("--reveal-delay", "0ms");
  });

  let lastScrollTop = invitationEl.scrollTop;
  let scrollDirection = "down";
  invitationEl.addEventListener("scroll", () => {
    const current = invitationEl.scrollTop;
    if (current > lastScrollTop) scrollDirection = "down";
    else if (current < lastScrollTop) scrollDirection = "up";
    lastScrollTop = current;
  }, { passive: true });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      el.classList.remove("is-leaving-down", "is-leaving-up");
      if (entry.isIntersecting) {
        el.classList.toggle("reveal-up", scrollDirection === "up");
        el.classList.add("is-revealed");
      } else {
        el.classList.remove("is-revealed", "reveal-up");
        el.classList.add(scrollDirection === "down" ? "is-leaving-down" : "is-leaving-up");
      }
    });
  }, {
    // Use the invitation viewport, not the nested message scroller. This makes
    // each plaque part of the same page-level reveal system as every other
    // invitation element. The nested scroller still controls which messages
    // are brought into view when there are more than three visible.
    root: invitationEl,
    rootMargin: "-15% 0px -15% 0px",
    threshold: 0.01
  });

  cards.forEach(el => observer.observe(el));
  messages._revealObserver = observer;
}

setupScrollReveals();
renderRSVPData();

function openModal(type) {
  const deadlinePassed = Date.now() > new Date(invitation.rsvpDeadline).getTime();
  const templates = {
    calendar: `
      <h3>Save the Date</h3>
      <p>${new Date(invitation.date).toLocaleDateString("en-MY", {weekday:"long", day:"numeric", month:"long", year:"numeric"})}<br>7:00 PM – 11:00 PM<br>${invitation.venue}</p>
      <div class="modal-actions">
        <a href="${googleCalendarUrl()}" target="_blank" rel="noopener">Google</a>
        <button type="button" onclick="downloadICS()">Apple</button>
      </div>`,
    contact: `
      <h3>Contact</h3>
      <p>For questions about the wedding, contact us directly.</p>
      <div class="modal-actions">
        ${invitation.contacts.map(c => `<a href="https://wa.me/${c.phone.replace(/\D/g,'')}" target="_blank" rel="noopener">${c.name} (${c.name === "Luqman" ? "WhatsApp" : "Whatsapp"})</a>`).join("")}
      </div>`,
    location: `
      <h3>Location</h3>
      <p>${invitation.venue}<br>${invitation.address}</p>
      <div class="modal-actions">
        <a href="${invitation.mapsUrl}" target="_blank" rel="noopener">Open Google Maps</a>
        <a href="${invitation.wazeUrl}" target="_blank" rel="noopener">Open Waze</a>
      </div>`,
    rsvp: deadlinePassed ? `
      <h3>RSVP Closed</h3>
      <p>Thank you for your interest. The RSVP period for this wedding has now closed.</p>` : rsvpForm()
  };
  modalContent.innerHTML = templates[type];
  modalLayer.classList.remove("hidden");
  modalLayer.setAttribute("aria-hidden", "false");
  if (type === "rsvp") bindRSVP();
}

function rsvpForm() {
  return `
    <h3>RSVP & Message</h3>
    <p>Please enter your full name and confirm your attendance.</p>
    <form id="rsvpForm">
      <div class="form-group">
        <label for="guestName">Full Name *</label>
        <input id="guestName" name="name" required maxlength="20" autocomplete="name">
      </div>
      <div class="form-group">
        <label>Attendance *</label>
        <div class="choice-row">
          <button type="button" class="choice selected" data-attendance="attending">Attending</button>
          <button type="button" class="choice" data-attendance="not-attending">Not Attending</button>
        </div>
      </div>
      <div class="form-group" id="guestCountGroup">
        <label for="guestCount">Number of Guests *</label>
        <select id="guestCount" name="guestCount">
          <option value="1">1 guest</option>
          <option value="2">2 guests</option>
        </select>
      </div>
      <div class="form-group">
        <label for="message">Message (optional)</label>
        <textarea id="message" name="message" maxlength="100" placeholder="Leave a message for the couple"></textarea>
      </div>
      <button class="outline-button" type="submit">Submit RSVP</button>
    </form>`;
}

function bindRSVP() {
  let attendance = "attending";
  document.querySelectorAll("[data-attendance]").forEach(btn => {
    btn.addEventListener("click", () => {
      attendance = btn.dataset.attendance;
      document.querySelectorAll("[data-attendance]").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      document.getElementById("guestCountGroup").style.display = attendance === "attending" ? "" : "none";
    });
  });

  document.getElementById("rsvpForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const submitButton = form.querySelector('button[type="submit"]');
    const fd = new FormData(form);
    const fullName = String(fd.get("name") || "").trim();
    const message = String(fd.get("message") || "").trim();
    const guestCount = attendance === "attending" ? Number(fd.get("guestCount")) : 0;

    if (!fullName) {
      form.querySelector("#guestName").focus();
      return;
    }

    if (fullName.length > 20 || message.length > 100) {
      alert("Please keep your name to 20 characters and your message to 100 characters or fewer.");
      return;
    }

    if (attendance === "attending" && ![1, 2].includes(guestCount)) {
      alert("Please select 1 or 2 guests.");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    try {
      await fetchSupabase("rsvps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          full_name: fullName,
          attendance,
          guest_count: guestCount,
          message: message || null
        })
      });

      await renderRSVPData();
      modalContent.innerHTML = `<h3>Thank You</h3><p>Your RSVP has been recorded.</p>`;
    } catch (error) {
      console.error("Unable to submit RSVP.", error);
      submitButton.disabled = false;
      submitButton.textContent = "Submit RSVP";
      const existingError = form.querySelector(".rsvp-error");
      if (!existingError) {
        const errorEl = document.createElement("p");
        errorEl.className = "rsvp-error";
        errorEl.textContent = "We couldn't submit your RSVP. Please check your connection and try again.";
        form.appendChild(errorEl);
      }
    }
  });
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[ch]));
}

function googleCalendarUrl() {
  const start = "20261024T100000";
  const end = "20261024T150000";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: invitation.couple + " Wedding",
    dates: `${start}/${end}`,
    location: invitation.venue + ", " + invitation.address,
    details: "Wedding invitation"
  });
  return "https://calendar.google.com/calendar/render?" + params.toString();
}

function downloadICS() {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    "DTSTART:20261024T100000",
    "DTEND:20261024T150000",
    "SUMMARY:Luqman & Nadia Wedding",
    "LOCATION:Ming Garden Ballroom, Ming Garden Hotel & Residences, Kota Kinabalu, Sabah",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\\r\\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "alex-sarah-wedding.ics";
  a.click();
  URL.revokeObjectURL(a.href);
}

document.querySelectorAll("[data-modal]").forEach(btn => {
  btn.addEventListener("click", () => {
    stopAutoScroll();
    openModal(btn.dataset.modal);
  });
});

document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("modalBackdrop").addEventListener("click", closeModal);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

function closeModal() {
  modalLayer.classList.add("hidden");
  modalLayer.setAttribute("aria-hidden", "true");
}

function startWeddingMusic() {
  if (musicStarted) return;
  musicStarted = true;

  // Keep playback tied directly to the Open Invitation gesture. Browsers
  // generally allow audio started from an explicit user interaction.
  weddingAudio.muted = musicMuted;
  const playPromise = weddingAudio.play();

  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {
      // If a browser still blocks playback, allow a later explicit interaction
      // (such as returning to the invitation) to retry without breaking the UI.
      musicStarted = false;
    });
  }
}

function setMusicMute(muted) {
  musicMuted = muted;
  weddingAudio.muted = muted;
  document.getElementById("musicIcon").textContent = muted ? "♩" : "♫";
  const button = document.getElementById("musicMuteButton");
  if (button) button.textContent = muted ? "Unmute Music" : "Mute Music";
}

document.getElementById("musicButton").addEventListener("click", () => {
  stopAutoScroll();
  modalContent.innerHTML = `
    <h3>Music</h3>
    <p>Background music for the invitation.</p>
    <div class="modal-actions">
      <button type="button" id="musicMuteButton">${musicMuted ? "Unmute Music" : "Mute Music"}</button>
      <a href="${YOUTUBE_MUSIC_URL}" target="_blank" rel="noopener">Watch on YouTube</a>
    </div>`;
  modalLayer.classList.remove("hidden");
  modalLayer.setAttribute("aria-hidden", "false");
  document.getElementById("musicMuteButton").addEventListener("click", () => setMusicMute(!musicMuted));
});
