#!/usr/bin/env python3
"""Bring the live cards up to the shape the preview agreed on.

    python3 tools/merge-paira-preview-cards.py

Three things the preview had and the page did not:

  the title   a round is named in the display face, at heading size, not in a
              small accent label with a rule after it
  the count   findings are numbered 01, 02, 03, so a reader can see how many
              a round produced before reading any of them
  the fourth  what the mentor sessions settled was written below the card as
              loose prose; it belongs with the three findings it sat beside

The screens each round produced stay inside the card. It refuses to run twice.
"""
import importlib.util
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
IDX = ROOT / "paira/index.html"
CSS_V = "2026111818"

spec = importlib.util.spec_from_file_location("rc", ROOT / "tools/build-research-cards.py")
rc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rc)
PAIRA = next(p for p in rc.PROJECTS if p["name"] == "Paira")
BY = {r["subject"]: r for r in PAIRA["rounds"]}

# the label the page used -> the subject the preview gives it
TITLES = [
    ("Initial user research", "The first interviews"),
    ("What the beta taught us", "What the beta taught us"),
    ("Explore", "Explore concepts"),
    ("MVP on TestFlight", "The MVP, and the mentor side"),
]

MENTOR_PROSE = (
    '<p class="pd-round pd-round-plain">Mentor AI flow</p>\n'
    '          <p>The question on this side was trust, not which screen wins.</p>\n'
    '          '
)


def element(src, i, tag="div"):
    """Start and end of the element that opens at i, tags balanced."""
    depth = 0
    for m in re.finditer(r"<(/?)%s\b" % tag, src[i:]):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            return i, src.index(">", i + m.end()) + 1
    sys.exit("unbalanced <%s> at %d" % (tag, i))


def signals(subject):
    r = BY[subject]
    return ('<ol class="rc-signals">%s</ol>'
            % "".join('<li><h3>%s</h3><p class="rc-change">%s</p></li>' % (f, c)
                      for f, c in r["signals"]))


def main():
    idx = IDX.read_text()
    if "rc-subject" in idx:
        sys.exit("paira/index.html already has the preview's cards. Nothing to do.")
    out = idx

    # ---- the title ---------------------------------------------------------
    for label, subject in TITLES:
        old = '<p class="rc-round-name">%s</p>' % label
        if out.count(old) != 1:
            sys.exit("not on the page exactly once: " + label)
        out = out.replace(old, '<h3 class="rc-subject">%s</h3>' % subject, 1)

    # ---- the three screens compared, all one size --------------------------
    out = out.replace('<div class="pd-ways">', '<div class="pd-ways pd-ways-even">', 1)

    # ---- numbered findings, and the fourth one brought in ------------------
    for subject in ("Explore concepts", "The MVP, and the mentor side"):
        mark = '<h3 class="rc-subject">%s</h3>' % subject
        i = out.index('<div class="paira-findings">', out.index(mark))
        a, b = element(out, i)
        out = out[:a] + signals(subject) + out[b:]

    # The screens the mentor round shipped move inside its card, and the prose
    # that introduced them goes: finding 04 is the same sentence.
    i = out.index('<div class="paira-screen-grid pd-screens"')
    a, b = element(out, i)
    grid = out[a:b]
    out = out[:a] + out[b:]
    out = out.replace(MENTOR_PROSE, "", 1)

    mvp = '<h3 class="rc-subject">The MVP, and the mentor side</h3>'
    end = out.index("</ol>", out.index(mvp)) + len("</ol>")
    out = (out[:end]
           + '\n            <p class="rc-exhibit">What the mentor flow shipped.</p>\n            '
           + grid + out[end:])

    out = re.sub(r"research-card\.css\?v=\d+", "research-card.css?v=%s" % CSS_V, out)
    IDX.write_text(out)

    for m in re.finditer(r'<h3 class="rc-subject">([^<]*)</h3>', out):
        print("  " + m.group(1))
    print("findings numbered: %d" % out.count('<ol class="rc-signals">'))


if __name__ == "__main__":
    main()
