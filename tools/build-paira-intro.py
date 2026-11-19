#!/usr/bin/env python3
"""Paira's own onboarding, as a short film, and its five main screens.

    python3 tools/build-paira-intro.py

Reads "What is paira/" (her source files) and writes assets/img/paira/intro/:

  paira-intro.mp4      the ten intro frames in the app's order, cross-faded,
                       ending on the logo and the sign-in screen
  paira-intro.webp     its poster, the first frame
  beats.json           when each of the three onboarding beats is on screen,
                       so the page can light the matching line as it plays
  <area>.webp          the five landing screens, all 393 x 852

The frames are SVGs; Chrome renders them at 3x and ffmpeg joins them.
"""
import json
import pathlib
import subprocess
import tempfile

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "What is paira"
OUT = ROOT / "assets/img/paira/intro"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# frame, seconds on screen. Two frames per beat: the second is the first one
# answered, so the pair reads as one screen coming to life.
SEQ = [
    ("Intro-01.svg", 1.4), ("Intro-02.svg", 2.1),      # start with a request
    ("Intro-03.svg", 1.3), ("Intro-04.svg", 2.5),      # AI brings it into focus
    ("Intro-05.svg", 1.6), ("Intro-06.svg", 2.1),      # get help ...
    ("Intro-07.svg", 1.6), ("Intro-08.svg", 2.1),      # ... give help
    ("Sign up 09.svg", 1.4), ("Sign up 10.svg", 2.6),  # the logo, then sign in
]
BEATS = [(0, 2), (2, 4), (4, 8)]      # which frames each beat spans
FADE = 0.45
W, H = 786, 1704                       # 2x the 393 x 852 screen

LANDING = [   # file, output name, crop box or None
    ("Requests management center - my requests - Landing  - Sort by new updates.png",
     "request-hub", None),
    ("Expore-landing.png", "explore", None),
    ("Chat landing page.png", "chat", None),
    # 440 x 879 with a soft shadow round it; the screen itself is 393 x 852
    ("Profile-Request.png", "profile", (26, 0, 419, 852)),
    ("AiHome.png", "ai", None),
]


def render(svg, png):
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--hide-scrollbars",
                    "--force-device-scale-factor=3", "--window-size=393,852",
                    "--virtual-time-budget=5000", "--screenshot=%s" % png,
                    svg.as_uri()], check=True, capture_output=True)
    Image.open(png).convert("RGB").resize((W, H), Image.LANCZOS).save(png)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    tmp = pathlib.Path(tempfile.mkdtemp())
    frames = []
    for i, (name, _) in enumerate(SEQ):
        png = tmp / ("f%02d.png" % i)
        render(SRC / "Intro" / name, png)
        frames.append(png)

    # each still held for its time; each cross-fade overlaps the next by FADE
    args, chain, starts = ["ffmpeg", "-y", "-loglevel", "error"], [], []
    for png, (_, d) in zip(frames, SEQ):
        args += ["-loop", "1", "-t", "%.3f" % (d + FADE), "-framerate", "30", "-i", str(png)]
    t, prev = 0.0, "[0:v]"
    starts.append(0.0)
    for k in range(1, len(SEQ)):
        t += SEQ[k - 1][1]
        starts.append(t)
        out = "[v%d]" % k
        chain.append("%s[%d:v]xfade=transition=fade:duration=%.2f:offset=%.3f%s"
                     % (prev, k, FADE, t, out))
        prev = out
    total = t + SEQ[-1][1] + FADE
    chain.append("%sformat=yuv420p[out]" % prev)
    mp4 = OUT / "paira-intro.mp4"
    args += ["-filter_complex", ";".join(chain), "-map", "[out]",
             "-c:v", "libx264", "-preset", "slow", "-crf", "24",
             "-movflags", "+faststart", "-t", "%.3f" % total, str(mp4)]
    subprocess.run(args, check=True)

    Image.open(frames[0]).save(OUT / "paira-intro.webp", "WEBP", quality=82, method=6)
    beats = [{"from": round(starts[a], 2),
              "to": round(starts[b] if b < len(starts) else total, 2)}
             for a, b in BEATS]
    (OUT / "beats.json").write_text(json.dumps({"total": round(total, 2), "beats": beats}))

    for src, name, box in LANDING:
        im = Image.open(SRC / "5 landing page" / src).convert("RGB")
        if box:
            im = im.crop(box)
        assert im.size == (393, 852), (name, im.size)
        im.save(OUT / ("%s.webp" % name), "WEBP", quality=88, method=6)

    for p in sorted(OUT.iterdir()):
        print("  %-22s %6d KB" % (p.name, p.stat().st_size // 1024))
    print("  film: %.1f s, beats %s" % (total, beats))


if __name__ == "__main__":
    main()
