import { clamp, px, py, score, todayStr, puzzleNumber, puzzleFor, shareText, recordDaily, dateForPuzzle, summarise, EMO } from "./game.js";

const $ = s => document.querySelector(s);
const KEY = "wdis:v1";
const pad = $("#pad"), pinYou = $("#pinYou"), pinAns = $("#pinAns"), link = $("#link"),
  hint = $("#hint"), go = $("#go"), reveal = $("#reveal");
const bars = [...document.querySelectorAll("#progress i")];

let store = load();
let puzzles, icons = {}, cards, num, daily = true;
let i = 0, pos = null, locked = false, drag = false, res = [];

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || { results: {}, stats: {}, progress: null }; }
  catch (_) { return { results: {}, stats: {}, progress: null }; }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (_) {} }
const put = (el, x, y) => { el.style.left = px(x) + "%"; el.style.top = py(y) + "%"; };

function loadCard() {
  const c = cards[i];
  $("#ctag").textContent = (c.country ? c.country + " · " : "") + c.tag + " · " + (i + 1) + " of " + cards.length;
  $("#ctitle").textContent = c.title;
  $("#cdesc").textContent = c.desc;
  $("#cicon").innerHTML = icons[c.icon] ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + icons[c.icon] + "</svg>" : "";
  pos = null; locked = false;
  pinYou.hidden = true; pinAns.hidden = true; hint.style.display = "flex";
  link.setAttribute("visibility", "hidden");
  reveal.hidden = true;
  go.disabled = true; go.textContent = "Lock it in";
  bars.forEach((b, k) => { b.className = k < i ? (b.dataset.c || "") : (k === i ? "cur" : ""); });
}

function setPos(x, y) {
  pos = { x: clamp(Math.round(x)), y: clamp(Math.round(y)) };
  put(pinYou, pos.x, pos.y); pinYou.hidden = false; hint.style.display = "none"; go.disabled = false;
}
function fromEvent(e) {
  const r = pad.getBoundingClientRect();
  setPos(((e.clientX - r.left) / r.width) * 200 - 100, 100 - ((e.clientY - r.top) / r.height) * 200);
}
pad.addEventListener("pointerdown", e => { if (locked) return; drag = true; try { pad.setPointerCapture(e.pointerId); } catch (_) {} fromEvent(e); pad.focus({ preventScroll: true }); });
pad.addEventListener("pointermove", e => { if (drag && !locked) fromEvent(e); });
pad.addEventListener("pointerup", () => { drag = false; });
pad.addEventListener("pointercancel", () => { drag = false; });
pad.addEventListener("keydown", e => {
  if (locked) return;
  const s = e.shiftKey ? 10 : 2; let dx = 0, dy = 0;
  if (e.key === "ArrowLeft") dx = -s; else if (e.key === "ArrowRight") dx = s;
  else if (e.key === "ArrowUp") dy = s; else if (e.key === "ArrowDown") dy = -s; else return;
  e.preventDefault();
  const b = pos || { x: 0, y: 0 }; setPos(b.x + dx, b.y + dy);
});

