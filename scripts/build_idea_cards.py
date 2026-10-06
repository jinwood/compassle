#!/usr/bin/env python3
"""Place political ideas on the grid from CHES 2024 issue scores.
Method: for each idea, take the parties that most strongly back it (issue score within the top 20% of the
scale on the relevant end) and average their CHES positions (lrecon, galtan), weighted by support strength and
sqrt(vote share). If fewer than MIN parties qualify, take the MIN strongest backers.
Usage: python3 -I scripts/build_idea_cards.py data-src/CHES_2024_final_v2.csv > public/data/idea-cards.json
"""
import csv, json, math, sys

MIN, CUT = 12, 0.8
SOURCE = "CHES 2024 issue scores, derived (Rovny et al. 2025)"
# (title, description, variable, end) - end "L" = idea is the 0 end of the variable, "H" = the 10 end.
IDEAS = [
 ("Wealth redistribution", "Taxing and transferring from richer to poorer people to narrow inequality.", "redistribution", "L"),
 ("Deregulating markets", "Removing government rules on how businesses operate.", "deregulation", "H"),
 ("Cutting taxes", "Lowering taxes even if public services receive less money.", "spendvtax", "H"),
 ("Public services first", "Spending more on public services in preference to cutting taxes.", "spendvtax", "L"),
 ("Strict immigration limits", "Tight caps and controls on how many people may enter.", "immigrate_policy", "H"),
 ("Liberal immigration", "Easy rules for people to move to and settle in a country.", "immigrate_policy", "L"),
 ("Multiculturalism", "Different cultures keep their own identities within one society.", "multiculturalism", "L"),
 ("Assimilation", "Newcomers are expected to adopt the majority culture.", "multiculturalism", "H"),
 ("Tough on crime", "Stronger policing and harsher sentences, even at some cost to civil liberties.", "civlib_laworder", "H"),
 ("Civil liberties first", "Strong limits on state power, even if it makes fighting crime harder.", "civlib_laworder", "L"),
 ("LGBTQ+ rights", "Legal protection and equal treatment for LGBTQ+ people.", "lgbtq_rights", "L"),
 ("Same-sex marriage", "Legal marriage for couples of the same sex.", "samesex_marriage", "L"),
 ("Women's rights policies", "Equal pay, parental leave and similar policies.", "womens_rights", "L"),
 ("Religion in politics", "Religious principles shape law and public policy.", "religious_principles", "H"),
 ("Secular government", "Religion kept out of law and public policy.", "religious_principles", "L"),
 ("Nationalism", "National identity and sovereignty come first.", "nationalism", "H"),
 ("Cosmopolitanism", "People are citizens of the world first, and borders matter less.", "nationalism", "L"),
 ("Trade protectionism", "Tariffs and rules that shield domestic producers.", "protectionism", "H"),
 ("Free trade", "Few barriers to buying and selling across borders.", "protectionism", "L"),
 ("Devolving power", "More decisions made by regions and local government.", "regions", "L"),
 ("Strong executive", "Leaders can act without heavy constraint.", "executive_power", "H"),
 ("Limits on leaders", "Checks and balances that constrain those in power.", "executive_power", "L"),
 ("Government sway over judges", "Elected governments get a say in judicial decisions and appointments.", "judicial_independence", "H"),
 ("Independent judiciary", "Courts that governments cannot direct.", "judicial_independence", "L"),
 ("Climate policy over growth", "Cutting emissions even if the economy grows more slowly.", "climate_change", "L"),
 ("Growth over environment", "Economic growth takes priority over environmental protection.", "environment", "H"),
 ("Ethnic minority rights", "Extra legal protections and rights for ethnic minorities.", "ethnic_minorities", "L"),
 ("Environment over growth", "Protecting nature even at some cost to economic growth.", "environment", "L"),
 ("Self-reliance over welfare", "People look after themselves, with less redistribution by the state.", "redistribution", "H"),
 ("Regulated markets", "Strong government rules on how businesses operate.", "deregulation", "L"),
 ("Centralised government", "Decisions made nationally, with less power for regions.", "regions", "H"),
 ("Direct democracy", "Citizens decide big issues by referendum rather than leaving them to representatives.", "people_v_elite", "H"),
 ("Representative democracy", "Elected officials make the big decisions on voters' behalf.", "people_v_elite", "L"),
 ("Rural interests", "Policy that puts the countryside ahead of cities.", "urban_rural", "H"),
 ("Urban interests", "Policy that puts cities ahead of the countryside.", "urban_rural", "L"),
 ("Anti-establishment politics", "Attacking elites and the political establishment.", "anti_elite_salience", "H"),
 ("Fighting corruption", "Making the clean-up of politics a top priority.", "corrupt_salience", "H"),
 ("International authority over security", "A union of countries sets shared foreign and defence policy.", "eu_foreign", "H", (1, 7)),
 ("Free movement across borders", "Goods, services, capital and workers move freely between member countries.", "eu_intmark", "H", (1, 7)),
 ("Deeper international union", "Countries pool more sovereignty in a shared body.", "eu_position", "H", (1, 7)),
 ("Leaving international unions", "Countries take back powers from shared bodies.", "eu_position", "L", (1, 7)),
]

rows = [r for r in csv.DictReader(open(sys.argv[1], encoding="utf-8-sig")) if r["lrecon"] and r["galtan"]]
def f(r, k):
    try: return float(r[k])
    except ValueError: return None

out = []
for title, desc, var, end, *sc in IDEAS:
    lo, hi = sc[0] if sc else (0, 10)
    cand = []
    for r in rows:
        v = f(r, var)
        if v is None: continue
        t = (v - lo) / (hi - lo)
        s = t if end == "H" else 1 - t
        cand.append((s, r))
    cand.sort(key=lambda t: -t[0])
    pick = [c for c in cand if c[0] >= CUT]
    if len(pick) < MIN: pick = cand[:MIN]
    w = [s * math.sqrt((f(r, "vote") or 0) + 1) for s, r in pick]
    x = sum(wi * (float(r["lrecon"]) - 5) * 20 for wi, (s, r) in zip(w, pick)) / sum(w)
    y = sum(wi * (float(r["galtan"]) - 5) * 20 for wi, (s, r) in zip(w, pick)) / sum(w)
    n, k = len(pick), len({r["country"] for s, r in pick})
    out.append({"tag": "Idea", "title": title, "desc": desc, "x": round(x), "y": round(y),
      "note": "Estimated from the %d European parties (in %d countries) that most strongly back this idea. Their average position on the left-right and GAL-TAN scales is where the idea is placed. Parties that back an idea are not the same as the idea itself, so treat this as a guide." % (n, k),
      "source": SOURCE})
json.dump(out, sys.stdout, indent=1, ensure_ascii=False)
