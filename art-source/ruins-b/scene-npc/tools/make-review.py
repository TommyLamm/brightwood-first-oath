from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "raw"
REVIEW = ROOT / "review"
MATTE = (223, 227, 219)
QUALITY = 70
MAX_EDGE = 1280


def make_review(source: Path) -> dict[str, object]:
    image = Image.open(source).convert("RGBA")
    alpha = image.getchannel("A")
    visible = alpha.point(lambda value: 255 if value > 8 else 0)
    preview = Image.new("RGB", image.size, MATTE)
    preview.paste(image, mask=alpha)
    preview.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)
    destination = REVIEW / f"{source.stem}-q{QUALITY}.jpg"
    preview.save(destination, "JPEG", quality=QUALITY, optimize=True)
    alpha_histogram = alpha.histogram()
    return {
        "source": source.relative_to(ROOT).as_posix(),
        "sourceSize": image.size,
        "sourceMode": Image.open(source).mode,
        "alphaMinMax": [next(i for i, count in enumerate(alpha_histogram) if count), max(i for i, count in enumerate(alpha_histogram) if count)],
        "alphaBBoxGt8": visible.getbbox(),
        "preview": destination.relative_to(ROOT).as_posix(),
        "previewSize": preview.size,
        "previewFormat": "JPEG",
        "previewQuality": QUALITY,
        "previewMatteRGB": MATTE,
        "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest().upper(),
    }


if __name__ == "__main__":
    REVIEW.mkdir(parents=True, exist_ok=True)
    records = [make_review(source) for source in sorted(RAW.glob("*.png"))]
    (ROOT / "metadata" / "raw-review-summary.json").write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(records, ensure_ascii=False, indent=2))