function lock() {
  const c = cards[i], s = score(c, pos);
  res.push({ title: c.title, gx: pos.x, gy: pos.y, ax: c.x, ay: c.y, d: s.d, pts: s.pts, b: s.b });
  bars[i].dataset.c = s.b; bars[i].className = s.b;
  if (daily) { store.progress = { num, res: res.map(r => ({ title: r.title, gx: r.gx, gy: r.gy, ax: r.ax, ay: r.ay, d: r.d, pts: r.pts, b: r.b })) }; save(); }
  put(pinAns, c.x, c.y); pinAns.hidden = false;
  link.setAttribute("x1", px(pos.x)); link.setAttribute("y1", py(pos.y)); link.setAttribute("x2", px(c.x)); link.setAttribute("y2", py(c.y));
  link.setAttribute("visibility", "visible");
  $("#rpts").textContent = s.pts + " pts";
  $("#rdist").textContent = "OFF BY " + Math.round(s.d) + "  ·  " + Math.round(Math.abs(s.dx)) + " ACROSS, " + Math.round(Math.abs(s.dy)) + " UP/DOWN";
  $("#rnote").textContent = c.note;
  $("#rsrc").textContent = "Reference position: " + (c.source || "editorial estimate") + ".";
  reveal.hidden = false; locked = true;
  go.textContent = i < cards.length - 1 ? "Next card" : "See results";
  reveal.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function finish(fresh) {
  $("#play").style.display = "none";
  const end = $("#end"); end.hidden = false; end.style.display = "flex";
  const total = res.reduce((a, r) => a + r.pts, 0);
  if (daily && fresh) {
    store.results[num] = res.map(({ title, gx, gy, ax, ay, d, pts, b }) => ({ title, gx, gy, ax, ay, d, pts, b }));
    store.stats = recordDaily(store.stats, num, total);
    store.progress = null;
    save();
  }
  $("#tot").textContent = total;
  const rows = $("#rows"); rows.innerHTML = "";
  const mini = $("#mini"); mini.querySelectorAll(".pin").forEach(n => n.remove());
  let lines = "";
  res.forEach((r, k) => {
    const row = document.createElement("div"); row.className = "row";
    row.innerHTML = '<span class="sq ' + r.b + '"></span><span class="nm"></span><span class="pt"></span>';
    row.querySelector(".nm").textContent = (k + 1) + ". " + r.title;
    row.querySelector(".pt").textContent = r.pts + " pts";
    rows.appendChild(row);
    lines += '<line x1="' + px(r.gx) + '" y1="' + py(r.gy) + '" x2="' + px(r.ax) + '" y2="' + py(r.ay) + '" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/>';
    const a = document.createElement("div"); a.className = "pin ans"; a.textContent = k + 1; put(a, r.ax, r.ay); mini.appendChild(a);
    const g = document.createElement("div"); g.className = "pin you"; g.textContent = k + 1; put(g, r.gx, r.gy); mini.appendChild(g);
  });
  $("#minisvg").innerHTML = lines;
  $("#share").textContent = shareText(daily ? "#" + num : "(preview)", res);
  renderStats();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderStats() {
  const s = store.stats, el = $("#stats");
  const avg = s.played ? Math.round(s.totalPts / s.played) : 0;
  el.innerHTML = [["played", s.played || 0], ["streak", s.streak || 0], ["best", s.best || 0], ["avg", avg]]
    .map(([k, v]) => "<div><b>" + v + "</b><span>" + k + "</span></div>").join("");
  const tick = () => {
    const n = new Date(), t = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1) - n;
    const h = Math.floor(t / 36e5), m = Math.floor(t / 6e4) % 60;
    $("#nextin").textContent = "Next daily in " + h + "h " + m + "m";
  };
  tick(); clearInterval(renderStats.t); renderStats.t = setInterval(tick, 30000);
}

function start(c, isDaily) {
  cards = c; daily = isDaily; res = []; i = 0;
  bars.forEach(b => delete b.dataset.c);
  $("#end").style.display = "none"; $("#end").hidden = true; $("#copy").textContent = "Copy result";
  $("#play").style.display = "contents";
  $("#meta").innerHTML = isDaily ? "DAILY #" + num + "<br>" + new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).replace(/,/g, "").toUpperCase() : "PREVIEW";
  loadCard();
}

go.addEventListener("click", () => {
  if (!locked) { if (pos) lock(); return; }
  if (i < cards.length - 1) { i++; loadCard(); } else finish(true);
});
$("#copy").addEventListener("click", () => {
  const btn = $("#copy"), t = $("#share").textContent;
  const fallback = () => {
    const r = document.createRange(); r.selectNodeContents($("#share"));
    const s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = "Selected. Copy it manually";
  };
  try { navigator.clipboard.writeText(t).then(() => { btn.textContent = "Copied"; }, fallback); } catch (_) { fallback(); }
});

