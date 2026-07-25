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

  showCurrent(parseCurrent(localStorage.getItem(currentKey)));

  // Fires in this window whenever mc.html (open in another tab/window of the
  // same browser) marks a song as playing, clears it, or checks one off.
  window.addEventListener("storage", (event) => {
    if (event.key === currentKey) {
      showCurrent(parseCurrent(event.newValue));
    } else if (event.key === playedKey) {
      const current = parseCurrent(localStorage.getItem(currentKey));
      if (!current) {
        showCurrent(null);
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

  function showCurrent(current) {
    labelEl.hidden = !current;
    if (current) {
      songEl.textContent = current.text;
    } else {
      const count = playedCount();
      songEl.textContent =
        count > 0
          ? `${count} song${count === 1 ? "" : "s"} played so far`
          : "Waiting for the first song…";
    }
    songEl.classList.remove("is-fresh");
    void songEl.offsetWidth; // restart the reveal animation
    songEl.classList.add("is-fresh");
  }

  function displayName(slug) {
    return slug
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
})();
