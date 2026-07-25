# Musical Bingo

A phone-friendly, landscape-only musical bingo card. No build step — plain
HTML/CSS/JS, deployable straight to GitHub Pages.

## How it works

- Open `index.html?playlist=NAME`, where `NAME` matches a file in
  `playlists/NAME.txt` (one song per line).
- On first load, 12 random songs are picked from the playlist and placed
  into a 5x3 grid, with 3 cells left blank.
- Tap a song cell to mark/unmark it. Progress is saved to `localStorage`
  per playlist, so reloading the page keeps your card and marks.
- The "New card" button asks for confirmation, then draws a fresh random
  card (discarding current progress).
- Portrait orientation shows a "rotate your phone" prompt instead of the
  board.

## Adding a playlist

Add a new text file to `playlists/`, one song title per line, e.g.
`playlists/80s-hits.txt`. It needs at least 12 songs. Share the link
`index.html?playlist=80s-hits` with players.

## Running locally

Because the app fetches playlist files with `fetch()`, it needs to be
served over HTTP (opening `index.html` directly via `file://` will fail
due to browser CORS restrictions). From the project root:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000/?playlist=sample`.

## Deploying to GitHub Pages

1. Push this repo to GitHub.
2. In the repo settings, open **Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, then
   pick the branch and `/ (root)` folder.
4. Save. Your site will be published at
   `https://<user>.github.io/<repo>/?playlist=sample`.

No build step or GitHub Actions workflow is required.
