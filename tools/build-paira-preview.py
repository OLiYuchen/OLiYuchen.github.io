#!/usr/bin/env python3
"""Build paira/preview.html: the live case study, copied, with the new
sections from paira/depth.html merged in and marked.

paira/index.html is read and never written. Run it again after any edit to
the draft:  python3 tools/build-paira-preview.py
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
VERSION = "2026111404"


def balanced_div(text, start):
    """From an opening <div ...> at `start`, return the slice through its close."""
    i, depth = start, 0
    for m in re.finditer(r"<(/?)div\b", text[start:]):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            end = start + m.end()
            return text[start:text.index(">", end - 1) + 1]
    raise SystemExit("unbalanced div from offset %d" % start)


def main():
    idx = (ROOT / "paira/index.html").read_text()
    dep = (ROOT / "paira/depth.html").read_text()

    heading = re.search(r"<h2>([^<]*decisions I made[^<]*)</h2>", dep)
    heading = heading.group(1) if heading else "Three decisions I made, and what I learned from them."
    ledger = balanced_div(dep, dep.index('<div class="pd-ledger">'))

    marks = [m.start() for m in re.finditer(r"<!-- =+ [A-E]\.", dep)]
    stories = [dep[marks[i]:marks[i + 1]] for i in (1, 2, 3)]

    drop = re.compile(r"\n\s*<p class=\"pd-note pd-draftonly\">.*?</p>", re.S)
    stories = [drop.sub("", s) for s in stories]
    for i, num in enumerate(("06", "07", "08")):
        stories[i] = re.sub(r'(<p class="section-label">Growth</p><span>)\d+(</span>)',
                            r"\g<1>" + num + r"\g<2>", stories[i], count=1)
    for old, new in (('id="b"', 'id="growth-ideas"'),
                     ('id="c"', 'id="growth-research"'),
                     ('id="d"', 'id="growth-truth"')):
        stories = [s.replace(old, new) for s in stories]

    act = "\n".join([
        "  <!-- ============================================================ NEW: 06-08 GROWTH -->",
        '  <div class="pv-new" data-pv-note="New act: three decisions, after 05 Decisions">',
        *[s.rstrip() for s in stories],
        "  </div>\n"])

    opening = (
        "\n      <!-- ============================================================ NEW: opening block -->\n"
        '      <div class="pv-new" data-pv-note="New: three decisions, under the cover image">\n'
        '        <div class="pv-opening">\n'
        '          <h2 class="pv-opening-head">' + heading + "</h2>\n"
        + ledger.rstrip() + "\n"
        "        </div>\n"
        "      </div>\n")

    out = idx
    out = out.replace("</head>",
                      '<link rel="stylesheet" href="../assets/paira-depth.css?v=%s" />\n'
                      '<link rel="stylesheet" href="../assets/paira-preview.css?v=%s" />\n'
                      '<meta name="robots" content="noindex" />\n</head>' % (VERSION, VERSION), 1)
    out = out.replace("<title>", "<title>PREVIEW &middot; ", 1)
    out = out.replace('<body class="merlin-report-page case-study-page paira-case-page">',
                      '<body class="merlin-report-page case-study-page paira-case-page show-changes">\n'
                      '<div class="pv-bar">\n  <div class="container">\n    <b>Preview</b>\n'
                      "    <span>A copy of the live case study with the new sections merged in. "
                      "The real page is untouched.</span>\n"
                      '    <button type="button" data-pv-toggle>Hide what changed</button>\n'
                      "  </div>\n</div>", 1)

    cover = out.index('<figure class="case-cover-image')
    cover_end = out.index("</figure>", cover) + len("</figure>")
    out = out[:cover_end] + opening + out[cover_end:]

    anchor = '  <section class="merlin-report-section paira-act-opener" id="brand-system">'
    out = out.replace(anchor, act + anchor, 1)

    head, tail = out.split(anchor, 1)
    tail = re.sub(r'(<p class="section-label">[^<]*</p><span>)(\d+)(</span>)',
                  lambda m: m.group(1) + str(int(m.group(2)) + 3).zfill(2) + m.group(3),
                  anchor + tail)
    out = head + tail

    out = out.replace("</body>",
                      "<script>\n  (function () {\n"
                      '    const b = document.querySelector("[data-pv-toggle]");\n'
                      '    b.addEventListener("click", function () {\n'
                      '      const on = document.body.classList.toggle("show-changes");\n'
                      '      b.textContent = on ? "Hide what changed" : "Show what changed";\n'
                      "    });\n  })();\n</script>\n</body>", 1)

    (ROOT / "paira/preview.html").write_text(out)
    print("paira/preview.html: %d lines, %d placeholders, %d marked regions"
          % (out.count("\n"), out.count("pd-slot"), out.count("pv-new")))
    if out.count("pd-slot"):
        sys.exit("a placeholder slipped through")


if __name__ == "__main__":
    main()
