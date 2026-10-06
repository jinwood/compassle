// Pure game logic, no DOM. Coordinates run -100..100.
// x: Left(-) to Right(+). y: Libertarian(-) to Authoritarian(+).
export const clamp = v => Math.max(-100, Math.min(100, v));
export const px = x => (x + 100) / 2;
export const py = y => (100 - y) / 2;
export const band = d => d <= 15 ? "g" : d <= 30 ? "y" : d <= 50 ? "o" : "r";
export const EMO = { g: "\u{1F7E9}", y: "\u{1F7E8}", o: "\u{1F7E7}", r: "\u{1F7E5}" };

export function score(card, pos) {
  const dx = pos.x - card.x, dy = pos.y - card.y, d = Math.hypot(dx, dy);
  return { dx, dy, d, pts: Math.max(0, Math.round(100 - d)), b: band(d) };
}

// Local calendar date as YYYY-MM-DD.
export const todayStr = (d = new Date()) =>
  d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

// Whole days between two YYYY-MM-DD strings, DST-safe.
export function daysBetween(a, b) {
  const t = s => Date.UTC(...s.split("-").map((n, i) => i === 1 ? n - 1 : +n));
  return Math.round((t(b) - t(a)) / 864e5);
}

// 1-based puzzle number for a date; dates before the epoch clamp to #1.
export const puzzleNumber = (epoch, date) => Math.max(0, daysBetween(epoch, date)) + 1;
export const puzzleFor = (days, n) => days[(n - 1) % days.length];

export function shareText(label, res) {
  const total = res.reduce((a, r) => a + r.pts, 0);
  const hot = res.reduce((m, r) => r.d > m.d ? r : m, res[0]);
  return "Compassle " + label + "\n" + res.map(r => EMO[r.b]).join("") + "  " + total + "/500\n\u{1F525} Hot take: " + hot.title;
}

// stats = {played, streak, best, lastDay, totalPts}. Streak counts consecutive daily puzzles.
export function recordDaily(stats, n, total) {
  const s = Object.assign({ played: 0, streak: 0, maxStreak: 0, best: 0, lastDay: 0, totalPts: 0 }, stats);
  if (s.lastDay === n) return s;
  s.streak = s.lastDay === n - 1 ? s.streak + 1 : 1;
  s.played++; s.lastDay = n; s.totalPts += total;
  s.best = Math.max(s.best, total);
  s.maxStreak = Math.max(s.maxStreak || 0, s.streak);
  return s;
}

// Calendar date (YYYY-MM-DD) of puzzle number n, counted from the epoch date.
export function dateForPuzzle(epoch, n) {
  const [y, m, d] = epoch.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n - 1));
  return t.getUTCFullYear() + "-" + String(t.getUTCMonth() + 1).padStart(2, "0") + "-" + String(t.getUTCDate()).padStart(2, "0");
}

// Summarise saved results ({puzzleNumber: [{title, pts, b}]}) for the record screen.
export function summarise(results) {
  const games = Object.keys(results).map(Number).sort((a, b) => b - a).map(n => ({
    n, total: results[n].reduce((a, r) => a + r.pts, 0), res: results[n] }));
  const buckets = [["0-199", 0, 199], ["200-299", 200, 299], ["300-399", 300, 399], ["400+", 400, 500]]
    .map(([label, lo, hi]) => ({ label, count: games.filter(g => g.total >= lo && g.total <= hi).length }));
  const by = {};
  games.forEach(g => g.res.forEach(r => { (by[r.title] = by[r.title] || []).push(r.pts); }));
  const ideas = Object.keys(by).map(t => ({ title: t, avg: Math.round(by[t].reduce((a, b) => a + b, 0) / by[t].length), n: by[t].length }))
    .sort((a, b) => b.avg - a.avg);
  return { games, buckets, best: ideas.slice(0, 3), worst: ideas.slice(-3).reverse() };
}
