#!/usr/bin/env python3
"""Pack idea cards from all sources into daily sets of 5 (seeded shuffle, no opposing pair on one day).
Days already in puzzles.json keep their cards (they may be live); only cards not yet scheduled are packed into new days appended after them.
Usage: python3 -I scripts/build_puzzles.py   (run from the repo root)"""
import json, random

cards = json.load(open("public/data/idea-cards.json")) + json.load(open("public/data/manifesto-cards.json"))
ICONS = json.load(open("scripts/icons_map.json"))  # title -> Lucide icon name (icons live in public/data/icons.json)
NOTES = json.load(open("scripts/notes.json"))  # friendly reveal text, written by hand
DESCS = json.load(open("scripts/descs.json"))  # one-to-two sentence explanation shown on the card
for c in cards: c["icon"] = ICONS[c["title"]]; c["note"] = NOTES[c["title"]]; c["desc"] = DESCS[c["title"]]
T = {c["title"]: c for c in cards}
PAIRS = [("Wealth redistribution","Self-reliance over welfare"),("Wealth redistribution","Public services first"),("Cutting taxes","Public services first"),
("Deregulating markets","Regulated markets"),("Strict immigration limits","Liberal immigration"),("Multiculturalism","Assimilation"),
("Tough on crime","Civil liberties first"),("Religion in politics","Secular government"),("Nationalism","Cosmopolitanism"),
("Trade protectionism","Free trade"),("Strong executive","Limits on leaders"),("Government sway over judges","Independent judiciary"),
("Climate policy over growth","Growth over environment"),("Environment over growth","Growth over environment"),("Climate policy over growth","Environment over growth"),
("Direct democracy","Representative democracy"),("Rural interests","Urban interests"),("Deeper international union","Leaving international unions"),
("International authority over security","Deeper international union"),("International authority over security","Leaving international unions"),
("Devolving power","Centralised government"),("LGBTQ+ rights","Same-sex marriage"),("Free movement across borders","Strict immigration limits"),
("Free movement across borders","Liberal immigration"),("Free movement across borders","Deeper international union"),("Anti-establishment politics","Direct democracy"),
("Nationalism","Leaving international unions"),("Military strength","Anti-militarism"),("Human rights and freedoms","Civil liberties first"),
("Equality","Wealth redistribution"),("Trade unions","Wealth redistribution"),("Traditional morality","Religion in politics"),("Traditional morality","Secular government"),
("Standing up to Russia","Accommodating Russia"),("Immigration as top priority","Strict immigration limits"),("Immigration as top priority","Liberal immigration"),
("Climate as top priority","Climate policy over growth"),("Climate as top priority","Environment over growth"),("Redistribution as top priority","Wealth redistribution"),
("Europe as top priority","Deeper international union"),("Europe as top priority","Leaving international unions")]
assert all(a in T and b in T for a, b in PAIRS), "unknown title in PAIRS"
BAD = {frozenset(p) for p in PAIRS}
p = json.load(open("public/data/puzzles.json"))
kept = [[c["title"] for c in d] for d in p["days"]]
left = [t for t in T if t not in {t for d in kept for t in d}]
N = len(left) // 5
for seed in range(10000):
    ts = list(left); random.Random(seed).shuffle(ts); days, pool = [], ts
    for _ in range(N):
        d = []
        for t in pool:
            if all(frozenset((t, u)) not in BAD for u in d): d.append(t)
            if len(d) == 5: break
        if len(d) < 5: break
        days.append(d); pool = [t for t in pool if t not in d]
    if len(days) == N: break
else: raise SystemExit("no packing found")
days = kept + days
p["days"] = [[T[t] for t in d] for d in days]
json.dump(p, open("public/data/puzzles.json", "w"), indent=1, ensure_ascii=False)
print(len(T), "cards ->", len(days), "days; unused:", pool)
