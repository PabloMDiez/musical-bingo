(function () {
  "use strict";

  const listEl = document.getElementById("mc-list");
  const titleEl = document.getElementById("mc-playlist-name");
  const progressEl = document.getElementById("mc-progress");
  const resetBtn = document.getElementById("reset-btn");
  const noPlaylistEl = document.getElementById("no-playlist");
  const loadErrorEl = document.getElementById("load-error");
  const loadErrorDetailEl = document.getElementById("load-error-detail");

  const slug = new URLSearchParams(window.location.search).get("playlist");

  if (!slug) {
    noPlaylistEl.hidden = false;
    resetBtn.hidden = true;
    return;
  }

  const storageKey = `musical-bingo:mc:${slug}`;
  titleEl.textContent = `${displayName(slug)} — MC List`;

  init();

  async function init() {
    let songs;
    try {
      songs = await fetchPlaylist(slug);
    } catch (err) {
      showLoadError(err.message);
      return;
    }

    if (songs.length === 0) {
      showLoadError("This playlist is empty.");
      return;
    }

    const played = loadState(songs.length);
    renderList(songs, played);

    resetBtn.addEventListener("click", () => {
      const confirmed = window.confirm(
        "Reset the played list? This clears every checkmark."
      );
      if (confirmed) {
        played.fill(false);
        saveState(played);
        renderList(songs, played);
      }
    });
  }

  async function fetchPlaylist(slug) {
    let response;
    try {
      response = await fetch(`playlists/${encodeURIComponent(slug)}.txt`, {
        cache: "no-store",
      });
    } catch (err) {
      throw new Error("Network error while fetching the playlist file.");
    }

    if (!response.ok) {
      throw new Error(
        `File "playlists/${slug}.txt" was not found (HTTP ${response.status}).`
      );
    }

    const text = await response.text();
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  function renderList(songs, played) {
    listEl.innerHTML = "";

    songs.forEach((song, index) => {
      const li = document.createElement("li");
      li.className = "mc-list__item";
      if (played[index]) li.classList.add("is-played");

      const label = document.createElement("label");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = !!played[index];
      checkbox.addEventListener("change", () => {
        played[index] = checkbox.checked;
        saveState(played);
        li.classList.toggle("is-played", checkbox.checked);
        updateProgress(played);
      });

      const text = document.createElement("span");
      text.textContent = song;

      label.appendChild(checkbox);
      label.appendChild(text);
      li.appendChild(label);
      listEl.appendChild(li);
    });

    updateProgress(played);
  }

  function updateProgress(played) {
    const count = played.filter(Boolean).length;
    progressEl.textContent = `${count} / ${played.length} played`;
  }

  function loadState(length) {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === length) {
          return parsed;
        }
      } catch (err) {
        /* corrupted state, ignore and fall through */
      }
    }
    return new Array(length).fill(false);
  }

  function saveState(played) {
    localStorage.setItem(storageKey, JSON.stringify(played));
  }

  function showLoadError(detail) {
    loadErrorDetailEl.textContent = detail;
    loadErrorEl.hidden = false;
  }

  function displayName(slug) {
    return slug
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
})();
