# Home v2 clay poses

Twelve figures: you in the middle, three things about you, four featured
projects, three made outside the screen, and the explorations archive. All
twelve are real pieces now; nothing is standing in.

Open the draft and press **Show the poses still to make**: every stand-in gets
a dashed amber box, and its hover card prints the pose it is waiting for.

## Rules that keep them one set

These matter more than any single pose. The figures sit next to each other on
one field, so anything that drifts shows up immediately.

1. **One camera.** Eye level, straight on, no tilt.
2. **One doll.** Same materials, same hair gradient, same skin and blush. A
   sitting pose is shorter than a standing one, not merely wider.
3. **Transparent background, no shadow baked in.** The page adds its own.
4. **Air on all four sides**, figure centred horizontally.
5. **Props in the same clay**, not photographed objects.
6. **Export at roughly 800 tall or more.** Smaller holds up to about a 1440
   screen and softens on a large display, where the centre runs to 394.

A featured project is a scene: the figure plus the screens that say what the
thing is. They are given more room than a lone figure so the phones stay
readable.

## What is on the page

**Centre** `me-portrait`. **About** `me-work-2`, `me-skills-2`,
`me-education`. **Featured** `me-paira`, `me-ecoscan`, `me-merlin-2`,
`me-game`. **Outside the screen** `me-tennis`, `me-climb`,
`me-calligraphy`, `me-explorations`.

The six with a `-2` or a name of their own came from Olivia's Figma file and
replaced earlier versions. The pieces they replaced, and the cat, Redmond,
physical computing and fabrication poses, stay in this folder unused.

Several of the new pieces carry a wide transparent margin. The page measures
each one's alpha channel at build time (`ART` in `home-v2.js`) so a tag hangs
under the art's feet rather than under the picture's edge; if you drop in a
replacement, re-run that measurement.

## Dropping a new pose in

Save it as `assets/img/home-v2/<slot>.webp` with transparency, then change that
node's `img` in `assets/home-v2.js` and delete its `todo` line. Nothing else
needs touching.
