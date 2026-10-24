from __future__ import annotations

import json
import math
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[4]
SOURCE = ROOT / "art-source/expansion-sands/sunwell/beetle"
ENVIRONMENT = ROOT / "public/assets/environment/env-sand-dune-sky-v1.png"
ATLAS = ROOT / "public/assets/actors/monsters/sunwell-beetle-atlas-v1.png"
PREVIEW = SOURCE / "sunwell-beetle-atlas-preview-96px-sky-v1.png"

CELL = 96
BASELINE = 94
PADDING = 24
HARD_ALPHA = 32
SKY_ORIGIN = (432, 210)


def frame_spec(group: str, filename: str, bounds: tuple[int, int, int, int], scale: float, column: int, columns: int):
    return {
        "group": group,
        "filename": filename,
        "bounds": bounds,
        "scale": scale,
        "column": column,
        "columns": columns,
    }


FRAMES = [
    frame_spec("idle", "sunwell-beetle-idle-2pose-raw-v1.png", (129, 238, 831, 736), 0.103896, 0, 2),
    frame_spec("idle", "sunwell-beetle-idle-2pose-raw-v1.png", (117, 294, 801, 751), 0.103896, 1, 2),
    frame_spec("walk", "sunwell-beetle-walk-4pose-raw-v1.png", (28, 234, 518, 566), 0.147844, 0, 4),
    frame_spec("walk", "sunwell-beetle-walk-4pose-raw-v1.png", (28, 227, 527, 566), 0.147844, 1, 4),
    frame_spec("walk", "sunwell-beetle-walk-4pose-raw-v1.png", (32, 230, 514, 566), 0.147844, 2, 4),
    frame_spec("walk", "sunwell-beetle-walk-4pose-raw-v1.png", (35, 231, 519, 566), 0.147844, 3, 4),
    frame_spec("attack", "sunwell-beetle-attack-4pose-raw-v1.png", (44, 331, 502, 628), 0.157549, 0, 4),
    frame_spec("attack", "sunwell-beetle-attack-4pose-raw-v1.png", (44, 335, 500, 625), 0.157549, 1, 4),
    frame_spec("attack", "sunwell-beetle-attack-4pose-raw-v1.png", (2, 343, 539, 628), 0.157549, 2, 4),
    frame_spec("attack", "sunwell-beetle-attack-4pose-raw-v1.png", (62, 321, 513, 634), 0.157549, 3, 4),
    frame_spec("hurt", "sunwell-beetle-hurt-2pose-raw-v1.png", (166, 350, 824, 784), 0.108027, 0, 2),
    frame_spec("hurt", "sunwell-beetle-hurt-2pose-raw-v1.png", (98, 350, 773, 784), 0.108027, 1, 2),
    frame_spec("dead", "sunwell-beetle-dead-4pose-raw-v1.png", (35, 230, 516, 579), 0.150313, 0, 4),
    frame_spec("dead", "sunwell-beetle-dead-4pose-raw-v1.png", (58, 270, 535, 583), 0.150313, 1, 4),
    frame_spec("dead", "sunwell-beetle-dead-4pose-raw-v1.png", (53, 325, 535, 591), 0.150313, 2, 4),
    frame_spec("dead", "sunwell-beetle-dead-4pose-raw-v1.png", (58, 378, 525, 593), 0.150313, 3, 4),
]


def scaled_hard_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    mask = alpha.point(lambda value: 255 if value > HARD_ALPHA else 0)
    bbox = mask.getbbox()
    if bbox is None:
        raise ValueError("Pose crop has no hard silhouette")
    return bbox


