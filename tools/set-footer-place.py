#!/usr/bin/env python3
"""Put where she is, and the time there, in the footer of every page.

    python3 tools/set-footer-place.py

It replaces the one line that was there before and adds the small script
that keeps the clock right. Safe to run again: pages already done are
left alone.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SCRIPT = '<script src="/assets/footer-clock.js?v=%s" defer></script>'
VERSION = "2026111801"
NEW = '<p class="footer-place">Redmond, WA <span data-clock></span></p>'
OLD = re.compile(r"<p>Designed with lots of[^<]*</p>")


def main():
    pages = sorted(p for p in ROOT.glob("**/*.html")
                   if ".git" not in p.parts and "node_modules" not in p.parts)
    touched, already, skipped = [], [], []
    for p in pages:
        s = p.read_text()
        if "data-clock" in s:
            already.append(p)
            continue
        if not OLD.search(s):
            skipped.append(p)
            continue
        s = OLD.sub(NEW, s, count=1)
        if "footer-clock.js" not in s:
            if "</body>" not in s:
                sys.exit("no </body> in " + str(p))
            s = s.replace("</body>", (SCRIPT % VERSION) + "\n</body>", 1)
        p.write_text(s)
        touched.append(p)

    for p in touched:
        print("  set   %s" % p.relative_to(ROOT))
    for p in already:
        print("  kept  %s (already done)" % p.relative_to(ROOT))
    print("%d pages set, %d already done, %d without that footer"
          % (len(touched), len(already), len(skipped)))


if __name__ == "__main__":
    main()
