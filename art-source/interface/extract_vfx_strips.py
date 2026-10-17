"""Repack isolated ImageGen VFX rows into square runtime frames.

The ImageGen rows are six 362x724 frames. Runtime cells are square, so this
script preserves every source pixel and adds 181 transparent pixels on both
horizontal sides of each frame. It does not crop, resample, redraw, or alter
alpha.
"""

from pathlib import Path
import sys

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "art-source" / "interface"
OUT = ROOT / "public" / "assets" / "interface"

SOURCES = {
    "sweep": "interface-vfx-sweep-v2-attempt1.png",
    "hit": "interface-vfx-hit-v2-attempt1.png",
    "levelup": "interface-vfx-levelup-v2-attempt1.png",
    "guard": "interface-vfx-guard-v2-repair1.png",
}


def repack(name: str, source_name: str, *, replace: bool = False) -> None:
    source_path = ART / source_name
    output_path = OUT / f"vfx-{name}-v2.png"
    if output_path.exists() and not replace:
        raise FileExistsError(f"Refusing to overwrite runtime asset: {output_path}")

    with Image.open(source_path) as opened:
        source = opened.convert("RGBA")
    width, height = source.size
    if height != 724 or width != 2172 or width % 6:
        raise ValueError(f"Unexpected {name} source dimensions: {source.size}")

    frame_width = width // 6
    if frame_width > height:
        raise ValueError(f"Cannot square-pad {name} frames without cropping")
    side_pad = (height - frame_width) // 2
    result = Image.new("RGBA", (height * 6, height), (0, 0, 0, 0))
    for index in range(6):
        frame = source.crop((index * frame_width, 0, (index + 1) * frame_width, height))
        result.paste(frame, (index * height + side_pad, 0))
    result.save(output_path, format="PNG", optimize=True)


if __name__ == "__main__":
    arguments = sys.argv[1:]
    replace = "--replace" in arguments
    requested = [arg for arg in arguments if arg != "--replace"]
    unknown = set(requested) - set(SOURCES)
    if unknown:
        choices = ", ".join(SOURCES)
        raise SystemExit(f"unknown VFX key(s): {', '.join(sorted(unknown))}; choices: {choices}")
    selected = requested or list(SOURCES)
    for key in selected:
        filename = SOURCES[key]
        repack(key, filename, replace=replace)
