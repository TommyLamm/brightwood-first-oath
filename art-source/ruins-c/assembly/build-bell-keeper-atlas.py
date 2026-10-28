from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[3]
ART = ROOT / "art-source" / "ruins-c"
ASSET_DIR = ROOT / "public" / "assets" / "actors"
OUTPUT_ATLAS = ASSET_DIR / "monster-ruins-bell-keeper-v1.png"
OUTPUT_REVIEW = ART / "assembly" / "review" / "ruins-bell-keeper-atlas-contact.jpg"
OUTPUT_DETAIL_REVIEW = ART / "assembly" / "review" / "ruins-bell-keeper-key-poses.jpg"
OUTPUT_METADATA = ART / "assembly" / "metadata" / "ruins-bell-keeper-atlas.json"
ACTOR_MANIFEST = ASSET_DIR / "manifest.json"

PROFILE_META_PATH = ART / "profiles" / "metadata" / "ruins-c-bell-keeper-profiles.json"
MOTION_META_PATH = ART / "motion-frames" / "metadata" / "accepted-frames.json"
SLAM_META_PATH = ART / "slam-hurt-frames" / "metadata" / "ruins-c-bell-keeper-slam-hurt-frames.json"
SWEEP_META_PATH = ART / "sweep-dead-frames" / "metadata" / "ruins-c-sweep-dead-frames.json"

CELL_SIZE = 192
COLUMNS = 6
ROWS = 5
ATLAS_SIZE = (CELL_SIZE * COLUMNS, CELL_SIZE * ROWS)
NEUTRAL = (58, 58, 58)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def pixel_sha(image: Image.Image) -> str:
    return hashlib.sha256(image.tobytes()).hexdigest()


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def resolve_source(value: str, base: Path | None = None) -> Path:
    """Resolve metadata paths both as workspace-relative and recorded Windows paths."""
    candidate = Path(value)
    if candidate.is_absolute() and candidate.exists():
        return candidate
    normalized = value.replace("/", "\\")
    marker = "art-source\\ruins-c\\"
    if marker in normalized:
        tail = normalized.split(marker, 1)[1]
        return ART / Path(tail.replace("\\", "/"))
    if base is not None:
        return base / Path(value.replace("\\", "/"))
    return ROOT / Path(value.replace("\\", "/"))


def rel(path: Path) -> str:
    return path.resolve().relative_to(ROOT.resolve()).as_posix()


def profile_record(data: dict[str, Any], key: str, metadata_path: Path) -> dict[str, Any]:
    item = next(record for record in data["artifacts"] if record["key"] == key)
    return {
        "pose": key,
        "raw_path": rel(resolve_source(item["raw_path"])),
        "raw_sha256": item["raw_sha256"].lower(),
        "normalized_path": rel(resolve_source(item["normalized_path"])),
        "normalized_sha256": item["normalized_sha256"].lower(),
        "metadata_path": rel(metadata_path),
        "image_result_item_id": item.get("image_result_item_id"),
        "outer_functions_exec_call_id": item.get("outer_functions_exec_call_id"),
        "saved_path": item.get("saved_path"),
        "source_kind": "shared profile reference",
    }


def motion_record(data: dict[str, Any], key: str, metadata_path: Path) -> dict[str, Any]:
    item = next(record for record in data["acceptedFrames"] if record["frameId"].endswith(key))
    return {
        "pose": key,
        "raw_path": item["rawPath"],
        "raw_sha256": item["rawSha256"].lower(),
        "normalized_path": item["normalizedPath"],
        "normalized_sha256": item["normalizedSha256"].lower(),
        "metadata_path": rel(metadata_path),
        "image_result_item_id": item.get("imageResultItemId"),
        "outer_functions_exec_call_id": item.get("outerFunctionsExecCallId"),
        "saved_path": item.get("savedPath"),
        "candidate": item.get("candidate"),
        "session_id": item.get("sessionId"),
        "source_kind": "accepted motion frame",
    }


