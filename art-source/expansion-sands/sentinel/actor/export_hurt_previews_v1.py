from __future__ import annotations

import json
import math
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
SOURCE = Path(__file__).resolve().parent
RAW = SOURCE / "sunwell-sentinel-hurt-raw-v1.png"
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
        raise ValueError("Pose has no hard-alpha silhouette")
    return bounds


def x_runs(image: Image.Image) -> list[tuple[int, int]]:
    alpha = image.getchannel("A").point(lambda value: 255 if value > HARD_ALPHA else 0)
    present = [alpha.crop((x, 0, x + 1, image.height)).getbbox() is not None for x in range(image.width)]
    runs: list[tuple[int, int]] = []
    for x, is_present in enumerate(present):
        if is_present:
            if runs and x == runs[-1][1] + 1:
                runs[-1] = (runs[-1][0], x)
            else:
                runs.append((x, x))
    return runs


def make_cell(raw: Image.Image, bounds: tuple[int, int, int, int], index: int, common_scale: float) -> tuple[Image.Image, dict]:
    x0, y0, x1, y1 = bounds
    hard_width, hard_height = x1 - x0, y1 - y0
    scale = common_scale
    crop_box = (max(0, x0 - PADDING), max(0, y0 - PADDING), min(raw.width, x1 + PADDING), min(raw.height, y1 + 10))
    cropped = raw.crop(crop_box)
    cropped.save(SOURCE / f"sunwell-sentinel-hurt-pose-{index}-crop-v1.png", format="PNG", optimize=True)
    pose = cropped.resize((max(1, round(cropped.width * scale)), max(1, round(cropped.height * scale))), Image.Resampling.NEAREST)
    hard = hard_bounds(pose)
    hard_width, hard_height = hard[2] - hard[0], hard[3] - hard[1]
    left = (CELL - hard_width) // 2 - hard[0]
    top = BASELINE - hard[3]
    if left < 0 or top < 0 or left + pose.width > CELL or top + pose.height > CELL:
        raise ValueError(f"Pose does not fit cell: crop={crop_box}, scaled={pose.size}, hard={hard}")
    cell = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    cell.alpha_composite(pose, (left, top))
    return cell, {
        "index": index, "source_hard_bounds": list(bounds), "crop_bounds": list(crop_box),
        "crop_size": list(cropped.size), "scale": scale,
        "hard_bounds_in_cell": [left + hard[0], top + hard[1], left + hard[2], top + hard[3]],
        "hard_size_in_cell": [hard_width, hard_height], "baseline": top + hard[3],
    }


def main() -> None:
    raw = Image.open(RAW).convert("RGBA")
    runs = x_runs(raw)
    if len(runs) != 2:
        raise ValueError(f"Expected 2 horizontally separated poses, found {runs}")
    reports = []
    cells = []
    bounds_list = []
    for left, right in runs:
        local = raw.crop((left, 0, right + 1, raw.height))
        b = hard_bounds(local)
        bounds_list.append((b[0] + left, b[1], b[2] + left, b[3]))
    max_width = max(b[2] - b[0] for b in bounds_list)
    max_height = max(b[3] - b[1] for b in bounds_list)
    common_scale = min(TARGET_HARD_WIDTH / max_width, TARGET_HARD_HEIGHT / max_height)
    for index, bounds in enumerate(bounds_list):
        cell, report = make_cell(raw, bounds, index, common_scale)
        cells.append(cell)
        reports.append(report)
        cell.save(SOURCE / f"sunwell-sentinel-hurt-preview-{index}-96px-v1.png", format="PNG", optimize=True)
        display = cell.resize((192, 192), Image.Resampling.NEAREST)
        display.save(SOURCE / f"sunwell-sentinel-hurt-preview-{index}-192px-v1.png", format="PNG", optimize=True)

    sky = Image.open(SKY).convert("RGB")
    sx, sy = SKY_ORIGIN
    for index, cell in enumerate(cells):
        p96 = sky.crop((sx, sy, sx + 96, sy + 96)).convert("RGBA")
        p96.alpha_composite(cell)
        p96.convert("RGB").save(SOURCE / f"sunwell-sentinel-hurt-preview-{index}-96px-sky-v1.png", format="PNG", optimize=True)
        p192 = sky.crop((sx, sy, sx + 192, sy + 192)).convert("RGBA")
        p192.alpha_composite(cell.resize((192, 192), Image.Resampling.NEAREST))
        p192.convert("RGB").save(SOURCE / f"sunwell-sentinel-hurt-preview-{index}-192px-sky-v1.png", format="PNG", optimize=True)

    sheet = Image.new("RGBA", (192, 96), (0, 0, 0, 0))
    sheet.alpha_composite(cells[0], (0, 0))
    sheet.alpha_composite(cells[1], (96, 0))
    sheet.save(SOURCE / "sunwell-sentinel-hurt-overview-96px-v1.png", format="PNG", optimize=True)
    print(json.dumps({"raw_size": list(raw.size), "alpha_extrema": list(raw.getchannel("A").getextrema()), "x_runs": [list(x) for x in runs], "shared_scale": common_scale, "poses": reports}, indent=2))


if __name__ == "__main__":
    main()
