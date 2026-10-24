from __future__ import annotations

import hashlib
import json
import statistics
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
SOURCE = Path(__file__).resolve().parent
ATTACK = SOURCE.parent / "attack"
WALK_FIX = SOURCE.parent / "walk-fix" / "sunwell-sentinel-walk-pose-0-edited-raw-v1.png"
RUNTIME = ROOT / "public/assets/actors/monsters/sunwell-sentinel-atlas-v1.png"
CELL = 96
BASELINE = 94
DISPLAY = 192
HARD_ALPHA = 32
PADDING = 24
BOTTOM_PADDING = 10
TARGET_CORE_HEIGHT = 9
CORE_CENTER_X = 58.5
SKY = ROOT / "public/assets/environment/env-sunwell-sky-v1.png"
SKY_ORIGIN = (384, 192)

# Ordered as the locked 4x4 row-major runtime contract.
FRAME_SOURCES = [
    ("idle", SOURCE / "sunwell-sentinel-idle-pose-0-crop-v1.png", "idle 0"),
    ("idle", SOURCE / "sunwell-sentinel-idle-pose-1-crop-v1.png", "idle 1"),
    ("walk", WALK_FIX, "walk 0 (targeted edit)"),
    ("walk", SOURCE / "sunwell-sentinel-walk-pose-1-crop-v1.png", "walk 1"),
    ("walk", SOURCE / "sunwell-sentinel-walk-pose-2-crop-v1.png", "walk 2"),
    ("walk", SOURCE / "sunwell-sentinel-walk-pose-3-crop-v1.png", "walk 3"),
    ("attack", ATTACK / "sunwell-sentinel-attack-06-windup-low-crop-v1.png", "attack 6: wind-up low"),
    ("attack", ATTACK / "sunwell-sentinel-attack-07-fists-high-crop-v1.png", "attack 7: fists high"),
    ("attack", ATTACK / "sunwell-sentinel-attack-08-low-smash-crop-v1.png", "attack 8: low smash"),
    ("attack", ATTACK / "sunwell-sentinel-attack-09-recover-crop-v1.png", "attack 9: recover"),
    ("hurt", SOURCE / "sunwell-sentinel-hurt-pose-0-crop-v1.png", "hurt 0"),
    ("hurt", SOURCE / "sunwell-sentinel-hurt-pose-1-crop-v1.png", "hurt 1"),
    ("dead", SOURCE / "sunwell-sentinel-dead-pose-0-crop-v1.png", "dead 0: fall"),
    ("dead", SOURCE / "sunwell-sentinel-dead-pose-1-crop-v1.png", "dead 1: kneel"),
    ("dead", SOURCE / "sunwell-sentinel-dead-pose-2-crop-v1.png", "dead 2: collapse"),
    ("dead", SOURCE / "sunwell-sentinel-dead-pose-3-crop-v1.png", "dead 3: prone"),
]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest().upper()


def hard_bounds(image: Image.Image) -> tuple[int, int, int, int]:
    mask = image.getchannel("A").point(lambda value: 255 if value > HARD_ALPHA else 0)
    bounds = mask.getbbox()
    if bounds is None:
        raise ValueError("Sprite crop has no pixels above hard-alpha threshold")
    return bounds


def largest_turquoise_core(image: Image.Image) -> tuple[tuple[int, int, int, int], int] | None:
    rgba = image.convert("RGBA")
    pix = rgba.load()
    width, height = rgba.size
    mask = bytearray(width * height)
    for y in range(height):
        for x in range(width):
            r, g, b, a = pix[x, y]
            if a > HARD_ALPHA and g > 70 and b > 80 and g > r * 1.08 and b > r * 1.08:
                mask[y * width + x] = 1
    visited = bytearray(width * height)
    best = None
    for y in range(height):
        for x in range(width):
            start = y * width + x
            if not mask[start] or visited[start]:
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
                        if mask[neighbor] and not visited[neighbor]:
                            visited[neighbor] = 1
                            stack.append(neighbor)
            candidate = ((x0, y0, x1 + 1, y1 + 1), count)
            if best is None or count > best[1]:
                best = candidate
    if best is None or best[1] < 100:
        return None
    return best


