"""Refresh the actor manifest's alpha bounds after editing sprite sheets (Pillow)."""

import json
from pathlib import Path

from PIL import Image


def measure(image, public):
    with Image.open(public / image["url"]) as sheet:
        alpha = sheet.convert("RGBA").getchannel("A")
    columns, rows = image["columns"], image["rows"]
    if alpha.width % columns or alpha.height % rows:
        raise ValueError(f"Invalid frame grid for {image['key']}")
    width, height = alpha.width // columns, alpha.height // rows
    foot_offsets = []
    content_width = content_height = 0
    for row in range(rows):
        for column in range(columns):
            x, y = column * width, row * height
            bounds = alpha.crop((x, y, x + width, y + height)).getbbox()
            if bounds is None:
                foot_offsets.append(0)
                continue
            left, top, right, bottom = bounds
            foot_offsets.append(image["displayHeight"] * image["pivotY"] - bottom * image["displayHeight"] / height)
            content_width = max(content_width, (right - left) * image["displayWidth"] / width)
            content_height = max(content_height, (bottom - top) * image["displayHeight"] / height)
    return {"footOffsets": foot_offsets, "width": content_width, "height": content_height}


if __name__ == "__main__":
    public = Path(__file__).resolve().parents[1] / "public"
    manifest = public / "assets/actors/manifest.json"
    data = json.loads(manifest.read_text(encoding="utf-8"))
    for image in data["images"]:
        if image["key"].startswith("actor:"):
            image["metrics"] = measure(image, public)
    manifest.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
