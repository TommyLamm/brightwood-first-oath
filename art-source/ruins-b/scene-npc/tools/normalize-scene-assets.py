from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT.parents[2]
RAW = ROOT / "raw"
NORMALIZED = ROOT / "normalized"
METADATA = ROOT / "metadata"
REVIEW = ROOT / "review" / "runtime"
MATTE = (223, 227, 219)
JPEG_QUALITY = 70
ALPHA_THRESHOLD = 8

ENVIRONMENT = [
    ("ruins-gallery-sky-source.png", "env-ruins-gallery-sky-v1.png", (960, 540), "sky"),
    ("ruins-gallery-far-source.png", "env-ruins-gallery-far-v1.png", (1440, 540), "far"),
    ("ruins-gallery-mid-source.png", "env-ruins-gallery-mid-v1.png", (1920, 540), "mid"),
]
ACTOR_OUTPUTS = {
    "ruins-pathfinder-idle-v1.png": "assets/actors/npcs/ruins-pathfinder-idle-v1.png",
    "ruins-stele-v1.png": "assets/actors/npcs/ruins-stele-v1.png",
}
ITEM_OUTPUTS = {
    "item-broken-copper-thread-v1.png": "assets/interface/item-broken-copper-thread-v1.png",
    "item-muted-bell-fragment-v1.png": "assets/interface/item-muted-bell-fragment-v1.png",
}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest().upper()


def alpha_bbox(image: Image.Image, threshold: int = ALPHA_THRESHOLD) -> tuple[int, int, int, int] | None:
    alpha = image.convert("RGBA").getchannel("A")
    return alpha.point(lambda value: 255 if value > threshold else 0).getbbox()


def save_png(image: Image.Image, destination: Path) -> None:
    if destination.exists():
        raise FileExistsError(f"Refusing to overwrite existing output: {destination}")
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, "PNG", optimize=True, compress_level=9)


def save_review(image: Image.Image, destination: Path, scale: int = 1) -> tuple[int, int]:
    REVIEW.mkdir(parents=True, exist_ok=True)
    rgba = image.convert("RGBA")
    matte = Image.new("RGBA", rgba.size, (*MATTE, 255))
    matte.alpha_composite(rgba)
    preview = matte.convert("RGB")
    if scale > 1:
        preview = preview.resize((preview.width * scale, preview.height * scale), Image.Resampling.NEAREST)
    preview.thumbnail((1280, 1280), Image.Resampling.LANCZOS)
    preview.save(destination, "JPEG", quality=JPEG_QUALITY, optimize=True)
    return preview.size


def metadata_path_for(raw_name: str) -> Path:
    return METADATA / f"{raw_name.replace('-source.png', '')}-v1.metadata.json"


def update_provenance(raw_name: str, normalization: dict[str, object], notes: str) -> None:
    record_path = metadata_path_for(raw_name)
    record = json.loads(record_path.read_text(encoding="utf-8"))
    record["status"] = "accepted"
    record["acceptance"] = notes
    record["rejectionReason"] = None
    record["normalization"] = normalization
    record["runtimeReview"] = {
        "quality": JPEG_QUALITY,
        "format": "JPEG",
        "matteRGB": MATTE,
        "preview": normalization.get("runtimeReview"),
    }
    record_path.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def normalize_environment() -> list[dict[str, object]]:
    rows = []
    for raw_name, output_name, size, layer in ENVIRONMENT:
        source = RAW / raw_name
        source_image = Image.open(source).convert("RGBA")
        resized = source_image.resize(size, Image.Resampling.LANCZOS)
        cleared_pixels = 0
        if layer == "mid":
            alpha = resized.getchannel("A")
            cleared_alpha = alpha.copy()
            cleared_pixels = sum(cleared_alpha.crop((0, 180, size[0], size[1])).histogram()[1:])
            cleared_alpha.paste(0, (0, 180, size[0], size[1]))
            resized.putalpha(cleared_alpha)
        destination = PROJECT / "public" / "assets" / "environment" / output_name
        save_png(resized, destination)
        review_path = REVIEW / f"{Path(output_name).stem}-q70.jpg"
        review_size = save_review(resized, review_path)
        raw_bbox = alpha_bbox(source_image)
        output_bbox = alpha_bbox(resized)
        reason = {
            "sky": "Accepted: full-width calm open vault, correct opaque sky treatment, and the 960x540 source aspect match the gallery plate.",
            "far": "Accepted: distant broken colonnade is separated into transparent clusters with a readable lower silhouette for parallax.",
            "mid": "Accepted: upper arch/root framing reads clearly; rows y>=180 are exactly transparent as specified. Source pixels below that cutoff were intentionally cleared by the requested layer contract.",
        }[layer]
        row = {
            "frameId": f"env:ruins-gallery:{layer}",
            "raw": f"raw/{raw_name}",
            "rawSha256": digest(source),
            "rawSize": source_image.size,
            "rawMode": Image.open(source).mode,
            "rawAlphaBBoxGt8": raw_bbox,
            "output": destination.relative_to(PROJECT).as_posix(),
            "outputSha256": digest(destination),
            "outputBytes": destination.stat().st_size,
            "outputSize": size,
            "outputMode": Image.open(destination).mode,
            "outputAlphaBBoxGt8": output_bbox,
            "normalization": "Lanczos resize to required runtime dimensions; RGBA retained; PNG optimized at zlib level 9 without palette conversion.",
            "clearedAlphaPixels": cleared_pixels,
            "runtimeReview": review_path.relative_to(PROJECT).as_posix(),
            "runtimeReviewSize": review_size,
            "accepted": True,
            "acceptanceReason": reason,
        }
        update_provenance(raw_name, row, reason)
        rows.append(row)
    return rows


