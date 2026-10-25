from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "raw"
NORMALIZED = ROOT / "normalized"
METADATA = ROOT / "metadata"
REVIEW = ROOT / "review"
MATTE = (223, 227, 219)
REVIEW_QUALITY = 70
REVIEW_MAX_EDGE = 1280
THRESHOLD = 8
MARGIN_RATIO = 0.035
MAX_W = 90
MAX_H = 76
CANVAS = (96, 96)
BASELINE_Y = 92


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def make_raw_review(source: Path) -> Path:
    image = Image.open(source).convert("RGBA")
    preview = Image.new("RGB", image.size, MATTE)
    preview.paste(image, mask=image.getchannel("A"))
    if max(preview.size) > REVIEW_MAX_EDGE:
        preview.thumbnail((REVIEW_MAX_EDGE, REVIEW_MAX_EDGE), Image.Resampling.LANCZOS)
    REVIEW.mkdir(parents=True, exist_ok=True)
    destination = REVIEW / f"{source.stem}-q{REVIEW_QUALITY}.jpg"
    preview.save(destination, "JPEG", quality=REVIEW_QUALITY, optimize=True)
    return destination


def normalize(frame_id: str, raw_name: str, out_name: str, reason: str) -> dict[str, object]:
    source = RAW / raw_name
    image = Image.open(source).convert("RGBA")
    alpha = image.getchannel("A")
    visible = alpha.point(lambda value: 255 if value > THRESHOLD else 0)
    bbox = visible.getbbox()
    if bbox is None:
        raise ValueError(f"No visible subject in {source}")
    x0, y0, x1, y1 = bbox
    margin = max(2, round(max(x1 - x0, y1 - y0) * MARGIN_RATIO))
    x0, y0 = max(0, x0 - margin), max(0, y0 - margin)
    x1, y1 = min(image.width, x1 + margin), min(image.height, y1 + margin)
    crop = image.crop((x0, y0, x1, y1))
    scale = min(MAX_W / crop.width, MAX_H / crop.height)
    width, height = max(1, round(crop.width * scale)), max(1, round(crop.height * scale))
    resized = crop.resize((width, height), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    x, y = (CANVAS[0] - width) // 2, BASELINE_Y - height + 1
    canvas.alpha_composite(resized, (x, y))
    destination = NORMALIZED / out_name
    destination.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(destination, optimize=True)
    output_bbox = canvas.getchannel("A").point(lambda value: 255 if value > THRESHOLD else 0).getbbox()
    if output_bbox is None:
        raise ValueError(f"Normalization erased subject for {frame_id}")
    output_alpha_bbox = canvas.getchannel("A").getbbox()
    if output_alpha_bbox is None:
        raise ValueError(f"Normalization erased alpha for {frame_id}")
    left, top, right, bottom = output_alpha_bbox
    if left < 3 or top < 3 or right > 93 or bottom > 93 or bottom != 93:
        raise ValueError(f"Frame violates transparent padding or y=92 baseline: {frame_id} {output_alpha_bbox}")
    review_path = make_raw_review(source)
    row = {
        "frameId": frame_id,
        "accepted": None,
        "status": "pending-review",
        "acceptanceReason": reason,
        "raw": f"raw/{raw_name}",
        "rawSha256": digest(source),
        "rawSize": image.size,
        "rawMode": Image.open(source).mode,
        "alphaThreshold": THRESHOLD,
        "sourceAlphaBBoxGt8": bbox,
        "edgeAlphaGt8Pixels": sum(alpha.getpixel((x, y)) > THRESHOLD for x in range(image.width) for y in (0, image.height - 1)) + sum(alpha.getpixel((x, y)) > THRESHOLD for y in range(1, image.height - 1) for x in (0, image.width - 1)),
        "cropIncludingMargin": (x0, y0, x1, y1),
        "marginRatio": MARGIN_RATIO,
        "scale": round(scale, 6),
        "resizedCrop": (width, height),
        "output": f"normalized/{out_name}",
        "outputSize": CANVAS,
        "outputAlphaBBoxAny": output_alpha_bbox,
        "outputAlphaBBoxGt8": output_bbox,
        "outputSha256": digest(destination),
        "pivot": (0.5, 1.0),
        "facing": "right",
        "normalization": "crop alpha>8 bbox with 3.5% margin, Lanczos downscale to max 90x76, center at x=48, lowest visible pixel y=92",
        "reviewPath": review_path.relative_to(ROOT).as_posix(),
        "reviewSpec": {"format": "JPEG", "quality": REVIEW_QUALITY, "maxEdge": REVIEW_MAX_EDGE, "matteRGB": MATTE, "size": Image.open(review_path).size},
    }
    return row


def write_metadata(row: dict[str, object], prompt_name: str, call: dict[str, object]) -> Path:
    prompt_path = ROOT / "prompts" / prompt_name
    prompt = prompt_path.read_text(encoding="utf-8-sig")
    row["submittedPromptPath"] = f"prompts/{prompt_name}"
    row["submittedPromptSha256"] = hashlib.sha256(prompt.encode("utf-8")).hexdigest()
    row.update({key: value for key, value in call.items() if key not in {
        "accepted", "acceptanceReason", "rejectionReason", "status",
        "submittedPromptPath", "submittedPromptSha256", "reviewPath", "reviewSpec",
    }})
    row["accepted"] = None
    row["status"] = "pending-review"
    out = METADATA / f"{row['frameId'].replace(':', '-')}.json"
    out.write_text(json.dumps(row, ensure_ascii=False, indent=2), encoding="utf-8")
    return out


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("frame_id")
    parser.add_argument("raw_name")
    parser.add_argument("output_name")
    parser.add_argument("reason")
    parser.add_argument("prompt_name")
    parser.add_argument("call_metadata_path", nargs="?")
    parser.add_argument("--saved-path")
    parser.add_argument("--call-id")
    args = parser.parse_args()
    row = normalize(args.frame_id, args.raw_name, args.output_name, args.reason)
    if args.call_metadata_path:
        call = json.loads(Path(args.call_metadata_path).read_text(encoding="utf-8-sig"))
    else:
        if not args.saved_path or not args.call_id:
            raise SystemExit("provide call_metadata_path or both --saved-path and --call-id")
        call = {
            "tool": "built-in image_gen",
            "callId": args.call_id,
            "savedPath": args.saved_path,
            "revisedPrompt": None,
            "revisedPromptReturnedByTool": False,
            "revisedPromptRecoveryNote": "The direct tool result exposed only image_url and output_hint; no revisedPrompt field was returned.",
            "resultKeysObserved": ["image_url", "output_hint"],
        }
    metadata_path = write_metadata(row, args.prompt_name, call)
    print(json.dumps({"metadataPath": metadata_path.relative_to(ROOT).as_posix(), **row}, ensure_ascii=False, indent=2))
