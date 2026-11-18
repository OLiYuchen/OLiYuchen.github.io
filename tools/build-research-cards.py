#!/usr/bin/env python3
"""Build drafts/research-card.html from the rounds below.

The two numbers the card is about — how many people, and when — are drawn
rather than only written:

  the sample   one mark per person, so five and fifty are told apart before
               they are read. Fifty wraps into a block; five is a short row.
  the date     a marker on the project's own span, so a column of cards reads
               as a timeline. A round whose month is not known yet shows the
               track with no marker rather than a guess.

Everything else is type. One accent colour, used for the sample marks, the
timeline marker and the arrow on a change; nothing else is coloured.
"""
import pathlib
from datetime import date

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "drafts" / "research-card.html"
CSS_V = "2026111818"


def months(a, b):
    return (b.year - a.year) * 12 + (b.month - a.month)


# --------------------------------------------------------------- the rounds
# span: the project's own run, which the timeline is drawn against.
PROJECTS = [
    {
        "name": "Paira",
        "show": True,
        "note": "Four rounds.",
        "span": (date(2025, 8, 1), date(2026, 9, 1)),
        "span_label": ("Aug 2025", "Sep 2026"),
        "rounds": [
            {
                "subject": "The first interviews",
                "sittings": [{"n": 5, "unit": "people", "how": "interviews"}],
                "when": None, "when_range": (date(2025, 8, 1), date(2025, 11, 1)),
                "when_label": "Aug&ndash;Nov 2025",
                "signals": [
                    ("All five wanted career help through something lighter than what exists today.",
                     "The premise the product was built on."),
                    ("The need was wide, not narrow.",
                     "Job and internship advice 5 of 5, resume feedback 4, mock interviews 4, referrals 4."),
                    ("&ldquo;I am not sure how different it is from the big networks.&rdquo;",
                     "The objection the positioning had to answer."),
                ],
            },
            {
                "subject": "The pivot",
                "sittings": [{"n": 6, "unit": "people", "label": "6 or more",
                              "how": "one-on-one think-aloud"}],
                "when": None, "when_range": (date(2026, 2, 1), date(2026, 4, 1)),
                "when_label": "Feb&ndash;Apr 2026",
                "signals": [
                    ("One-shot AI was not enough. Search understood the intent, then left people on their own.",
                     "Intent needed a guided path from the ask to the match."),
                    ("Swiping was not friendly to mentors.",
                     "The product was rebuilt around the request rather than the person."),
                ],
            },
            {
                "subject": "Explore concepts",
                "sittings": [{"n": 5, "unit": "people", "how": "2 rounds, three days apart"}],
                "when": date(2026, 4, 22), "when_label": "21 and 23 April 2026",
                "signals": [
                    ("Novel to look at, heavy to use.",
                     "The calm list became the default."),
                    ("People wanted to browse on purpose.",
                     "Explore exists because a mentor asked for it in that first round."),
                    ("A new interaction needs an order.",
                     "The stream stayed on the roadmap, behind the mode people already read."),
                ],
            },
            {
                "subject": "The MVP, and the mentor side",
                "sittings": [
                    {"n": 9, "unit": "people", "how": "builds 122&ndash;127, five days"},
                    {"n": 3, "unit": "people", "how": "the mentor flow, one-on-one"},
                ],
                "when": date(2026, 6, 15), "when_label": "June 2026",
                "signals": [
                    ("The AI wrote well, and that was the question.",
                     "Its brief moved from writing the request to finding what the request is missing."),
                    ("The words carried more than the design did.",
                     "A phrasing pass across the product."),
                    ("Helpers weighed what it would cost them.",
                     "Filters by deadline and reward before taking something on."),
                    ("On the mentor side the question was trust, not which screen wins.",
                     "The AI shows its work for a beat, then gets out of the way."),
                ],
            },
        ],
    },
    {
        # Off for now: the card was asked for on Paira. The rounds stay here so
        # turning this back on is one word.
        "name": "Merlin Bird ID",
        "show": False,
        "note": "Three rounds.",
        "span": (date(2025, 1, 1), date(2025, 6, 1)),
        "span_label": ("Jan 2025", "Jun 2025"),
        "rounds": [
            {
                "subject": "Discovery",
                "sittings": [{"n": 50, "unit": "responses",
                              "how": "survey, and 3 field observations"}],
                "when": None, "when_label": "month to confirm",
                "signals": [
                    ("A first profile of the young novice birder, from the survey rather than from assumption.",
                     "The novice score, which made recruitment a decision rather than a guess."),
                ],
            },
            {
                "subject": "Interviews and shadowing",
                "sittings": [{"n": 6, "unit": "people",
                              "how": "12 hours, 90&ndash;120 minutes each"}],
                "when": None, "when_label": "month to confirm",
                "signals": [
                    ("Someone can be novice through knowledge, tools, confidence, identity, or community access.",
                     "Novice became a profile rather than a single ladder."),
                    ("The five did not move in one neat line.",
                     "The score could find the sample; it could not carry the rest."),
                ],
            },
            {
                "subject": "Concept testing",
                "sittings": [{"n": 4, "unit": "people", "how": "from the interview pool"}],
                "when": None, "when_label": "month to confirm",
                "signals": [
                    ("There was no single winning feature.",
                     "Each concept answered a different gap, so each was kept for a different reason."),
                ],
            },
        ],
    },
]


