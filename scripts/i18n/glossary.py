"""Glossary tooling for the PT->EN translation of data/processes.json.

Usage (run from repo root):
  python3 -I scripts/i18n/glossary.py check   # every PT string covered, map is consistent
  python3 -I scripts/i18n/glossary.py md      # write docs/glossary-pt-en.md for review
  python3 -I scripts/i18n/glossary.py apply   # rewrite data/processes.json in English
Ids (process, domain, phase, edge) are never touched.

ONE-SHOT: `check`, `md` and `apply` all read Portuguese data. After `apply` they fail on
every string. To re-apply after editing the glossary, first restore the Portuguese data:
  git checkout main -- data/processes.json
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "processes.json"
GLOSSARY = Path(__file__).with_name("glossary.json")


def norm(s):
    # Extraction left soft hyphens (and "­ " breaks) inside some PT strings.
    return re.sub("­ ?", "", s)


def load():
    return json.loads(DATA.read_text(encoding="utf-8")), json.loads(GLOSSARY.read_text(encoding="utf-8"))


def tr(table, s, missing):
    key = norm(s)
    if key not in table:
        missing.add(s)
        return s
    return table[key]


def translate(d, g):
    """Return (translated copy, set of uncovered strings)."""
    missing = set()
    s = g["strings"]
    d = json.loads(json.dumps(d))
    for k, v in g["source"].items():
        d["source"][k] = v
    for sect, ident in (("principles", "name"), ("domains", "name"), ("phases", "name")):
        for item in d[sect]:
            item[ident] = tr(g[sect], item[ident], missing)
    d["edgesNote"] = tr(g["edgesNote"], d["edgesNote"], missing)
    for p in d["processes"]:
        p["name"] = tr(s, p["name"], missing)
        for k in ("inputs", "tools", "outputs"):
            for a in p[k]:
                a["name"] = tr(s, a["name"], missing)
                a["items"] = [tr(s, i, missing) for i in a["items"]]
        p["sourceNotes"] = [tr(s, n, missing) for n in p.get("sourceNotes", [])] if "sourceNotes" in p else None
        if p["sourceNotes"] is None:
            del p["sourceNotes"]
    for e in d["edges"]:
        e["artifacts"] = [tr(s, a, missing) for a in e["artifacts"]]
    return d, missing


def check():
    d, g = load()
    _, missing = translate(d, g)
    assert not missing, f"uncovered strings: {sorted(missing)}"
    pt = {}
    for sect in ("principles", "domains", "phases", "edgesNote", "strings"):
        for k, v in g[sect].items():
            pt.setdefault(v, []).append(k)
    dup = {en: ks for en, ks in pt.items() if len(ks) > 1 and en != "Etc."}
    print("covered all strings; EN strings reached from >1 PT key:", dup or "none")


def md():
    _, g = load()
    out = ["# PT -> EN glossary (draft for review)", "",
           "Source of truth: `scripts/i18n/glossary.json`. Edit there, then re-run `python3 -I scripts/i18n/glossary.py md`.", ""]
    for sect in ("principles", "domains", "phases", "strings"):
        out += [f"## {sect}", "", "| Portuguese | English |", "|---|---|"]
        out += [f"| {k.replace('|', chr(92) + '|')} | {v.replace('|', chr(92) + '|')} |" for k, v in g[sect].items()]
        out.append("")
    (ROOT / "docs" / "glossary-pt-en.md").write_text("\n".join(out), encoding="utf-8")


def apply():
    d, g = load()
    new, missing = translate(d, g)
    assert not missing, f"uncovered strings: {sorted(missing)}"
    DATA.write_text(json.dumps(new, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    {"check": check, "md": md, "apply": apply}[sys.argv[1]]()
