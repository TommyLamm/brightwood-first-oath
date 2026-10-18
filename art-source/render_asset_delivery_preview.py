"""Render a static asset contact sheet; this is not a game screenshot."""
from pathlib import Path
import json

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"


def main():
    font_path = Path("C:/Windows/Fonts/arial.ttf")
    font = ImageFont.truetype(str(font_path), 16) if font_path.exists() else ImageFont.load_default()
    small = ImageFont.truetype(str(font_path), 13) if font_path.exists() else font
    manifests = [json.loads((PUBLIC / "assets" / pack / "manifest.json").read_text(encoding="utf-8")) for pack in ("actors", "environment", "interface")]
    entries = {entry["key"]: entry for manifest in manifests for entry in manifest["images"]}
    result = Image.new("RGB", (1000, 730), "#283440")
    draw = ImageDraw.Draw(result)

    def label(x, y, text, compact=False):
        draw.text((x, y), text, fill="#e5e9ee", font=small if compact else font)

    def frame(key, index=0, size=None):
        entry = entries[key]
        im = Image.open(PUBLIC / entry["url"]).convert("RGBA")
        width, height = im.width // entry["columns"], im.height // entry["rows"]
        x, y = index % entry["columns"], index // entry["columns"]
        im = im.crop((x * width, y * height, (x + 1) * width, (y + 1) * height))
        return im.resize(size or (entry["displayWidth"], entry["displayHeight"]), Image.Resampling.NEAREST)

    label(24, 18, "Recovered game assets | 2026-10-18 | ImageGen originals + authorized deterministic export")
    for group, costume in enumerate(("cloth", "leather", "iron")):
        x = 28 + group * 322
        label(x, 55, f"Hero {costume}: idle / walk / attack")
        for col, index in enumerate((0, 10, 34)):
            image = frame(f"actor:hero-{costume}", index, (96, 96))
            result.paste(image, (x + col * 98, 82), image)
    label(24, 202, "Recovered creatures and merchant (idle samples; complete animation atlases are delivered)")
    for index, actor in enumerate(("snail", "mushroom", "boar", "golem", "guardian", "merchant")):
        x = 28 + index * 160
        image = frame(f"actor:{actor}", size=(128, 128))
        result.paste(image, (x, 230), image)
        label(x, 363, actor, True)
    label(24, 400, "Heavy strike: anticipation / cleave / contact / shockwave / fragments / ending")
    for index in range(6):
        image = frame("vfx:heavy-strike", index)
        result.paste(image, (108 + index * 128, 425), image)
    label(24, 566, "Platform repeat (112px pitch)")
    tile = frame("env:tile-platform", size=(128, 32))
    for index in range(5):
        result.paste(tile, (28 + index * 112, 605), tile)
    label(650, 566, "Slope material (rotated by renderer)")
    tile = frame("env:tile-slope", size=(128, 128))
    result.paste(tile, (650, 591), tile)
    label(24, 690, "Asset preview only. Gameplay, equipment attachment, browser and iframe integration remain unverified.", True)
    output = ROOT / "art-source" / "asset-delivery-preview-20261018.png"
    result.save(output, optimize=True)
    print(output)


if __name__ == "__main__":
    main()
