from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "raw"
NORMALIZED = ROOT / "normalized"
METADATA = ROOT / "metadata"
THRESHOLD = 8
MARGIN_RATIO = 0.035
CANVAS = (96, 96)
BASELINE_Y = 92
MATTE = (223, 227, 219)
REVIEW_QUALITY = 70
REVIEW_MAX_EDGE = 1280

# Mean of the accepted idle-0 and attack-2 source-to-frame scales, using the
# same alpha>8 crop and 3.5% margin rule as their handoff normalizer.
REFERENCE_SCALE = 0.072776


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def normalize(capture_path: Path) -> dict[str, object]:
    capture = json.loads(capture_path.read_text(encoding="utf-8-sig"))
    frame_id = capture["frameId"]
    frame_name = frame_id.split(":", 1)[1]
    raw_path = RAW / f"ruins-string-puppet-{frame_name}-v1.png"
    image_original = Image.open(raw_path)
    original_mode = image_original.mode
    image = image_original.convert("RGBA")
    alpha = image.getchannel("A")
    visible = alpha.point(lambda value: 255 if value > THRESHOLD else 0)
    bbox = visible.getbbox()
    if bbox is None:
        raise ValueError(f"No visible pixels for {frame_id}")

    x0, y0, x1, y1 = bbox
    margin = max(2, round(max(x1 - x0, y1 - y0) * MARGIN_RATIO))
    x0, y0 = max(0, x0 - margin), max(0, y0 - margin)
    x1, y1 = min(image.width, x1 + margin), min(image.height, y1 + margin)
    crop = image.crop((x0, y0, x1, y1))
    width = max(1, round(crop.width * REFERENCE_SCALE))
    height = max(1, round(crop.height * REFERENCE_SCALE))
    if width > 90 or height > 90:
        raise ValueError(
            f"Reference-scale sprite would not fit without cropping: {frame_id} "
            f"{width}x{height}"
        )
    resized = crop.resize((width, height), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    x = (CANVAS[0] - width) // 2
    y = BASELINE_Y - height + 1
    canvas.alpha_composite(resized, (x, y))

    output_alpha = canvas.getchannel("A")
    output_bbox_any = output_alpha.getbbox()
    output_bbox_gt8 = output_alpha.point(
        lambda value: 255 if value > THRESHOLD else 0
    ).getbbox()
    if output_bbox_any is None or output_bbox_gt8 is None:
        raise ValueError(f"Normalization erased {frame_id}")
    left, top, right, bottom = output_bbox_any
    if left < 3 or top < 3 or right > 93 or bottom > 93 or bottom != 93:
        raise ValueError(
            f"Frame violates >=3px padding or y=92 baseline: "
            f"{frame_id} {output_bbox_any}"
        )

    output_name = f"ruins-string-puppet-{frame_name}.png"
    output_path = NORMALIZED / output_name
    output_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output_path, optimize=True)

    prompt = capture["submittedPrompt"]
    prompt_path = ROOT / "prompts" / f"ruins-string-puppet-{frame_name}.txt"
    review_path = ROOT / "review" / f"ruins-string-puppet-{frame_name}-q70.jpg"
    review = Image.new("RGB", image.size, MATTE)
    review.paste(image, mask=alpha)
    if max(review.size) > REVIEW_MAX_EDGE:
        review.thumbnail((REVIEW_MAX_EDGE, REVIEW_MAX_EDGE), Image.Resampling.LANCZOS)
    review_path.parent.mkdir(parents=True, exist_ok=True)
    review.save(review_path, "JPEG", quality=REVIEW_QUALITY, optimize=True)

    metadata = {
        **capture,
        "rawSha256": sha256(raw_path),
        "rawSize": list(image.size),
        "rawMode": original_mode,
        "alphaThreshold": THRESHOLD,
        "sourceAlphaBBoxGt8": list(bbox),
        "marginRatio": MARGIN_RATIO,
        "cropIncludingMargin": [x0, y0, x1, y1],
        "referenceScale": REFERENCE_SCALE,
        "resizedCrop": [width, height],
        "output": f"normalized/{output_name}",
        "outputSize": list(CANVAS),
        "outputAlphaBBoxAny": list(output_bbox_any),
        "outputAlphaBBoxGt8": list(output_bbox_gt8),
        "outputSha256": sha256(output_path),
        "pivot": [0.5, 1.0],
        "facing": "right",
        "normalization": (
            "alpha>8 bbox with 3.5% margin; fixed scale 0.072776 derived from "
            "accepted puppet idle-0/attack-2 references; Lanczos; centered at "
            "x=48; lowest nontransparent alpha pixel at y=92"
        ),
        "submittedPromptPath": f"prompts/{prompt_path.name}",
        "submittedPromptSha256": hashlib.sha256(prompt.encode("utf-8")).hexdigest(),
        "accepted": None,
        "status": "pending-review",
        "acceptanceReason": None,
        "rejectionReason": None,
        "rawReviewPath": f"review/{review_path.name}",
        "rawReviewSpec": {
            "format": "JPEG",
            "quality": REVIEW_QUALITY,
            "maxEdge": REVIEW_MAX_EDGE,
            "matteRGB": list(MATTE),
            "size": list(review.size),
        },
    }
    metadata_path = METADATA / f"ruins-string-puppet-{frame_name}.metadata.json"
    metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    return {
        "frameId": frame_id,
        "rawSha256": metadata["rawSha256"],
        "output": metadata["output"],
        "outputSize": metadata["outputSize"],
        "outputAlphaBBoxAny": metadata["outputAlphaBBoxAny"],
        "outputSha256": metadata["outputSha256"],
        "metadata": metadata_path.relative_to(ROOT.parent).as_posix(),
    }


if __name__ == "__main__":
    rows = []
    for path in sorted(METADATA.glob("*.capture.json")):
        frame_name = path.name.replace("ruins-string-puppet-", "").replace(".capture.json", "")
        metadata_path = METADATA / f"ruins-string-puppet-{frame_name}.metadata.json"
        if not metadata_path.exists():
            rows.append(normalize(path))
    print(json.dumps(rows, ensure_ascii=False, indent=2))
