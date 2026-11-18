#!/usr/bin/env python3
"""Make each round on the Paira page an actual card, not just a header.

    python3 tools/merge-paira-cards.py

The header landed first; this puts the box around it. Each round and the
evidence that belongs to it go inside one .rc-card, so a reader sees four
cards rather than four labels. Two of them already had a wrapper of their
own and only needed the class; the two in What I learned are a run of
siblings, so those get wrapped.

It refuses to run twice.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
IDX = ROOT / "paira/index.html"
CSS_V = "2026111817"

# already a wrapper: the round and its evidence are the only things inside
CLASSED = [
    ('<div class="paira-user-research">',
     '<div class="paira-user-research rc-card rc-card-round">'),
    ('<div class="paira-findings" aria-label="What the beta taught us">',
     '<div class="paira-findings rc-card rc-card-round" aria-label="What the beta taught us">'),
]

# a run of siblings: (the round's name, how many elements belong to it)
WRAPPED = [("Explore", 3), ("MVP on TestFlight", 2)]


def element(src, i):
    """End index of the element starting at i, tags balanced."""
    tag = re.match(r"<([a-zA-Z0-9]+)", src[i:]).group(1)
    depth, j = 0, i
    for m in re.finditer(r"<(/?)%s\b" % tag, src[i:]):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            j = i + m.end()
            break
    else:
        sys.exit("unbalanced <%s> at %d" % (tag, i))
    return src.index(">", j) + 1


def run(src, i, n):
    """End index of n sibling elements starting at i."""
    for _ in range(n):
        i = element(src, i)
        while i < len(src) and src[i] in " \t\r\n":
            i += 1
    return i


def main():
    idx = IDX.read_text()
    if "rc-card" in idx:
        sys.exit("paira/index.html already has the cards. Nothing to do.")
    if "rc-round" not in idx:
        sys.exit("the round headers are not on the page yet: run merge-paira-rounds.py first")

    out = idx
    for old, new in CLASSED:
        if out.count(old) != 1:
            sys.exit("not on the page exactly once: " + old)
        out = out.replace(old, new, 1)

    for name, n in WRAPPED:
        mark = '<p class="rc-round-name">%s</p>' % name
        if out.count(mark) != 1:
            sys.exit("not on the page exactly once: " + name)
        start = out.rindex('<div class="rc-round">', 0, out.index(mark))
        end = run(out, start, n)
        inner = out[start:end].rstrip()
        indent = " " * (start - out.rindex("\n", 0, start) - 1)
        out = (out[:start]
               + '<div class="rc-card rc-card-round">\n%s  %s\n%s</div>'
                 % (indent, inner.replace("\n", "\n  "), indent)
               + out[end:])

    out = re.sub(r"research-card\.css\?v=\d+", "research-card.css?v=%s" % CSS_V, out)
    IDX.write_text(out)

    print("four rounds are cards now:")
    for m in re.finditer(r'<p class="rc-round-name">([^<]*)</p>', out):
        print("  " + m.group(1))


if __name__ == "__main__":
    main()
