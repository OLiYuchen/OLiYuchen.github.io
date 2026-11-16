#!/usr/bin/env python3
"""The home page's arrangement, out to Figma and back.

    python3 tools/home-figma.py export
        Writes drafts/home-v2-layout.svg. Drag that into Figma and every
        figure arrives as a named group: the clay as an image, its tag as a
        rounded rectangle and a line of text. Move them. Resize them. Then:

    python3 tools/home-figma.py import <file.svg> [--write]
        Reads the arrangement back out and prints the nx / ny / k each figure
        now wants. With --write it edits assets/home-v2.js in place.

Only position and size travel. Everything else about a figure — what it
links to, what its card says, which clay pose it uses — stays in the code,
because that is where it belongs.

The numbers are relative, not absolute: nx and ny are shares of the field's
own ellipse and k is a size relative to the figure's rank, so an arrangement
made in a 1512-wide frame holds at any window size the page is opened at.
"""

import base64
import io as _io
import json
import os
import re
import sys
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SNAP = os.path.join(ROOT, 'tools', 'home-v2-snapshot.json')
OUT = os.path.join(ROOT, 'drafts', 'home-v2-layout.svg')
JS = os.path.join(ROOT, 'assets', 'home-v2.js')
IMGDIR = os.path.join(ROOT, 'assets', 'img', 'home-v2')

CREAM = '#f3eee4'
INK = '#3e3226'
MAX_PX = 760          # longest side of an embedded picture
SX, SY = 0.47, 0.44   # must match spread() in home-v2.js for a wide window


# --------------------------------------------------------------------- export

def png_data_uri(name):
    from PIL import Image
    im = Image.open(os.path.join(IMGDIR, name)).convert('RGBA')
    if max(im.size) > MAX_PX:
        s = MAX_PX / max(im.size)
        im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    buf = _io.BytesIO()
    im.save(buf, 'PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()


def esc(t):
    return (t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))


def export():
    snap = json.load(open(SNAP, encoding='utf-8'))
    F = snap['field']
    C = snap['chrome']
    top = C['draftbar'] + C['header']
    W, H = F['w'], top + F['h'] + C['footer']

    p = ['<?xml version="1.0" encoding="UTF-8"?>',
         '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
         'width="%d" height="%d" viewBox="0 0 %d %d">' % (W, H, W, H),
         '<rect width="%d" height="%d" fill="%s"/>' % (W, H, CREAM)]

    # The bands the page's own chrome sits in. Nothing may be arranged here.
    p.append('<g id="guides" data-name="guides" opacity="0.5">')
    p.append('<rect x="0" y="0" width="%d" height="%d" fill="none" stroke="#c9b9a4" '
             'stroke-dasharray="6 6"/>' % (W, top))
    p.append('<text x="14" y="26" font-family="monospace" font-size="11" fill="#9c8a74">'
             'page chrome \u2014 nothing goes here</text>')
    p.append('<rect x="0" y="%d" width="%d" height="%d" fill="none" stroke="#c9b9a4" '
             'stroke-dasharray="6 6"/>' % (top + F['h'], W, C['footer']))
    p.append('<text x="14" y="%d" font-family="monospace" font-size="11" fill="#9c8a74">'
             'footer \u2014 nothing goes here</text>' % (top + F['h'] + 24))
    p.append('<text x="14" y="%d" font-family="monospace" font-size="11" fill="#8fae9c">'
             'arrange inside this box</text>' % (top + 20))
    p.append('<rect x="0" y="%d" width="%d" height="%d" fill="none" stroke="#b9d4c4" '
             'stroke-dasharray="2 5"/>' % (top, W, F['h']))
    p.append('</g>')

    # The one action, as a thing to arrange around rather than to move.
    cta = snap['cta']
    p.append('<g id="cta" data-name="See the selected work (fixed)">')
    p.append('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="%.1f" fill="#fffdf9" '
             'fill-opacity="0.72"/>' % (cta['x'], cta['y'] + top, cta['w'], cta['h'], cta['h'] / 2))
    p.append('<text x="%.1f" y="%.1f" font-family="monospace" font-size="13.8" fill="%s" '
             'text-anchor="middle">See the selected work</text>'
             % (cta['x'] + cta['w'] / 2, cta['y'] + top + cta['h'] / 2 + 5, INK))
    p.append('</g>')

    for n in snap['nodes']:
        uri = png_data_uri(n['img'])
        gid = n['id']
        p.append('<g id="%s" data-name="%s">' % (gid, esc(n['label'])))
        p.append('<image id="%s-clay" data-name="clay" x="%.1f" y="%.1f" width="%.1f" '
                 'height="%.1f" xlink:href="%s"/>'
                 % (gid, n['x'], n['y'] + top, n['w'], n['h'], uri))
        fs = float(n['fs'].replace('px', ''))
        rx = n['lh'] / 2
        dark = n['ring'] == 0
        p.append('<rect id="%s-tag" data-name="tag" x="%.1f" y="%.1f" width="%.1f" height="%.1f" '
                 'rx="%.1f" fill="%s" stroke="%s" stroke-opacity="%s"/>'
                 % (gid, n['lx'], n['ly'] + top, n['lw'], n['lh'], rx,
                    '#241f1a' if dark else 'none', INK, '0' if dark else '0.42'))
        p.append('<text id="%s-name" data-name="name" x="%.1f" y="%.1f" font-family="monospace" '
                 'font-size="%.1f" fill="%s" text-anchor="middle">%s</text>'
                 % (gid, n['lx'] + n['lw'] / 2, n['ly'] + top + n['lh'] / 2 + fs * 0.36,
                    fs, '#faf7f1' if dark else INK, esc(n['label'])))
        p.append('</g>')

    p.append('</svg>')
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    open(OUT, 'w', encoding='utf-8').write('\n'.join(p))
    print('%s  %d figures  %.1f MB' % (os.path.relpath(OUT, ROOT), len(snap['nodes']),
                                       os.path.getsize(OUT) / 1048576))


