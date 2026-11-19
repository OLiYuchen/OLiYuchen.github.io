#!/usr/bin/env python3
"""Prepare the Paira intro film's pictures, and the five landing screens.

    python3 tools/build-paira-intro.py
    node --experimental-websocket tools/paira-film/capture.mjs

The first reads "What is paira/" (her source files):

  tools/paira-film/media/f01..f10.jpg   the ten intro frames, rendered from
                                        their SVGs by Chrome at 3x, for the film
  assets/img/paira/intro/<area>.webp    the five landing screens, all 393 x 852,
                                        for the page and (copied) for the film

The second films tools/paira-film/film.html frame by frame into
assets/img/paira/intro/paira-film.mp4 and its two poster frames.
"""
import pathlib
import shutil
import subprocess

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "What is paira"
OUT = ROOT / "assets/img/paira/intro"
MEDIA = ROOT / "tools/paira-film/media"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

FRAMES = ["Intro-01.svg", "Intro-02.svg", "Intro-03.svg", "Intro-04.svg",
          "Intro-05.svg", "Intro-06.svg", "Intro-07.svg", "Intro-08.svg",
          "Sign up 09.svg", "Sign up 10.svg"]

LANDING = [   # file, output name, crop box or None
    ("Requests management center - my requests - Landing  - Sort by new updates.png",
     "request-hub", None),
    ("Expore-landing.png", "explore", None),
    ("Chat landing page.png", "chat", None),
    # 440 x 879 with a soft shadow round it; the screen itself is 393 x 852
    ("Profile-Request.png", "profile", (26, 0, 419, 852)),
    ("AiHome.png", "ai", None),
]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    MEDIA.mkdir(parents=True, exist_ok=True)
    for i, name in enumerate(FRAMES, 1):
        png = MEDIA / ("f%02d.png" % i)
        subprocess.run([CHROME, "--headless", "--disable-gpu", "--hide-scrollbars",
                        "--force-device-scale-factor=3", "--window-size=393,852",
                        "--virtual-time-budget=5000", "--screenshot=%s" % png,
                        (SRC / "Intro" / name).as_uri()], check=True, capture_output=True)
        Image.open(png).convert("RGB").save(MEDIA / ("f%02d.jpg" % i), quality=92)
        png.unlink()

    for src, name, box in LANDING:
        im = Image.open(SRC / "5 landing page" / src).convert("RGB")
        if box:
            im = im.crop(box)
        assert im.size == (393, 852), (name, im.size)
        im.save(OUT / ("%s.webp" % name), "WEBP", quality=88, method=6)
        shutil.copy(OUT / ("%s.webp" % name), MEDIA / ("%s.webp" % name))

    for p in sorted(OUT.iterdir()):
        print("  %-24s %6d KB" % (p.name, p.stat().st_size // 1024))


if __name__ == "__main__":
    main()
