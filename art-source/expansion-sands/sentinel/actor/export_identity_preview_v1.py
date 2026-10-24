from __future__ import annotations

import json
import math
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[4]
SOURCE = Path(__file__).resolve().parent
RAW = SOURCE / "sunwell-sentinel-identity-raw-v1.png"
SKY = ROOT / "public/assets/environment/env-sunwell-sky-v1.png"
CELL = 96
BASELINE = 94
HARD_ALPHA = 32
PADDING = 24
TARGET_HARD_WIDTH = 84
TARGET_HARD_HEIGHT = 86
SKY_ORIGIN = (384, 192)


def hard_bounds(image: Image.Image) -> tuple[int, int, int, int]:
    mask = image.getchannel("A").point(lambda value: 255 if value > HARD_ALPHA else 0)
    bounds = mask.getbbox()
    if bounds is None:
        raise ValueError("Identity has no hard-alpha silhouette")
    return bounds


def make_cell() -> tuple[Image.Image, dict]:
    raw = Image.open(RAW).convert("RGBA")
    x0, y0, x1, y1 = hard_bounds(raw)
    hard_width, hard_height = x1 - x0, y1 - y0
    scale = min(TARGET_HARD_WIDTH / hard_width, TARGET_HARD_HEIGHT / hard_height)
    bottom_padding = max(1, math.floor((CELL - BASELINE) / scale))
    crop_box = (
        max(0, x0 - PADDING),
        max(0, y0 - PADDING),
        min(raw.width, x1 + PADDING),
        min(raw.height, y1 + bottom_padding),
    )
    # Threshold locates the crop only; all RGBA values in the crop are preserved.
    pose = raw.crop(crop_box)
    pose = pose.resize(
        (max(1, round(pose.width * scale)), max(1, round(pose.height * scale))),
        Image.Resampling.NEAREST,
    )
    hard = hard_bounds(pose)
    hard_width, hard_height = hard[2] - hard[0], hard[3] - hard[1]
    left = (CELL - hard_width) // 2 - hard[0]
    top = BASELINE - hard[3]
    if left < 0 or top < 0 or left + pose.width > CELL or top + pose.height > CELL:
        raise ValueError(f"Identity does not fit its 96px cell: crop={pose.size}, hard={hard}")
    cell = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    cell.alpha_composite(pose, (left, top))
    return cell, {
        "raw_size": list(raw.size),
        "hard_alpha_threshold": HARD_ALPHA,
        "source_hard_bounds": [x0, y0, x1, y1],
        "crop_bounds": list(crop_box),
        "scale": scale,
        "hard_bounds_in_cell": [left + hard[0], top + hard[1], left + hard[2], top + hard[3]],
        "hard_size_in_cell": [hard_width, hard_height],
        "baseline": top + hard[3],
        "cell_size": [CELL, CELL],
    }


def main() -> None:
    cell, report = make_cell()
    cell_path = SOURCE / "sunwell-sentinel-identity-preview-96px-v1.png"
    display_path = SOURCE / "sunwell-sentinel-identity-preview-192px-v1.png"
    review_96_path = SOURCE / "sunwell-sentinel-identity-preview-96px-sky-v1.png"
    review_192_path = SOURCE / "sunwell-sentinel-identity-preview-192px-sky-v1.png"
    cell.save(cell_path, format="PNG", optimize=True)
    display = cell.resize((CELL * 2, CELL * 2), Image.Resampling.NEAREST)
    display.save(display_path, format="PNG", optimize=True)

    sky = Image.open(SKY).convert("RGB")
    sx, sy = SKY_ORIGIN
    patch96 = sky.crop((sx, sy, sx + CELL, sy + CELL)).convert("RGBA")
    patch192 = sky.crop((sx, sy, sx + CELL * 2, sy + CELL * 2)).convert("RGBA")
    if patch96.size != (CELL, CELL) or patch192.size != (CELL * 2, CELL * 2):
        raise ValueError("Sunwell sky patch is missing or too small")
    review96 = patch96.copy()
    review96.alpha_composite(cell)
    review96.convert("RGB").save(review_96_path, format="PNG", optimize=True)
    review192 = patch192.copy()
    review192.alpha_composite(display)
    review192.convert("RGB").save(review_192_path, format="PNG", optimize=True)

    report.update({
        "alpha_extrema_in_cell": list(cell.getchannel("A").getextrema()),
        "alpha_extrema_in_display": list(display.getchannel("A").getextrema()),
        "sky_patch_origin": list(SKY_ORIGIN),
        "outputs": [
            cell_path.name,
            display_path.name,
            review_96_path.name,
            review_192_path.name,
        ],
    })
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
