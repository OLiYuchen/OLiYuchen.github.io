#!/usr/bin/env python3
"""Give every round of research on the Paira page the same announcement.

    python3 tools/merge-paira-rounds.py

The page named its rounds four different ways: a meta line in Market
Research, another in The Pivot, and two pd-round lines in What I learned.
This replaces all four with the research card's own header — the sample
drawn one mark per person, and the round's place on the project's run —
so the four read as one format. Nothing that was shown is removed; the
figures each round already had stay where they are.

It refuses to run twice.
"""
import importlib.util
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
IDX = ROOT / "paira/index.html"
CSS_V = "2026111817"

spec = importlib.util.spec_from_file_location("rc", ROOT / "tools/build-research-cards.py")
rc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rc)

PAIRA = next(p for p in rc.PROJECTS if p["name"] == "Paira")
BY_SUBJECT = {r["subject"]: r for r in PAIRA["rounds"]}

# anchor on the page -> (the round it is, what the page calls it)
ROUNDS = [
    ('<p class="project-meta">Initial user research, n = 5</p>',
     "The first interviews", "Initial user research"),
    ('<p class="project-meta">What the beta taught us</p>',
     "The pivot", "What the beta taught us"),
    ('<p class="pd-round">Explore &middot; 5 people &middot; 21 and 23 April 2026</p>',
     "Explore concepts", "Explore"),
    ('<p class="pd-round">MVP on TestFlight &middot; 9 people &middot; June 2026</p>',
     "The MVP, and the mentor side", "MVP on TestFlight"),
]

# Its numbers moved into the round above it, so the line is only a name now.
MENTOR_OLD = '<p class="pd-round">Mentor AI flow &middot; one-on-one sessions</p>'
MENTOR_NEW = '<p class="pd-round pd-round-plain">Mentor AI flow</p>'

# The header already says how many and how, so the note starts where it stops.
NOTE_OLD = ('<p class="paira-findings-note">The evidence came from one-on-one '
            'think-aloud sessions with six or more potential users, each given '
            'the same set of tasks, designed and run by the design team.')
NOTE_NEW = ('<p class="paira-findings-note">Every session used the same set of '
            'tasks, designed and run by the design team.')


def block(subject, name):
    r = BY_SUBJECT[subject]
    return ('<div class="rc-round">'
            '<p class="rc-round-name">%s</p>'
            '<div class="rc-round-data">%s%s</div>'
            '</div>'
            % (name, rc.sample(r["sittings"]),
               rc.timeline(r, PAIRA["span"], PAIRA["span_label"])))


def main():
    idx = IDX.read_text()
    if "rc-round" in idx:
        sys.exit("paira/index.html already announces its rounds this way. Nothing to do.")

    missing = [a for a, _, _ in ROUNDS if idx.count(a) != 1]
    for extra in (MENTOR_OLD, NOTE_OLD):
        if idx.count(extra) != 1:
            missing.append(extra)
    if missing:
        sys.exit("these are not on the page exactly once:\n  " + "\n  ".join(missing))

    out = idx
    for anchor, subject, name in ROUNDS:
        out = out.replace(anchor, block(subject, name), 1)
    out = out.replace(MENTOR_OLD, MENTOR_NEW, 1)
    out = out.replace(NOTE_OLD, NOTE_NEW, 1)
    out = out.replace(
        "</head>",
        '<link rel="stylesheet" href="../assets/research-card.css?v=%s" />\n</head>'
        % CSS_V, 1)

    IDX.write_text(out)
    print("four rounds now announce themselves the same way:")
    for _, subject, name in ROUNDS:
        r = BY_SUBJECT[subject]
        who = " + ".join("%s %s" % (s.get("label") or s["n"], s["unit"])
                         for s in r["sittings"])
        print("  %-26s %-24s %s" % (name, who, r["when_label"].replace("&ndash;", "-")))


if __name__ == "__main__":
    main()
