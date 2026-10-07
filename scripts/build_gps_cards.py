#!/usr/bin/env python3
"""Place ideas on the grid from the Global Party Survey 2019 (Norris, CC0), which covers parties worldwide.
Two kinds of card, both using the expert placements V4 (economic left-right) and V6 (social liberal-conservative), rescaled to -100..100:
 - Issue ideas: the parties that most strongly back the idea (top 20% of a 0-10 variable on the relevant end, at least MIN) are averaged,
   weighted by support strength and sqrt(vote share), as in build_idea_cards.py.
 - Family ideas: the parties in a ParlGov party family, weighted by sqrt(vote share).
Usage: python3 -I scripts/build_gps_cards.py data-src/GPS_2019_party.tsv > public/data/gps-cards.json
"""
import csv, json, math, sys

MIN, CUT = 12, 0.8
SOURCE = "Global Party Survey 2019 (Norris), derived"
# (title, description, variable, end) - end "H" = idea is the 10 end of the variable, "L" = the 0 end.
ISSUES = [
 ("Populism", "Politics that sets 'the people' against a corrupt elite, and says the people's will should decide.", "V8_Scale", "H"),
 ("Patronage politics", "Handing out jobs, projects and benefits mainly to your own supporters.", "V17", "H"),
 ("Undermining democratic norms", "Weakening the courts, the press or the opposition in order to hold on to power.", "V16", "H"),
]
# (title, description, ParlGov family)
FAMILIES = [
 ("Conservatism", "Preserving established institutions and traditions, with change coming slowly.", "Conservative"),
 ("Social democracy", "A market economy with strong unions, a generous welfare state and public services.", "Social democracy"),
 ("Liberalism", "Individual freedom and the rule of law, with limited government.", "Liberal"),
 ("Socialism", "Common ownership and a far bigger role for the state in the economy.", "Communist/Socialist"),
 ("Green politics", "Putting ecology first, alongside social justice and grassroots democracy.", "Green/Ecologist"),
 ("Christian democracy", "Politics built on Christian social teaching: family, community and moderate welfare.", "Christian democracy"),
 ("Radical right", "Nativist, nationalist politics that is hostile to immigration and the liberal establishment.", "Right-wing"),
]

def f(v):
    try:
        v = float(v)
        return None if v >= 99 else v
    except (ValueError, TypeError): return None

rows = []
for r in csv.DictReader(open(sys.argv[1], encoding="utf-8"), delimiter="\t"):
    x, y = f(r["V4_Scale"]), f(r["V6_Scale"])
    if x is None or y is None: continue
    r["_x"], r["_y"] = (x - 5) * 20, (y - 5) * 20
    r["_v"] = math.sqrt((f(r["PartyPerVote"]) or 0) + 1)
    rows.append(r)

def place(pick, w, label):
    x = sum(wi * r["_x"] for wi, r in zip(w, pick)) / sum(w)
    y = sum(wi * r["_y"] for wi, r in zip(w, pick)) / sum(w)
    return {"tag": "Idea", "x": round(x), "y": round(y), "note": "",
            "source": "%s · %d parties in %d countries" % (SOURCE, len(pick), len({r["Country"] for r in pick}))}

out = []
for title, desc, var, end in ISSUES:
    cand = []
    for r in rows:
        v = f(r[var])
        if v is None: continue
        cand.append((v / 10 if end == "H" else 1 - v / 10, r))
    cand.sort(key=lambda t: -t[0])
    pick = [c for c in cand if c[0] >= CUT]
    if len(pick) < MIN: pick = cand[:MIN]
    out.append({"title": title, "desc": desc, **place([r for s, r in pick], [s * r["_v"] for s, r in pick], title)})
for title, desc, fam in FAMILIES:
    pick = [r for r in rows if r["PG_family"] == fam]
    out.append({"title": title, "desc": desc, **place(pick, [r["_v"] for r in pick], title)})
json.dump(out, sys.stdout, indent=1, ensure_ascii=False)
