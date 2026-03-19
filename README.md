# VR Experiences

A static multi-experience A-Frame site that can be deployed directly to GitHub Pages.

## Project structure

- `index.html`: landing page listing available VR experiences.
- `experiences/experiences.json`: catalog of experience cards shown on the landing page.
- `experiences/<slug>/index.html`: shared VR player shell for an individual experience.
- `experiences/<slug>/scenes.json`: scene and hotspot data for that experience.
- `js/`: shared runtime scripts for the landing page and VR player.
- `css/styles.css`: shared landing/player styles.

## Adding a new experience

1. Create a new folder such as `experiences/my-tour/`.
2. Add:
   - `experiences/my-tour/index.html`
   - `experiences/my-tour/scenes.json`
   - an optional thumbnail image or SVG
3. Register the experience in `experiences/experiences.json` with:
   - `title`
   - `description`
   - `href` (for example `experiences/my-tour/`)
   - `thumbnail`

Because the player loads `data-scenes-config="scenes.json"`, each experience can keep its own relative scene config without changing the shared JavaScript.

## GitHub Pages deployment

This repo includes:

- `.github/workflows/deploy-pages.yml` for automatic deployment on pushes to `main`
- `.nojekyll` so static assets and folders are served as-is

### One-time GitHub setup

1. Push the repository to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Ensure your default branch is `main`, or update the workflow branch filter if you deploy from a different branch.
4. Push to `main` or run the workflow manually from the **Actions** tab.

## Asset loading notes

- All site navigation, script, stylesheet, and experience paths are relative so the project works under a GitHub Pages project subpath.
- Scene videos are referenced from a CDN-backed host in each `scenes.json`.
- The player also adds `preconnect` and `dns-prefetch` hints at runtime for the video origins and keeps the likely-next-scene preload hint in place for faster transitions.
