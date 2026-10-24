from __future__ import annotations

import json
import math
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
SOURCE = Path(__file__).resolve().parent
RAW = SOURCE / "sunwell-sentinel-walk-raw-v1.png"
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


def hard_components(image: Image.Image) -> list[tuple[int, tuple[int, int, int, int]]]:
    mask = image.getchannel("A").point(lambda value: 255 if value > HARD_ALPHA else 0)
    pixels = mask.load()
    width, height = mask.size
    visited = bytearray(width * height)
    components: list[tuple[int, tuple[int, int, int, int]]] = []
    for y in range(height):
        for x in range(width):
            start = y * width + x
            if not pixels[x, y] or visited[start]:
                continue
            stack = [start]
            visited[start] = 1
            count = 0
            x0 = x1 = x
            y0 = y1 = y
            while stack:
                current = stack.pop()
                cx, cy = current % width, current // width
                count += 1
                x0, x1 = min(x0, cx), max(x1, cx)
                y0, y1 = min(y0, cy), max(y1, cy)
                for ny in range(max(0, cy - 1), min(height, cy + 2)):
                    for nx in range(max(0, cx - 1), min(width, cx + 2)):
                        neighbor = ny * width + nx
                        if pixels[nx, ny] and not visited[neighbor]:
                            visited[neighbor] = 1
                            stack.append(neighbor)
            components.append((count, (x0, y0, x1 + 1, y1 + 1)))
    return components

def make_cell(raw: Image.Image, bounds: tuple[int, int, int, int], index: int) -> tuple[Image.Image, dict]:
    x0, y0, x1, y1 = bounds
    hard_width, hard_height = x1 - x0, y1 - y0
    scale = min(TARGET_HARD_WIDTH / hard_width, TARGET_HARD_HEIGHT / hard_height)
    crop_box = (max(0, x0 - PADDING), max(0, y0 - PADDING), min(raw.width, x1 + PADDING), min(raw.height, y1 + 10))
    cropped = raw.crop(crop_box)
    cropped.save(SOURCE / f"sunwell-sentinel-walk-pose-{index}-crop-v1.png", format="PNG", optimize=True)
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
    components = sorted(hard_components(raw), key=lambda item: item[1][0])
    if len(components) != 4 or min(count for count, _ in components) < 10000:
        raise ValueError(f"Expected exactly four substantial pose silhouettes, found {components}")
    reports = []
    cells = []
    for index, (_, bounds) in enumerate(components):
        cell, report = make_cell(raw, bounds, index)
        cells.append(cell)
        reports.append(report)
        cell.save(SOURCE / f"sunwell-sentinel-walk-preview-{index}-96px-v1.png", format="PNG", optimize=True)
        display = cell.resize((192, 192), Image.Resampling.NEAREST)
        display.save(SOURCE / f"sunwell-sentinel-walk-preview-{index}-192px-v1.png", format="PNG", optimize=True)

    sky = Image.open(SKY).convert("RGB")
    sx, sy = SKY_ORIGIN
    for index, cell in enumerate(cells):
        p96 = sky.crop((sx, sy, sx + 96, sy + 96)).convert("RGBA")
        p96.alpha_composite(cell)
        p96.convert("RGB").save(SOURCE / f"sunwell-sentinel-walk-preview-{index}-96px-sky-v1.png", format="PNG", optimize=True)
        p192 = sky.crop((sx, sy, sx + 192, sy + 192)).convert("RGBA")
        p192.alpha_composite(cell.resize((192, 192), Image.Resampling.NEAREST))
        p192.convert("RGB").save(SOURCE / f"sunwell-sentinel-walk-preview-{index}-192px-sky-v1.png", format="PNG", optimize=True)

    sheet = Image.new("RGBA", (384, 96), (0, 0, 0, 0))
    for index, cell in enumerate(cells):
        sheet.alpha_composite(cell, (index * CELL, 0))
    sheet.save(SOURCE / "sunwell-sentinel-walk-overview-96px-v1.png", format="PNG", optimize=True)
    sheet192 = Image.new("RGBA", (768, 192), (0, 0, 0, 0))
    for index, cell in enumerate(cells):
        sheet192.alpha_composite(cell.resize((192, 192), Image.Resampling.NEAREST), (index * 192, 0))
    sheet192.save(SOURCE / "sunwell-sentinel-walk-overview-192px-v1.png", format="PNG", optimize=True)
    sheet.save(SOURCE / "sunwell-sentinel-walk-overview-96px-v1.png", format="PNG", optimize=True)
    print(json.dumps({"raw_size": list(raw.size), "alpha_extrema": list(raw.getchannel("A").getextrema()), "hard_components": [{"pixels": count, "bounds": list(bounds)} for count, bounds in components], "poses": reports}, indent=2))


if __name__ == "__main__":
    main()
