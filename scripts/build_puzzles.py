#!/usr/bin/env python3
"""Pack idea cards from all sources into daily sets of 5 (seeded shuffle, no opposing pair on one day).
Usage: python3 -I scripts/build_puzzles.py   (run from the repo root)"""
import json, random

cards = json.load(open("public/data/idea-cards.json")) + json.load(open("public/data/manifesto-cards.json"))
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
("Equality","Wealth redistribution"),("Trade unions","Wealth redistribution"),("Traditional morality","Religion in politics"),("Traditional morality","Secular government")]
assert all(a in T and b in T for a, b in PAIRS), "unknown title in PAIRS"
BAD = {frozenset(p) for p in PAIRS}
N = len(T) // 5
for seed in range(10000):
    ts = list(T); random.Random(seed).shuffle(ts); days, pool = [], ts
    for _ in range(N):
        d = []
        for t in pool:
            if all(frozenset((t, u)) not in BAD for u in d): d.append(t)
            if len(d) == 5: break
        if len(d) < 5: break
        days.append(d); pool = [t for t in pool if t not in d]
    if len(days) == N: break
else: raise SystemExit("no packing found")
p = json.load(open("public/data/puzzles.json")); p["days"] = [[T[t] for t in d] for d in days]
json.dump(p, open("public/data/puzzles.json", "w"), indent=1, ensure_ascii=False)
print(len(T), "cards ->", N, "days; unused:", pool)
