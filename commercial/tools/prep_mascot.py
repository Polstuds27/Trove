"""Prepare Atlas poses from web/public/mascot/ultra-refined for the commercial.

Flat PNGs (no layers): crop to the character, zero the near-transparent
background haze, downscale, and emit metadata (feet anchor, eye boxes) so the
Remotion <Mascot> can swap poses on a shared baseline and paint blinks.
Source files are only read. Output: commercial/public/mascot/*.png + src/mascot-meta.json
"""

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "web" / "public" / "mascot" / "ultra-refined"
OUT = ROOT / "commercial" / "public" / "mascot"
META = ROOT / "commercial" / "src" / "mascot-meta.json"
OUT.mkdir(parents=True, exist_ok=True)

POSES = ["Idle", "Worried", "Sad", "Sadder", "Search", "Waving", "Leaf-Hello", "Happy",
         "Celebrating", "Happy-Rejoicing", "Bank-Happy", "Coin", "Working", "Relaxed", "Curios"]
TARGET_H = 1100  # px of standing character (leaf tip to feet) after resize

meta = {}
for name in POSES:
    im = Image.open(SRC / f"{name}.png").convert("RGBA")
    r, g, b, a = im.split()
    a = a.point(lambda v: 0 if v < 24 else v)
    im.putalpha(a)
    bbox = a.point(lambda v: 255 if v > 40 else 0).getbbox()
    im = im.crop(bbox)
    w, h = im.size
    scale = TARGET_H / h
    im = im.resize((round(w * scale), TARGET_H), Image.LANCZOS)
    w, h = im.size
    px = im.load()

    # Feet anchor: centroid of opaque pixels in the bottom 6% of rows.
    xs = [x for y in range(int(h * 0.94), h) for x in range(w) if px[x, y][3] > 128]
    feet_x = sum(xs) / len(xs) / w if xs else 0.5

    # Eyes: dark, opaque blobs in the upper-middle band (head region).
    y0, y1 = int(h * 0.25), int(h * 0.55)
    dark = [(x, y) for y in range(y0, y1) for x in range(w)
            if px[x, y][3] > 200 and sum(px[x, y][:3]) < 150]
    eyes = []
    if dark:
        mid = sorted(x for x, _ in dark)[len(dark) // 2]
        for side in ([p for p in dark if p[0] < mid], [p for p in dark if p[0] >= mid]):
            if len(side) < 30:
                continue
            sx = [p[0] for p in side]
            sy = [p[1] for p in side]
            eyes.append({"x": (min(sx) + max(sx)) / 2 / w, "y": (min(sy) + max(sy)) / 2 / h,
                         "w": (max(sx) - min(sx) + 1) / w, "h": (max(sy) - min(sy) + 1) / h})
    # Skin tone sampled just above the first eye for blink lids.
    skin = None
    if len(eyes) == 2:
        e = eyes[0]
        sx, sy = int(e["x"] * w), int((e["y"] - e["h"] * 1.1) * h)
        skin = "#%02x%02x%02x" % px[sx, sy][:3]
    im.save(OUT / f"{name}.png", optimize=True)
    meta[name] = {"w": w, "h": h, "feetX": round(feet_x, 4), "eyes": eyes, "skin": skin}
    print(name, (w, h), round(feet_x, 3), len(eyes), skin)

META.parent.mkdir(parents=True, exist_ok=True)
META.write_text(json.dumps(meta, indent=1))
