from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
repo = root.parents[2]
poses = [
    ("idle-0 ref", repo / "art-source/ruins-b/references/normalized/ruins-bell-prowler-idle-0.png"),
    ("attack-0", root / "normalized/ruins-bell-prowler-attack-0-v1.png"),
    ("attack-1", root / "normalized/ruins-bell-prowler-attack-1-v1.png"),
    ("attack-2 accepted", repo / "art-source/ruins-b/references/normalized/ruins-bell-prowler-attack-2.png"),
    ("attack-3", root / "normalized/ruins-bell-prowler-attack-3-v1.png"),
    ("hurt-0", root / "normalized/ruins-bell-prowler-hurt-0-v1.png"),
    ("hurt-1", root / "normalized/ruins-bell-prowler-hurt-1-v1.png"),
    ("dead-0", root / "normalized/ruins-bell-prowler-dead-0-v1.png"),
    ("dead-1", root / "normalized/ruins-bell-prowler-dead-1-v1.png"),
    ("dead-2", root / "normalized/ruins-bell-prowler-dead-2-v1.png"),
    ("dead-3", root / "normalized/ruins-bell-prowler-dead-3-v1.png"),
]
matte = (223, 227, 219)
scale = 3
cell_w, cell_h, margin, label_h = 300, 320, 12, 22
cols = 4
rows = (len(poses) + cols - 1) // cols
sheet = Image.new("RGB", (margin + cols * cell_w + margin, margin + rows * cell_h + margin), matte)
draw = ImageDraw.Draw(sheet)
font = ImageFont.load_default()

for index, (label, path) in enumerate(poses):
    col, row = index % cols, index // cols
    x = margin + col * cell_w
    y = margin + row * cell_h
    draw.text((x + 8, y + 5), label, fill=(42, 45, 40), font=font)
    sprite = Image.open(path).convert("RGBA").resize((96 * scale, 96 * scale), Image.Resampling.NEAREST)
    tile = Image.new("RGBA", sprite.size, (*matte, 255))
    tile.alpha_composite(sprite)
    sheet.paste(tile.convert("RGB"), (x + 6, y + label_h))

output = root / "review/ruins-bell-prowler-actions-contact-q70.jpg"
sheet.save(output, "JPEG", quality=70, optimize=True)
print(f"{output.relative_to(repo).as_posix()} {sheet.size[0]}x{sheet.size[1]} JPEG quality=70")