def load_sources() -> list[tuple[str, Path, str, Image.Image, tuple[int, int, int, int], tuple[int, int, int, int] | None]]:
    if not WALK_FIX.is_file():
        raise FileNotFoundError(f"Accepted walk0 edit source is missing: {WALK_FIX}")
    result = []
    for group, path, label in FRAME_SOURCES:
        if not path.is_file():
            raise FileNotFoundError(path)
        with Image.open(path) as opened:
            if opened.mode != "RGBA":
                raise ValueError(f"Expected RGBA source: {path} ({opened.mode})")
            image = opened.copy()
        bounds = hard_bounds(image)
        core = largest_turquoise_core(image)
        result.append((group, path, label, image, bounds, core[0] if core else None))
    return result


def common_group_scales(sources):
    # The targeted walk edit was rendered on its own square canvas. Other walk
    # frames preserve the accepted group's shared source scale; only the edited
    # pose is normalized by its measured core height to match that same anchor.
    samples: dict[str, list[int]] = {name: [] for name in ("idle", "walk", "attack", "hurt", "dead")}
    for group, path, label, image, bounds, core in sources:
        if core is None:
            continue
        if group == "walk" and path == WALK_FIX:
            continue
        samples[group].append(core[3] - core[1])
    scales = {}
    for group, heights in samples.items():
        if not heights:
            raise ValueError(f"No turquoise chest-core measurements for {group}")
        scales[group] = TARGET_CORE_HEIGHT / statistics.median(heights)
    return scales, samples


def make_cell(source, scale: float, index: int):
    group, path, label, original, bounds, core = source
    if group == "walk" and path == WALK_FIX:
        # Save a mechanical crop of the accepted edited raw, preserving every
        # RGBA sample in the rectangle; it is not redrawn or cleaned.
        x0, y0, x1, y1 = bounds
        crop_box = (max(0, x0 - PADDING), max(0, y0 - PADDING), min(original.width, x1 + PADDING), min(original.height, y1 + BOTTOM_PADDING))
        cropped = original.crop(crop_box)
        cropped.save(SOURCE_DIR_WALK_EDIT_CROP, format="PNG", optimize=True)
        actual_core_height = (core[3] - core[1]) if core else None
        if not actual_core_height:
            raise ValueError("Edited walk0 chest core could not be measured")
        scale = TARGET_CORE_HEIGHT / actual_core_height
        source_bounds = list(bounds)
    else:
        x0, y0, x1, y1 = bounds
        crop_box = (max(0, x0 - PADDING), max(0, y0 - PADDING), min(original.width, x1 + PADDING), min(original.height, y1 + BOTTOM_PADDING))
        cropped = original.crop(crop_box)
        source_bounds = list(bounds)

    scaled = cropped.resize((max(1, round(cropped.width * scale)), max(1, round(cropped.height * scale))), Image.Resampling.NEAREST)
    hard = hard_bounds(scaled)
    hard_width, hard_height = hard[2] - hard[0], hard[3] - hard[1]
    left = (CELL - hard_width) // 2 - hard[0]
    top = BASELINE - hard[3]
    if left < 0 or top < 0 or left + scaled.width > CELL or top + scaled.height > CELL:
        raise ValueError(f"Frame {index} {label} does not fit: scaled={scaled.size}, hard={hard}, scale={scale}")
    cell = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    cell.alpha_composite(scaled, (left, top))
    core_cell = None
    if core is not None:
        cx = (core[0] + core[2]) / 2
        cy = (core[1] + core[3]) / 2
        local_crop_x = (core[0] - crop_box[0] + core[2] - crop_box[0]) / 2
        local_crop_y = (core[1] - crop_box[1] + core[3] - crop_box[1]) / 2
        # Report the core's resulting cell bounds, using the same nearest transform.
        core_cell = [
            left + round((core[0] - crop_box[0]) * scale),
            top + round((core[1] - crop_box[1]) * scale),
            left + round((core[2] - crop_box[0]) * scale),
            top + round((core[3] - crop_box[1]) * scale),
        ]
    return cell, {
        "index": index,
        "frame": label,
        "state": group,
        "source": path.relative_to(ROOT).as_posix() if path.is_relative_to(ROOT) else str(path),
        "source_sha256": sha256(path),
        "source_size": list(original.size),
        "hard_alpha_threshold": HARD_ALPHA,
        "source_hard_bounds": source_bounds,
        "mechanical_crop_bounds": list(crop_box),
        "mechanical_crop_size": list(cropped.size),
        "uniform_nearest_scale": scale,
        "core_source_bounds": list(core) if core else None,
        "core_bounds_in_cell": core_cell,
        "hard_bounds_in_cell": [left + hard[0], top + hard[1], left + hard[2], top + hard[3]],
        "hard_size_in_cell": [hard_width, hard_height],
        "baseline_y": top + hard[3],
        "cell_size": [CELL, CELL],
    }


