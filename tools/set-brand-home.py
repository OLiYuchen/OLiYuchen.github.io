#!/usr/bin/env python3
"""Make the name and logo in the top-left corner go to the new homepage, on
every page that carries them.

    python3 tools/set-brand-home.py

Any <a class="brand"> whose link reads "Olivia Feng" is pointed at
/home-v2.html, root-absolute so it works from any depth. The Portugal tool
has its own brand and is left alone. Safe to run again.
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
HOME = "/home-v2.html"
BRAND = re.compile(r'(<a class="brand" href=")([^"]*)("[^>]*>)(.*?</a>)', re.S)


def main():
    changed = []
    for p in sorted(ROOT.glob("**/*.html")):
        if ".git" in p.parts:
            continue
        s = p.read_text()

        def fix(m):
            if "Olivia Feng" not in m.group(4) or m.group(2) == HOME:
                return m.group(0)
            return m.group(1) + HOME + m.group(3) + m.group(4)

        t = BRAND.sub(fix, s, count=1)
        if t != s:
            p.write_text(t)
            changed.append(p.relative_to(ROOT))
    for p in changed:
        print("  " + str(p))
    print("%d pages now go home to %s" % (len(changed), HOME))


if __name__ == "__main__":
    main()
