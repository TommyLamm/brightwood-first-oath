from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "references" / "raw"
REVIEW = ROOT / "references" / "review"
MATTE = (223, 227, 219)
QUALITY = 70
MAX_EDGE = 1280


def make_review(filename: str) -> dict[str, object]:
    source = RAW / filename
    image = Image.open(source).convert("RGBA")
    alpha = image.getchannel("A")
    visible = alpha.point(lambda value: 255 if value > 8 else 0)
    bbox = visible.getbbox()
    edge_pixels = 0
    for y in range(alpha.height):
        for x in range(alpha.width):
            if x in (0, alpha.width - 1) or y in (0, alpha.height - 1):
                edge_pixels += alpha.getpixel((x, y)) > 8
    preview = Image.new("RGB", image.size, MATTE)
    preview.paste(image, mask=alpha)
    if max(preview.size) > MAX_EDGE:
        preview.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)
    destination = REVIEW / f"{source.stem}-q{QUALITY}.jpg"
    preview.save(destination, "JPEG", quality=QUALITY, optimize=True)
    return {
        "source": source.relative_to(ROOT).as_posix(),
        "sourceSize": image.size,
        "sourceMode": Image.open(source).mode,
        "alphaBBoxAlphaGt8": bbox,
        "edgeAlphaGt8Pixels": edge_pixels,
        "preview": destination.relative_to(ROOT).as_posix(),
        "previewSize": preview.size,
        "previewFormat": "JPEG",
        "previewQuality": QUALITY,
        "previewMatteRGB": MATTE,
        "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
    }


if __name__ == "__main__":
    REVIEW.mkdir(parents=True, exist_ok=True)
    reports = [make_review(name) for name in sys.argv[1:]]
    summary = ROOT / "references" / "review" / "review-summary.json"
    summary.write_text(json.dumps(reports, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(reports, ensure_ascii=False, indent=2))
