(function () {
  "use strict";

  const playlistEl = document.getElementById("projector-playlist");
  const labelEl = document.getElementById("projector-label");
  const songEl = document.getElementById("projector-song");
  const noPlaylistEl = document.getElementById("no-playlist");

  const slug = new URLSearchParams(window.location.search).get("playlist");

  if (!slug) {
    playlistEl.hidden = true;
    labelEl.hidden = true;
    songEl.hidden = true;
    noPlaylistEl.hidden = false;
    return;
  }

  const currentKey = `musical-bingo:current:${slug}`;
  const playedKey = `musical-bingo:mc:${slug}`;
  playlistEl.textContent = displayName(slug);

  const TEASER_EMOJIS = ["🎵", "🎶", "🎧", "🎤", "🎸", "🥁", "🎷", "🎹"];
  const TEASER_BEAT_MS = 700;

  let countdownTimer = null;
  let teaserTimer = null;
  let lastText = null;

  render(parseCurrent(localStorage.getItem(currentKey)));

  // Fires in this window whenever mc.html (open in another tab/window of the
  // same browser) marks a song as playing, reveals it, clears it, or checks
  // one off.
  window.addEventListener("storage", (event) => {
    if (event.key === currentKey) {
      render(parseCurrent(event.newValue));
    } else if (event.key === playedKey) {
      const current = parseCurrent(localStorage.getItem(currentKey));
      if (!current) {
        render(null);
      }
    }
  });

  function parseCurrent(raw) {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.text === "string") return parsed;
    } catch (err) {
      /* ignore corrupted value */
    }
    return null;
  }

  function playedCount() {
    const raw = localStorage.getItem(playedKey);
    if (!raw) return 0;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).length;
    } catch (err) {
      /* ignore corrupted value */
    }
    return 0;
  }

  function render(current) {
    clearTimeout(countdownTimer);
    clearInterval(teaserTimer);
    songEl.classList.remove("projector__song--teaser");

    if (!current) {
      showIdle();
    } else if (current.phase === "revealing" && current.revealAt) {
      runCountdown(current);
    } else {
      showTeaser();
    }
  }

  function showIdle() {
    const count = playedCount();
    setDisplay({
      label: null,
      text:
        count > 0
          ? `${count} song${count === 1 ? "" : "s"} played so far`
          : "Waiting for the first song…",
    });
  }

  function showTeaser() {
    labelEl.hidden = false;
    labelEl.textContent = "Get Ready";
    songEl.classList.add("projector__song--teaser");

    let index = 0;
    const nextEmoji = () => {
      songEl.textContent = TEASER_EMOJIS[index % TEASER_EMOJIS.length];
      index++;
    };
    nextEmoji();
    teaserTimer = setInterval(nextEmoji, TEASER_BEAT_MS);
  }

  function runCountdown(current) {
    const tick = () => {
      const remainingMs = current.revealAt - Date.now();
      if (remainingMs <= 0) {
        setDisplay({ label: "Now Playing", text: current.text });
        return;
      }
      setDisplay({
        label: "Revealing In",
        text: String(Math.ceil(remainingMs / 1000)),
      });
      countdownTimer = setTimeout(tick, Math.min(remainingMs, 200));
    };
    tick();
  }

  function setDisplay({ label, text }) {
    labelEl.hidden = !label;
    labelEl.textContent = label || "";
    songEl.textContent = text;

    // The countdown re-renders every 200ms for accurate timing, but the
    // pop animation should only restart when the visible text changes.
    if (text !== lastText) {
      songEl.classList.remove("is-fresh");
      void songEl.offsetWidth; // restart the reveal animation
      songEl.classList.add("is-fresh");
      lastText = text;
    }
  }

  function displayName(slug) {
    return slug
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
})();