def action_record(data: dict[str, Any], key: str, metadata_path: Path) -> dict[str, Any]:
    item = next(record for record in data["artifacts"] if record["key"] == key)
    return {
        "pose": key,
        "raw_path": rel(resolve_source(item["raw_path"], ART / "slam-hurt-frames")),
        "raw_sha256": item["raw_sha256"].lower(),
        "normalized_path": rel(resolve_source(item["normalized_path"], ART / "slam-hurt-frames")),
        "normalized_sha256": item["normalized_sha256"].lower(),
        "metadata_path": rel(metadata_path),
        "image_result_item_id": item.get("image_result_item_id"),
        "outer_functions_exec_call_id": item.get("outer_functions_exec_call_id"),
        "saved_path": item.get("saved_path"),
        "source_kind": "accepted action frame",
    }


def sweep_record(data: dict[str, Any], key: str, metadata_path: Path) -> dict[str, Any]:
    item = next(record for record in data["artifacts"] if record["key"] == key)
    return {
        "pose": key,
        "raw_path": rel(resolve_source(item["workspace_raw_path"], ART / "sweep-dead-frames")),
        "raw_sha256": item["raw_sha256"].lower(),
        "normalized_path": rel(resolve_source(item["normalized_path"], ART / "sweep-dead-frames")),
        "normalized_sha256": item["normalized_sha256"].lower(),
        "metadata_path": rel(metadata_path),
        "image_result_item_id": item.get("item_id"),
        "outer_functions_exec_call_id": item.get("outer_functions_exec_call_id"),
        "saved_path": item.get("saved_path"),
        "source_kind": "accepted sweep/death frame",
    }


def source_map() -> dict[int, dict[str, Any]]:
    profile_meta = read_json(PROFILE_META_PATH)
    motion_meta = read_json(MOTION_META_PATH)
    slam_meta = read_json(SLAM_META_PATH)
    sweep_meta = read_json(SWEEP_META_PATH)

    selected: dict[int, dict[str, Any]] = {
        0: profile_record(profile_meta, "idle-0", PROFILE_META_PATH),
        1: motion_record(motion_meta, "idle-1", MOTION_META_PATH),
        2: sweep_record(sweep_meta, "sweep-windup-0", SWEEP_META_PATH),
        3: sweep_record(sweep_meta, "sweep-windup-1", SWEEP_META_PATH),
        4: profile_record(profile_meta, "sweep-active", PROFILE_META_PATH),
        5: sweep_record(sweep_meta, "sweep-recovery", SWEEP_META_PATH),
        12: action_record(slam_meta, "slam-windup-0", SLAM_META_PATH),
        13: action_record(slam_meta, "slam-windup-1", SLAM_META_PATH),
        14: profile_record(profile_meta, "slam-active", PROFILE_META_PATH),
        15: action_record(slam_meta, "slam-recovery", SLAM_META_PATH),
        18: action_record(slam_meta, "hurt-0", SLAM_META_PATH),
        19: action_record(slam_meta, "hurt-1", SLAM_META_PATH),
        24: sweep_record(sweep_meta, "dead-0", SWEEP_META_PATH),
        25: sweep_record(sweep_meta, "dead-1", SWEEP_META_PATH),
        26: sweep_record(sweep_meta, "dead-2", SWEEP_META_PATH),
        27: sweep_record(sweep_meta, "dead-3", SWEEP_META_PATH),
    }
    for walk_index in range(6):
        cell = 6 + walk_index
        selected[cell] = motion_record(motion_meta, f"walk-{walk_index}", MOTION_META_PATH)
    return selected


