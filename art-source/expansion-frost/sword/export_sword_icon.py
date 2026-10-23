from pathlib import Path
from PIL import Image

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[2]
SOURCE_PATH = SCRIPT_DIR / "frost-tide-sword-icon-imagegen-rgba-1254.png"
OUTPUT_PATH = REPO_ROOT / "public/assets/interface/item-frost-tide-sword-v1.png"
OUTPUT_SIZE = 128
TRANSPARENT_PADDING = 128

with Image.open(SOURCE_PATH) as opened:
    if opened.mode != "RGBA" or opened.size != (1254, 1254):
        raise ValueError(f"Expected transparent RGBA 1254x1254 ImageGen output; got {opened.mode} {opened.size}")
    source = opened.copy()

padded_size = (source.width + TRANSPARENT_PADDING * 2, source.height + TRANSPARENT_PADDING * 2)
padded = Image.new("RGBA", padded_size, (0, 0, 0, 0))
padded.paste(source, (TRANSPARENT_PADDING, TRANSPARENT_PADDING))
# Nearest-neighbor is format/size preparation only and retains hard pixel edges and alpha.
asset = padded.resize((OUTPUT_SIZE, OUTPUT_SIZE), Image.Resampling.NEAREST)
alpha = asset.getchannel("A")
if alpha.getbbox() is None or min(alpha.getextrema()) != 0 or max(alpha.getextrema()) == 0:
    raise AssertionError("Expected visible sword pixels and transparent canvas")
OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
asset.save(OUTPUT_PATH, format="PNG", optimize=True)
print(f"Wrote {OUTPUT_PATH}: {asset.mode} {asset.size}; alpha={alpha.getextrema()}; alpha bounds={alpha.getbbox()}")
