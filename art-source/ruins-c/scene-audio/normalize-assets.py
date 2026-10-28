"""Deterministic runtime sizing and alpha cleanup for Ruins C generated art."""

import hashlib
import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "art-source/ruins-c/scene-audio"


def transparent_clean(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A").point(lambda value: 0 if value < 3 else value)
    rgba.putalpha(alpha)
    pixels = rgba.load()
    alpha_pixels = alpha.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            if alpha_pixels[x, y] == 0:
                pixels[x, y] = (0, 0, 0, 0)
    return rgba


def save_png(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="PNG", optimize=True, compress_level=9)


def update_metadata(stem: str, runtime_path: str, transform: str) -> None:
    metadata = SOURCE / f"{stem}.metadata.json"
    value = json.loads(metadata.read_text(encoding="utf-8-sig"))
    runtime_file = ROOT / runtime_path
    value["runtimePath"] = runtime_path.replace("\\", "/")
    value["runtimeSha256"] = hashlib.sha256(runtime_file.read_bytes()).hexdigest()
    value["normalization"] = transform
    metadata.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


sky_path = SOURCE / "ruins-sanctum-sky.raw.png"
sky = Image.open(sky_path).convert("RGB").resize((960, 540), Image.Resampling.LANCZOS)
sky_runtime = "public/assets/environment/env-ruins-sanctum-sky-v1.png"
save_png(sky, ROOT / sky_runtime)
update_metadata("ruins-sanctum-sky", sky_runtime, "RGB resize 1672x941 to 960x540; optimized PNG")

far = transparent_clean(Image.open(SOURCE / "ruins-sanctum-far.raw.png"))
far = far.resize((1440, 540), Image.Resampling.LANCZOS)
far_runtime = "public/assets/environment/env-ruins-sanctum-far-v1.png"
save_png(far, ROOT / far_runtime)
update_metadata("ruins-sanctum-far", far_runtime, "RGBA resize 2048x768 to 1440x540; clear alpha below 3 and zero RGB where fully transparent; optimized PNG")

mid_source = transparent_clean(Image.open(SOURCE / "ruins-sanctum-mid.raw.png"))
band_height = round(mid_source.height / 3)
mid_band = mid_source.crop((0, 0, mid_source.width, band_height)).resize((1920, 180), Image.Resampling.LANCZOS)
mid = Image.new("RGBA", (1920, 540), (0, 0, 0, 0))
mid.alpha_composite(mid_band, (0, 0))
mid_pixels = mid.load()
for y in range(180, 540):
    for x in range(1920):
        mid_pixels[x, y] = (0, 0, 0, 0)
mid_runtime = "public/assets/environment/env-ruins-sanctum-mid-v1.png"
save_png(mid, ROOT / mid_runtime)
update_metadata("ruins-sanctum-mid", mid_runtime, f"RGBA top-band crop {mid_source.width}x{band_height} resized to 1920x180 on transparent 1920x540 canvas; y>=180 cleared; alpha below 3 cleared; optimized PNG")


def fit_rgba(source_path: Path, output_path: str, box: tuple[int, int], bottom_pivot: bool = False) -> None:
    image = transparent_clean(Image.open(source_path))
    bbox = image.getchannel("A").getbbox()
    if not bbox:
        raise ValueError(f"Generated image has no visible alpha: {source_path}")
    image = image.crop(bbox)
    width, height = box
    scale = min(width / image.width, height / image.height)
    size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    image = image.resize(size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    x = (128 - image.width) // 2
    y = 128 - image.height if bottom_pivot else (128 - image.height) // 2
    canvas.alpha_composite(image, (x, y))
    save_png(canvas, ROOT / output_path)


icon_runtime = "public/assets/interface/item-oathfarer-circlet-v1.png"
fit_rgba(SOURCE / "oathfarer-circlet-icon.raw.png", icon_runtime, (108, 108))
update_metadata("oathfarer-circlet-icon", icon_runtime, "RGBA alpha-bound crop, contain within 108x108, centered on transparent 128x128 canvas; alpha below 3 cleared; optimized PNG")

overlay_runtime = "public/assets/actors/equip-oathfarer-circlet-v1.png"
fit_rgba(SOURCE / "oathfarer-circlet-overlay.raw.png", overlay_runtime, (116, 86), bottom_pivot=True)
update_metadata("oathfarer-circlet-overlay", overlay_runtime, "RGBA alpha-bound crop, contain within 116x86, horizontal center and bottom-align to transparent 128x128 canvas; alpha below 3 cleared; optimized PNG")