def inspect_source(cell: int, record: dict[str, Any]) -> tuple[Image.Image, dict[str, Any]]:
    raw_path = resolve_source(record["raw_path"])
    normalized_path = resolve_source(record["normalized_path"])
    if not raw_path.is_file() or not normalized_path.is_file():
        raise FileNotFoundError(f"cell {cell}: source path missing: {raw_path} / {normalized_path}")
    actual_raw_hash = sha256(raw_path)
    actual_normalized_hash = sha256(normalized_path)
    if actual_raw_hash != record["raw_sha256"]:
        raise ValueError(f"cell {cell}: raw SHA mismatch for {rel(raw_path)}: {actual_raw_hash}")
    if actual_normalized_hash != record["normalized_sha256"]:
        raise ValueError(f"cell {cell}: normalized SHA mismatch for {rel(normalized_path)}: {actual_normalized_hash}")

    with Image.open(raw_path) as raw_image:
        if raw_image.mode != "RGBA":
            raise ValueError(f"cell {cell}: raw source mode is {raw_image.mode}, expected RGBA")
        raw_dimensions = list(raw_image.size)
    with Image.open(normalized_path) as source:
        if source.mode != "RGBA" or source.size != (CELL_SIZE, CELL_SIZE):
            raise ValueError(f"cell {cell}: normalized source must be 192x192 RGBA; got {source.size} {source.mode}")
        image = source.copy()

    alpha = image.getchannel("A")
    bounds = alpha.getbbox()
    if bounds is None:
        raise ValueError(f"cell {cell}: source has no visible pixels")
    left, top, right, bottom = bounds
    source_center_x = (left + right - 1) / 2
    source_margins = {"left": left, "top": top, "right": CELL_SIZE - right, "bottom": CELL_SIZE - bottom}
    source_bounds = list(bounds)
    adjustment = None
    if abs(source_center_x - 96) > 0.5:
        # walk-3 is the one accepted source whose alpha bbox is one pixel left
        # of the shared pivot. Keep its canonical normalized file untouched and
        # make a separately recorded assembly copy with a transparent 1px nudge.
        if cell != 9 or source_center_x != 95.0:
            raise ValueError(f"cell {cell}: alpha bounds center {source_center_x} does not anchor at x=96")
        image = Image.new("RGBA", (CELL_SIZE, CELL_SIZE), (0, 0, 0, 0))
        with Image.open(normalized_path) as source:
            image.paste(source.convert("RGBA"), (1, 0))
        adjusted_path = ART / "assembly" / "adjusted" / "ruins-bell-keeper-walk-3-center96.png"
        adjusted_path.parent.mkdir(parents=True, exist_ok=True)
        image.save(adjusted_path, format="PNG", optimize=True, compress_level=9)
        adjustment = {
            "path": rel(adjusted_path),
            "sha256": sha256(adjusted_path),
            "size_bytes": adjusted_path.stat().st_size,
            "translation_px": [1, 0],
            "reason": "canonical walk-3 alpha bbox center is x=95.0; a transparent-safe 1px right shift aligns it to the required x=96 pivot",
            "canonical_source_unchanged": True,
        }

    atlas_bounds = image.getchannel("A").getbbox()
    if atlas_bounds is None:
        raise ValueError(f"cell {cell}: adjusted source has no visible pixels")
    left, top, right, bottom = atlas_bounds
    center_x = (left + right - 1) / 2
    nearest_anchor_x = math.floor(center_x + 0.5)
    margins = {"left": left, "top": top, "right": CELL_SIZE - right, "bottom": CELL_SIZE - bottom}
    if abs(center_x - 96) > 0.5 or nearest_anchor_x != 96:
        raise ValueError(f"cell {cell}: atlas alpha bounds center {center_x} does not anchor at x=96")
    if bottom - 1 != 188:
        raise ValueError(f"cell {cell}: last alpha row is {bottom - 1}, expected 188")
    if min(margins.values()) < 3:
        raise ValueError(f"cell {cell}: transparent margins are below 3px: {margins}")

    return image, {
        "raw_size_bytes": raw_path.stat().st_size,
        "raw_dimensions": raw_dimensions,
        "raw_mode": "RGBA",
        "normalized_size_bytes": normalized_path.stat().st_size,
        "normalized_dimensions": [CELL_SIZE, CELL_SIZE],
        "normalized_mode": "RGBA",
        "source_alpha_bounds": source_bounds,
        "source_alpha_center_x": source_center_x,
        "source_transparent_margins_ltrb": source_margins,
        "assembly_alpha_bounds": list(atlas_bounds),
        "assembly_alpha_center_x": center_x,
        "nearest_pivot_pixel_x": nearest_anchor_x,
        "assembly_transparent_margins_ltrb": margins,
        "assembly_adjustment": adjustment,
    }


