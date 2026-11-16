# Arranging the home page in Figma

`home-v2-layout.svg` is the home page as it stands, as an editable file.
Drag it onto a Figma canvas and it arrives as twelve named groups.

## What you get

Each figure is one group — `paira`, `skills`, `tennis` and so on — holding
three layers:

| layer | what it is |
|---|---|
| `clay` | the figure, as an image |
| `tag` | the capsule behind its name |
| `name` | the name itself |

Plus two groups you should leave alone:

- **`guides`** — three dashed boxes. The top one is the draft bar and the site
  header, the bottom one is the footer. Nothing may be arranged in either.
  The green box between them is the field, and that is the whole stage.
- **`cta`** — *See the selected work*. It is fixed to the foot of the page in
  code, so move things around it rather than moving it.

## What to do

Move the figures. Resize them if you want to. Both travel back.

Two things do not travel back, so there is no point doing them here: rotating
a figure, and changing a name. Names, links and card text live in
`assets/home-v2.js`.

Keep the group and layer names exactly as they are — that is how each figure
is recognised on the way back.

## Sending it back

In Figma, select the frame and **Export → SVG**. Then either hand me the file,
or run it yourself:

```bash
python3 tools/home-figma.py import <the-file>.svg
```

That prints what each figure now wants and changes nothing. Add `--write` and
it edits `assets/home-v2.js` for you.

## What actually gets read

Three numbers per figure:

- **nx, ny** — where it stands, as a share of the field's own ellipse. `0, 0`
  is the exact middle; `-1, 1` is the bottom left corner.
- **k** — how large it is, relative to what its rank would give it. `1` is
  unchanged.

They are shares rather than pixels, so an arrangement made in a 1512-wide
frame holds at any window the page is opened at.

## What happens to it afterwards

Your arrangement becomes the **starting** arrangement, not the final one. The
page still evens the gaps out from there and still scales everything to the
window it finds itself in — that is what keeps it from falling apart on a
laptop screen. If you want it followed more literally, say so and I will
stiffen the spring that holds each figure to its place.

## Regenerating this file

```bash
python3 tools/home-figma.py export
```

It builds from `tools/home-v2-snapshot.json`, which is a capture of the live
page at 1512 x 900. If the page has changed a lot, that snapshot wants taking
again first.
