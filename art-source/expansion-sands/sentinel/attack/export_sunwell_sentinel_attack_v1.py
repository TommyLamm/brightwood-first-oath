from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent
RAW_PATH = ROOT / "sunwell-sentinel-attack-raw-v1.png"
CELL = 96
BASELINE_Y = 94
COMMON_SCALE_NUM = 96
COMMON_SCALE_DEN = 648
FRAMES = [
    ("06-windup-low", (46, 155, 623, 614)),
    ("07-fists-high", (747, 32, 1236, 614)),
    ("08-low-smash", (65, 766, 674, 1182)),
    ("09-recover", (714, 696, 1289, 1183)),
]

with Image.open(RAW_PATH) as opened:
    if opened.mode != "RGBA":
        raise ValueError(f"Expected original RGBA source; received {opened.mode}")
    raw = opened.copy()

if raw.size != (1296, 1213):
    raise ValueError(f"Unexpected source dimensions: {raw.size}")

preview_cells = []
for name, box in FRAMES:
    crop = raw.crop(box)
    crop.save(ROOT / f"sunwell-sentinel-attack-{name}-crop-v1.png", format="PNG", compress_level=9)

    width = round(crop.width * COMMON_SCALE_NUM / COMMON_SCALE_DEN)
    height = round(crop.height * COMMON_SCALE_NUM / COMMON_SCALE_DEN)
    scaled = crop.resize((width, height), Image.Resampling.NEAREST)
    if width > CELL or height > CELL:
        raise ValueError(f"{name} does not fit the 96x96 preview cell: {scaled.size}")

    cell = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    x = (CELL - width) // 2
    y = BASELINE_Y - height
    cell.alpha_composite(scaled, (x, y))
    cell.save(ROOT / f"sunwell-sentinel-attack-{name}-preview-96px-v1.png", format="PNG", compress_level=9)
    preview_cells.append(cell)

strip = Image.new("RGBA", (CELL * len(preview_cells), CELL), (0, 0, 0, 0))
for index, cell in enumerate(preview_cells):
    strip.paste(cell, (index * CELL, 0))
strip.save(ROOT / "sunwell-sentinel-attack-poses-preview-384x96-v1.png", format="PNG", compress_level=9)
