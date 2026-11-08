# Home v2 clay poses

Sixteen figures: you in the middle, four things about you, four featured
projects, and seven made outside the screen. Twelve are real poses. Four are
stand-ins and still need making.

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

## The four still to make

| Slot | Pose |
|---|---|
| Calligraphy | Kneeling at a low desk with a brush, a sheet of paper under it. |
| Physical computing | At a bench with a breadboard and a few wires. |
| Fabrication | Holding a flat-pack part, a laser-cut sheet beside her. |
| Skill archive | Holding a small stack of finished objects. |

## Already made

**Centre** the close-up portrait. **About** work, skills, school, and sitting
with the cat and a mug. **Featured** Paira, EcoScan, Merlin with the raven,
and Common Ground at the table. **Outside the screen** tennis, bouldering,
and resting with the cat.

Four outfit variations stand in for the four above until they are made.

## Dropping a new pose in

Save it as `assets/img/home-v2/<slot>.webp` with transparency, then change that
node's `img` in `assets/home-v2.js` and delete its `todo` line. Nothing else
needs touching.
