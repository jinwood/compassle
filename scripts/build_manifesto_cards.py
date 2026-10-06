#!/usr/bin/env python3
"""Place political ideas on the grid from Manifesto Project (MPDS 2026a) emphasis data.
Method: each manifesto (since 2010) gets a position: x = RILE (left-right), y = an authoritarian index built from
cultural categories (see AUTH). Both are standardised then rescaled to the spread of CHES party positions, so the
two sources share one scale. An idea is placed at the emphasis-weighted mean position of the manifestos that give
it the most space (top quartile, minimum MIN).
Usage: python3 -I scripts/build_manifesto_cards.py data-src/MPDataset_MPDS2026a.csv data-src/CHES_2024_final_v2.csv > public/data/manifesto-cards.json
Data files are not redistributed (Manifesto Project terms); only the derived numbers are published.
"""
import csv, json, statistics as st, sys

SINCE, MIN = 201001, 30
SOURCE = "Manifesto Project Dataset 2026a (Lehmann et al.), derived"
# authoritarian index = sum(AUTH) - sum(LIB). National way of life+, traditional morality+, law and order+,
# multiculturalism-, political authority vs. national way of life-, traditional morality-, multiculturalism+, freedom & human rights.
AUTH = ["per601", "per603", "per605", "per608", "per305"]
LIB = ["per602", "per604", "per607", "per201"]

# (title, description, [categories]); emphasis = sum of the categories' shares of the manifesto.
IDEAS = [
 ("Military strength", "Spending on and support for the armed forces.", ["per104"]),
 ("Anti-militarism", "Cutting military spending and favouring disarmament and peace.", ["per105", "per106"]),
 ("Free market economy", "Free enterprise, with the market rather than the state allocating resources.", ["per401"]),
 ("Economic planning", "Government directs the economy through long-term plans.", ["per404"]),
 ("Nationalisation", "Key industries and utilities owned by the state.", ["per413"]),
 ("Expanding welfare", "More generous public pensions, benefits and social care.", ["per504"]),
 ("Limiting welfare", "Cutting back state welfare and benefits.", ["per505"]),
 ("Expanding education", "More public spending on schools and universities.", ["per506"]),
 ("Environmental protection", "Conserving nature and fighting pollution.", ["per501"]),
 ("Infrastructure and technology", "Public investment in transport, energy and research.", ["per411"]),
 ("Keynesian demand management", "Governments spend to boost demand and jobs in downturns.", ["per409"]),
 ("Traditional morality", "Law and public life that uphold traditional moral values.", ["per603"]),
 ("Equality", "Fairer outcomes and treatment for all groups in society.", ["per503"]),
 ("Trade unions", "Support for organised labour and workers' collective rights.", ["per701"]),
 ("Farmers and agriculture", "Subsidies and protection for the farming sector.", ["per703"]),
 ("Protecting minority groups", "Special protection for disadvantaged groups in society.", ["per705"]),
 ("Federalism", "Power shared between national and regional governments.", ["per301"]),
 ("Strong political authority", "Stable government and a state able to act decisively.", ["per305"]),
 ("Human rights and freedoms", "Personal freedom, civil rights and the rule of law.", ["per201"]),
 ("Entrepreneurship and incentives", "Tax breaks and rewards for business owners and risk-takers.", ["per402"]),
 ("Supporting the middle class", "Policy aimed at professionals and the middle class.", ["per704"]),
 ("Civic duty", "Citizens' duty to contribute to society and community.", ["per606"]),
 ("Anti-imperialism", "Opposing dominance by powerful states over weaker ones.", ["per103"]),
 ("Efficient government", "Streamlining the state and cutting administrative waste.", ["per303"]),
 ("Culture and the arts", "Public support for the arts, heritage and cultural life.", ["per502"]),
]

# Ideas with a clear signal that don't duplicate a CHES idea. The rest were noisy or near the centre.
KEEP = {"Military strength", "Anti-militarism", "Nationalisation", "Expanding education", "Traditional morality", "Equality", "Trade unions", "Human rights and freedoms"}

def f(v):
    try: return float(v)
    except (ValueError, TypeError): return 0.0

rows = [r for r in csv.DictReader(open(sys.argv[1], encoding="utf-8-sig")) if r["date"] and int(r["date"]) >= SINCE and r["rile"] not in ("", "NA")]
for r in rows:
    r["_x"] = f(r["rile"]); r["_y"] = sum(f(r[c]) for c in AUTH) - sum(f(r[c]) for c in LIB)
mx, sx = st.mean(r["_x"] for r in rows), st.pstdev(r["_x"] for r in rows)
my, sy = st.mean(r["_y"] for r in rows), st.pstdev(r["_y"] for r in rows)
ch = [r for r in csv.DictReader(open(sys.argv[2], encoding="utf-8-sig")) if r["lrecon"] and r["galtan"]]
tx = st.pstdev((float(r["lrecon"]) - 5) * 20 for r in ch); ty = st.pstdev((float(r["galtan"]) - 5) * 20 for r in ch)
cx = st.mean((float(r["lrecon"]) - 5) * 20 for r in ch); cy = st.mean((float(r["galtan"]) - 5) * 20 for r in ch)
for r in rows:
    r["X"] = (r["_x"] - mx) / sx * tx + cx; r["Y"] = (r["_y"] - my) / sy * ty + cy

if len(sys.argv) > 3 and sys.argv[3] == "--parties":  # sanity check helper
    for r in rows:
        if r["countryname"] in ("United States", "United Kingdom", "Germany") and r["date"] >= "202000":
            print(r["countryname"], r["partyabbrev"], r["date"], round(r["X"]), round(r["Y"]), file=sys.stderr)

out = []
for title, desc, cats in IDEAS:
    if title not in KEEP: continue
    e = [(sum(f(r[c]) for c in cats), r) for r in rows]
    e.sort(key=lambda t: -t[0])
    k = max(MIN, len(e) // 4)
    pick = [t for t in e[:k] if t[0] > 0]
    w = sum(t[0] for t in pick)
    x = sum(t[0] * t[1]["X"] for t in pick) / w; y = sum(t[0] * t[1]["Y"] for t in pick) / w
    n, c = len(pick), len({t[1]["country"] for t in pick})
    out.append({"tag": "Idea", "title": title, "desc": desc, "x": max(-100, min(100, round(x))), "y": max(-100, min(100, round(y))),
      "note": "Estimated from %d party manifestos (in %d countries, since 2010) that give this idea the most space. Their average left-right and authoritarian-libertarian positions are where the idea is placed. Manifesto emphasis is not the same as support, so treat this as a guide." % (n, c),
      "source": SOURCE})
json.dump(out, sys.stdout, indent=1, ensure_ascii=False)
