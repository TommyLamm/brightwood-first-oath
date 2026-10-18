"""Deterministically recover the retained ImageGen hero atlases.

Authorized by the user on 2026-10-18. Original artwork and prompts are retained.
Only thresholding/fringe removal, palette reduction, crop, nearest-neighbor
scaling and frame packing are performed. No character pose is drawn by code.
"""
from pathlib import Path
import hashlib
import json

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[3]
ART = ROOT / "art-source/actors/hero"
OUT = ROOT / "public/assets/actors"
SOURCES = {"cloth": "hero-cloth-v8-attempt-1.png", "leather": "hero-leather-v3-repair-1.png", "iron": "hero-iron-v3-repair-1.png"}
STATES = [("idle", 4, 180, True), ("walk", 6, 100, True), ("jump", 2, 100, False), ("climb", 4, 120, True), ("attack", 6, 60, False), ("hurt", 2, 100, False), ("dead", 4, 120, False), ("buff", 4, 100, False)]


def separators(counts):
    """Locate actual transparent valleys near the eight intended source cells."""
    length = len(counts)
    cuts = [0]
    for index in range(1, 8):
        target = length * index / 8
        lo, hi = round(target - length / 32), round(target + length / 32)
        section = counts[lo:hi]
        minimum = section.min()
        positions = np.flatnonzero(section == minimum) + lo
        groups = np.split(positions, np.flatnonzero(np.diff(positions) > 1) + 1)
        group = min(groups, key=lambda group: abs(float(group.mean()) - target))
        cuts.append(round(float(group.mean())))
    return [*cuts, length]


def retain_character(cell):
    """Discard disconnected slivers from the neighboring source poses."""
    alpha = np.asarray(cell)[:, :, 3] > 0
    remaining = set(zip(*np.nonzero(alpha)))
    largest = set()
    while remaining:
        seed = remaining.pop()
        component, todo = {seed}, [seed]
        while todo:
            y, x = todo.pop()
            for dy, dx in ((-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)):
                nxt = (y + dy, x + dx)
                if nxt in remaining:
                    remaining.remove(nxt)
                    component.add(nxt)
                    todo.append(nxt)
        if len(component) > len(largest):
            largest = component
    pixels = np.asarray(cell).copy()
    keep = np.zeros(alpha.shape, dtype=bool)
    for y, x in largest:
        keep[y, x] = True
    pixels[~keep] = 0
    return Image.fromarray(pixels)


def main():
    subset = {"version": 1, "pack": "actors", "images": [], "animations": [], "audio": []}
    reports = {}
    for costume, source_name in SOURCES.items():
        source = Image.open(ART / source_name).convert("RGBA")
        pixels = np.asarray(source).copy()
        r, g, b, a = [pixels[:, :, i].astype(np.int32) for i in range(4)]
        # Red/green/yellow keying residue is outside the intended warm neutral,
        # muted teal and steel palette. Preserve the normal chestnut hair/skin.
        red = (r > 175) & (r > g * 1.8) & (r > b * 1.8) & (g < 95)
        green = (g > 100) & (g > r * 1.55) & (g > b * 1.5)
        yellow = (r > 150) & (g > 150) & (b < 100) & (abs(r - g) < 70)
        mask = (a >= 160) & ~red & ~green & ~yellow
        pixels[:, :, 3] = np.where(mask, 255, 0)
        pixels[~mask] = 0
        clean = Image.fromarray(pixels)
        # One palette per costume maintains colors across its complete animation.
        rgb = clean.convert("RGB").quantize(colors=40, method=Image.Quantize.MEDIANCUT).convert("RGB")
        rgb.putalpha(clean.getchannel("A"))
        clean = rgb
        cells = []
        max_width, max_height = 0, 0
        y_cuts = separators(mask.sum(axis=1))
        for row, (_, count, _, _) in enumerate(STATES):
            row_cells = []
            x_cuts = separators(mask[y_cuts[row]:y_cuts[row + 1]].sum(axis=0))
            for col in range(count):
                box = (x_cuts[col], y_cuts[row], x_cuts[col + 1], y_cuts[row + 1])
                cell = retain_character(clean.crop(box))
                bounds = cell.getbbox()
                assert bounds, (costume, row, col)
                content = cell.crop(bounds)
                max_width, max_height = max(max_width, content.width), max(max_height, content.height)
                row_cells.append((content, box, bounds))
            cells.append(row_cells)
        scale = min(94 / max_width, 94 / max_height)
        sheet = Image.new("RGBA", (1024, 1024))
        review = Image.new("RGB", (1024, 1088), "#283440")
        draw = ImageDraw.Draw(review)
        frame_reports = {}
        for row, (state, count, duration, loop) in enumerate(STATES):
            frame_reports[state] = []
            effective = []
            for col, (content, box, bounds) in enumerate(cells[row]):
                size = (max(1, round(content.width * scale)), max(1, round(content.height * scale)))
                content = content.resize(size, Image.Resampling.NEAREST)
                # A shared baseline avoids motion from independent bbox fitting;
                # death collapse retains its actual changing body height.
                x, y = (128 - size[0]) // 2, 112 - size[1]
                frame = Image.new("RGBA", (128, 128))
                frame.paste(content, (x, y))
                bbox = frame.getbbox()
                margins = [bbox[0], bbox[1], 128 - bbox[2], 128 - bbox[3]]
                assert min(margins) >= 16, (costume, state, col, margins)
                effective.append(frame)
                frame_reports[state].append({"sourceBox": box, "contentBounds": bounds, "scale": scale, "runtimeOffset": [x, y], "runtimeSize": size, "runtimeBounds": bbox, "clearMargins": margins})
            for col in range(8):
                frame = effective[min(col, count - 1)]
                sheet.paste(frame, (col * 128, row * 128))
                review.paste(frame, (col * 128, row * 136 + 8), frame)
                draw.text((col * 128 + 2, row * 136), f"{state}:{min(col, count - 1)}", fill="#e5e9ee")
            subset["animations"].append({"key": f"hero:{costume}:{state}", "imageKey": f"actor:hero-{costume}", "frames": [row * 8 + n for n in range(count)], "frameMs": [duration] * count, "loop": loop})
        path = OUT / f"hero-{costume}-v9.png"
        sheet.save(path, optimize=True)
        review.save(ART / f"hero-{costume}-v9-review.png", optimize=True)
        subset["images"].append({"key": f"actor:hero-{costume}", "url": f"assets/actors/hero-{costume}-v9.png", "columns": 8, "rows": 8, "displayWidth": 96, "displayHeight": 96, "pivotX": .5, "pivotY": 1})
        reports[costume] = {"source": source_name, "sourceSha256": hashlib.sha256((ART / source_name).read_bytes()).hexdigest(), "output": str(path.relative_to(ROOT)), "outputSha256": hashlib.sha256(path.read_bytes()).hexdigest(), "bytes": path.stat().st_size, "scale": scale, "frames": frame_reports}
    (ART / "hero-v9-subset.json").write_text(json.dumps(subset, indent=2) + "\n", encoding="utf-8")
    (ART / "hero-v9-export.json").write_text(json.dumps(reports, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: {"bytes": value["bytes"], "scale": value["scale"]} for key, value in reports.items()}, indent=2))


if __name__ == "__main__":
    main()
