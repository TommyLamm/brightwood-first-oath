#!/usr/bin/env python3
"""Assemble the accepted Ruins B monster poses into 6x5 runtime atlases."""

from __future__ import annotations

import hashlib
import json
import textwrap
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from PIL import Image


ROOT = Path(__file__).resolve().parents[4]
RUINS_B = ROOT / "art-source" / "ruins-b"
ASSEMBLY = RUINS_B / "assembly"
PUBLIC_ACTORS = ROOT / "public" / "assets" / "actors"
MANIFEST_PATH = PUBLIC_ACTORS / "manifest.json"
MATTE = (223, 227, 219)
CELL = 96
ATLAS_SIZE = (CELL * 6, CELL * 5)


@dataclass(frozen=True)
class Source:
    pose: str
    normalized: str
    raw: str
    prompt: str
    metadata: str


def puppet_source(pose: str, group: str, stem: str, raw_suffix: str, meta_suffix: str) -> Source:
    base = f"ruins-string-puppet-{stem}"
    return Source(
        pose=pose,
        normalized=f"{group}/normalized/{base}.png",
        raw=f"{group}/raw/{base}{raw_suffix}",
        prompt=f"{group}/prompts/{base}.txt",
        metadata=f"{group}/metadata/{base}{meta_suffix}",
    )


def prowler_source(pose: str, group: str, stem: str, raw_suffix: str, meta_suffix: str) -> Source:
    base = f"ruins-bell-prowler-{stem}"
    return Source(
        pose=pose,
        normalized=f"{group}/normalized/{base}{raw_suffix if group.endswith('actions') else '.png'}",
        raw=f"{group}/raw/{base}{raw_suffix}",
        prompt=f"{group}/prompts/{base}.txt",
        metadata=f"{group}/metadata/{base}{meta_suffix}",
    )


def make_sources(monster: str) -> list[Source]:
    if monster == "ruins-string-puppet":
        sources = [
            Source("idle-0", "references/normalized/ruins-string-puppet-idle-0.png", "references/raw/ruins-string-puppet-profile-v1.png", "references/prompts/ruins-string-puppet-profile-v1.txt", "references/ruins-string-puppet-profile-v1.metadata.json"),
            puppet_source("idle-1", "puppet-motion", "idle-1", "-v1.png", ".json"),
        ]
        sources.extend(puppet_source(f"walk-{i}", "puppet-motion", f"walk-{i}", "-v1.png", ".json") for i in range(6))
        sources.extend([
            puppet_source("attack-0", "puppet-actions", "attack-0", "-v1.png", ".metadata.json"),
            puppet_source("attack-1", "puppet-actions", "attack-1", "-v1.png", ".metadata.json"),
            Source("attack-2", "references/normalized/ruins-string-puppet-attack-2.png", "references/raw/ruins-string-puppet-attack-2-v1.png", "references/prompts/ruins-string-puppet-attack-2-v1.txt", "references/ruins-string-puppet-attack-2-v1.metadata.json"),
            puppet_source("attack-3", "puppet-actions", "attack-3", "-v1.png", ".metadata.json"),
            puppet_source("hurt-0", "puppet-actions", "hurt-0", "-v1.png", ".metadata.json"),
            puppet_source("hurt-1", "puppet-actions", "hurt-1", "-v1.png", ".metadata.json"),
        ])
        sources.extend(puppet_source(f"dead-{i}", "puppet-actions", f"dead-{i}", "-v1.png", ".metadata.json") for i in range(4))
        return sources

    if monster == "ruins-bell-prowler":
        sources = [
            Source("idle-0", "references/normalized/ruins-bell-prowler-idle-0.png", "references/raw/ruins-bell-prowler-profile-v1.png", "references/prompts/ruins-bell-prowler-profile-v1.txt", "references/ruins-bell-prowler-profile-v1.metadata.json"),
            prowler_source("idle-1", "prowler-motion", "idle-1", ".png", ".metadata.json"),
        ]
        sources.extend(prowler_source(f"walk-{i}", "prowler-motion", f"walk-{i}", ".png", ".metadata.json") for i in range(6))
        sources.extend([
            prowler_source("attack-0", "prowler-actions", "attack-0", "-v1.png", ".metadata.json"),
            prowler_source("attack-1", "prowler-actions", "attack-1", "-v1.png", ".metadata.json"),
            Source("attack-2", "references/normalized/ruins-bell-prowler-attack-2.png", "references/raw/ruins-bell-prowler-attack-2-v2.png", "references/prompts/ruins-bell-prowler-attack-2-v2.txt", "references/ruins-bell-prowler-attack-2-v2.metadata.json"),
            prowler_source("attack-3", "prowler-actions", "attack-3", "-v1.png", ".metadata.json"),
            prowler_source("hurt-0", "prowler-actions", "hurt-0", "-v1.png", ".metadata.json"),
            prowler_source("hurt-1", "prowler-actions", "hurt-1", "-v1.png", ".metadata.json"),
        ])
        sources.extend(prowler_source(f"dead-{i}", "prowler-actions", f"dead-{i}", "-v1.png", ".metadata.json") for i in range(4))
        return sources

    raise ValueError(f"Unknown Ruins B monster: {monster}")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def pixel_sha256(image: Image.Image) -> str:
    return hashlib.sha256(image.tobytes()).hexdigest()


