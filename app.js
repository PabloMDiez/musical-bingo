(function () {
  "use strict";

  const CARD_SIZE = 15;
  const BLANK_COUNT = 3;
  const SONG_COUNT = CARD_SIZE - BLANK_COUNT;

  const splashEl = document.getElementById("splash");
  const splashSubtitleEl = document.getElementById("splash-subtitle");
  const startBtn = document.getElementById("start-btn");
  const portraitNoticeEl = document.getElementById("portrait-notice");
  const boardEl = document.getElementById("board");
  const appEl = document.getElementById("app");
  const titleEl = document.getElementById("playlist-name");
  const newCardBtn = document.getElementById("new-card-btn");
  const noPlaylistEl = document.getElementById("no-playlist");
  const loadErrorEl = document.getElementById("load-error");
  const loadErrorDetailEl = document.getElementById("load-error-detail");
  const exampleLinkEl = document.getElementById("example-link");

  const slug = new URLSearchParams(window.location.search).get("playlist");

  exampleLinkEl.textContent =
    window.location.pathname + "?playlist=sample";

  if (!slug) {
    splashEl.hidden = true;
    appEl.hidden = false;
    noPlaylistEl.hidden = false;
    newCardBtn.hidden = true;
    return;
  }

  const storageKey = `musical-bingo:${slug}`;
  titleEl.textContent = displayName(slug);
  splashSubtitleEl.textContent = displayName(slug);

  startBtn.addEventListener("click", startGame, { once: true });

  const orientationQuery = window.matchMedia("(orientation: portrait)");
  orientationQuery.addEventListener("change", updatePortraitNotice);

  async function startGame() {
    await enterFullscreenLandscape();
    splashEl.hidden = true;
    appEl.hidden = false;
    updatePortraitNotice();
    await init();
  }

  async function enterFullscreenLandscape() {
    const el = document.documentElement;
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }
    } catch (err) {
      /* fullscreen unavailable or blocked; carry on windowed */
    }

    try {
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock("landscape");
      }
    } catch (err) {
      /* orientation lock unsupported (e.g. iOS Safari); rely on the rotate prompt */
    }
  }

  function updatePortraitNotice() {
    portraitNoticeEl.hidden = !orientationQuery.matches;
  }

  async function init() {
    const saved = loadState();
    if (saved) {
      renderCard(saved);
    } else {
      await generateAndRenderNewCard();
    }

    newCardBtn.addEventListener("click", async () => {
      const confirmed = window.confirm(
        "Start a new card? This will discard your current progress."
      );
      if (confirmed) {
        await generateAndRenderNewCard();
      }
    });
  }

  async function generateAndRenderNewCard() {
    let songs;
    try {
      songs = await fetchPlaylist(slug);
    } catch (err) {
      showLoadError(err.message);
      return;
    }

    if (songs.length < SONG_COUNT) {
      showLoadError(
        `This playlist only has ${songs.length} song(s); at least ${SONG_COUNT} are needed for a card.`
      );
      return;
    }

    const card = buildCard(songs);
    saveState(card);
    renderCard(card);
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

  function buildCard(songs) {
    const chosenSongs = shuffle(songs).slice(0, SONG_COUNT);
    const blankPositions = new Set(
      shuffle(range(CARD_SIZE)).slice(0, BLANK_COUNT)
    );

    const cells = [];
    let songIndex = 0;
    for (let i = 0; i < CARD_SIZE; i++) {
      if (blankPositions.has(i)) {
        cells.push({ type: "blank" });
      } else {
        cells.push({ type: "song", text: chosenSongs[songIndex++], marked: false });
      }
    }

    return { slug, cells };
  }

  function renderCard(card) {
    hideMessages();
    boardEl.innerHTML = "";

    card.cells.forEach((cell, index) => {
      const cellEl = document.createElement(cell.type === "song" ? "button" : "div");
      cellEl.className = `cell cell--${cell.type}`;

      if (cell.type === "song") {
        cellEl.type = "button";
        cellEl.textContent = cell.text;
        cellEl.setAttribute("aria-pressed", String(!!cell.marked));
        if (cell.marked) cellEl.classList.add("is-marked");

        cellEl.addEventListener("click", () => {
          cell.marked = !cell.marked;
          cellEl.classList.toggle("is-marked", cell.marked);
          cellEl.setAttribute("aria-pressed", String(cell.marked));
          saveState(card);
        });
      } else {
        cellEl.setAttribute("aria-hidden", "true");
      }

      boardEl.appendChild(cellEl);
    });
  }

  function showLoadError(detail) {
    hideMessages();
    loadErrorDetailEl.textContent = detail;
    loadErrorEl.hidden = false;
  }

  function hideMessages() {
    noPlaylistEl.hidden = true;
    loadErrorEl.hidden = true;
  }

  function saveState(card) {
    localStorage.setItem(storageKey, JSON.stringify(card));
  }

  function loadState() {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.slug === slug && Array.isArray(parsed.cells)) {
        return parsed;
      }
    } catch (err) {
      /* corrupted state, ignore and fall through */
    }
    return null;
  }

  function displayName(slug) {
    return slug
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function range(n) {
    return Array.from({ length: n }, (_, i) => i);
  }

  function shuffle(array) {
    const result = array.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
})();
