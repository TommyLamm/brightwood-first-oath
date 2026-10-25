from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
NORMALIZED = ROOT / "normalized"
REVIEW = ROOT / "review"
MATTE = (223, 227, 219)
SCALE = 4
GAP = 10
LABEL_H = 22


def tile(path: Path, label: str) -> Image.Image:
    sprite = Image.open(path).convert("RGBA").resize((96 * SCALE, 96 * SCALE), Image.Resampling.NEAREST)
    card = Image.new("RGB", (96 * SCALE, 96 * SCALE + LABEL_H), MATTE)
    card.paste(sprite, (0, LABEL_H), sprite.getchannel("A"))
    ImageDraw.Draw(card).text((4, 4), label, fill=(26, 28, 27), font=ImageFont.load_default())
    return card


def contact_sheet(entries: list[tuple[str, str]], columns: int, filename: str) -> Path:
    cards = [tile(NORMALIZED / path, label) for label, path in entries]
    card_w, card_h = cards[0].size
    rows = (len(cards) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * card_w + (columns - 1) * GAP, rows * card_h + (rows - 1) * GAP), MATTE)
    for index, card in enumerate(cards):
        x = (index % columns) * (card_w + GAP)
        y = (index // columns) * (card_h + GAP)
        sheet.paste(card, (x, y))
    REVIEW.mkdir(parents=True, exist_ok=True)
    output = REVIEW / filename
    sheet.save(output, "JPEG", quality=70, optimize=True)
    return output


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("kind", choices=("idle-pair", "walk-cycle"))
    args = parser.parse_args()
    if args.kind == "idle-pair":
        entries = [("idle-0", "../../references/normalized/ruins-string-puppet-idle-0.png"), ("idle-1", "ruins-string-puppet-idle-1.png")]
        output = contact_sheet(entries, 2, "ruins-string-puppet-idle-pair-q70.jpg")
    else:
        entries = [(f"walk-{i}", f"ruins-string-puppet-walk-{i}.png") for i in range(6)]
        output = contact_sheet(entries, 3, "ruins-string-puppet-walk-cycle-q70.jpg")
    print(output.relative_to(ROOT).as_posix())