def alpha_bbox(image: Image.Image) -> list[int]:
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError("Frame has no alpha-visible pixels")
    left, top, right_exclusive, bottom_exclusive = bbox
    return [left, top, right_exclusive - 1, bottom_exclusive - 1]


def get_normalized_hash(metadata: dict[str, Any]) -> str:
    for container, key in (("normalized", "outputSha256"), ("normalization", "sha256")):
        value = metadata.get(container)
        if isinstance(value, dict) and isinstance(value.get(key), str):
            return value[key].lower()
    for key in ("outputSha256", "normalizedSha256"):
        if isinstance(metadata.get(key), str):
            return metadata[key].lower()
    raise ValueError("Source metadata does not record its normalized PNG SHA-256")


def get_raw_hash(metadata: dict[str, Any]) -> str:
    for key in ("rawSha256", "rawSHA", "sha256"):
        if isinstance(metadata.get(key), str):
            return metadata[key].lower()
    raise ValueError("Source metadata does not record its raw PNG SHA-256")


def translated(image: Image.Image, dx: int, dy: int) -> Image.Image:
    if dx == 0 and dy == 0:
        return image.copy()
    result = Image.new("RGBA", image.size, (0, 0, 0, 0))
    result.alpha_composite(image, (dx, dy))
    return result


