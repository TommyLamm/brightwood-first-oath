"""Export the existing ImageGen v8 artwork after authorized deterministic cleanup.

Run from any directory with Python + Pillow + NumPy. The original is untouched.
Source regions follow the six visible, isolated motifs rather than assuming the
generator placed them on mathematically equal columns. All frames use one scale
and one ground baseline; the first/last effects therefore remain naturally small.
"""
from pathlib import Path
import hashlib
import json

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "art-source/interface"
SOURCE = ART / "interface-vfx-heavy-strike-v8-attempt1.png"
OUT = ROOT / "public/assets/interface/vfx-heavy-strike-v9.png"
REGIONS = [(0, 370), (370, 780), (780, 1080), (1080, 1470), (1470, 1880), (1880, 2172)]
PALETTE = np.array([
    [32, 55, 71], [51, 87, 117], [91, 136, 168], [155, 201, 228],
    [234, 248, 255], [188, 122, 36], [232, 172, 53], [255, 226, 160],
], dtype=np.int32)


def export():
    source = Image.open(SOURCE).convert("RGBA")
    assert source.size == (2172, 724), "Review region coordinates for a different source"
    sheet = Image.new("RGBA", (768, 128))
    frames, metrics = [], []
    for index, (left, right) in enumerate(REGIONS):
        pixels = np.array(source.crop((left, 0, right, source.height)))
        mask = pixels[:, :, 3] >= 128
        # Snap edge contamination and blended RGB to the intended steel/gold palette.
        rgb = pixels[:, :, :3].astype(np.int32)
        nearest = ((rgb[:, :, None, :] - PALETTE[None, None, :, :]) ** 2).sum(axis=3).argmin(axis=2)
        pixels[:, :, :3] = PALETTE[nearest]
        pixels[:, :, 3] = np.where(mask, 255, 0)
        pixels[~mask] = 0
        cleaned = Image.fromarray(pixels, "RGBA")
        bounds = cleaned.getbbox()
        assert bounds
        motif = cleaned.crop(bounds)
        motif = motif.resize((max(1, round(motif.width / 4)), max(1, round(motif.height / 4))), Image.Resampling.NEAREST)
        frame = Image.new("RGBA", (128, 128))
        x = (128 - motif.width) // 2
        y = round((bounds[1] - 52) / 4)
        frame.paste(motif, (x, y))
        bbox = frame.getbbox()
        margins = [bbox[0], bbox[1], 128 - bbox[2], 128 - bbox[3]]
        assert min(margins) >= 16, (index, margins)
        assert set(np.unique(np.asarray(frame)[:, :, 3])) <= {0, 255}
        sheet.paste(frame, (index * 128, 0))
        frames.append(frame)
        metrics.append({"frame": index, "sourceRegion": [left, 0, right, 724], "coreBoundsInRegion": list(bounds), "runtimeBounds": list(bbox), "margins": margins})
    sheet.save(OUT, optimize=True)
    preview = Image.new("RGB", (768, 152), "#283440")
    for i, frame in enumerate(frames):
        preview.paste(frame, (i * 128, 0), frame)
        ImageDraw.Draw(preview).text((i * 128 + 52, 132), str(i + 1), fill="#e2e7ed")
    preview.save(ART / "heavy-strike-v9-review.png")
    # A separate review animation holds the final frame before replaying.
    animated = []
    for frame in frames:
        bg = Image.new("RGBA", (128, 128), "#283440")
        bg.alpha_composite(frame)
        animated.append(bg.resize((384, 384), Image.Resampling.NEAREST).convert("RGB"))
    animated[0].save(ART / "heavy-strike-v9-review.gif", save_all=True, append_images=animated[1:], duration=[60] * 5 + [400], loop=0, disposal=2)
    report = {"source": str(SOURCE.relative_to(ROOT)), "sourceSha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(), "output": str(OUT.relative_to(ROOT)), "outputSha256": hashlib.sha256(OUT.read_bytes()).hexdigest(), "size": [768, 128], "alpha": [0, 255], "palette": PALETTE.tolist(), "bytes": OUT.stat().st_size, "frames": metrics}
    (ART / "heavy-strike-v9-export.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    export()