# ----------------------------------------------------------------- drawings
def sitting(s):
    """One mark per person. Fifty wraps into a block; five is a short row.
    A round can have more than one sitting; each gets its own row of marks."""
    n, unit, label, how = s["n"], s["unit"], s.get("label"), s.get("how")
    extra = '<span class="rc-how">%s</span>' % how if how else ""
    if n is None:
        return ('<div class="rc-sitting">'
                '<span class="rc-dots rc-dots-unknown" aria-hidden="true">'
                '<i></i><i></i><i></i></span>'
                '<span class="rc-n rc-unknown">%s</span>%s</div>' % (label, extra))
    dense = " rc-dots-dense" if n > 12 else ""
    # An uncertain count draws the ones that are certain, then an open one.
    solid = s.get("solid", n)
    dots = "".join("<i></i>" for _ in range(solid))
    dots += "".join('<i class="rc-maybe"></i>' for _ in range(n - solid))
    return ('<div class="rc-sitting">'
            '<span class="rc-dots%s" aria-hidden="true">%s</span>'
            '<span class="rc-n">%s %s</span>%s</div>'
            % (dense, dots, label or n, unit, extra))


def sample(sittings):
    return '<div class="rc-sample">%s</div>' % "".join(sitting(s) for s in sittings)


def timeline(r, span, span_label):
    """A marker on the project's own run. No marker where the month is not known."""
    a, b = span
    total = max(months(a, b), 1)
    if r.get("when"):
        pos = months(a, date(r["when"].year, r["when"].month, 1)) / total * 100
        mark = '<span class="rc-mark" style="left:%.1f%%"></span>' % min(max(pos, 0), 100)
        state = ""
    elif r.get("when_range"):
        s, e = r["when_range"]
        x1 = months(a, s) / total * 100
        x2 = months(a, e) / total * 100
        mark = ('<span class="rc-band" style="left:%.1f%%;right:%.1f%%"></span>'
                % (min(max(x1, 0), 100), max(100 - x2, 0)))
        state = " rc-track-soft"
    else:
        mark = ""
        state = " rc-track-unknown"
    return ('<div class="rc-time">'
            '<span class="rc-track%s">%s</span>'
            '<span class="rc-when%s">%s</span>'
            '</div>' % (state, mark, "" if r.get("when") else " rc-unknown", r["when_label"]))


def card(r, span, span_label):
    sigs = "".join(
        '<li><h3>%s</h3><p class="rc-change">%s</p></li>' % (f, c)
        for f, c in r["signals"])
    return ('<article class="rc-card">'
            '<header class="rc-head">'
            '<h3 class="rc-subject">%s</h3>'
            '%s'
            '%s'
            '</header>'
            '<ol class="rc-signals">%s</ol>'
            '</article>'
            % (r["subject"], sample(r["sittings"]),
               timeline(r, span, span_label), sigs))


# -------------------------------------------------------------------- build
HEAD = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Research card (draft)</title>
<meta name="robots" content="noindex" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/assets/style.css" />
<link rel="stylesheet" href="/assets/research-card.css?v=%s" />
</head>
<body class="case-study-page paira-case-page rc-page">

<div class="rc-bar"><b>Draft</b><span>One card for every round of research. Nothing here is on a live page.</span></div>

<main class="container rc-main">
  <header class="rc-intro">
    <p class="rc-kicker">Research card</p>
    <h1>One shape for every round.</h1>
    <p>The two numbers the card is about are drawn, not only written. The sample
       is one mark per person, so five and fifty are told apart before they are
       read. The date sits on the project&rsquo;s own run, as a dot where the day
       is known and as a span where only the stage is, so the four cards read
       as one timeline. Everything else is type. The card takes its colour from
       the page it is on, so this preview is wearing Paira&rsquo;s.</p>
  </header>
''' % CSS_V

TAIL = '''
  <section class="rc-sec">
    <p class="rc-kicker">What is placed, not pinned</p>
    <h2>Three things to pin down.</h2>
    <p>Every card is filled from something already on the site. Where the month
       is not pinned the card draws a span rather than a dot, and the span is
       taken from what the case study already says, never from a guess. Give me
       a month and the span becomes a dot.</p>
    <ul class="rc-gaps">
      <li><b>The first interviews &mdash; Aug&ndash;Nov 2025.</b> The span is read
          from the page: you joined in August 2025, and this is the research the
          premise was built on.</li>
      <li><b>The pivot &mdash; Feb&ndash;Apr 2026.</b> Beta testers were recruited
          in February 2026 and the page says the rebuild landed in spring, so
          the sessions sit between the two. The count is the other open one: the
          page says six or more, so the card draws six and says so.</li>
      <li><b>The mentor flow &mdash; three people.</b> It is written into the June
          card, which places those sessions in the same window as the
          TestFlight round.</li>
      <li><b>Merlin</b> is switched off on this page, not deleted. Its three
          rounds are still in the builder and come back in one word.</li>
    </ul>
  </section>
</main>

</body>
</html>
'''


def main():
    body = []
    for p in [x for x in PROJECTS if x.get("show")]:
        body.append('\n  <section class="rc-sec">')
        body.append('    <p class="rc-kicker">%s</p>' % p["name"])
        body.append('    <h2>%s</h2>' % p["note"])
        body.append('    <p class="rc-span">The timeline on each card runs %s to %s.</p>'
                    % p["span_label"])
        body.append('    <div class="rc-grid">')
        for r in p["rounds"]:
            body.append("      " + card(r, p["span"], p["span_label"]))
        body.append('    </div>')
        body.append('  </section>')

    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(HEAD + "\n".join(body) + TAIL)
    on = [x for x in PROJECTS if x.get("show")]
    n = sum(len(p["rounds"]) for p in on)
    print("%s: %d cards across %d projects (%d off)"
          % (OUT.relative_to(ROOT), n, len(on), len(PROJECTS) - len(on)))


if __name__ == "__main__":
    main()
