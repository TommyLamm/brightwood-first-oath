from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[2]
MATTE = (223, 227, 219)
SCALE = 3
GAP = 8
LABEL_HEIGHT = 26
CELL_W = 96 * SCALE
CELL_H = LABEL_HEIGHT + 96 * SCALE
COLS = 4
ROWS = 3
OUTPUT = ROOT / "review" / "puppet-actions-contact-q70.jpg"

frames = [
    ("idle-0 ref", REPO / "art-source/ruins-b/references/normalized/ruins-string-puppet-idle-0.png"),
    ("attack-0", ROOT / "normalized/ruins-string-puppet-attack-0.png"),
    ("attack-1", ROOT / "normalized/ruins-string-puppet-attack-1.png"),
    ("attack-2 ref", REPO / "art-source/ruins-b/references/normalized/ruins-string-puppet-attack-2.png"),
    ("attack-3", ROOT / "normalized/ruins-string-puppet-attack-3.png"),
    ("hurt-0", ROOT / "normalized/ruins-string-puppet-hurt-0.png"),
    ("hurt-1", ROOT / "normalized/ruins-string-puppet-hurt-1.png"),
    ("dead-0", ROOT / "normalized/ruins-string-puppet-dead-0.png"),
    ("dead-1", ROOT / "normalized/ruins-string-puppet-dead-1.png"),
    ("dead-2", ROOT / "normalized/ruins-string-puppet-dead-2.png"),
    ("dead-3", ROOT / "normalized/ruins-string-puppet-dead-3.png"),
]

width = COLS * CELL_W + (COLS + 1) * GAP
height = ROWS * CELL_H + (ROWS + 1) * GAP
sheet = Image.new("RGB", (width, height), MATTE)
draw = ImageDraw.Draw(sheet)
font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 16)

for index, (label, path) in enumerate(frames):
    column, row = index % COLS, index // COLS
    x, y = GAP + column * (CELL_W + GAP), GAP + row * (CELL_H + GAP)
    draw.text((x + 4, y + 4), label, fill=(32, 38, 35), font=font)
    image = Image.open(path).convert("RGBA")
    image = image.resize((CELL_W, 96 * SCALE), Image.Resampling.NEAREST)
    sheet.paste(image, (x, y + LABEL_HEIGHT), mask=image.getchannel("A"))

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
sheet.save(OUTPUT, "JPEG", quality=70, optimize=True)
print(f"{OUTPUT.relative_to(REPO).as_posix()} {sheet.size} JPEG q70")
