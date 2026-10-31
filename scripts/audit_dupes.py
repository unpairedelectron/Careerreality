#!/usr/bin/env python3
import sys, os, re, json, csv, hashlib, html
from collections import defaultdict

def strip_html(s):
    s = re.sub(r"(?is)<(script|style).*?</\1>", " ", s)
    return html.unescape(re.sub(r"(?s)<[^>]+>", "\n", s))

def load(path):
    docs = {}
    if os.path.isdir(path):
        for fn in sorted(os.listdir(path)):
            if fn.lower().endswith((".md", ".html", ".htm", ".txt")):
                raw = open(os.path.join(path, fn), encoding="utf-8", errors="ignore").read()
                docs[fn] = strip_html(raw) if fn.lower().endswith((".html", ".htm")) else raw
    else:
        for r in json.load(open(path, encoding="utf-8")):
            docs[r["slug"]] = strip_html(r["body"]) if "<" in r["body"] else r["body"]
    return docs

def paras(t, n=25):
    out = []
    for p in re.split(r"\n\s*\n", t):
        p = re.sub(r"\s+", " ", p).strip()
        if len(p.split()) >= n: out.append(p)
    return out

def h(p): return hashlib.md5(re.sub(r"[^a-z0-9 ]", "", p.lower()).encode()).hexdigest()

def main(path):
    docs, owner, stats = load(path), defaultdict(set), {}
    for slug, text in docs.items():
        seen, dup, total = defaultdict(int), 0, len(text.split())
        ps = paras(text)
        for p in ps:
            k = h(p); seen[k] += 1; owner[k].add(slug)
            if seen[k] > 1: dup += len(p.split())
        stats[slug] = dict(words=total, paras=len(ps), dup=dup, pct=round(100 * dup / max(total, 1), 1))
    shared = {k: s for k, s in owner.items() if len(s) > 1}
    for slug in stats:
        stats[slug]["shared"] = sum(1 for k, s in shared.items() if slug in s)
    with open("dupe_report.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["slug", "words", "paras>=25w", "repeated_inside_words", "repeated_inside_pct", "paras_shared_with_other_articles"])
        for s, v in sorted(stats.items(), key=lambda kv: -kv[1]["pct"]):
            w.writerow([s, v["words"], v["paras"], v["dup"], v["pct"], v["shared"]])
    for s, v in sorted(stats.items(), key=lambda kv: -kv[1]["pct"])[:10]:
        print(f'{v["pct"]:5.1f}%  {v["words"]:6d}w  {s}')

if __name__ == "__main__":
    main(sys.argv[1]) if len(sys.argv) == 2 else sys.exit("usage: audit_dupes.py <folder|json>")
