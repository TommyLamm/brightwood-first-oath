from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "references" / "raw"
NORMALIZED = ROOT / "references" / "normalized"
THRESHOLD = 8
MARGIN_RATIO = 0.035
MAX_W = 90
MAX_H = 76
CANVAS = (96, 96)
BASELINE_Y = 92

FRAMES = [
    ("ruins-string-puppet:idle-0", "ruins-string-puppet-profile-v1.png", "ruins-string-puppet-idle-0.png",
     "Right-facing slender wooden marionette; complete feet, forward long arm and snapped copper strings; one neutral pose."),
    ("ruins-string-puppet:attack-2", "ruins-string-puppet-attack-2-v1.png", "ruins-string-puppet-attack-2.png",
     "Right-facing active slap; extended long wooden arm reads clearly; one complete pose with no dash or effects."),
    ("ruins-bell-prowler:idle-0", "ruins-bell-prowler-profile-v1.png", "ruins-bell-prowler-idle-0.png",
     "Low right-facing quadruped; four feet, chipped copper bell and clapper; one neutral pose."),
    ("ruins-bell-prowler:attack-2", "ruins-bell-prowler-attack-2-v2.png", "ruins-bell-prowler-attack-2.png",
     "Right-facing in-place sweep with the near-side foreleg extended low beyond the nose; three bracing legs and bell remain intact."),
]


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def normalize(frame_id: str, raw_name: str, out_name: str, acceptance_reason: str) -> dict[str, object]:
    source = RAW / raw_name
    image = Image.open(source).convert("RGBA")
    alpha = image.getchannel("A")
    visible = alpha.point(lambda value: 255 if value > THRESHOLD else 0)
    bbox = visible.getbbox()
    if bbox is None:
        raise ValueError(f"No visible subject in {source}")
    x0, y0, x1, y1 = bbox
    margin = max(2, round(max(x1 - x0, y1 - y0) * MARGIN_RATIO))
    x0 = max(0, x0 - margin)
    y0 = max(0, y0 - margin)
    x1 = min(image.width, x1 + margin)
    y1 = min(image.height, y1 + margin)
    crop = image.crop((x0, y0, x1, y1))
    scale = min(MAX_W / crop.width, MAX_H / crop.height)
    width = max(1, round(crop.width * scale))
    height = max(1, round(crop.height * scale))
    resized = crop.resize((width, height), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    x = (CANVAS[0] - width) // 2
    y = BASELINE_Y - height + 1
    canvas.alpha_composite(resized, (x, y))
    destination = NORMALIZED / out_name
    destination.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(destination, optimize=True)
    result_alpha = canvas.getchannel("A")
    result_bbox = result_alpha.point(lambda value: 255 if value > THRESHOLD else 0).getbbox()
    if result_bbox is None:
        raise ValueError(f"Normalization erased subject for {frame_id}")
    left, top, right, bottom = result_bbox
    if left < 3 or top < 3 or right > 93 or bottom > 93:
        raise ValueError(f"Frame bounds violate 3px padding/baseline: {frame_id} {result_bbox}")
    row = {
        "frameId": frame_id,
        "accepted": True,
        "acceptanceReason": acceptance_reason,
        "raw": f"references/raw/{raw_name}",
        "rawSha256": digest(source),
        "rawSize": image.size,
        "alphaThreshold": THRESHOLD,
        "sourceAlphaBBox": bbox,
        "cropIncludingMargin": (x0, y0, x1, y1),
        "marginRatio": MARGIN_RATIO,
        "scale": round(scale, 6),
        "resizedCrop": (width, height),
        "output": f"references/normalized/{out_name}",
        "outputSize": CANVAS,
        "outputAlphaBBoxGt8": result_bbox,
        "outputSha256": digest(destination),
        "pivot": (0.5, 1.0),
        "facing": "right",
        "normalization": "crop alpha>8 bbox with 3.5% margin, Lanczos downscale, horizontal center, lowest nontransparent pixel y=92",
        "review": f"references/review/{Path(raw_name).stem}-q70.jpg",
        "reviewSpec": {"format": "JPEG", "quality": 70, "maxEdge": 1280, "matteRGB": (223, 227, 219)},
    }
    metadata_path = ROOT / "references" / (Path(raw_name).stem + ".metadata.json")
    metadata = json.loads(metadata_path.read_text(encoding="utf-8-sig"))
    metadata["accepted"] = True
    metadata["acceptanceReason"] = acceptance_reason
    metadata["reviewPath"] = row["review"]
    metadata["normalized"] = {
        key: row[key]
        for key in ("output", "outputSize", "outputAlphaBBoxGt8", "outputSha256", "pivot", "facing", "normalization")
    }
    metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    return row


if __name__ == "__main__":
    NORMALIZED.mkdir(parents=True, exist_ok=True)
    rows = [normalize(*frame) for frame in FRAMES]
    report = ROOT / "references" / "normalized" / "normalization-summary.json"
    report.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(rows, ensure_ascii=False, indent=2))
