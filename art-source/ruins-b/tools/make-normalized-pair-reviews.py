from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "references" / "normalized"
REVIEW = ROOT / "references" / "review"
MATTE = (223, 227, 219)
SCALE = 6
QUALITY = 70
PAIRS = {
    "puppet": ("ruins-string-puppet-idle-0.png", "ruins-string-puppet-attack-2.png"),
    "prowler": ("ruins-bell-prowler-idle-0.png", "ruins-bell-prowler-attack-2.png"),
}

REVIEW.mkdir(parents=True, exist_ok=True)
for name, files in PAIRS.items():
    sheet = Image.new("RGB", (96 * SCALE * 2, 96 * SCALE), MATTE)
    for index, filename in enumerate(files):
        frame = Image.open(SOURCE / filename).convert("RGBA")
        tile = Image.new("RGBA", frame.size, (*MATTE, 255))
        tile.alpha_composite(frame)
        tile = tile.resize((96 * SCALE, 96 * SCALE), Image.Resampling.NEAREST)
        sheet.paste(tile.convert("RGB"), (index * 96 * SCALE, 0))
    sheet.save(REVIEW / f"{name}-normalized-pair-q{QUALITY}.jpg", "JPEG", quality=QUALITY, optimize=True)
