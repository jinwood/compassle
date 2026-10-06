import { clamp, px, py, score, todayStr, puzzleNumber, puzzleFor, shareText, recordDaily } from "./game.js";

const $ = s => document.querySelector(s);
const KEY = "wdis:v1";
const pad = $("#pad"), pinYou = $("#pinYou"), pinAns = $("#pinAns"), link = $("#link"),
  hint = $("#hint"), go = $("#go"), reveal = $("#reveal");
const bars = [...document.querySelectorAll("#progress i")];

let store = load();
let puzzles, icons = {}, cards, num, daily = true;
let i = 0, pos = null, locked = false, drag = false, res = [];

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || { results: {}, stats: {} }; }
  catch (_) { return { results: {}, stats: {} }; }
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
  $("#share").textContent = shareText(daily ? "#" + num : "(random set)", res);
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
  $("#meta").innerHTML = isDaily ? "DAILY #" + num + "<br>" + new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).replace(/,/g, "").toUpperCase() : "RANDOM SET<br>PRACTICE";
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
$("#again").addEventListener("click", () => {
  const all = puzzles.days.flat().slice();
  for (let k = all.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [all[k], all[j]] = [all[j], all[k]]; }
  start(all.slice(0, 5), false);
  window.scrollTo({ top: 0, behavior: "smooth" });
});

(async function init() {
  try {
    puzzles = await (await fetch("/data/puzzles.json")).json();
    try { icons = await (await fetch("/data/icons.json")).json(); } catch (_) {}
  } catch (_) {
    $("#ctitle").textContent = "Couldn't load today's puzzle"; $("#cdesc").textContent = "Check your connection and reload."; return;
  }
  num = puzzleNumber(puzzles.epoch, todayStr());
  const cs = puzzleFor(puzzles.days, num);
  start(cs, true);
  if (store.results[num]) { res = store.results[num]; finish(false); }
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
})();
