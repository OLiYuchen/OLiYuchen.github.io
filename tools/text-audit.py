#!/usr/bin/env python3
"""Where the portfolio repeats itself, and where it asks to be read without
giving anything to look at.

    python3 tools/text-audit.py          # writes drafts/TEXT-AUDIT.md

Three questions, per page and per section:

  repeated   a sentence that appears more than once, here or on another page
  unpaired   a section with words and no picture, diagram or screen in it
  long       a paragraph past the length where a reader starts skimming

It reports; it changes nothing. Every row names the file and the section so
the cut can be checked before it is made.
"""
import html
import os
import pathlib
import difflib
import re
import sys
from collections import defaultdict

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "drafts" / "TEXT-AUDIT.md"

# The pages a reader actually walks through. Drafts, experiments and the
# utility pages are not part of the portfolio's reading experience.
PAGES = [
    ("Home", "index.html"),
    ("About", "about/index.html"),
    ("Paira", "paira/index.html"),
    ("Merlin Bird ID", "merlin/index.html"),
    ("EcoScan", "ecoscan/index.html"),
    ("Common Ground", "game/index.html"),
    ("Explorations", "explorations/index.html"),
    ("Focus House", "focus-house/index.html"),
    ("Mooncake", "mooncake/index.html"),
]

LONG_WORDS = 55          # a paragraph past this is where skimming starts
STRIP = re.compile(r"<(script|style|svg|noscript)\b.*?</\1>", re.S | re.I)
# The rail label, and anything a reader clicks rather than reads. Leaving
# these in turns "Key Findings 03" into part of a sentence and makes two
# buttons look like a repeated thought.
CHROME = re.compile(r"<(aside|nav|button)\b.*?</\1>|<a\b[^>]*class=\"[^\"]*btn[^\"]*\".*?</a>", re.S | re.I)
TAG = re.compile(r"<[^>]+>")


def clean(s):
    s = html.unescape(TAG.sub(" ", s))
    s = s.replace("’", "'").replace("—", "-").replace("–", "-")
    return re.sub(r"\s+", " ", s).strip()


def sentences(text):
    for raw in re.split(r"(?<=[.!?])\s+", text):
        t = raw.strip()
        if len(t.split()) >= 6:
            yield t


def key(sentence):
    return re.sub(r"[^a-z0-9 ]", "", sentence.lower()).strip()


def sections(src):
    """Every <section>, with its label, its text and whether it shows anything."""
    out = []
    for m in re.finditer(r"<section\b[^>]*>", src):
        start = m.start()
        depth, end = 0, len(src)
        for t in re.finditer(r"<(/?)section\b", src[start:]):
            depth += -1 if t.group(1) else 1
            if depth == 0:
                end = start + t.end()
                break
        block = src[start:end]
        sid = re.search(r'id="([^"]+)"', m.group(0))
        label = re.search(r'class="section-label">([^<]*)<', block)
        head = re.search(r"<h2[^>]*>(.*?)</h2>", block, re.S)
        body = CHROME.sub(" ", STRIP.sub(" ", block))
        shows = bool(re.search(r"<(img|video|figure|picture)\b", body)) or "svg" in block
        out.append({
            "id": sid.group(1) if sid else "",
            "label": clean(label.group(1)) if label else "",
            "head": clean(head.group(1))[:70] if head else "",
            "text": clean(body),
            "shows": shows,
            "paras": [clean(p) for p in re.findall(r"<p\b[^>]*>(.*?)</p>", body, re.S)],
        })
    return out