def render_pose(spec: dict) -> tuple[Image.Image, dict]:
    raw = Image.open(SOURCE / spec["filename"]).convert("RGBA")
    x0, y0, x1, y1 = spec["bounds"]
    columns = spec["columns"]
    column_width = raw.width // columns
    left_limit = spec["column"] * column_width
    right_limit = raw.width if spec["column"] == columns - 1 else left_limit + column_width
    if raw.width % columns:
        raise ValueError(f"Raw strip width is not divisible into {columns} equal poses")
    x0 += left_limit
    x1 += left_limit

    # The alpha >32 box only locates each complete sprite. Crop pixels are left
    # untouched, including any soft pixels around the hard silhouette.
    bottom_padding = max(1, math.floor((CELL - BASELINE) / spec["scale"]))
    crop = (
        max(left_limit, x0 - PADDING),
        max(0, y0 - PADDING),
        min(right_limit, x1 + PADDING),
        min(raw.height, y1 + bottom_padding),
    )
    pose = raw.crop(crop)
    resized_size = (max(1, round(pose.width * spec["scale"])), max(1, round(pose.height * spec["scale"])))
    pose = pose.resize(resized_size, Image.Resampling.NEAREST)
    hard = scaled_hard_bbox(pose)
    hard_width = hard[2] - hard[0]
    hard_height = hard[3] - hard[1]
    left = (CELL - hard_width) // 2 - hard[0]
    top = BASELINE - hard[3]
    if left < 0 or top < 0 or left + pose.width > CELL or top + pose.height > CELL:
        raise ValueError(f"{spec['group']} pose exceeds 96px cell after scaling: {pose.size}, hard bbox={hard}")

    cell = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    cell.alpha_composite(pose, (left, top))
    measured = {
        "group": spec["group"],
        "source": spec["filename"],
        "source_hard_bbox": spec["bounds"],
        "scale": spec["scale"],
        "hard_bbox_in_cell": [left + hard[0], top + hard[1], left + hard[2], top + hard[3]],
        "hard_size": [hard_width, hard_height],
        "baseline": top + hard[3],
        "crop_rect": list(crop),
        "resized_crop_size": list(pose.size),
    }
    return cell, measured


def main() -> None:
    atlas = Image.new("RGBA", (CELL * 4, CELL * 4), (0, 0, 0, 0))
    cells: list[Image.Image] = []
    measurements = []
    for index, spec in enumerate(FRAMES):
        cell, measured = render_pose(spec)
        x, y = (index % 4) * CELL, (index // 4) * CELL
        atlas.alpha_composite(cell, (x, y))
        cells.append(cell)
        measured["frame_index"] = index
        measured["atlas_origin"] = [x, y]
        measurements.append(measured)

    ATLAS.parent.mkdir(parents=True, exist_ok=True)
    SOURCE.mkdir(parents=True, exist_ok=True)
    atlas.save(ATLAS, format="PNG", optimize=True)

    environment = Image.open(ENVIRONMENT).convert("RGB")
    sky_x, sky_y = SKY_ORIGIN
    background = environment.crop((sky_x, sky_y, sky_x + CELL, sky_y + CELL)).convert("RGBA")
    if background.size != (CELL, CELL):
        raise ValueError("Approved environment patch is not 96×96")
    preview = Image.new("RGB", (CELL * 4, CELL * 4))
    for index, cell in enumerate(cells):
        tile = background.copy()
        tile.alpha_composite(cell)
        preview.paste(tile.convert("RGB"), ((index % 4) * CELL, (index // 4) * CELL))
    preview.save(PREVIEW, format="PNG", optimize=True)

    result = {
        "atlas": str(ATLAS.relative_to(ROOT)),
        "atlas_size": list(atlas.size),
        "mode": atlas.mode,
        "alpha_extrema": atlas.getchannel("A").getextrema(),
        "preview": str(PREVIEW.relative_to(ROOT)),
        "preview_size": list(preview.size),
        "frame_order": ["idle 0", "idle 1", "walk 0", "walk 1", "walk 2", "walk 3", "attack 0", "attack 1", "attack 2", "attack 3", "hurt 0", "hurt 1", "dead 0", "dead 1", "dead 2", "dead 3"],
        "sky_patch_origin": list(SKY_ORIGIN),
        "frames": measurements,
    }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