def prepare_frame(monster: str, source: Source) -> tuple[Image.Image, dict[str, Any]]:
    normalized_path = RUINS_B / source.normalized
    raw_path = RUINS_B / source.raw
    prompt_path = RUINS_B / source.prompt
    metadata_path = RUINS_B / source.metadata
    for path in (normalized_path, raw_path, prompt_path, metadata_path):
        if not path.is_file():
            raise FileNotFoundError(f"Mapped source file is missing: {path.relative_to(ROOT)}")

    source_meta: dict[str, Any] = json.loads(metadata_path.read_text(encoding="utf-8"))
    recorded_id = source_meta.get("frameId", source_meta.get("frameID"))
    expected_id = f"{monster}:{source.pose}"
    if recorded_id != expected_id:
        raise ValueError(f"Metadata frame ID mismatch for {source.pose}: {recorded_id!r} != {expected_id!r}")
    if not (source_meta.get("accepted") is True or source_meta.get("status") == "accepted"):
        raise ValueError(f"Source pose is not explicitly accepted: {expected_id}")
    prompt_text = prompt_path.read_text(encoding="utf-8")
    recorded_prompt = source_meta.get("submittedPrompt")
    if isinstance(recorded_prompt, str) and recorded_prompt.strip() != prompt_text.strip():
        raise ValueError(f"Prompt file differs from accepted metadata: {source.prompt}")

    raw_hash = sha256(raw_path)
    normalized_hash = sha256(normalized_path)
    if raw_hash != get_raw_hash(source_meta):
        raise ValueError(f"Raw SHA-256 mismatch for {expected_id}")
    if normalized_hash != get_normalized_hash(source_meta):
        raise ValueError(f"Normalized SHA-256 mismatch for {expected_id}")

    image = Image.open(normalized_path)
    if image.size != (CELL, CELL) or image.mode != "RGBA":
        raise ValueError(f"Normalized source must be 96x96 RGBA: {source.normalized} ({image.size}, {image.mode})")
    original_bbox = alpha_bbox(image)
    left, top, right, bottom = original_bbox
    center_x = (left + right) / 2

    # The accepted files were normalized by owners using alpha > 8 bounds.
    # Reconcile only the weak Lanczos fringe which falls beyond the agreed
    # y=92 pivot row; never translate/crop the visible body for these pixels.
    tail_cleanup_count = 0
    if monster == "ruins-bell-prowler":
        alpha = image.getchannel("A")
        tail_pixels = [(x, y, alpha.getpixel((x, y))) for y in range(93, CELL) for x in range(CELL) if alpha.getpixel((x, y)) > 0]
        too_visible = [(x, y, value) for x, y, value in tail_pixels if value > 8]
        if too_visible:
            raise ValueError(f"Prowler frame has alpha > 8 below baseline; manual review required: {expected_id}")
        if tail_pixels:
            rgba = image.load()
            for x, y, _ in tail_pixels:
                red, green, blue, _ = rgba[x, y]
                rgba[x, y] = (red, green, blue, 0)
            tail_cleanup_count = len(tail_pixels)

    # Snap the alpha-bbox center to x=48 when it is a full pixel off-center.
    # A half-pixel center is the expected result for even-width silhouettes.
    dx = 1 if center_x < 47.25 else -1 if center_x > 48.25 else 0
    # One accepted reference has its actual alpha bottom at y=91; move it down
    # one pixel to the common baseline without cutting any pixels.
    current_bottom = alpha_bbox(image)[3]
    dy = 92 - current_bottom
    if abs(dx) > 1 or abs(dy) > 1:
        raise ValueError(f"Frame needs more than a micro-translation: {expected_id}, dx={dx}, dy={dy}")
    prepared = translated(image, dx, dy)

    # If any nonzero alpha remains below y=92, require it to be the same
    # low-alpha Lanczos fringe rule used above; no body pixel is removed.
    alpha = prepared.getchannel("A")
    spill = [(x, y, alpha.getpixel((x, y))) for y in range(93, CELL) for x in range(CELL) if alpha.getpixel((x, y)) > 0]
    if spill:
        if any(value > 8 for _, _, value in spill):
            raise ValueError(f"High-alpha pixel falls below baseline after adjustment: {expected_id}")
        rgba = prepared.load()
        for x, y, _ in spill:
            red, green, blue, _ = rgba[x, y]
            rgba[x, y] = (red, green, blue, 0)
        tail_cleanup_count += len(spill)

    final_bbox = alpha_bbox(prepared)
    left, top, right, bottom = final_bbox
    margins = [left, top, CELL - 1 - right, CELL - 1 - bottom]
    final_center_x = (left + right) / 2
    if min(margins) < 3:
        raise ValueError(f"Alpha-visible frame must leave 3px on each edge: {expected_id}: {final_bbox}")
    if bottom != 92:
        raise ValueError(f"Adjusted frame must end at y=92: {expected_id}: {final_bbox}")
    if abs(final_center_x - 48) > 0.5:
        raise ValueError(f"Adjusted alpha bbox must be centered at x=48: {expected_id}: {final_bbox}")

    adjustment: dict[str, Any] = {
        "translationPx": {"x": dx, "y": dy},
        "lowAlphaTailPixelsCleared": tail_cleanup_count,
        "lowAlphaTailRule": "alpha <= 8 at y > 92 set to 0; no alpha > 8 pixel cleared",
    }
    adjusted_path: str | None = None
    if dx or dy or tail_cleanup_count:
        adjusted_path_obj = ASSEMBLY / "adjusted" / monster / f"{source.pose}.png"
        adjusted_path_obj.parent.mkdir(parents=True, exist_ok=True)
        prepared.save(adjusted_path_obj, format="PNG", optimize=True, compress_level=9)
        adjusted_path = adjusted_path_obj.relative_to(ROOT).as_posix()

    record = {
        "frameId": expected_id,
        "pose": source.pose,
        "sourceNormalizedPath": source.normalized,
        "sourceNormalizedSha256": normalized_hash,
        "sourceRawPath": source.raw,
        "sourceRawSha256": raw_hash,
        "sourcePromptPath": source.prompt,
        "sourcePromptSha256": hashlib.sha256(prompt_text.encode("utf-8")).hexdigest(),
        "sourceMetadataPath": source.metadata,
        "sourceAlphaBBoxAnyInclusive": original_bbox,
        "adjustment": adjustment,
        "adjustedFramePath": adjusted_path,
        "packedFrameSha256": pixel_sha256(prepared),
        "packedAlphaBBoxAnyInclusive": final_bbox,
        "packedTransparentPadding": {
            "left": margins[0],
            "top": margins[1],
            "right": margins[2],
            "bottom": margins[3],
        },
    }
    return prepared, record


