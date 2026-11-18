#!/usr/bin/env python3
"""The constellation is the front door; the old homepage lives at /work.

    python3 tools/front-door.py

Every page's links are pointed to match: the name and logo go to /, and
anything that reached into a section of the old homepage (/#selected-work,
/#contact, ...) goes to the same section at /work. Safe to run again.
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SKIP = {"drafts", "tools", ".git", "node_modules"}


def main():
    changed = {}
    for p in sorted(ROOT.glob("**/*.html")):
        if SKIP & set(p.relative_to(ROOT).parts):
            continue
        s = p.read_text()
        t = s.replace('href="/home-v2.html"', 'href="/"')
        t = re.sub(r'href="/#([A-Za-z][\w-]*)"', r'href="/work#\1"', t)
        if t != s:
            p.write_text(t)
            changed[p.relative_to(ROOT)] = (s.count('href="/home-v2.html"'),
                                            len(re.findall(r'href="/#[A-Za-z]', s)))
    for p, (home, sections) in changed.items():
        print("  %-44s logo->/ %d   sections->/work %d" % (p, home, sections))
    print("%d pages updated" % len(changed))


if __name__ == "__main__":
    main()