(async function init() {
  try {
    puzzles = await (await fetch("/data/puzzles.json")).json();
    try { icons = await (await fetch("/data/icons.json")).json(); } catch (_) {}
  } catch (_) {
    $("#ctitle").textContent = "Couldn't load today's puzzle"; $("#cdesc").textContent = "Check your connection and reload."; return;
  }
  num = puzzleNumber(puzzles.epoch, todayStr());
  const peek = parseInt(new URLSearchParams(location.search).get("day"), 10);
  if (peek > 0) { // ?day=N previews any day without touching saved results
    start(puzzleFor(puzzles.days, peek), false);
    $("#meta").innerHTML = "PREVIEW<br>DAY " + peek;
    return;
  }
  const cs = puzzleFor(puzzles.days, num);
  start(cs, true);
  if (store.results[num]) { res = store.results[num]; finish(false); }
  else if (store.progress && store.progress.num === num && store.progress.res.length) {
    res = store.progress.res; i = res.length;
    res.forEach((r, k) => { bars[k].dataset.c = r.b; });
    if (i >= cards.length) finish(true); else loadCard();
  }
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
})();

// ---- Record screen ----
const dlg = $("#dlg");
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
function renderRecord() {
  const s = store.stats || {}, sum = summarise(store.results);
  const avg = s.played ? Math.round(s.totalPts / s.played) : 0;
  const max = Math.max(1, ...sum.buckets.map(b => b.count));
  let h = '<div class="stats">' + [["played", s.played || 0], ["streak", s.streak || 0], ["longest", s.maxStreak || s.streak || 0], ["best", s.best || 0]]
    .map(([k, v]) => "<div><b>" + v + "</b><span>" + k + "</span></div>").join("") + "</div>";
  if (!sum.games.length) return h + '<p class="empty">No finished games yet. Play today\'s puzzle and it will show up here.</p>';
  h += '<div class="dsec">Average ' + avg + ' / 500</div>' + sum.buckets.map(b => '<div class="bar"><span>' + b.label + '</span><i style="width:' + (b.count / max * 100) + '%"></i><span>' + b.count + "</span></div>").join("");
  h += '<div class="dsec">Recent games</div>' + sum.games.slice(0, 14).map(g => '<div class="game"><span class="no">#' + g.n + " · " + esc(dateForPuzzle(puzzles.epoch, g.n)) + "</span><span>" + g.res.map(r => EMO[r.b]).join("") + '</span><span class="sc">' + g.total + "</span></div>").join("");
  if (sum.games.length >= 2) {
    const row = i => '<div class="idea"><span>' + esc(i.title) + "</span><span>" + i.avg + " avg</span></div>";
    h += '<div class="dsec">Your best ideas</div>' + sum.best.map(row).join("") + '<div class="dsec">Hardest for you</div>' + sum.worst.map(row).join("");
  }
  return h;
}
$("#statsBtn").addEventListener("click", () => { $("#dbody").innerHTML = renderRecord(); $("#dnote").textContent = "Saved on this device only. Export to move it to another."; dlg.showModal(); });
$("#dclose").addEventListener("click", () => dlg.close());
dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
$("#dexport").addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ app: "compassle", v: 1, results: store.results, stats: store.stats }, null, 1)], { type: "application/json" }));
  a.download = "compassle-record.json"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});
$("#dimport").addEventListener("click", () => $("#dfile").click());
$("#dfile").addEventListener("change", async e => {
  const file = e.target.files[0]; e.target.value = ""; if (!file) return;
  try {
    const d = JSON.parse(await file.text());
    if (d.app !== "compassle" || typeof d.results !== "object" || typeof d.stats !== "object") throw new Error("shape");
    for (const n in d.results) if (!Array.isArray(d.results[n]) || d.results[n].some(r => typeof r.pts !== "number" || typeof r.title !== "string" || !(r.b in EMO))) throw new Error("rows");
    if (!confirm("Replace the record on this device with the imported one?")) return;
    store = { results: d.results, stats: d.stats, progress: null }; save();
    $("#dbody").innerHTML = renderRecord(); $("#dnote").textContent = "Imported. Reload to see today's state.";
  } catch (_) { $("#dnote").textContent = "That file isn't a valid Compassle record."; }
});
$("#dreset").addEventListener("click", () => {
  if (!confirm("Delete all saved scores and streaks on this device?")) return;
  store = { results: {}, stats: {}, progress: null }; save(); $("#dbody").innerHTML = renderRecord(); $("#dnote").textContent = "Reset. Reload to start today's puzzle afresh.";
});
