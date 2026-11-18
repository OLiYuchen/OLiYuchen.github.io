#!/usr/bin/env python3
"""Every selector this page cannot do without, and that the braces balance.

Twice now a regex deletion in home-v2.css has taken a neighbouring rule with
it, and both times the page looked broken in a way that read as a design
problem rather than a missing rule. This is the cheap version of noticing.
"""
import re, sys, io, os

CSS = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   'assets', 'home-v2.css')
NEEDED = [
    '.hv2-node', '.hv2-node-inner', '.hv2-node-label', '.hv2-node-plate',
    '.hv2-node-centre .hv2-node-label', '.hv2-cta', '.hv2-cta:hover',
    '.hv2-card', '.hv2-card-body', '.hv2-card-cue', '.hv2-card-media', '.hv2-field',
    '.hv2-draftbar', '.hv2-foot',
]
s = io.open(CSS, encoding='utf-8').read()
bare = re.sub(r'/\*.*?\*/', '', s, flags=re.S)

bad = []
depth = 0
for ch in bare:
    if ch == '{': depth += 1
    elif ch == '}':
        depth -= 1
        if depth < 0: bad.append('a stray closing brace')
if depth: bad.append('%d unclosed block(s)' % depth)

selectors = set()
for m in re.finditer(r'(^|[}\n])\s*([^{}@]+?)\s*\{', bare):
    for part in m.group(2).split(','):
        selectors.add(part.strip())
for want in NEEDED:
    if not any(sel == want or sel.startswith(want + ':') or sel.startswith(want + ' ')
               or sel.endswith(' ' + want) or want in sel.split(',') for sel in selectors):
        bad.append('no rule for %s' % want)

if bad:
    print('home-v2.css: ' + '; '.join(bad)); sys.exit(1)
print('home-v2.css: %d selectors, braces balanced, nothing missing' % len(selectors))
