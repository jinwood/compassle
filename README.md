# Compassle

Tagline: "Where does it sit?"

A daily placement game. Static site, no build step, no backend.

- `public/` is the whole site. `data/puzzles.json` holds the puzzles (5 cards per day, cycling from `epoch`).
- Idea cards are placed by `scripts/build_idea_cards.py` from CHES 2024 issue scores (`data-src/`): each idea sits at the average position of the European parties that most strongly back it. Cite: Rovny, Polk, Bakker, Hooghe, Jolly, Marks, Steenbergen & Vachudova (2025), 2024 Chapel Hill Expert Survey.
- Eight more idea cards come from the Manifesto Project (MPDS 2026a) via `scripts/build_manifesto_cards.py`. Those data files stay in `data-src/` and are not redistributed (see their terms of use). Cite: Lehmann, Pola et al. (2026), Manifesto Project Dataset 2026a.
- `scripts/build_puzzles.py` packs idea cards into daily sets. Days already in `puzzles.json` are kept as they are (they may be live); only unscheduled cards are packed into new days at the end.
- Icons are from [Lucide](https://lucide.dev) (ISC licence), stored in `public/data/icons.json`. `scripts/icons_map.json` maps each idea to an icon.
- `src/worker.js` and `src/finish.js` form a small Worker that counts finished games into D1 (`schema.sql`, `wrangler.jsonc`). Setup is in `LAUNCH.md`.
- Progress and streaks live in the browser's localStorage. A service worker makes it work offline and installable.

## Run locally
    python3 -m http.server -d public 8000

## Deploy (free): Cloudflare Workers with static assets
    npx wrangler deploy
Or connect the repo in the Cloudflare dashboard (build command empty, deploy command `npx wrangler deploy`). Put your D1 database ID in `wrangler.jsonc` first; see `LAUNCH.md`.

## Add puzzles
Append another array of 5 cards to `days` in `public/data/puzzles.json`. x is left(-)/right(+), y is libertarian(-)/authoritarian(+), range -100..100.