# --------------------------------------------------------------------- import

def matrix_of(el):
    """Only the translate and scale Figma writes when you move or resize."""
    t = el.get('transform') or ''
    a = d = 1.0
    e = f = 0.0
    for kind, args in re.findall(r'(translate|scale|matrix)\(([^)]*)\)', t):
        v = [float(x) for x in re.split(r'[\s,]+', args.strip()) if x]
        if kind == 'translate':
            e += v[0] * a
            f += (v[1] if len(v) > 1 else 0) * d
        elif kind == 'scale':
            a *= v[0]
            d *= (v[1] if len(v) > 1 else v[0])
        elif kind == 'matrix' and len(v) == 6:
            a *= v[0]
            d *= v[3]
            e += v[4]
            f += v[5]
    return a, d, e, f


def read_svg(path):
    tree = ET.parse(path)
    found = {}

    def walk(el, a, d, e, f):
        ma, md, me, mf = matrix_of(el)
        a, d, e, f = a * ma, d * md, e + me, f + mf
        tag = el.tag.split('}')[-1]
        if tag == 'image':
            name = (el.get('id') or '').replace('-clay', '')
            if name:
                found[name] = {
                    'x': float(el.get('x', 0)) * a + e,
                    'y': float(el.get('y', 0)) * d + f,
                    'w': float(el.get('width', 0)) * a,
                    'h': float(el.get('height', 0)) * d,
                }
        for kid in el:
            walk(kid, a, d, e, f)

    walk(tree.getroot(), 1.0, 1.0, 0.0, 0.0)
    return found, tree.getroot()


def do_import(path, write):
    snap = json.load(open(SNAP, encoding='utf-8'))
    F, C = snap['field'], snap['chrome']
    top = C['draftbar'] + C['header']
    found, root = read_svg(path)

    # Figma may export at a different scale; normalise by the frame's width.
    vb = (root.get('viewBox') or '').split()
    fw = float(vb[2]) if len(vb) == 4 else float(re.sub(r'[^\d.]', '', root.get('width', '0')) or 0)
    fh = float(vb[3]) if len(vb) == 4 else float(re.sub(r'[^\d.]', '', root.get('height', '0')) or 0)
    if not fw or not fh:
        sys.exit('Could not read the frame size from that SVG.')
    k = snap['field']['w'] / fw
    field_h = fh * k - top - C['footer']

    missing = [n['id'] for n in snap['nodes'] if n['id'] not in found]
    if missing:
        print('! not found in the SVG, left as they are: ' + ', '.join(missing))

    # The weight each figure now carries, relative to hers.
    def side(d, nid):
        area = d['w'] * d['h'] * k * k
        pose = POSE.get(nid, 1.0)
        return (area / pose) ** 0.5

    me = found.get('me')
    me_side = side(me, 'me') if me else None
    base_sides = {n['id']: (n['w'] * n['h'] / POSE.get(n['id'], 1.0)) ** 0.5 for n in snap['nodes']}

    rows = []
    for n in snap['nodes']:
        d = found.get(n['id'])
        if not d:
            continue
        x = d['x'] * k + d['w'] * k / 2          # the point it stands on
        y = d['y'] * k + d['h'] * k - top        # its ground line, in field space
        nx = (x - F['w'] / 2) / (F['w'] * SX)
        ny = (y - field_h / 2) / (field_h * SY)
        kk = 1.0
        if me_side:
            kk = (side(d, n['id']) / me_side) / (base_sides[n['id']] / base_sides['me'])
        rows.append((n['id'], nx, ny, kk))

    print('%-12s %7s %7s %6s' % ('figure', 'nx', 'ny', 'k'))
    for nid, nx, ny, kk in rows:
        print('%-12s %7.2f %7.2f %6.2f' % (nid, nx, ny, kk))

    if not write:
        print('\nNothing changed. Add --write to put these into assets/home-v2.js.')
        return

    src = open(JS, encoding='utf-8').read()
    for nid, nx, ny, kk in rows:
        pat = re.compile(r"(\{ id:'%s', ring:\d, )nx:-?[\d.]+, ny:-?[\d.]+,( k:[\d.]+,)?" % nid)
        rep = r"\g<1>nx:%.2f, ny:%.2f," % (nx, ny)
        if abs(kk - 1) > 0.03:
            rep += ' k:%.2f,' % kk
        new = pat.sub(rep, src)
        if new == src:
            print('! could not place %s' % nid)
        src = new
    open(JS, 'w', encoding='utf-8').write(src)
    print('\nassets/home-v2.js updated. Bump the ?v= on the script tag and reload.')


POSE = {'paira': 1.18, 'ecoscan': 1.18, 'merlin': 1.18, 'game': 1.18}


if __name__ == '__main__':
    if len(sys.argv) < 2 or sys.argv[1] not in ('export', 'import'):
        sys.exit(__doc__)
    if sys.argv[1] == 'export':
        export()
    else:
        if len(sys.argv) < 3:
            sys.exit('usage: home-figma.py import <file.svg> [--write]')
        do_import(sys.argv[2], '--write' in sys.argv)
