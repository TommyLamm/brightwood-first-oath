"""Deterministically export ImageGen terrain sources; requires Pillow and numpy.

Run from any directory with Python 3.  Originals are never changed.  Only the
two versioned runtime PNGs and the source-only review/metrics files are written.
The generated art supplies every material; this script crops, resizes, reduces
the palette, cleans alpha, and matches repeat-edge bands for the renderer.
"""

from hashlib import sha256
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "art-source/environment"
RUNTIME = ROOT / "public/assets/environment"


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def sampled_material(filename, crop, size):
    """Keep only fully covered interior material; NN prevents soft new edges."""
    original = Image.open(SOURCE / filename).convert("RGBA")
    material = original.crop(crop).resize(size, Image.Resampling.NEAREST)
    alpha = np.asarray(material.getchannel("A"))
    assert int(alpha.min()) >= 224, "crop must stay inside the generated material"
    rgb = material.convert("RGB").quantize(
        colors=48, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE
    ).convert("RGB")
    result = np.asarray(rgb).copy()
    palette = np.unique(result.reshape(-1, 3), axis=0)
    # Match a narrow wrap band. Blends are snapped to existing material colors,
    # so no antialias colors or new painted details enter the generated palette.
    width = result.shape[1]
    band = 8
    original_rgb = result.copy().astype(np.float32)
    seam = (original_rgb[:, 0] + original_rgb[:, -1]) / 2
    for offset in range(band):
        weight = offset / band
        for x in (offset, width - 1 - offset):
            blended = seam * (1 - weight) + original_rgb[:, x] * weight
            distances = ((blended[:, None, :] - palette[None, :, :]) ** 2).sum(axis=2)
            result[:, x] = palette[distances.argmin(axis=1)]
    assert np.array_equal(result[:, 0], result[:, -1])
    return Image.fromarray(result, "RGB").convert("RGBA")


platform_source = "env-tile-platform-t11-06-stone-timber-one-shot-20261018.png"
slope_source = "env-tile-slope-t11-06-fresh-correction-20261018-v2.png"
# A central plate segment preserves the generated stone blocks and timber apron
# without shrinking an entire very-wide strip into one small cell.
platform_crop = (750, 305, 1198, 425)
slope_crop = (100, 192, 1150, 1160)
platform = Image.new("RGBA", (128, 32))
platform.paste(sampled_material(platform_source, platform_crop, (112, 30)), (8, 0))
# The renderer rotates a horizontal material tile. A diagonal wedge would apply
# the slope angle twice and put its walking surface below the true foothold.
slope = Image.new("RGBA", (128, 128))
slope.paste(sampled_material(slope_source, slope_crop, (128, 127)), (0, 0))

outputs = [("env:tile-platform", "env-tile-platform-v1.png", platform),
           ("env:tile-slope", "env-tile-slope-v1.png", slope)]
for _, filename, sprite in outputs:
    sprite.save(RUNTIME / filename, optimize=True)

p = np.asarray(platform)
s = np.asarray(slope)
assert np.count_nonzero(p[:, :8, 3]) == 0
assert np.count_nonzero(p[:, 120:, 3]) == 0
assert np.all(p[0, 8:120, 3] == 255)
assert np.array_equal(p[:, 8], p[:, 119])
assert np.all(s[0, :, 3] == 255)
assert np.array_equal(s[:, 0], s[:, -1])
for sprite in (p, s):
    assert set(np.unique(sprite[:, :, 3])).issubset({0, 255})
    assert np.count_nonzero(sprite[sprite[:, :, 3] == 0, :3]) == 0

metrics = {
    "tool": "deterministic Pillow/numpy export of retained built-in ImageGen originals",
    "sources": [{"file": platform_source, "sha256": digest(SOURCE / platform_source),
                 "crop": platform_crop, "nearest_neighbor_size": [112, 30]},
                {"file": slope_source, "sha256": digest(SOURCE / slope_source),
                 "crop": slope_crop, "nearest_neighbor_size": [128, 127]}],
    "palette_colors_per_material": 48,
    "repeat_edge_band_px": 8,
    "platform_side_gutter_px": 8,
    "platform_active_pitch_px": 112,
    "platform_top_coverage": 112,
    "slope_top_coverage": 128,
    "partial_alpha_pixels": 0,
    "platform_active_edge_mismatched_rows": 0,
    "slope_repeat_edge_mismatched_rows": 0,
    "outputs": [{"key": key, "file": name, "size": list(sprite.size),
                 "bytes": (RUNTIME / name).stat().st_size,
                 "sha256": digest(RUNTIME / name)} for key, name, sprite in outputs],
    "renderer_integration": "not verified; no browser or game run",
}
(SOURCE / "terrain-v1-export.json").write_text(
    json.dumps(metrics, indent=2) + "\n", encoding="utf-8"
)

# One source-only sheet shows native pixels, the 112px platform repetition, the
# slope material repeat, and a nearest-neighbor rotated 16-degree illustration.
review = Image.new("RGB", (1160, 900), "#283742")
draw = ImageDraw.Draw(review)
draw.text((24, 16), "Generated terrain export: platform native / 4x / 112px pitch", fill="white")
review.paste(platform, (24, 44), platform)
large = platform.resize((512, 128), Image.Resampling.NEAREST)
review.paste(large, (24, 96), large)
platform_strip = Image.new("RGBA", (352, 32))
for x in (0, 112, 224):
    platform_strip.alpha_composite(platform, (x, 0))
large = platform_strip.resize((1056, 96), Image.Resampling.NEAREST)
review.paste(large, (24, 256), large)
draw.text((24, 380), "Slope: native / 2x / three repeated cells", fill="white")
review.paste(slope, (24, 408), slope)
large = slope.resize((256, 256), Image.Resampling.NEAREST)
review.paste(large, (184, 408), large)
slope_strip = Image.new("RGBA", (384, 128))
for x in (0, 128, 256):
    slope_strip.alpha_composite(slope, (x, 0))
review.paste(slope_strip, (472, 408), slope_strip)
rotated = slope_strip.rotate(16, resample=Image.Resampling.NEAREST, expand=True)
review.paste(rotated, (472, 598), rotated)
draw.text((24, 720), "Bottom right: -16 degree display illustration; game integration unverified", fill="white")
review.save(SOURCE / "terrain-v1-review.png", optimize=True)
print(json.dumps(metrics, indent=2))