def normalize_pathfinder() -> dict[str, object]:
    frame_names = ["ruins-pathfinder-idle-0-source.png", "ruins-pathfinder-idle-1-source.png"]
    frames = [Image.open(RAW / name).convert("RGBA") for name in frame_names]
    boxes = [alpha_bbox(frame) for frame in frames]
    assert all(box is not None for box in boxes)
    x0 = min(box[0] for box in boxes if box)
    y0 = min(box[1] for box in boxes if box)
    x1 = max(box[2] for box in boxes if box)
    y1 = max(box[3] for box in boxes if box)
    margin = max(2, round(max(x1 - x0, y1 - y0) * 0.035))
    crop_box = (max(0, x0 - margin), max(0, y0 - margin), min(frames[0].width, x1 + margin), min(frames[0].height, y1 + margin))
    crop_size = (crop_box[2] - crop_box[0], crop_box[3] - crop_box[1])
    scale = min(76 / crop_size[0], 88 / crop_size[1])
    width = max(1, round(crop_size[0] * scale))
    height = max(1, round(crop_size[1] * scale))
    sheet = Image.new("RGBA", (192, 96), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        resized = frame.crop(crop_box).resize((width, height), Image.Resampling.LANCZOS)
        cell = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
        cell.alpha_composite(resized, ((96 - width) // 2, 95 - height))
        sheet.alpha_composite(cell, (96 * index, 0))
    destination = PROJECT / "public" / "assets" / "actors" / "npcs" / "ruins-pathfinder-idle-v1.png"
    save_png(sheet, destination)
    review_path = REVIEW / "ruins-pathfinder-idle-runtime-q70.jpg"
    review_size = save_review(sheet, review_path, scale=6)
    normalization = {
        "method": "Combine alpha>8 bounds from both raw poses; add 3.5% margin; same crop and Lanczos scale for both frames; center x and align the lowest visible pixel to y=95 in each 96x96 cell.",
        "sourceFrames": frame_names,
        "sourceAlphaBBoxesGt8": boxes,
        "cropIncludingMargin": crop_box,
        "resizedFrameSize": [width, height],
        "scale": round(scale, 6),
        "output": destination.relative_to(PROJECT).as_posix(),
        "outputSize": sheet.size,
        "outputSha256": digest(destination),
        "outputAlphaBBoxGt8": alpha_bbox(sheet),
        "runtimeReview": review_path.relative_to(PROJECT).as_posix(),
        "runtimeReviewSize": review_size,
    }
    for raw_name in frame_names:
        reason = "Accepted: full-body right-facing scout retains closed mouth and calm pose; shared crop/scale keeps the subtle breathing pair aligned and suitable for the 350ms idle loop."
        update_provenance(raw_name, normalization, reason)
    return {
        "frameId": "actor:ruins-pathfinder",
        "rawSources": [{"path": f"raw/{name}", "sha256": digest(RAW / name)} for name in frame_names],
        "output": destination.relative_to(PROJECT).as_posix(),
        "outputBytes": destination.stat().st_size,
        "outputSize": sheet.size,
        "outputMode": Image.open(destination).mode,
        "normalization": normalization,
        "accepted": True,
        "acceptanceReason": "Accepted: two complete closed-mouth idle breathing poses, same identity and aligned crop; runtime metadata assigns 350ms per frame.",
    }


def normalize_actor_stele() -> dict[str, object]:
    raw_name = "ruins-stele-source.png"
    source = Image.open(RAW / raw_name).convert("RGBA")
    bbox = alpha_bbox(source)
    assert bbox is not None
    margin = max(2, round(max(bbox[2] - bbox[0], bbox[3] - bbox[1]) * 0.035))
    crop_box = (max(0, bbox[0] - margin), max(0, bbox[1] - margin), min(source.width, bbox[2] + margin), min(source.height, bbox[3] + margin))
    crop = source.crop(crop_box)
    scale = min(164 / crop.width, 236 / crop.height)
    size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
    resized = crop.resize(size, Image.Resampling.LANCZOS)
    output = Image.new("RGBA", (192, 256), (0, 0, 0, 0))
    output.alpha_composite(resized, ((192 - size[0]) // 2, 255 - size[1]))
    destination = PROJECT / "public" / "assets" / "actors" / "npcs" / "ruins-stele-v1.png"
    save_png(output, destination)
    review_path = REVIEW / "ruins-stele-runtime-q70.jpg"
    review_size = save_review(output, review_path, scale=4)
    reason = "Accepted: one complete upright monument with a calm blank center, wave grooves, teal mineral seams, copper inlays, and bottom pivot; both NPC IDs will share this static actor."
    normalization = {
        "method": "Crop alpha>8 subject bounds with 3.5% margin; Lanczos fit within 164x236; center horizontally and align bottom pivot at y=255.",
        "sourceAlphaBBoxGt8": bbox,
        "cropIncludingMargin": crop_box,
        "resizedSize": size,
        "scale": round(scale, 6),
        "output": destination.relative_to(PROJECT).as_posix(),
        "outputSize": output.size,
        "outputSha256": digest(destination),
        "outputAlphaBBoxGt8": alpha_bbox(output),
        "runtimeReview": review_path.relative_to(PROJECT).as_posix(),
        "runtimeReviewSize": review_size,
    }
    update_provenance(raw_name, normalization, reason)
    return {
        "frameId": "actor:ruins-stele",
        "raw": f"raw/{raw_name}",
        "rawSha256": digest(RAW / raw_name),
        "output": destination.relative_to(PROJECT).as_posix(),
        "outputBytes": destination.stat().st_size,
        "outputSize": output.size,
        "outputMode": Image.open(destination).mode,
        "normalization": normalization,
        "accepted": True,
        "acceptanceReason": reason,
    }


def normalize_items() -> list[dict[str, object]]:
    rows = []
    sources = [
        ("broken-copper-thread-source.png", "item-broken-copper-thread-v1.png", "item:broken-copper-thread", "item-broken-copper-thread"),
        ("muted-bell-fragment-source.png", "item-muted-bell-fragment-v1.png", "item:muted-bell-fragment", "item-muted-bell-fragment"),
    ]
    for raw_name, output_name, frame_id, review_stem in sources:
        source = Image.open(RAW / raw_name).convert("RGBA")
        bbox = alpha_bbox(source)
        assert bbox is not None
        margin = max(2, round(max(bbox[2] - bbox[0], bbox[3] - bbox[1]) * 0.045))
        crop_box = (max(0, bbox[0] - margin), max(0, bbox[1] - margin), min(source.width, bbox[2] + margin), min(source.height, bbox[3] + margin))
        crop = source.crop(crop_box)
        scale = min(104 / crop.width, 104 / crop.height)
        size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
        resized = crop.resize(size, Image.Resampling.LANCZOS)
        output = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
        output.alpha_composite(resized, ((128 - size[0]) // 2, (128 - size[1]) // 2))
        destination = PROJECT / "public" / "assets" / "interface" / output_name
        save_png(output, destination)
        review_path = REVIEW / f"{review_stem}-runtime-q70.jpg"
        review_size = save_review(output, review_path, scale=5)
        reason = "Accepted: one centered, readable transparent material icon with a clean silhouette and enough margin for 32x32 runtime display."
        normalization = {
            "method": "Crop alpha>8 subject bounds with 4.5% margin; Lanczos fit within 104x104 and center on a transparent 128x128 canvas.",
            "sourceAlphaBBoxGt8": bbox,
            "cropIncludingMargin": crop_box,
            "resizedSize": size,
            "scale": round(scale, 6),
            "output": destination.relative_to(PROJECT).as_posix(),
            "outputSize": output.size,
            "outputSha256": digest(destination),
            "outputAlphaBBoxGt8": alpha_bbox(output),
            "runtimeReview": review_path.relative_to(PROJECT).as_posix(),
            "runtimeReviewSize": review_size,
        }
        update_provenance(raw_name, normalization, reason)
        rows.append({
            "frameId": frame_id,
            "raw": f"raw/{raw_name}",
            "rawSha256": digest(RAW / raw_name),
            "output": destination.relative_to(PROJECT).as_posix(),
            "outputBytes": destination.stat().st_size,
            "outputSize": output.size,
            "outputMode": Image.open(destination).mode,
            "normalization": normalization,
            "accepted": True,
            "acceptanceReason": reason,
        })
    return rows


def main() -> None:
    NORMALIZED.mkdir(parents=True, exist_ok=True)
    records = {
        "environment": normalize_environment(),
        "pathfinder": normalize_pathfinder(),
        "stele": normalize_actor_stele(),
        "items": normalize_items(),
        "normalization": "Deterministic Pillow Lanczos resize/crop, RGBA output, optimize=True and PNG compression level 9. No generated source image was edited or overwritten.",
    }
    summary_path = METADATA / "normalization-summary.json"
    summary_path.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "outputs": [
            {"path": row["output"], "bytes": row["outputBytes"], "size": row["outputSize"], "mode": row["outputMode"]}
            for row in [*records["environment"], records["pathfinder"], records["stele"], *records["items"]]
        ],
        "summary": summary_path.relative_to(PROJECT).as_posix(),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