def animation_entries() -> list[dict[str, Any]]:
    prefix = "ruins-bell-keeper:"
    return [
        {"key": prefix + "idle", "imageKey": "actor:ruins-bell-keeper", "frames": [0, 1], "frameMs": [200, 200], "loop": True},
        {"key": prefix + "attack-sweep", "imageKey": "actor:ruins-bell-keeper", "frames": [2, 3, 4, 5], "frameMs": [600, 600, 100, 1000], "loop": False},
        {"key": prefix + "walk", "imageKey": "actor:ruins-bell-keeper", "frames": [6, 7, 8, 9, 10, 11], "frameMs": [120] * 6, "loop": True},
        {"key": prefix + "attack", "imageKey": "actor:ruins-bell-keeper", "frames": [12, 13, 14, 15], "frameMs": [450, 450, 100, 1000], "loop": False},
        {"key": prefix + "hurt", "imageKey": "actor:ruins-bell-keeper", "frames": [18, 19], "frameMs": [100, 100], "loop": False},
        {"key": prefix + "dead", "imageKey": "actor:ruins-bell-keeper", "frames": [24, 25, 26, 27], "frameMs": [100] * 4, "loop": False},
    ]


def insert_array_item_preserving_text(text: str, array_name: str, item: dict[str, Any]) -> str:
    marker = f'  "{array_name}": ['
    start = text.find(marker)
    if start < 0:
        raise ValueError(f"manifest has no {array_name} array")
    bracket = text.find("[", start)
    depth = 0
    in_string = False
    escaped = False
    end = -1
    for index in range(bracket, len(text)):
        char = text[index]
        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            continue
        if char == '"':
            in_string = True
        elif char == "[":
            depth += 1
        elif char == "]":
            depth -= 1
            if depth == 0:
                end = index
                break
    if end < 0:
        raise ValueError(f"cannot find end of {array_name} array")

    body = text[bracket + 1:end]
    if not body.strip():
        insertion = "\n" + "\n".join("    " + line for line in json.dumps(item, ensure_ascii=False, indent=2).splitlines()) + "\n  "
        return text[:bracket + 1] + insertion + text[end:]
    # The arrays in this manifest use a newline before their closing bracket.
    last_content_end = len(body.rstrip())
    if last_content_end == 0 or body.rstrip()[-1] != "}":
        raise ValueError(f"unexpected trailing structure in {array_name} array")
    formatted = "\n".join("    " + line for line in json.dumps(item, ensure_ascii=False, indent=2).splitlines())
    updated_body = body[:last_content_end] + ",\n" + formatted + body[last_content_end:]
    return text[:bracket + 1] + updated_body + text[end:]


def append_manifest(image_entry: dict[str, Any], animations: list[dict[str, Any]]) -> dict[str, Any]:
    original_bytes = ACTOR_MANIFEST.read_bytes()
    original_text = original_bytes.decode("utf-8-sig")
    original = json.loads(original_text)
    image_keys = {item["key"] for item in original["images"]}
    animation_keys = {item["key"] for item in original["animations"]}
    appended_present = image_entry["key"] in image_keys or any(item["key"] in animation_keys for item in animations)
    if appended_present:
        if original["images"][-1:] != [image_entry] or original["animations"][-len(animations):] != animations:
            raise ValueError("actors manifest contains a partial or changed boss append; refusing to rewrite it")
        if sum(item["key"] == image_entry["key"] for item in original["images"]) != 1:
            raise ValueError("actors manifest contains duplicate boss image keys")
        if any(sum(entry["key"] == item["key"] for entry in original["animations"]) != 1 for item in animations):
            raise ValueError("actors manifest contains duplicate boss animation keys")
        previous = read_json(OUTPUT_METADATA) if OUTPUT_METADATA.is_file() else {}
        previous_manifest = previous.get("manifest", {})
        if previous_manifest.get("appended_image") != image_entry or previous_manifest.get("appended_animations") != animations:
            raise ValueError("existing boss append is present, but its original assembly metadata is unavailable")
        result = dict(previous_manifest)
        result["sha256_after"] = hashlib.sha256(original_bytes).hexdigest()
        result["old_entries_preserved_exactly"] = True
        return result

    text = original_text
    text = insert_array_item_preserving_text(text, "images", image_entry)
    for animation in animations:
        text = insert_array_item_preserving_text(text, "animations", animation)
    updated = json.loads(text)
    if updated["images"][:len(original["images"])] != original["images"]:
        raise AssertionError("existing actor image entries changed")
    if updated["animations"][:len(original["animations"])] != original["animations"]:
        raise AssertionError("existing actor animation entries changed")
    if updated["images"][len(original["images"]):] != [image_entry]:
        raise AssertionError("image append does not match the requested boss entry")
    if updated["animations"][len(original["animations"]):] != animations:
        raise AssertionError("animation append does not match the requested six entries")
    ACTOR_MANIFEST.write_bytes(text.encode("utf-8"))
    return {
        "sha256_before": hashlib.sha256(original_bytes).hexdigest(),
        "sha256_after": sha256(ACTOR_MANIFEST),
        "old_image_count": len(original["images"]),
        "new_image_count": len(updated["images"]),
        "old_animation_count": len(original["animations"]),
        "new_animation_count": len(updated["animations"]),
        "old_entries_preserved_exactly": True,
        "appended_image": image_entry,
        "appended_animations": animations,
    }


