"""Manual hand/crown annotations on reviewed 128px final frames, exported to 96px.

The arrays are measurements on the v9 artwork, not collision-body coordinates.
Review crosses are retained separately; the runtime PNGs are never marked.
Weapon rotation is an authored pose cue for the independent equipment overlay.
"""
from pathlib import Path
import json

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[3]
ART = ROOT / "art-source/actors/hero"
OUT = ROOT / "public/assets/actors"
STATES = ["idle", "walk", "jump", "climb", "attack", "hurt", "dead", "buff"]

# Each tuple is (hand x, hand y, crown x, crown y) in the final 128px cell.
ANNOTATIONS = {
    "cloth": {
        "idle": [(73,90,65,40), (74,90,65,40), (74,90,65,40), (73,90,65,40)],
        "walk": [(75,86,65,41), (77,86,67,40), (79,83,69,40), (77,82,65,39), (80,83,67,40), (74,82,65,41)],
        "jump": [(78,83,65,42), (80,88,68,46)],
        "climb": [(88,43,59,43), (84,48,59,44), (79,36,60,40), (85,47,63,43)],
        "attack": [(78,79,65,42), (75,82,65,47), (73,80,65,42), (88,73,69,44), (94,72,67,39), (88,78,68,44)],
        "hurt": [(80,79,64,43), (61,90,65,47)],
        "dead": [(77,80,64,50), (73,84,64,58), (74,103,66,82), (77,105,86,85)],
        "buff": [(78,84,63,48), (77,85,64,49), (79,84,64,48), (78,84,64,49)],
    },
    "leather": {
        "idle": [(80,87,70,32), (80,88,70,32), (80,88,70,32), (80,88,70,32)],
        "walk": [(82,78,69,35), (87,78,72,35), (90,73,71,35), (90,76,70,34), (90,77,70,34), (88,78,69,35)],
        "jump": [(83,81,69,40), (87,80,70,38)],
        "climb": [(91,37,61,37), (87,46,63,40), (83,52,66,37), (90,36,62,37)],
        "attack": [(87,75,67,36), (93,65,68,34), (95,55,69,31), (95,67,68,35), (96,76,67,37), (96,56,68,37)],
        "hurt": [(79,50,42,45), (65,81,69,42)],
        "dead": [(75,72,43,35), (77,88,51,64), (56,101,35,87), (56,101,35,93)],
        "buff": [(84,78,69,38), (89,45,62,39), (83,69,62,31), (84,78,69,38)],
    },
    "iron": {
        "idle": [(79,91,63,35), (80,91,63,35), (83,90,66,36), (79,91,64,36)],
        "walk": [(80,84,66,40), (84,82,68,39), (83,82,67,39), (85,83,68,39), (85,83,67,40), (86,83,68,41)],
        "jump": [(86,86,67,44), (85,84,67,41)],
        "climb": [(88,40,64,42), (86,44,64,44), (85,40,64,44), (85,41,64,42)],
        "attack": [(89,77,69,36), (93,72,67,32), (94,71,72,33), (89,76,68,37), (85,83,67,42), (95,77,67,39)],
        "hurt": [(62,89,66,43), (67,88,70,44)],
        "dead": [(72,85,63,45), (73,103,63,64), (54,108,45,93), (53,108,42,91)],
        "buff": [(77,86,63,44), (81,84,64,44), (85,84,66,43), (85,84,66,43)],
    },
}


def main():
    anchors = {"version": 1, "coordinateSpace": {"width": 96, "height": 96, "origin": "frame-top-left", "facing": "right", "sourceFramePixels": 128}, "heroes": {}}
    for costume, states in ANNOTATIONS.items():
        sheet = Image.open(OUT / f"hero-{costume}-v9.png").convert("RGBA")
        review = Image.new("RGB", (1024, 1088), "#283440")
        draw = ImageDraw.Draw(review)
        anchors["heroes"][costume] = {}
        for row, state in enumerate(STATES):
            frames = []
            for col, (hx, hy, tx, ty) in enumerate(states[state]):
                rotation = [-45, -75, -25, 25, 65, 25][col] if state == "attack" else -15
                frames.append({"hand": {"x": hx * .75, "y": hy * .75, "rotationDeg": rotation}, "head": {"x": tx * .75, "y": ty * .75}})
                image = sheet.crop((col * 128, row * 128, (col + 1) * 128, (row + 1) * 128))
                x, y = col * 128, row * 136 + 8
                review.paste(image, (x, y), image)
                draw.text((x + 2, row * 136), f"{state}:{col}", fill="#e5e9ee")
                for px, py, color in ((hx,hy,"#ffcf48"), (tx,ty,"#6ed4ff")):
                    draw.line((x+px-3,y+py,x+px+3,y+py), fill=color)
                    draw.line((x+px,y+py-3,x+px,y+py+3), fill=color)
            anchors["heroes"][costume][state] = frames
        review.save(ART / f"hero-{costume}-v9-anchors-review.png", optimize=True)
    (OUT / "anchors.json").write_text(json.dumps(anchors, indent=2) + "\n", encoding="utf-8")
    print("Exported 96 effective-frame hand/crown anchors in 96x96 display coordinates")


if __name__ == "__main__":
    main()
