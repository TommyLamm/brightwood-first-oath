from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "art-source" / "interface"
RUNTIME = ROOT / "public" / "assets" / "interface"
RUNTIME.mkdir(parents=True, exist_ok=True)


def cell(sheet_name: str, columns: int, rows: int, index: int) -> Image.Image:
    sheet = Image.open(SOURCE / sheet_name).convert("RGBA")
    col = index % columns
    row = index // columns
    left = col * sheet.width // columns
    right = (col + 1) * sheet.width // columns
    top = row * sheet.height // rows
    bottom = (row + 1) * sheet.height // rows
    return sheet.crop((left, top, right, bottom))


def save_icon(sheet_name: str, index: int, filename: str) -> None:
    source = cell(sheet_name, 4, 4, index)
    source.resize((128, 128), Image.Resampling.LANCZOS).save(RUNTIME / filename, optimize=True)


def save_piece(sheet_name: str, index: int, filename: str, canvas_size: tuple[int, int]) -> None:
    source = cell(sheet_name, 3, 3, index)
    bounds = source.getchannel("A").point(lambda alpha: 255 if alpha >= 16 else 0).getbbox()
    if bounds is None:
        raise ValueError(f"empty UI cell {index} in {sheet_name}")
    content = source.crop(bounds)
    content.thumbnail(canvas_size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
    canvas.alpha_composite(content, ((canvas.width - content.width) // 2, (canvas.height - content.height) // 2))
    canvas.save(RUNTIME / filename, optimize=True)


images: list[dict[str, object]] = []


def add(key: str, filename: str, width: int, height: int) -> None:
    images.append({
        "key": key,
        "url": f"assets/interface/{filename}",
        "columns": 1,
        "rows": 1,
        "displayWidth": width,
        "displayHeight": height,
        "pivotX": 0.5,
        "pivotY": 0.5,
    })


item_ids = [
    "starter-sword", "iron-sword", "steel-sword", "guardian-sword",
    "cloth-shirt", "leather-vest", "iron-mail", "cloth-cap",
    "leather-cap", "iron-helm", "small-red", "large-red",
    "small-blue", "large-blue",
]
for index, item_id in enumerate(item_ids):
    filename = f"item-{item_id}-v1.png"
    save_icon("interface-items-sheet-v1.png", index, filename)
    add(f"item:{item_id}", filename, 32, 32)

material_ids = [
    "snail-shell", "slime-gel", "mushroom-cap", "boar-tusk", "stone-chip",
    "metal-shard", "forest-seed", "spore-sample", "ridge-emblem", "guardian-core",
]
for index, item_id in enumerate(material_ids):
    filename = f"item-{item_id}-v1.png"
    save_icon("interface-materials-sheet-v1.png", index, filename)
    add(f"item:{item_id}", filename, 32, 32)

skill_ids = ["heavy-strike", "sweep", "iron-guard", "vitality", "rest-recovery"]
for index, skill_id in enumerate(skill_ids):
    filename = f"skill-{skill_id}-v1.png"
    save_icon("interface-skills-sheet-v1.png", index, filename)
    add(f"skill:{skill_id}", filename, 32, 32)

marker_ids = ["quest", "portal", "shop", "player"]
for index, marker_id in enumerate(marker_ids):
    source = cell("interface-markers-sheet-v1.png", 2, 2, index)
    filename = f"marker-{marker_id}-v1.png"
    source.resize((128, 128), Image.Resampling.LANCZOS).save(RUNTIME / filename, optimize=True)
    add(f"marker:{marker_id}", filename, 32, 32)

skin_pieces = [
    ("panel:frame", "panel-frame-v1.png", (256, 256), (224, 224)),
    ("button:normal", "button-normal-v1.png", (512, 160), (192, 60)),
    ("button:hover", "button-hover-v1.png", (512, 160), (192, 60)),
    ("button:pressed", "button-pressed-v1.png", (512, 160), (192, 60)),
    ("bar:hp", "bar-hp-v1.png", (512, 160), (192, 60)),
    ("bar:mp", "bar-mp-v1.png", (512, 160), (192, 60)),
    ("bar:exp", "bar-exp-v1.png", (512, 160), (192, 60)),
    ("slot:normal", "slot-normal-v1.png", (160, 160), (48, 48)),
    ("slot:selected", "slot-selected-v1.png", (160, 160), (48, 48)),
]
for index, (key, filename, canvas_size, display_size) in enumerate(skin_pieces):
    save_piece("interface-skins-sheet-v2-repair1.png", index, filename, canvas_size)
    add(key, filename, *display_size)

manifest = {
    "version": 1,
    "pack": "interface",
    "images": images,
    "animations": [],
    "audio": [],
}
(RUNTIME / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

review_keys = [image["key"] for image in images if str(image["key"]).startswith(("item:", "skill:", "marker:"))]
review = Image.new("RGBA", (6 * 80, 6 * 80), (35, 42, 52, 255))
for index, key in enumerate(review_keys):
    entry = next(image for image in images if image["key"] == key)
    filename = str(entry["url"]).split("/")[-1]
    icon_32 = Image.open(RUNTIME / filename).convert("RGBA").resize((32, 32), Image.Resampling.LANCZOS)
    icon_zoom = icon_32.resize((64, 64), Image.Resampling.NEAREST)
    x = (index % 6) * 80 + 8
    y = (index // 6) * 80 + 8
    review.alpha_composite(icon_zoom, (x, y))
review.save(SOURCE / "interface-icons-review-32px-v1.png", optimize=True)

missing_vfx = ["vfx:heavy-strike", "vfx:sweep", "vfx:hit", "vfx:levelup", "vfx:guard"]
print(f"wrote {len(images)} images; generated 32px review sheet; missing VFX alpha validation: {', '.join(missing_vfx)}")