def make_review(atlas: Image.Image, source_map_by_cell: dict[int, dict[str, Any]], unused_copies: dict[int, int]) -> dict[str, Any]:
    OUTPUT_REVIEW.parent.mkdir(parents=True, exist_ok=True)
    review = Image.new("RGB", ATLAS_SIZE, NEUTRAL)
    draw = ImageDraw.Draw(review)
    font = ImageFont.load_default()
    for cell in range(COLUMNS * ROWS):
        x = (cell % COLUMNS) * CELL_SIZE
        y = (cell // COLUMNS) * CELL_SIZE
        rgb_cell = Image.new("RGB", (CELL_SIZE, CELL_SIZE), NEUTRAL)
        rgb_cell.paste(atlas.crop((x, y, x + CELL_SIZE, y + CELL_SIZE)), mask=atlas.crop((x, y, x + CELL_SIZE, y + CELL_SIZE)).getchannel("A"))
        review.paste(rgb_cell, (x, y))
        name = source_map_by_cell[cell]["pose"] if cell in source_map_by_cell else f"copy-of-{unused_copies[cell]}"
        label = f"{cell:02d} {name}"
        label_bounds = draw.textbbox((0, 0), label, font=font)
        label_w = min(CELL_SIZE - 8, label_bounds[2] - label_bounds[0] + 6)
        label_h = label_bounds[3] - label_bounds[1] + 4
        draw.rectangle((x + 2, y + 2, x + 2 + label_w, y + 2 + label_h), fill=(30, 34, 38))
        draw.text((x + 5, y + 3), label, fill=(245, 245, 245), font=font)
    for col in range(1, COLUMNS):
        draw.line((col * CELL_SIZE, 0, col * CELL_SIZE, ATLAS_SIZE[1]), fill=(96, 96, 96), width=1)
    for row in range(1, ROWS):
        draw.line((0, row * CELL_SIZE, ATLAS_SIZE[0], row * CELL_SIZE), fill=(96, 96, 96), width=1)
    review.save(OUTPUT_REVIEW, format="JPEG", quality=70, optimize=True, progressive=True)

    detail = Image.new("RGB", (768, 768), NEUTRAL)
    detail_draw = ImageDraw.Draw(detail)
    key_poses = [(0, "idle-0"), (12, "slam-windup-0"), (4, "sweep-active"), (14, "slam-active")]
    for index, (cell, label) in enumerate(key_poses):
        x0 = (cell % COLUMNS) * CELL_SIZE
        y0 = (cell // COLUMNS) * CELL_SIZE
        rgba_cell = atlas.crop((x0, y0, x0 + CELL_SIZE, y0 + CELL_SIZE))
        rgb_cell = Image.new("RGB", (CELL_SIZE, CELL_SIZE), NEUTRAL)
        rgb_cell.paste(rgba_cell, mask=rgba_cell.getchannel("A"))
        rgb_cell = rgb_cell.resize((384, 384), Image.Resampling.NEAREST)
        x = (index % 2) * 384
        y = (index // 2) * 384
        detail.paste(rgb_cell, (x, y))
        detail_draw.rectangle((x + 3, y + 3, x + 112, y + 21), fill=(30, 34, 38))
        detail_draw.text((x + 7, y + 5), f"{cell:02d} {label}", fill=(245, 245, 245), font=font)
    detail.save(OUTPUT_DETAIL_REVIEW, format="JPEG", quality=70, optimize=True, progressive=True)
    return {
        "supplemental": {
            "path": rel(OUTPUT_DETAIL_REVIEW),
            "dimensions": [768, 768],
            "format": "JPEG",
            "quality": 70,
            "background_rgb": list(NEUTRAL),
            "pose_cells": [0, 12, 4, 14],
            "size_bytes": OUTPUT_DETAIL_REVIEW.stat().st_size,
            "sha256": sha256(OUTPUT_DETAIL_REVIEW),
        },
        "size_bytes": OUTPUT_REVIEW.stat().st_size,
        "sha256": sha256(OUTPUT_REVIEW),
    }


def main() -> None:
    selected = source_map()
    expected_valid_cells = set(range(16)) | {18, 19} | {24, 25, 26, 27}
    if set(selected) != expected_valid_cells or len(selected) != 22:
        raise AssertionError(f"expected 22 approved pose cells, got {sorted(selected)}")

    atlas = Image.new("RGBA", ATLAS_SIZE, (0, 0, 0, 0))
    details: dict[int, dict[str, Any]] = {}
    decoded_sources: dict[int, Image.Image] = {}
    for cell, record in selected.items():
        image, source_details = inspect_source(cell, record)
        decoded_sources[cell] = image
        details[cell] = {**record, **source_details}
        atlas.paste(image, ((cell % COLUMNS) * CELL_SIZE, (cell // COLUMNS) * CELL_SIZE))

    unused_copies = {16: 15, 17: 15, 20: 19, 21: 19, 22: 19, 23: 19, 28: 27, 29: 27}
    for cell, source_cell in unused_copies.items():
        src_x = (source_cell % COLUMNS) * CELL_SIZE
        src_y = (source_cell // COLUMNS) * CELL_SIZE
        tile = atlas.crop((src_x, src_y, src_x + CELL_SIZE, src_y + CELL_SIZE))
        atlas.paste(tile, ((cell % COLUMNS) * CELL_SIZE, (cell // COLUMNS) * CELL_SIZE))

    frame_hashes: dict[int, str] = {}
    for cell in range(COLUMNS * ROWS):
        x = (cell % COLUMNS) * CELL_SIZE
        y = (cell // COLUMNS) * CELL_SIZE
        tile = atlas.crop((x, y, x + CELL_SIZE, y + CELL_SIZE))
        frame_hashes[cell] = pixel_sha(tile)
        if cell in selected and tile.tobytes() != decoded_sources[cell].tobytes():
            raise AssertionError(f"cell {cell} changed pixels while packing")
    for cell, source_cell in unused_copies.items():
        if frame_hashes[cell] != frame_hashes[source_cell]:
            raise AssertionError(f"unused cell {cell} does not exactly copy cell {source_cell}")
    if len({frame_hashes[cell] for cell in expected_valid_cells}) != 22:
        raise AssertionError("approved pose cells are not all pixel-distinct")

    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_ATLAS.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(OUTPUT_ATLAS, format="PNG", optimize=True, compress_level=9)
    with Image.open(OUTPUT_ATLAS) as written:
        if written.mode != "RGBA" or written.size != ATLAS_SIZE or written.tobytes() != atlas.tobytes():
            raise AssertionError("written atlas failed the pixel-exact round trip")

    animations = animation_entries()
    image_entry = {
        "key": "actor:ruins-bell-keeper",
        "url": "assets/actors/monster-ruins-bell-keeper-v1.png",
        "columns": COLUMNS,
        "rows": ROWS,
        "displayWidth": CELL_SIZE,
        "displayHeight": CELL_SIZE,
        "pivotX": 0.5,
        "pivotY": 1,
    }
    manifest_details = append_manifest(image_entry, animations)
    review_details = make_review(atlas, selected, unused_copies)

    cell_metadata = []
    for cell in range(COLUMNS * ROWS):
        base = details[cell] if cell in details else {
            "pose": f"unused-copy-of-{unused_copies[cell]}",
            "raw_path": None,
            "raw_sha256": None,
            "normalized_path": None,
            "normalized_sha256": None,
            "metadata_path": None,
            "source_kind": "exact pixel copy of another atlas cell",
        }
        cell_metadata.append({
            "cell": cell,
            "row": cell // COLUMNS,
            "column": cell % COLUMNS,
            **base,
            "atlas_cell_pixel_sha256": frame_hashes[cell],
            "copied_from_cell": unused_copies.get(cell),
        })

    # The 10 companion files are the exact runtime files listed in the scene/audio handoff.
    companion_assets = [
        ROOT / "public/assets/environment/env-ruins-sanctum-sky-v1.png",
        ROOT / "public/assets/environment/env-ruins-sanctum-far-v1.png",
        ROOT / "public/assets/environment/env-ruins-sanctum-mid-v1.png",
        ROOT / "public/assets/interface/item-oathfarer-circlet-v1.png",
        ROOT / "public/assets/actors/equip-oathfarer-circlet-v1.png",
        ROOT / "public/assets/audio/boss-ruins.ogg",
        ROOT / "public/assets/audio/boss-ruins.m4a",
        ROOT / "public/assets/audio/boss-ruins-phase2.ogg",
        ROOT / "public/assets/audio/boss-ruins-phase2.m4a",
        ROOT / "public/assets/audio/oath-bell-restored.wav",
    ]
    companion_bytes = sum(path.stat().st_size for path in companion_assets)
    total_c_bytes = companion_bytes + OUTPUT_ATLAS.stat().st_size
    if total_c_bytes > 9 * 1024 * 1024:
        raise AssertionError(f"C runtime budget exceeded: {total_c_bytes} bytes")

    metadata = {
        "asset": "Ruins C Bell Keeper assembled boss atlas",
        "date": "2026-10-25",
        "plan": "plan/14-ruins-bell-sanctum.md §5, §8, §9",
        "contract": {
            "image_key": image_entry["key"],
            "atlas_path": rel(OUTPUT_ATLAS),
            "atlas_dimensions": list(ATLAS_SIZE),
            "atlas_mode": "RGBA",
            "cell_size": [CELL_SIZE, CELL_SIZE],
            "grid": [COLUMNS, ROWS],
            "display_size": [CELL_SIZE, CELL_SIZE],
            "pivot": [0.5, 1],
            "valid_pose_count": 22,
            "alpha_contract": "each approved source cell is used pixel-exactly; source alpha>0 bounds are centered at x=96 within 0.5px, nearest anchor pixel 96, last row y=188, and at least 3 transparent pixels on each edge",
        },
        "source_metadata": [
            rel(PROFILE_META_PATH),
            rel(MOTION_META_PATH),
            rel(SLAM_META_PATH),
            rel(SWEEP_META_PATH),
        ],
        "atlas_sha256": sha256(OUTPUT_ATLAS),
        "atlas_size_bytes": OUTPUT_ATLAS.stat().st_size,
        "sha256_method": "SHA-256 over exact source/output files; cell pixel SHA-256 over decoded RGBA bytes",
        "cell_mapping": cell_metadata,
        "unused_cells": {str(cell): {"copied_from_cell": source_cell, "pixel_sha256": frame_hashes[cell]} for cell, source_cell in unused_copies.items()},
        "animations": animations,
        "manifest": manifest_details,
        "review": {
            "path": rel(OUTPUT_REVIEW),
            "dimensions": list(ATLAS_SIZE),
            "format": "JPEG",
            "quality": 70,
            "background_rgb": list(NEUTRAL),
            "contains_cell_labels": True,
            "size_bytes": review_details["size_bytes"],
            "sha256": review_details["sha256"],
            "supplemental": review_details["supplemental"],
        },
        "runtime_budget": {
            "companion_asset_count": len(companion_assets),
            "companion_bytes": companion_bytes,
            "atlas_bytes": OUTPUT_ATLAS.stat().st_size,
            "c_runtime_total_bytes": total_c_bytes,
            "limit_bytes": 9 * 1024 * 1024,
        },
    }
    OUTPUT_METADATA.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_METADATA.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps({
        "atlas": rel(OUTPUT_ATLAS),
        "atlas_sha256": metadata["atlas_sha256"],
        "atlas_bytes": metadata["atlas_size_bytes"],
        "metadata": rel(OUTPUT_METADATA),
        "metadata_sha256": sha256(OUTPUT_METADATA),
        "review": rel(OUTPUT_REVIEW),
        "review_dimensions": list(ATLAS_SIZE),
        "valid_pose_count": len(expected_valid_cells),
        "unused_cell_copies": unused_copies,
        "unique_valid_pixel_cells": len({frame_hashes[cell] for cell in expected_valid_cells}),
        "runtime_c_bytes": total_c_bytes,
        "manifest_old_entries_preserved": True,
    }, indent=2))


if __name__ == "__main__":
    main()
