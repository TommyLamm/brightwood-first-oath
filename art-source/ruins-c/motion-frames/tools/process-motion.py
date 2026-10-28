"""Create a neutral-matte review and deterministic 192px source frame.

Usage: python process-motion.py <raw-png> <frame-id>
Raw source files are read-only; normalized output and a JPEG review are written
inside the motion-frames directory.
"""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MATTE = (223, 227, 219)


def sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1 << 20), b""):
            digest.update(block)
    return digest.hexdigest()


def alpha_bbox(image: Image.Image):
    alpha = image.getchannel("A")
    return alpha.getbbox()


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: process-motion.py <raw-png> <frame-id>")
    raw = Path(sys.argv[1]).resolve()
    frame_id = sys.argv[2]
    if raw.parent != (ROOT / "raw").resolve():
        raise SystemExit("raw input must be directly under this batch's raw/ directory")
    if not raw.is_file():
        raise SystemExit(f"missing raw source: {raw}")

    normalized_path = ROOT / "normalized" / f"ruins-bell-keeper-{frame_id}.png"
    review_path = ROOT / "review" / f"ruins-bell-keeper-{frame_id}-raw-q70.jpg"
    with Image.open(raw) as loaded:
        source = loaded.convert("RGBA")
        raw_size = source.size
        # Preserve the source image; clear faint matte/edge haze only in the derivative.
        alpha = source.getchannel("A")
        alpha = alpha.point(lambda value: 0 if value < 8 else value)
        source.putalpha(alpha)
        matte = Image.new("RGBA", raw_size, MATTE + (255,))
        matte.alpha_composite(source)
        matte.convert("RGB").save(review_path, "JPEG", quality=70, optimize=True)

        # Scale the complete source canvas uniformly; never crop a limb or detail.
        # Shrink only as needed to retain >=3px transparent padding after alignment.
        base_w, base_h = raw_size
        scale = min(188 / base_w, 188 / base_h)
        limit = min(188, round(base_w * scale), round(base_h * scale))
        resized = None
        origin = None
        bounds = None
        size = limit
        while size >= 16:
            width = max(1, round(base_w * size / max(base_w, base_h)))
            height = max(1, round(base_h * size / max(base_w, base_h)))
            # Pillow's RGBa mode resizes premultiplied RGB to avoid dark edge halos.
            candidate = source.convert("RGBa").resize((width, height), Image.Resampling.LANCZOS).convert("RGBA")
            candidate.putalpha(candidate.getchannel("A").point(lambda value: 0 if value < 8 else value))
            bbox = alpha_bbox(candidate)
            if bbox is None:
                raise SystemExit("source has no visible alpha after low-alpha cleanup")
            left, top, right, bottom = bbox
            # Center the visible bbox at x=96 and place its lowest alpha row at y=188.
            x = round(96 - (left + right) / 2)
            y = 189 - bottom
            shifted = (left + x, top + y, right + x, bottom + y)
            if shifted[0] >= 3 and shifted[1] >= 3 and 192 - shifted[2] >= 3 and 192 - shifted[3] >= 3:
                resized = candidate
                origin = (x, y)
                bounds = shifted
                break
            candidate.close()
            size -= 1
        if resized is None or origin is None or bounds is None:
            raise SystemExit("cannot place the complete source with required transparent margins")
        canvas = Image.new("RGBA", (192, 192), (0, 0, 0, 0))
        canvas.alpha_composite(resized, dest=origin)
        canvas.save(normalized_path, "PNG", optimize=True)
        resized.close()

    with Image.open(normalized_path) as normalized:
        bbox = normalized.getchannel("A").getbbox()
        if bbox is None:
            raise SystemExit("normalized image has no visible alpha")
        left, top, right, bottom = bbox
        margins = [left, top, 192 - right, 192 - bottom]
        if abs((left + right) / 2 - 96) > 0.5 or bottom != 189 or min(margins) < 3:
            raise SystemExit(f"normalized contract failed: bbox={bbox}, margins={margins}")
        print(json.dumps({
            "frame_id": frame_id,
            "raw_path": str(raw),
            "raw_sha256": sha(raw),
            "raw_dimensions": raw_size,
            "raw_mode": "RGBA",
            "normalized_path": str(normalized_path),
            "normalized_sha256": sha(normalized_path),
            "normalized_dimensions": normalized.size,
            "normalized_mode": "RGBA",
            "alpha_bbox": bbox,
            "transparent_margins_ltrb": margins,
            "visible_center_x": (left + right) / 2,
            "last_alpha_row": bottom - 1,
            "review_path": str(review_path),
            "review_dimensions": Image.open(review_path).size,
            "review_quality": 70,
            "review_matte_rgb": MATTE,
            "transform": {
                "method": "full source canvas scaled uniformly with Lanczos; no crop",
                "low_alpha_cutoff": 8,
                "source_canvas_scaled_px": resized.size,
                "source_placement_xy": origin,
                "visible_bbox_in_canvas": bounds,
            },
        }, ensure_ascii=False))


if __name__ == "__main__":
    main()
