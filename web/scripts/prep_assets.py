#!/usr/bin/env python3
"""Prepare Trove brand assets from the supplied source artwork.

Inputs (checked into public/, do not delete):
  public/mascot/Trove Sprite Atlas.png  2048x2048, 4x4 grid of 512px cells,
                                        background baked in as a light
                                        neutral checkerboard (no alpha).
  public/icons/favicon-trove.jfif       2048x2048 source for PWA icons.

Outputs:
  public/mascot/<pose>.png  transparent, trimmed pose sprites + manifest.json
  public/icons/icon-192.png, icon-512.png, maskable-512.png,
                  apple-touch-icon.png, favicon.ico

Run from web/:  python scripts/prep_assets.py
Requires: pillow, numpy (no other dependencies).
"""
from __future__ import annotations

import hashlib
import json
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
MASCOT_DIR = ROOT / "public" / "mascot"
ICON_DIR = ROOT / "public" / "icons"
ATLAS = MASCOT_DIR / "Trove Sprite Atlas.png"
ICON_SRC = ICON_DIR / "favicon-trove.jfif"

# 4x4 grid, row-major. Names describe the pose, not the expression detail.
POSES = [
    "idle", "celebrate", "delight", "sleep",
    "cheer", "read", "talk", "rest",
    "ledger", "wave", "piggy", "worried",
    "note", "save", "guard", "peek",
]

MAX_SIZE = 448          # longest edge of an exported sprite
NEUTRAL_SPREAD = 16      # |R-B| under this counts as neutral (checkerboard)
NEUTRAL_MIN = 196        # light enough to be background, not character
CELL = 512


def key_background(arr: np.ndarray) -> np.ndarray:
    """Return a bool mask of pixels to erase.

    The shipped atlas has no alpha channel: the "transparent" area was baked
    in as a light neutral checkerboard (~#FFFFFF / ~#DDDDDD). Characters are
    warm (cream, sage, forest) so a neutrality+lightness test separates them
    cleanly; the mask is then restricted to the region connected to the cell
    border so interior whites (paper, highlights) survive.
    """
    r = arr[..., 0].astype(np.int16)
    g = arr[..., 1].astype(np.int16)
    b = arr[..., 2].astype(np.int16)
    spread = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)
    light = np.minimum(np.minimum(r, g), b) >= NEUTRAL_MIN
    candidate = (spread <= NEUTRAL_SPREAD) & light

    h, w = candidate.shape
    seen = np.zeros((h, w), dtype=bool)
    queue: deque[tuple[int, int]] = deque()

    for x in range(w):
        for y in (0, h - 1):
            if candidate[y, x] and not seen[y, x]:
                seen[y, x] = True
                queue.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if candidate[y, x] and not seen[y, x]:
                seen[y, x] = True
                queue.append((y, x))

    while queue:
        y, x = queue.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and candidate[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                queue.append((ny, nx))
    return seen


def clean_atlas(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    arr = np.array(rgba)
    background = key_background(arr)

    alpha = np.where(background, 0, 255).astype(np.uint8)
    # Erode by a pixel so the anti-aliased rim does not carry the checkerboard
    # colour into the sprite, then soften the mask to avoid stair-stepping.
    alpha_img = Image.fromarray(alpha, "L")
    alpha_img = alpha_img.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))
    arr[..., 3] = np.array(alpha_img)
    return Image.fromarray(arr, "RGBA")


def export_poses(atlas: Image.Image) -> dict:
    manifest: dict[str, dict] = {}
    hashes: dict[str, list[str]] = {}

    for index, name in enumerate(POSES):
        row, col = divmod(index, 4)
        cell = atlas.crop((col * CELL, row * CELL, (col + 1) * CELL, (row + 1) * CELL))

        alpha = np.array(cell.getchannel("A"))
        ys, xs = np.where(alpha > 8)
        if len(xs) == 0:
            print(f"  ! {name}: empty cell, skipped", file=sys.stderr)
            continue
        pad = 8
        box = (
            max(int(xs.min()) - pad, 0),
            max(int(ys.min()) - pad, 0),
            min(int(xs.max()) + pad + 1, CELL),
            min(int(ys.max()) + pad + 1, CELL),
        )
        sprite = cell.crop(box)
        if max(sprite.size) > MAX_SIZE:
            scale = MAX_SIZE / max(sprite.size)
            sprite = sprite.resize(
                (round(sprite.width * scale), round(sprite.height * scale)),
                Image.LANCZOS,
            )

        out = MASCOT_DIR / f"{name}.png"
        sprite.save(out, "PNG", optimize=True)

        digest = hashlib.md5(
            np.array(cell.convert("RGB").crop(box)).tobytes()
        ).hexdigest()[:8]
        hashes.setdefault(digest, []).append(name)

        manifest[name] = {"file": f"/mascot/{name}.png", "w": sprite.width, "h": sprite.height}
        print(f"  {name:10s} {sprite.width}x{sprite.height}  {out.stat().st_size // 1024} kB")

    (MASCOT_DIR / "manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )
    for digest, names in hashes.items():
        if len(names) > 1:
            print(f"  = duplicate poses: {', '.join(names)}")
    return manifest


def export_icons() -> None:
    src = Image.open(ICON_SRC).convert("RGB")
    side = min(src.size)
    src = src.crop(
        ((src.width - side) // 2, (src.height - side) // 2,
         (src.width + side) // 2, (src.height + side) // 2)
    )

    for name, size in (("icon-192.png", 192), ("icon-512.png", 512),
                       ("apple-touch-icon.png", 180)):
        src.resize((size, size), Image.LANCZOS).save(ICON_DIR / name, "PNG", optimize=True)
        print(f"  {name} {size}x{size}")

    # Maskable icons are cropped ~40% by the launcher: compose the artwork at
    # 66% inside the full-bleed safe zone on the brand cream background.
    canvas = src.resize((366, 366), Image.LANCZOS)
    maskable = Image.new("RGB", (512, 512), src.getpixel((4, 4)))
    maskable.paste(canvas, ((512 - 366) // 2, (512 - 366) // 2))
    maskable.save(ICON_DIR / "maskable-512.png", "PNG", optimize=True)
    print("  maskable-512.png 512x512")

    ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
    src.save(ICON_DIR / "favicon.ico", format="ICO", sizes=ico_sizes)
    print("  favicon.ico " + ", ".join(f"{s[0]}x{s[1]}" for s in ico_sizes))


def main() -> None:
    if not ATLAS.exists():
        sys.exit(f"missing {ATLAS}")
    print("mascot sprites:")
    export_poses(clean_atlas(Image.open(ATLAS)))
    if ICON_SRC.exists():
        print("pwa icons:")
        export_icons()
    else:
        print(f"! {ICON_SRC} missing - icons not regenerated", file=sys.stderr)


if __name__ == "__main__":
    main()
