#!/usr/bin/env python3
"""Put the growth act into the live Paira case study, once.

    python3 tools/merge-paira-growth.py

It takes section B of paira/depth.html — the three decisions, the three
rounds of research, and the figures after launch — and writes it into
paira/index.html as act 06, shifting the acts after it by one.

It refuses to run twice. The opening ledger in section A of the draft is not
merged; that was asked for separately and stays on the draft page.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
IDX = ROOT / "paira/index.html"
DEP = ROOT / "paira/depth.html"
DEPTH_CSS = "2026111707"
ANCHOR = '  <section class="merlin-report-section paira-act-opener" id="brand-system">'


def main():
    idx = IDX.read_text()
    dep = DEP.read_text()

    # Not id="growth": the live page already has one, on Growth & Next.
    if "pd-growth" in idx:
        sys.exit("paira/index.html already has the act. Nothing to do.")
    if ANCHOR not in idx:
        sys.exit("could not find where to put it: the brand-system act is not where it was")

    marks = [m.start() for m in re.finditer(r"<!-- =+ [A-E]\.", dep)]
    if len(marks) < 3:
        sys.exit("paira/depth.html does not have the sections this expects")
    story = dep[marks[1]:marks[2]]

    story = re.sub(r"\n\s*<p class=\"pd-note pd-draftonly\">.*?</p>", "", story, flags=re.S)
    story = story.replace('id="b"', 'id="learned"').rstrip() + "\n\n"
    if "pd-draftonly" in story:
        sys.exit("a draft-only note survived the strip; look at it before merging")

    out = idx.replace("</head>",
                      '<link rel="stylesheet" href="../assets/paira-depth.css?v=%s" />\n</head>'
                      % DEPTH_CSS, 1)
    out = out.replace(ANCHOR, story + ANCHOR, 1)

    # Everything after it moves down one.
    head, tail = out.split(ANCHOR, 1)
    tail = re.sub(r'(<p class="section-label">[^<]*</p><span>)(\d+)(</span>)',
                  lambda m: m.group(1) + str(int(m.group(2)) + 1).zfill(2) + m.group(3),
                  ANCHOR + tail)
    out = head + tail

    IDX.write_text(out)
    acts = re.findall(r'<p class="section-label">([^<]*)</p><span>(\d+)</span>', out)
    print("merged. paira/index.html now runs:")
    for name, num in acts:
        print("  %s  %s" % (num, name.replace("&amp;", "&")))


if __name__ == "__main__":
    main()
