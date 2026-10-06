// Records one finished daily game. No IP, cookie or user id is stored.
// Body: {"day": 12, "total": 310, "cards": [{"t": "Free trade", "p": 64}, ... 5 items]}
// Needs a D1 binding named DB (declared in wrangler.jsonc; table in schema.sql).
const json = (o, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

export async function handleFinish(request, env) {
  if (request.method !== "POST") return json({ error: "method" }, 405);
  const origin = request.headers.get("origin");
  try { if (origin && new URL(origin).host !== new URL(request.url).host) return json({ error: "origin" }, 403); }
  catch (_) { return json({ error: "origin" }, 403); }

  const text = await request.text();           // sendBeacon sends text/plain, so parse by hand
  if (text.length > 2000) return json({ error: "too large" }, 413);
  let d; try { d = JSON.parse(text); } catch (_) { return json({ error: "json" }, 400); }

  if (!d || !isInt(d.day, 1, 100000) || !Array.isArray(d.cards) || d.cards.length !== 5) return json({ error: "shape" }, 400);
  let sum = 0;
  for (const c of d.cards) {
    if (!c || typeof c.t !== "string" || c.t.length < 1 || c.t.length > 60 || !isInt(c.p, 0, 100)) return json({ error: "card" }, 400);
    sum += c.p;
  }
  if (d.total !== sum) return json({ error: "total" }, 400);
  if (!env.DB) return json({ error: "no database" }, 503);

  const play = crypto.randomUUID(), ts = Math.floor(Date.now() / 1000);
  const stmt = env.DB.prepare("INSERT INTO scores (play, ts, day, total, idx, title, pts) VALUES (?, ?, ?, ?, ?, ?, ?)");
  await env.DB.batch(d.cards.map((c, i) => stmt.bind(play, ts, d.day, sum, i, c.t, c.p)));
  return json({ ok: true }, 201);
}
