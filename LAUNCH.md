# Compassle launch checklist

Status key: **[done]** finished, **[you]** needs you, **[open]** not started or undecided.

## Before launch

1. **Test the full flow in a real browser, including on a phone** **[done]**
   A headless Chromium run (mobile 390px and desktop 1280px, dark and light) played a full round and checked: placing, locking, reveal, results, copy to clipboard, the record panel, export and import (valid and invalid files), reload restoring a finished game, resuming mid-game the about page, offline use after a first visit, and no console or network errors. All 37 checks pass. The test is a one-off script, not in the repo. Still worth a real play on a real phone.

2. **Confirm the data terms** **[you]**
   - **CHES:** the site shows no licence. Email them (draft below) and wait for a reply.
   - **Manifesto Project:** the terms (re-read in full) say the data is provided "for the purposes of scientific research", forbid redistribution without written authorisation, and require a citation and a copy of any published work. They say nothing about commercial use or derived results. Only derived numbers are published, so this is probably fine, but ask: `manifesto-communication@wzb.eu` (draft below). If you don't hear back, remove the 8 manifesto cards before launch (`Military strength`, `Anti-militarism`, `Nationalisation`, `Expanding education`, `Traditional morality`, `Equality`, `Trade unions`, `Human rights and freedoms`). That leaves 41 cards, or 8 days.
   - The raw Manifesto file is git-ignored and was never committed.

3. **Credit the sources on the site** **[done]**
   `public/about.html` explains the method, lists both datasets with their full citations, notes the limits, and has a short privacy note. A footer on the game links to it.

4. **Self-host the fonts** **[done]**
   Google Fonts is gone. The three font families are in `public/fonts/` (latin subset, woff2) and `public/css/fonts.css`. No request goes to Google.

5. **Share preview and favicon** **[done, one follow-up for you]**
   `public/og.png` (1200x630) plus Open Graph and Twitter tags, and a new compass-needle favicon. **Follow-up:** crawlers want an absolute image URL. Once you have the domain, change `og:image` and `twitter:image` in `public/index.html` from `/og.png` to `https://YOURDOMAIN/og.png`.

6. **A way to report problems** **[done]**
   The footer links "Disagree with a placement?" to GitHub Issues, and the about page does too. Switch it to an email address if you prefer.

## Analytics (finished-game counter)

The game sends one anonymous record when a daily is finished: puzzle number, total, and the score on each idea. No IP, cookie or ID is stored. It goes to `functions/api/finish.js`, a Cloudflare Pages Function, and is stored in a D1 database. The about page describes this. **[you: one-off setup, the code is done]**

1. Create the database: Cloudflare dashboard > Storage & Databases > D1 > Create, name it `compassle`. Open its **Console** tab and run the contents of `schema.sql`.
2. Bind it: Workers & Pages > your project > Settings > Bindings (or Functions) > Add > D1 database. Variable name must be exactly `DB`, database `compassle`. Add it for both Production and Preview.
3. Redeploy (push a commit, or Deployments > Retry). Finish a puzzle on the live site, then in the D1 console run `SELECT COUNT(DISTINCT play) FROM scores;` to confirm a row arrived.
4. Optional but recommended: a rate-limit rule on `/api/finish` (Security > WAF > Rate limiting rules, e.g. 20 requests per minute per IP). The endpoint validates its input, but anyone could still flood it with fake scores.
5. Optional: turn on Cloudflare **Web Analytics** (project > Metrics) for visitors, referrers and countries. If you do, change the about page's "no cookies" line to mention aggregate, cookie-free analytics.

Useful queries (D1 console):

    -- games finished per puzzle day, with average total
    SELECT day, COUNT(DISTINCT play) AS games, ROUND(AVG(total)) AS avg_total FROM scores GROUP BY day ORDER BY day;
    -- hardest ideas
    SELECT title, COUNT(*) AS n, ROUND(AVG(pts)) AS avg_pts FROM scores GROUP BY title HAVING n >= 20 ORDER BY avg_pts LIMIT 10;

Not done: a way to show "average score today" in the game. The data supports it if you want it later. Without a database binding the endpoint answers 503 and the game carries on as normal. Untested on real Cloudflare: I tested the function against a mock database and the game in a headless browser, but not on Pages itself.

## Worth deciding

- **Day rollover uses each player's local date.** Someone in Sydney gets tomorrow's puzzle hours before someone in Los Angeles, and share-text numbers can differ across timezones. Switching to UTC keeps everyone in sync, but the puzzle then flips at an odd local time for some players. Small change: `todayStr()` in `public/js/game.js`. **[open]**
- **The answers are visible.** The site is static, so anyone can read every position in the network tab, including future days. Fine for a casual game. Fixing it needs a small Cloudflare Worker that serves only today's cards. **[open]**
- **Content runway.** 49 cards make 9 days, then it repeats. Aim for 3 to 4 weeks before announcing widely. Cheapest source: hand-written cards labelled as editorial estimates. **[open]**
- **Fairness check.** Show it to a few friends from different political leanings. If the same cards annoy people on both sides, the placements are probably fine. If only one side objects, look again. Also see whether scoring feels too generous, since averaging pulls positions toward the middle. **[you]**
- **Custom domain, redirects and a 404 page** on Cloudflare Pages. **[you]**

## Can wait

- Analytics. Cloudflare Web Analytics is free and cookie-free, so no consent banner.
- Unit tests for the scoring logic, and a screen-reader pass.
- Accounts, cross-device sync and leaderboards (needs a backend, e.g. a Worker with D1 and a sign-in step). Only once people are using it.
- More countries and a US data source.

## Email drafts

**To the Chapel Hill Expert Survey team** (contact is on chesdata.eu):

> Subject: Using CHES 2024 in a free daily web game
>
> Hello, I'm building Compassle, a free daily game in which players place political ideas on a left-right / libertarian-authoritarian grid. For each idea I estimate a position by averaging the CHES 2024 positions of the parties that most strongly back it (using the issue variables). Only these derived numbers are published, together with a visible citation to Rovny et al. (2025). I don't redistribute the dataset itself, although the CSV is in the project's public repository for reproducibility. Could you confirm whether this use is acceptable, and say if you'd prefer I remove the CSV from the repo? Thank you.

**To the Manifesto Project** (send to `manifesto-communication@wzb.eu`, the contact in the footer of manifesto-project.wzb.eu; the bibliography address is only for sending them citations):

> Subject: Use of MPDS 2026a in a free, non-commercial web game
>
> Hello, I'm building Compassle, a free, non-commercial daily web game in which players place political ideas on a two-dimensional grid and see how close they got to a reference position. For eight ideas I estimate the reference position as the emphasis-weighted average of manifesto positions (RILE plus an index built from per-category shares) for manifestos since 2010. Only these derived numbers appear on the site, with a visible citation to the Manifesto Data Collection, Version 2026a. I do not redistribute the dataset or any manifesto text. Is this use permitted? I'm also happy to send you the citation, as your terms of use request. Thank you.

(Only keep the "free, non-commercial" wording if it's true.)

## Handy

`/?day=N` previews day N without touching your saved record (for example `/?day=7` opens with Anti-militarism). Manifesto cards are on days 1, 3, 5, 6, 7 and 8.