def frame_to_cells() -> list[tuple[str, int | None]]:
    """Return row-major (pose, copied-from-cell) mappings for all 30 cells."""
    poses = [
        "idle-0", "idle-1", "idle-1", "idle-1", "idle-1", "idle-1",
        "walk-0", "walk-1", "walk-2", "walk-3", "walk-4", "walk-5",
        "attack-0", "attack-1", "attack-2", "attack-3", "attack-3", "attack-3",
        "hurt-0", "hurt-1", "hurt-1", "hurt-1", "hurt-1", "hurt-1",
        "dead-0", "dead-1", "dead-2", "dead-3", "dead-3", "dead-3",
    ]
    copies = {2: 1, 3: 1, 4: 1, 5: 1, 16: 15, 17: 15, 20: 19, 21: 19, 22: 19, 23: 19, 28: 27, 29: 27}
    return [(pose, copies.get(index)) for index, pose in enumerate(poses)]


ANIMATION_DEFS = {
    "idle": ([0, 1], [200, 200], True),
    "walk": ([6, 7, 8, 9, 10, 11], [120] * 6, True),
    "attack": ([12, 13, 14, 15], None, False),
    "hurt": ([18, 19], [100, 100], False),
    "dead": ([24, 25, 26, 27], [100] * 4, False),
}


def assert_unique_poses(frames: dict[str, Image.Image], monster: str) -> None:
    used = ["idle-0", "idle-1", *[f"walk-{i}" for i in range(6)], *[f"attack-{i}" for i in range(4)], "hurt-0", "hurt-1", *[f"dead-{i}" for i in range(4)]]
    hashes = [pixel_sha256(frames[pose]) for pose in used]
    if len(hashes) != 18 or len(set(hashes)) != 18:
        raise ValueError(f"Expected 18 distinct accepted poses for {monster}; got {len(set(hashes))}")


def animation_entries(monster: str, image_key: str) -> list[dict[str, Any]]:
    attack_ms = [500, 500, 100, 900] if monster == "ruins-string-puppet" else [550, 550, 100, 900]
    entries = []
    for name, (indices, times, loops) in ANIMATION_DEFS.items():
        entries.append({
            "key": f"{monster}:{name}",
            "imageKey": image_key,
            "frames": indices,
            "frameMs": attack_ms if name == "attack" else times,
            "loop": loops,
        })
    return entries