def main():
    seen = defaultdict(list)       # sentence -> [(page, section)]
    pages = []

    for name, rel in PAGES:
        path = ROOT / rel
        if not path.exists():
            print("missing: %s" % rel, file=sys.stderr)
            continue
        src = STRIP.sub(" ", path.read_text())
        secs = sections(src)
        for s in secs:
            where = (name, rel, s["label"] or s["id"] or s["head"] or "?")
            for sent in sentences(s["text"]):
                seen[key(sent)].append((where, sent))
        pages.append((name, rel, secs))

    repeats = {k: v for k, v in seen.items() if len({w for w, _ in v}) > 1}

    # Exact repeats are rare in writing this careful. What costs a reader is
    # the second sentence that says what the first one said, so compare every
    # pair that shares enough words to be worth comparing.
    flat = [(w, t, set(key(t).split())) for k, v in seen.items() for w, t in v]
    near = []
    for i in range(len(flat)):
        wi, ti, si = flat[i]
        for j in range(i + 1, len(flat)):
            wj, tj, sj = flat[j]
            if ti == tj:
                continue
            common = si & sj
            if len(common) < 5:
                continue
            r = difflib.SequenceMatcher(None, key(ti), key(tj)).ratio()
            if r >= 0.62:
                near.append((round(r, 2), wi, ti, wj, tj))
    near.sort(reverse=True)
    near = near[:30]

    L = []
    L.append("# Where the portfolio repeats itself, and where it is all words\n")
    L.append("Written by `tools/text-audit.py`, which reads the nine pages a visitor")
    L.append("actually walks through. It reports and changes nothing; tick what you")
    L.append("want cut and I will cut it.\n")
    L.append("Three things are counted: a sentence that appears in more than one")
    L.append("place, a section that asks to be read without showing anything, and a")
    L.append("paragraph past %d words, which is roughly where a reader starts" % LONG_WORDS)
    L.append("skimming.\n")

    L.append("\n## 1. The same sentence, twice\n")
    if not repeats:
        L.append("Nothing. No sentence of six words or more appears in two places.\n")
    else:
        L.append("| Sentence | Appears in |")
        L.append("|---|---|")
        for k, items in sorted(repeats.items(), key=lambda kv: -len(kv[1])):
            sent = items[0][1]
            places = sorted({"%s / %s" % (w[0], w[2]) for w, _ in items})
            L.append("| %s | %s |" % (sent[:110], " · ".join(places)))
        L.append("")

    L.append("\n## 1b. Two sentences that say the same thing\n")
    if not near:
        L.append("Nothing close enough to call a repeat.\n")
    else:
        L.append("Ranked by how alike they are. The page and section are given so")
        L.append("you can see which of the two is carrying its weight.\n")
        for r, wi, ti, wj, tj in near:
            L.append("**%.0f%% alike**" % (r * 100))
            L.append("")
            L.append("- *%s / %s* — %s" % (wi[0], wi[2], ti))
            L.append("- *%s / %s* — %s" % (wj[0], wj[2], tj))
            L.append("")

    L.append("\n## 2. Sections with nothing to look at\n")
    L.append("Word count is the whole section, headings included.\n")
    L.append("| Page | Section | Words | First line |")
    L.append("|---|---|---|---|")
    total_unpaired = 0
    for name, rel, secs in pages:
        for s in secs:
            words = len(s["text"].split())
            if not s["shows"] and words >= 60:
                total_unpaired += 1
                L.append("| %s | %s | %d | %s |" % (
                    name, s["label"] or s["id"] or "?", words,
                    (s["head"] or s["text"][:60]) + "…"))
    if not total_unpaired:
        L.append("| — | — | — | every section shows something |")
    L.append("")

    L.append("\n## 3. Paragraphs past %d words\n" % LONG_WORDS)
    L.append("| Page | Section | Words | Paragraph |")
    L.append("|---|---|---|---|")
    longs = []
    for name, rel, secs in pages:
        for s in secs:
            for p in s["paras"]:
                n = len(p.split())
                if n >= LONG_WORDS:
                    longs.append((n, name, s["label"] or s["id"] or "?", p))
    for n, name, lab, p in sorted(longs, reverse=True):
        L.append("| %s | %s | %d | %s… |" % (name, lab, n, p[:120]))
    if not longs:
        L.append("| — | — | — | nothing over the line |")
    L.append("")

    L.append("\n## 4. Where the words are\n")
    L.append("| Page | Words | Sections | Of those, no picture |")
    L.append("|---|---|---|---|")
    for name, rel, secs in pages:
        w = sum(len(s["text"].split()) for s in secs)
        blind = sum(1 for s in secs if not s["shows"] and len(s["text"].split()) >= 60)
        L.append("| %s | %d | %d | %d |" % (name, w, len(secs), blind))
    L.append("")

    L.append("\n## Totals\n")
    L.append("- %d sentences appear word for word in more than one place" % len(repeats))
    L.append("- %d pairs say much the same thing" % len(near))
    L.append("- %d sections carry 60 words or more and show nothing" % total_unpaired)
    L.append("- %d paragraphs run past %d words" % (len(longs), LONG_WORDS))
    L.append("")

    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text("\n".join(L))
    print("%s: %d repeated, %d unpaired, %d long"
          % (OUT.relative_to(ROOT), len(repeats), total_unpaired, len(longs)))


if __name__ == "__main__":
    main()
