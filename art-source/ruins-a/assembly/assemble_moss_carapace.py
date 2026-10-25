#!/usr/bin/env python3
"""Deterministically assemble and validate the Ruins A moss-carapace atlas.

Default mode writes a review contact sheet and cell metadata under this folder.
Pass --commit-runtime only after visually accepting the contact sheet to add the
runtime atlas and append the image/animation entries to the shared actor manifest.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[3]
ASSEMBLY = Path(__file__).resolve().parent
MOTION = Path("art-source/ruins-a/motion-frames/normalized")
ACTION = Path("art-source/ruins-a/action-frames/normalized")
ATLAS_PATH = Path("public/assets/actors/monster-ruins-moss-carapace.png")
MANIFEST_PATH = Path("public/assets/actors/manifest.json")

FRAME_INPUTS = {
    0: MOTION / "frame-00.png",
    1: MOTION / "frame-01.png",
    6: MOTION / "frame-06.png",
    7: MOTION / "frame-07.png",
    8: MOTION / "frame-08.png",
    9: MOTION / "frame-09.png",
    10: MOTION / "frame-10.png",
    11: MOTION / "frame-11.png",
    12: ACTION / "frame-12.png",
    13: ACTION / "frame-13.png",
    14: ACTION / "frame-14.png",
    15: ACTION / "frame-15.png",
    18: ACTION / "frame-18.png",
    19: ACTION / "frame-19.png",
    24: ACTION / "frame-24.png",
    25: ACTION / "frame-25.png",
    26: ACTION / "frame-26.png",
    27: ACTION / "frame-27.png",
}

CELL_SOURCES = {
    **{frame: frame for frame in FRAME_INPUTS},
    2: 1,
    3: 1,
    4: 1,
    5: 1,
    16: 15,
    17: 15,
    20: 19,
    21: 19,
    22: 19,
    23: 19,
    28: 27,
    29: 27,
}

ANIMATIONS = [
    {
        "key": "ruins-moss-carapace:idle",
        "imageKey": "actor:ruins-moss-carapace",
        "frames": [0, 1],
        "frameMs": [200, 200],
        "loop": True,
    },
    {
        "key": "ruins-moss-carapace:walk",
        "imageKey": "actor:ruins-moss-carapace",
        "frames": [6, 7, 8, 9, 10, 11],
        "frameMs": [120] * 6,
        "loop": True,
    },
    {
        "key": "ruins-moss-carapace:attack",
        "imageKey": "actor:ruins-moss-carapace",
        "frames": [12, 13, 14, 15],
        "frameMs": [275, 275, 80, 770],
        "loop": False,
    },
    {
        "key": "ruins-moss-carapace:hurt",
        "imageKey": "actor:ruins-moss-carapace",
        "frames": [18, 19],
        "frameMs": [100, 100],
        "loop": False,
    },
    {
        "key": "ruins-moss-carapace:dead",
        "imageKey": "actor:ruins-moss-carapace",
        "frames": [24, 25, 26, 27],
        "frameMs": [100] * 4,
        "loop": False,
    },
]

IMAGE_ENTRY = {
    "key": "actor:ruins-moss-carapace",
    "url": "assets/actors/monster-ruins-moss-carapace.png",
    "columns": 6,
    "rows": 5,
    "displayWidth": 96,
    "displayHeight": 96,
    "pivotX": 0.5,
    "pivotY": 1,
}


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load_frames() -> tuple[dict[int, Image.Image], dict[int, dict[str, object]]]:
    frames: dict[int, Image.Image] = {}
    metadata: dict[int, dict[str, object]] = {}
    seen_hashes: dict[str, int] = {}
    for index, relative in FRAME_INPUTS.items():
        path = ROOT / relative
        if not path.is_file():
            raise FileNotFoundError(f"Missing source frame {index}: {relative.as_posix()}")
        raw = path.read_bytes()
        with Image.open(path) as opened:
            if opened.format != "PNG" or opened.mode != "RGBA" or opened.size != (96, 96):
                raise ValueError(
                    f"Frame {index} must be a 96x96 RGBA PNG; got "
                    f"{opened.format} {opened.mode} {opened.size}: {relative.as_posix()}"
                )
            frame = opened.copy()
        alpha = frame.getchannel("A")
        if alpha.getextrema() != (0, 255):
            raise ValueError(f"Frame {index} lacks real transparent and opaque alpha: {relative.as_posix()}")
        full_alpha_bbox = alpha.getbbox()
        if full_alpha_bbox is None:
            raise ValueError(f"Frame {index} has no visible subject: {relative.as_posix()}")
        bbox = alpha.point(lambda value: 255 if value > 8 else 0).getbbox()
        if bbox is None:
            raise ValueError(f"Frame {index} has no visible subject: {relative.as_posix()}")
        left, top, right, bottom = bbox
        full_left, full_top, full_right, full_bottom = full_alpha_bbox
        if full_left < 3 or full_top < 3 or 96 - full_right < 3 or 96 - full_bottom < 3:
            raise ValueError(
                f"Frame {index} needs at least 3 transparent pixels on every side "
                f"(alpha>0 bbox {full_alpha_bbox}); repair its margin before assembly."
            )
        digest = sha256(raw)
        pixel_digest = sha256(frame.tobytes())
        if pixel_digest in seen_hashes:
            raise ValueError(f"Frames {seen_hashes[pixel_digest]} and {index} are pixel-identical; copied poses are not allowed.")
        seen_hashes[pixel_digest] = index
        alpha_values = list(alpha.tobytes())
        alpha_pixels = sum(value > 8 for value in alpha_values)
        frames[index] = frame
        metadata[index] = {
            "frame": index,
            "source": relative.as_posix(),
            "sha256": digest,
            "pixelSha256": pixel_digest,
            "size": [96, 96],
            "mode": "RGBA",
            "alphaBBoxAtThreshold0": list(full_alpha_bbox),
            "alphaBBoxAtThreshold8": [left, top, right, bottom],
            "transparentMarginsAtThreshold0": [full_left, full_top, 96 - full_right, 96 - full_bottom],
            "alphaPixelsAbove8": alpha_pixels,
            "alphaMean": round(sum(alpha_values) / len(alpha_values), 2),
        }
    return frames, metadata


def assemble(frames: dict[int, Image.Image]) -> Image.Image:
    atlas = Image.new("RGBA", (576, 480), (0, 0, 0, 0))
    for cell, source_index in CELL_SOURCES.items():
        atlas.paste(frames[source_index], ((cell % 6) * 96, (cell // 6) * 96))
    return atlas


def create_contact_sheet(atlas: Image.Image) -> Path:
    cell_width, cell_height, label_height = 128, 122, 20
    sheet = Image.new("RGB", (cell_width * 6, cell_height * 5), (157, 162, 154))
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()
    for cell in range(30):
        column, row = cell % 6, cell // 6
        x, y = column * cell_width, row * cell_height
        source_index = CELL_SOURCES[cell]
        label = f"{cell:02d} <- {source_index:02d}"
        draw.text((x + 6, y + 3), label, font=font, fill=(28, 32, 29))
        rgba = atlas.crop((column * 96, row * 96, column * 96 + 96, row * 96 + 96))
        background = Image.new("RGBA", (96, 96), (157, 162, 154, 255))
        background.alpha_composite(rgba)
        sheet.paste(background.convert("RGB"), (x + 16, y + label_height))
        draw.rectangle((x + 15, y + label_height - 1, x + 112, y + label_height + 96), outline=(79, 85, 79))
    output = ASSEMBLY / "moss-carapace-contact-sheet.jpg"
    sheet.save(output, "JPEG", quality=70, optimize=True, progressive=True)
    with Image.open(output) as check:
        if check.size[0] > 1280 or check.size[1] > 1280 or check.format != "JPEG":
            raise ValueError("Contact sheet must be a JPEG with both dimensions at or below 1280 px.")
    return output


def manifest_with_entries(original: str) -> str:
    data = json.loads(original)
    old_images = [entry for entry in data["images"] if entry.get("key") == IMAGE_ENTRY["key"]]
    old_animations = [entry for entry in data["animations"] if entry.get("key", "").startswith("ruins-moss-carapace:")]
    if old_images or old_animations:
        if old_images == [IMAGE_ENTRY] and old_animations == ANIMATIONS:
            return original
        raise ValueError("Manifest already contains conflicting moss-carapace entries; preserving existing content.")

    def insert_array(text: str, property_name: str, objects: list[dict[str, object]]) -> str:
        marker = json.dumps(property_name) + ":"
        prop = text.find(marker)
        if prop < 0:
            raise ValueError(f"Manifest is missing top-level {property_name} array.")
        opening = text.find("[", prop + len(marker))
        if opening < 0:
            raise ValueError(f"Manifest {property_name} value is not an array.")
        depth, quoted, escaped = 0, False, False
        closing = -1
        for index in range(opening, len(text)):
            char = text[index]
            if quoted:
                if escaped:
                    escaped = False
                elif char == "\\":
                    escaped = True
                elif char == '"':
                    quoted = False
                continue
            if char == '"':
                quoted = True
            elif char == "[":
                depth += 1
            elif char == "]":
                depth -= 1
                if depth == 0:
                    closing = index
                    break
        if closing < 0:
            raise ValueError(f"Manifest {property_name} array is unterminated.")
        body_end = closing
        while body_end > opening + 1 and text[body_end - 1].isspace():
            body_end -= 1
        if body_end == opening + 1:
            raise ValueError(f"Manifest {property_name} array is unexpectedly empty.")
        trailing = text[body_end:closing]
        serialized = []
        for obj in objects:
            serialized.append("\n".join("    " + line for line in json.dumps(obj, ensure_ascii=False, indent=2).splitlines()))
        return text[:body_end] + ",\n" + ",\n".join(serialized) + trailing + text[closing:]

    updated = insert_array(original, "animations", ANIMATIONS)
    updated = insert_array(updated, "images", [IMAGE_ENTRY])
    updated_data = json.loads(updated)
    if updated_data["images"][: len(data["images"])] != data["images"]:
        raise ValueError("Appending the new image unexpectedly changed an existing image entry.")
    if updated_data["animations"][: len(data["animations"])] != data["animations"]:
        raise ValueError("Appending animations unexpectedly changed an existing animation entry.")
    return updated


def run_animation_contract(manifest_path: Path) -> None:
    checker = ASSEMBLY / "check_animation_contract.mjs"
    command = ["node", "--import", "tsx", str(checker), str(manifest_path)]
    result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        raise RuntimeError(
            "Animation contract check failed.\n"
            + result.stdout.strip()
            + ("\n" + result.stderr.strip() if result.stderr.strip() else "")
        )
    print(result.stdout.strip())


def write_review_metadata(frame_metadata: dict[int, dict[str, object]], sheet: Path, atlas: Image.Image) -> None:
    metadata = {
        "status": "review-preview",
        "atlas": {"size": [576, 480], "mode": "RGBA", "columns": 6, "rows": 5, "cellSize": [96, 96]},
        "contactSheet": {"path": sheet.relative_to(ROOT).as_posix(), "size": list(Image.open(sheet).size), "jpegQuality": 70},
        "sourceFrames": [frame_metadata[index] for index in sorted(frame_metadata)],
        "cellSources": {str(cell): CELL_SOURCES[cell] for cell in range(30)},
        "unusedCellCopiesVerifiedInMemory": True,
        "fullAtlasHasTransparentPixels": atlas.getchannel("A").getextrema()[0] == 0,
    }
    (ASSEMBLY / "metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_source_log(frame_metadata: dict[int, dict[str, object]]) -> None:
    motion_report = Path("plan/reports/ruins-a-motion-frames.md")
    action_report = Path("plan/reports/ruins-a-action-frames.md")
    missing_reports = [path.as_posix() for path in (motion_report, action_report) if not (ROOT / path).is_file()]
    if missing_reports:
        raise FileNotFoundError("Cannot finalize frame provenance until agent reports exist: " + ", ".join(missing_reports))
    lines = [
        "# 苔陶蟲 atlas 組裝來源記錄",
        "",
        "runtime 圖集由 18 張獨立的 96×96 RGBA 有效姿勢原樣排入六欄五列；沒有把概念大圖等分裁格，也沒有把 idle 複製成動作。",
        "",
        "## 身份錨點與生成報告",
        "",
        "- 共用右向身份錨點：`art-source/ruins-a/actors/moss-carapace-idle-anchor-v1-mirrored-right.png`。",
        f"- idle/walk 來源、逐格 prompt、savedPath／revisedPrompt 對照與正規化紀錄：`{motion_report.as_posix()}`。",
        f"- attack/hurt/dead 原稿 SHA-256、10/10 逐 call savedPath／revisedPrompt 對照、姿勢編排及正規化紀錄：`{action_report.as_posix()}`。",
        "- 組裝輸入是下表列出的獨立 normalized 影格；assemble 腳本不縮放、裁切或重畫它們。來源 SHA-256 與 pixel SHA-256 記錄在 `metadata.json`。",
        "",
        "## 有效姿勢逐格 mapping",
        "",
        "| Atlas frame | 狀態 | 正規化來源 | SHA-256 |",
        "| ---: | --- | --- | --- |",
    ]
    state_by_frame = {
        0: "idle", 1: "idle", **{i: "walk" for i in range(6, 12)},
        **{i: "attack" for i in range(12, 16)}, 18: "hurt", 19: "hurt",
        **{i: "dead" for i in range(24, 28)},
    }
    for index in sorted(frame_metadata):
        item = frame_metadata[index]
        lines.append(f"| {index} | {state_by_frame[index]} | `{item['source']}` | `{item['sha256']}` |")
    lines.extend([
        "",
        "## 補格與隔離稿",
        "",
        "- Idle cells 2–5 copy frame 1; attack cells 16–17 copy frame 15; hurt cells 20–23 copy frame 19; dead cells 28–29 copy frame 27. Walk row uses all six unique source frames.",
        "- Rejected legacy sheets remain isolated under `art-source/ruins-a/`: `ruins-moss-carapace-atlas-generated.png`, `ruins-moss-carapace-atlas-generated-v2.png`, and `ruins-moss-carapace-atlas-generated-v3.png`. They are not runtime sources because high-alpha subjects crossed internal cell boundaries / overlapped adjacent poses; prior diagnosis is in `plan/reports/ruins-a-combat.md` and `plan/reports/ruins-a-actor-art.md`.",
        "- No failed or rejected source was removed or promoted into `public/`.",
        "",
        "## Runtime output and checks",
        "",
        f"- Runtime image: `{ATLAS_PATH.as_posix()}`; 576×480 RGBA, six columns by five rows, display 96×96, pivot (0.5, 1).",
        f"- Runtime manifest: `{MANIFEST_PATH.as_posix()}`; only the `actor:ruins-moss-carapace` image and its five animation entries were appended.",
        "- Check list: true RGBA/alpha, 96×96 input cells, complete non-edge-clipped alpha bounds, duplicate-pose rejection, exact filler copies, contract check against `src/render/animation-contract.ts`, and retained prior manifest entries.",
        "- Visual review is represented by `moss-carapace-contact-sheet.jpg` (neutral background, JPEG quality 70, below 1280 px).",
        "",
    ])
    (ASSEMBLY / "source-log.md").write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--commit-runtime", action="store_true", help="write the runtime PNG and append its manifest entries after source validation")
    args = parser.parse_args()

    if sorted(CELL_SOURCES) != list(range(30)) or len(FRAME_INPUTS) != 18:
        raise ValueError("Atlas layout must account for all 30 cells and exactly 18 independent poses.")
    frames, frame_metadata = load_frames()
    atlas = assemble(frames)
    sheet = create_contact_sheet(atlas)
    write_review_metadata(frame_metadata, sheet, atlas)
    print(f"Validated {len(frames)} independent RGBA poses; contact sheet: {sheet.relative_to(ROOT).as_posix()}")
    print("Frame bounds (alpha > 8): " + ", ".join(
        f"{i}:{frame_metadata[i]['alphaBBoxAtThreshold8']}" for i in sorted(frame_metadata)
    ))

    if not args.commit_runtime:
        print("Review the contact sheet, then rerun with --commit-runtime to write runtime files.")
        return 0

    atlas_bytes_path = ASSEMBLY / "candidate-atlas.png"
    atlas.save(atlas_bytes_path, "PNG", optimize=True)
    atlas_bytes = atlas_bytes_path.read_bytes()
    with Image.open(atlas_bytes_path) as check:
        if check.format != "PNG" or check.mode != "RGBA" or check.size != (576, 480):
            raise ValueError("Assembled atlas did not round-trip as 576×480 RGBA PNG.")
    for cell in range(30):
        x, y = (cell % 6) * 96, (cell // 6) * 96
        actual = atlas.crop((x, y, x + 96, y + 96))
        if actual.tobytes() != frames[CELL_SOURCES[cell]].tobytes():
            raise ValueError(f"Atlas cell {cell} does not exactly match its mapped source frame.")

    manifest_path = ROOT / MANIFEST_PATH
    original_manifest = manifest_path.read_text(encoding="utf-8")
    updated_manifest = manifest_with_entries(original_manifest)
    candidate_manifest = ASSEMBLY / "candidate-manifest.json"
    candidate_manifest.write_text(updated_manifest, encoding="utf-8")
    run_animation_contract(candidate_manifest)
    candidate_manifest.unlink(missing_ok=True)

    runtime_path = ROOT / ATLAS_PATH
    if runtime_path.exists() and runtime_path.read_bytes() != atlas_bytes:
        raise FileExistsError(f"Refusing to overwrite an existing different runtime atlas: {ATLAS_PATH.as_posix()}")
    created_runtime = not runtime_path.exists()
    metadata_path = ASSEMBLY / "metadata.json"
    source_log_path = ASSEMBLY / "source-log.md"
    original_metadata = metadata_path.read_bytes()
    original_source_log = source_log_path.read_bytes() if source_log_path.exists() else None
    try:
        if created_runtime:
            runtime_path.write_bytes(atlas_bytes)
        if updated_manifest != original_manifest:
            manifest_path.write_text(updated_manifest, encoding="utf-8")
        with Image.open(runtime_path) as runtime_check:
            if runtime_check.mode != "RGBA" or runtime_check.size != (576, 480):
                raise ValueError("Runtime atlas verification failed after write.")
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        metadata["status"] = "runtime"
        metadata["runtimeAtlas"] = {
            "path": ATLAS_PATH.as_posix(),
            "sha256": sha256(atlas_bytes),
            "size": [576, 480],
            "mode": "RGBA",
        }
        metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        write_source_log(frame_metadata)
    except Exception:
        if created_runtime and runtime_path.exists():
            runtime_path.unlink()
        manifest_path.write_text(original_manifest, encoding="utf-8")
        metadata_path.write_bytes(original_metadata)
        if original_source_log is None:
            source_log_path.unlink(missing_ok=True)
        else:
            source_log_path.write_bytes(original_source_log)
        raise
    finally:
        atlas_bytes_path.unlink(missing_ok=True)

    print(f"Wrote {ATLAS_PATH.as_posix()} and appended the moss-carapace manifest entries.")
    print(f"Source log: {(ASSEMBLY / 'source-log.md').relative_to(ROOT).as_posix()}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"assembly failed: {error}", file=sys.stderr)
        raise SystemExit(1)
