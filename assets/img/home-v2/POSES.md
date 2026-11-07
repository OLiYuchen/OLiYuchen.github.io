# Home v2 clay poses

The constellation on `/home-v2.html` has 19 slots. Five are filled with real
crops from your character sheet. Twelve are stand-ins and need a pose made. Paira and EcoScan are done.

Open the draft and press **Show the poses still to make**: every stand-in gets
a dashed amber box, and its hover card prints the pose it is waiting for.

## Rules that keep them one set

These matter more than any single pose. The figures sit next to each other on
one field, so anything that drifts shows up immediately.

1. **One camera.** Eye level, straight on, no tilt. The same lens as the
   turnaround row on your sheet.
2. **One height.** Build each pose so the figure reads at the same real-world
   size, roughly 7.5 cm as marked on your sheet. The page scales them, so what
   matters is that a standing figure and a sitting one look like the same doll.
3. **Transparent background, no shadow baked in.** The page adds its own soft
   shadow. A baked one will not match.
4. **Square-ish framing.** The page puts every figure in a square cell and
   contains it, so leave a little air on all four sides and keep the figure
   centred horizontally.
5. **Same materials.** Matte clay, the felted jacket texture, the same hair
   gradient, the same skin and blush.
6. **Props in the same clay.** A phone, a brush, a racket, a card: all modelled
   in the same material, not photographed objects.
7. **Keep the stand** if the pose is standing, drop it if she is sitting or
   lying, which is what your sheet already does.

## The twelve

### Featured work

| Slot | Pose |
|---|---|
| Merlin Bird ID | Binoculars raised, a small bird on her shoulder. |
| Common Ground | Holding a fan of cards, a few laid out in front of her. |

### Made outside the screen

| Slot | Pose |
|---|---|
| Calligraphy | Kneeling at a low desk with a brush, a sheet of paper under it. |
| Markets | Behind a small market table with pieces laid out on it. |
| Magazine | Holding an open magazine, posters stacked beside her. |
| Physical computing | At a bench with a breadboard and a few wires. |
| Fabrication | Holding a flat-pack part, a laser-cut sheet beside her. |
| Bouldering | Reaching up for a climbing hold, chalk bag at her waist. |
| Tennis | Mid-swing with a racket. |
| Board games | At a table with a board and pieces, two friends across from her. |
| Skill archive | Holding a small stack of finished objects. |

### Centre

| Slot | Pose |
|---|---|
| Olivia | Waving hello. The sheet's front view is standing in for now, and a wave would make the centre read as a greeting. |

## Already filled, from your sheet

`me-paira` and `me-ecoscan`, the two scenes with their phones. `me-hi` the
front view, `me-skills` lying with the laptop, `me-base` sitting with the cat
and a mug, `me-school` the graduation outfit, `cat` the companion. Four outfit
variations are doing stand-in duty until the list above is made.

The two scenes set a second convention worth keeping: a featured project is a
scene, the figure plus the screens that show what the thing is. They are given
more height than a lone figure so the phones stay readable, and they sit at the
four corners of the featured ring. If Merlin and Common Ground follow the same
pattern, send them at a similar width so they balance.

## Dropping a new pose in

Save it as `assets/img/home-v2/<slot>.webp` with transparency, then change that
node's `img` in `assets/home-v2.js` and delete its `todo` line. Nothing else
needs touching.