def build_atlas(monster: str) -> tuple[Path, list[dict[str, Any]], dict[str, Any]]:
    frame_sources = make_sources(monster)
    if len(frame_sources) != 18:
        raise ValueError(f"Expected 18 explicitly mapped source frames for {monster}; got {len(frame_sources)}")

    frames: dict[str, Image.Image] = {}
    frame_records: dict[str, dict[str, Any]] = {}
    for source in frame_sources:
        if source.pose in frames:
            raise ValueError(f"Duplicate source pose mapping: {monster}:{source.pose}")
        image, record = prepare_frame(monster, source)
        frames[source.pose] = image
        frame_records[source.pose] = record
    assert_unique_poses(frames, monster)

    atlas = Image.new("RGBA", ATLAS_SIZE, (0, 0, 0, 0))
    mappings = []
    for index, (pose, copied_from) in enumerate(frame_to_cells()):
        row, column = divmod(index, 6)
        # Each tile is isolated, so paste RGBA directly to preserve even the
        # hidden RGB values of fully transparent source pixels byte-for-byte.
        atlas.paste(frames[pose], (column * CELL, row * CELL))
        frame_record = frame_records[pose]
        mappings.append({
            "index": index,
            "column": column,
            "row": row,
            "frameId": f"{monster}:{pose}",
            "pose": pose,
            "effectivePose": copied_from is None,
            "copiedFromCell": copied_from,
            "sourceNormalizedPath": frame_record["sourceNormalizedPath"],
            "sourceNormalizedSha256": frame_record["sourceNormalizedSha256"],
            "sourceRawPath": frame_record["sourceRawPath"],
            "sourceRawSha256": frame_record["sourceRawSha256"],
            "sourceAlphaBBoxAnyInclusive": frame_record["sourceAlphaBBoxAnyInclusive"],
            "adjustedFramePath": frame_record["adjustedFramePath"],
            "packedAlphaBBoxAnyInclusive": frame_record["packedAlphaBBoxAnyInclusive"],
            "pixelSha256": pixel_sha256(frames[pose]),
        })
        frame_records[pose].setdefault("cells", []).append(index)

    # Ensure the four unused ranges are exact pixel copies of the required cell.
    for index, (_, copied_from) in enumerate(frame_to_cells()):
        if copied_from is None:
            continue
        x, y = (index % 6) * CELL, (index // 6) * CELL
        sx, sy = (copied_from % 6) * CELL, (copied_from // 6) * CELL
        if atlas.crop((x, y, x + CELL, y + CELL)).tobytes() != atlas.crop((sx, sy, sx + CELL, sy + CELL)).tobytes():
            raise ValueError(f"Unused atlas cell {index} does not exactly copy cell {copied_from}")

    filename = f"monster-{monster}.png"
    atlas_path = PUBLIC_ACTORS / filename
    atlas.save(atlas_path, format="PNG", optimize=True, compress_level=9)
    if atlas.size != ATLAS_SIZE or atlas.mode != "RGBA":
        raise ValueError(f"Runtime atlas format mismatch: {atlas_path}")

    image_key = f"actor:{monster}"
    image_entry = {
        "key": image_key,
        "url": f"assets/actors/{filename}",
        "columns": 6,
        "rows": 5,
        "displayWidth": CELL,
        "displayHeight": CELL,
        "pivotX": 0.5,
        "pivotY": 1,
    }
    animations = animation_entries(monster, image_key)
    metadata = {
        "monster": monster,
        "imageKey": image_key,
        "atlasPath": atlas_path.relative_to(ROOT).as_posix(),
        "atlasSha256": sha256(atlas_path),
        "atlasPixelSha256": pixel_sha256(atlas),
        "atlasSize": list(ATLAS_SIZE),
        "mode": atlas.mode,
        "cellSize": [CELL, CELL],
        "columns": 6,
        "rows": 5,
        "pivot": [0.5, 1],
        "displaySize": [CELL, CELL],
        "imageEntry": image_entry,
        "animationEntries": animations,
        "effectivePoseCount": 18,
        "effectivePosePixelDistinctCount": 18,
        "cellMappings": mappings,
        "frames": list(frame_records.values()),
    }
    return atlas_path, [image_entry, *animations], metadata


def make_contact_sheet(atlas_path: Path, monster: str) -> Path:
    atlas = Image.open(atlas_path).convert("RGBA")
    enlarged = atlas.resize((ATLAS_SIZE[0] * 2, ATLAS_SIZE[1] * 2), Image.Resampling.NEAREST)
    background = Image.new("RGB", enlarged.size, MATTE)
    background.paste(enlarged, mask=enlarged.getchannel("A"))
    output = ASSEMBLY / "review" / f"{monster}-atlas-contact-q70.jpg"
    output.parent.mkdir(parents=True, exist_ok=True)
    background.save(output, format="JPEG", quality=70, optimize=True, subsampling=0)
    if max(background.size) > 1280:
        raise ValueError(f"Contact sheet exceeds 1280px: {output} ({background.size})")
    return output


def append_json_array_text(text: str, name: str, entries: list[dict[str, Any]]) -> str:
    marker = f'"{name}"'
    key_offset = text.index(marker)
    array_start = text.index("[", key_offset + len(marker))
    existing, consumed = json.JSONDecoder().raw_decode(text[array_start:])
    if not isinstance(existing, list) or not existing:
        raise ValueError(f"Expected a nonempty JSON array for {name}")
    array_close = array_start + consumed - 1
    prefix = text[:array_close].rstrip(" \t\r\n")
    newline = "\r\n" if "\r\n" in text else "\n"
    rendered = []
    for entry in entries:
        item = json.dumps(entry, ensure_ascii=False, indent=2).replace("\n", newline)
        rendered.append(textwrap.indent(item, "    "))
    return prefix + "," + newline + ("," + newline).join(rendered) + newline + "  " + text[array_close:]


def update_actor_manifest(appended_images: list[dict[str, Any]], appended_animations: list[dict[str, Any]]) -> dict[str, Any]:
    with MANIFEST_PATH.open("r", encoding="utf-8", newline="") as stream:
        original_text = stream.read()
    manifest = json.loads(original_text)
    original_images = list(manifest["images"])
    original_animations = list(manifest["animations"])
    existing_image_keys = {item["key"] for item in original_images}
    existing_animation_keys = {item["key"] for item in original_animations}
    overlap = existing_image_keys.intersection(item["key"] for item in appended_images)
    if overlap:
        raise ValueError(f"Image keys already exist in actor manifest: {sorted(overlap)}")
    overlap = existing_animation_keys.intersection(item["key"] for item in appended_animations)
    if overlap:
        raise ValueError(f"Animation keys already exist in actor manifest: {sorted(overlap)}")
    for entry in appended_images:
        if not (ROOT / "public" / entry["url"]).is_file():
            raise FileNotFoundError(f"Manifest image URL does not resolve: {entry['url']}")
    updated_text = append_json_array_text(original_text, "images", appended_images)
    updated_text = append_json_array_text(updated_text, "animations", appended_animations)
    with MANIFEST_PATH.open("w", encoding="utf-8", newline="") as stream:
        stream.write(updated_text)
    with MANIFEST_PATH.open("r", encoding="utf-8", newline="") as stream:
        reloaded = json.loads(stream.read())
    if reloaded["images"][:len(original_images)] != original_images:
        raise ValueError("Existing actor manifest image entries changed")
    if reloaded["animations"][:len(original_animations)] != original_animations:
        raise ValueError("Existing actor manifest animation entries changed")
    if len(reloaded["images"]) != len(original_images) + len(appended_images):
        raise ValueError("Unexpected actor manifest image count after append")
    if len(reloaded["animations"]) != len(original_animations) + len(appended_animations):
        raise ValueError("Unexpected actor manifest animation count after append")
    return {
        "path": MANIFEST_PATH.relative_to(ROOT).as_posix(),
        "originalImages": len(original_images),
        "appendedImages": len(appended_images),
        "originalAnimations": len(original_animations),
        "appendedAnimations": len(appended_animations),
    }


def main() -> None:
    existing_outputs = [
        ASSEMBLY / "monster-atlas-assembly.json",
        ASSEMBLY / "review" / "ruins-string-puppet-atlas-contact-q70.jpg",
        ASSEMBLY / "review" / "ruins-bell-prowler-atlas-contact-q70.jpg",
        PUBLIC_ACTORS / "monster-ruins-string-puppet.png",
        PUBLIC_ACTORS / "monster-ruins-bell-prowler.png",
    ]
    if any(path.exists() for path in existing_outputs):
        raise FileExistsError(f"Assembly outputs already exist; inspect them before rerunning: {ASSEMBLY}")
    ASSEMBLY.mkdir(parents=True, exist_ok=True)
    assembled = []
    images = []
    animations = []
    for monster in ("ruins-string-puppet", "ruins-bell-prowler"):
        atlas_path, entries, metadata = build_atlas(monster)
        metadata["reviewContactSheetPath"] = make_contact_sheet(atlas_path, monster).relative_to(ROOT).as_posix()
        images.append(entries[0])
        animations.extend(entries[1:])
        assembled.append(metadata)
    manifest_summary = update_actor_manifest(images, animations)
    metadata_path = ASSEMBLY / "monster-atlas-assembly.json"
    metadata_path.write_text(json.dumps({
        "date": "2026-10-25",
        "requirements": {
            "atlasSize": [576, 480],
            "cellSize": [96, 96],
            "columns": 6,
            "rows": 5,
            "pivot": [0.5, 1],
            "minimumAlphaPaddingPx": 3,
            "visibleBottomY": 92,
            "alphaBBoxCenterX": 48,
            "centerTolerancePx": 0.5,
        },
        "manifestAppend": manifest_summary,
        "atlases": assembled,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")

    print(json.dumps({
        "atlases": [{
            "path": item["atlasPath"],
            "bytes": (ROOT / item["atlasPath"]).stat().st_size,
            "sha256": item["atlasSha256"],
            "contactSheet": item["reviewContactSheetPath"],
        } for item in assembled],
        "metadata": metadata_path.relative_to(ROOT).as_posix(),
        "manifest": manifest_summary,
        "adjustedFrames": [frame["adjustedFramePath"] for atlas in assembled for frame in atlas["frames"] if frame["adjustedFramePath"]],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