SOURCE_DIR_WALK_EDIT_CROP = SOURCE / "sunwell-sentinel-walk-pose-0-edited-crop-v1.png"


def main():
    sources = load_sources()
    scales, core_samples = common_group_scales(sources)
    atlas = Image.new("RGBA", (CELL * 4, CELL * 4), (0, 0, 0, 0))
    cells = []
    reports = []
    for index, source in enumerate(sources):
        group = source[0]
        cell, report = make_cell(source, scales[group], index)
        atlas.alpha_composite(cell, ((index % 4) * CELL, (index // 4) * CELL))
        cells.append(cell)
        reports.append(report)

    RUNTIME.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(RUNTIME, format="PNG", optimize=True)
    preview96 = SOURCE / "sunwell-sentinel-atlas-preview-96px-v1.png"
    atlas.save(preview96, format="PNG", optimize=True)

    display = Image.new("RGBA", (CELL * 8, CELL * 8), (0, 0, 0, 0))
    board192 = Image.new("RGBA", (CELL * 8, CELL * 8), (0, 0, 0, 0))
    sky = Image.open(SKY).convert("RGB")
    sx, sy = SKY_ORIGIN
    sky_patch = sky.crop((sx, sy, sx + DISPLAY, sy + DISPLAY)).convert("RGBA")
    if sky_patch.size != (DISPLAY, DISPLAY):
        raise ValueError("Sunwell sky preview patch is missing or too small")
    for index, cell in enumerate(cells):
        x, y = (index % 4) * DISPLAY, (index // 4) * DISPLAY
        doubled = cell.resize((DISPLAY, DISPLAY), Image.Resampling.NEAREST)
        display.alpha_composite(doubled, (x, y))
        bg = sky_patch.copy()
        bg.alpha_composite(doubled)
        board192.alpha_composite(bg, (x, y))
    display.save(SOURCE / "sunwell-sentinel-atlas-preview-192px-v1.png", format="PNG", optimize=True)
    board192.convert("RGB").save(SOURCE / "sunwell-sentinel-atlas-preview-192px-sky-v1.png", format="PNG", optimize=True)

    runtime_sha = sha256(RUNTIME)
    report = {
        "runtime_asset": RUNTIME.relative_to(ROOT).as_posix(),
        "runtime_sha256": runtime_sha,
        "atlas_size": list(atlas.size),
        "mode": atlas.mode,
        "alpha_extrema": list(atlas.getchannel("A").getextrema()),
        "cell_size": [CELL, CELL],
        "display_size": [DISPLAY, DISPLAY],
        "pivot": [0.5, 1.0],
        "baseline_y": BASELINE,
        "logic_collision": [72, 84],
        "target_core_height_px": TARGET_CORE_HEIGHT,
        "group_core_source_heights": core_samples,
        "group_scales": scales,
        "animation_contract": {
            "idle": {"frames": [0, 1], "frame_ms": 200, "loop": True},
            "walk": {"frames": [2, 3, 4, 5], "frame_ms": 120, "loop": True},
            "attack": {"frames": [6, 7, 8, 9], "loop": False, "warn_ms": 900, "active_ms": 100, "recovery_ms": 850},
            "hurt": {"frames": [10, 11], "frame_ms": 100, "loop": False},
            "dead": {"frames": [12, 13, 14, 15], "frame_ms": 100, "loop": False},
        },
        "previews": {
            "96px": preview96.relative_to(ROOT).as_posix(),
            "192px": (SOURCE / "sunwell-sentinel-atlas-preview-192px-v1.png").relative_to(ROOT).as_posix(),
            "192px_sunwell_sky": (SOURCE / "sunwell-sentinel-atlas-preview-192px-sky-v1.png").relative_to(ROOT).as_posix(),
        },
        "frames": reports,
    }
    report_path = SOURCE / "sunwell-sentinel-atlas-build-report-v1.json"
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    (SOURCE / "sunwell-sentinel-atlas-source-v1.md").write_text(render_notes(report), encoding="utf-8")
    print(json.dumps({"runtime": str(RUNTIME), "sha256": runtime_sha, "size": atlas.size, "alpha": list(atlas.getchannel("A").getextrema()), "group_scales": scales, "core_samples": core_samples, "frames": [{"index": r["index"], "frame": r["frame"], "scale": r["uniform_nearest_scale"], "hard_size_in_cell": r["hard_size_in_cell"], "core_bounds_in_cell": r["core_bounds_in_cell"]} for r in reports], "previews": report["previews"]}, indent=2))


def render_notes(report):
    frame_lines = []
    for row in report["frames"]:
        frame_lines.append(f"| {row['index']} | {row['state']} | {row['frame']} | `{row['source']}` | {row['uniform_nearest_scale']:.9f} | {row['hard_size_in_cell'][0]}×{row['hard_size_in_cell'][1]} | {row['source_sha256']} |")
    lines = [
        "# Sunwell Sentinel final atlas source v1",
        "",
        "All actor source groups use built-in ImageGen and retain their original raw images and exact prompts in this folder or the linked attack/walk-fix packages. This export only takes rectangular RGBA crops, uniformly resizes with nearest-neighbor sampling, and places each frame in a transparent cell. It does not redraw, recolor, erase, or clean pixels.",
        "",
        f"- Runtime output: `{report['runtime_asset']}` (384×384 RGBA, 4×4 96×96 cells), SHA-256 `{report['runtime_sha256']}`.",
        f"- Game display: 192×192 per cell; pivot {report['pivot']}; baseline y={report['baseline_y']}; logic collision {report['logic_collision'][0]}×{report['logic_collision'][1]}.",
        f"- Pose groups are scaled by a shared chest-core height target of {report['target_core_height_px']} source-inspection pixels. Walk0 uses its accepted targeted-edit source and is normalized by its measured core height to match the generated walk group.",
        "- The turquoise color mask is used only to measure the core and determine common scale. The crop includes original RGBA values unchanged.",
        "",
        "## Locked row-major frame contract",
        "",
        "| Cell | State | Pose | Source | Scale | Hard silhouette in cell | Source SHA-256 |",
        "|---:|---|---|---|---:|---:|---|",
        *frame_lines,
        "",
        "- Idle: cells 0–1, 200 ms each, looping.",
        "- Walk: cells 2–5, 120 ms each, looping.",
        "- Attack: cells 6–9, non-looping; 900 ms warning, 100 ms active, 850 ms recovery. The four images are low wind-up, fists raised, low smash, recovery.",
        "- Hurt: cells 10–11, 100 ms each, non-looping.",
        "- Dead: cells 12–15, 100 ms each, non-looping.",
        "",
        "The 96px overview is the final runtime atlas itself. The 192px previews double each cell by nearest-neighbor scaling; the sky-backed board is a visual review only and is not part of the runtime sprite.",
        "",
    ]
    return "\n".join(lines)


if __name__ == "__main__":
    main()
