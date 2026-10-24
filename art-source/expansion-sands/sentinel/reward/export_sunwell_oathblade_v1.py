from pathlib import Path
from PIL import Image

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[3]
SOURCE_PATH = SCRIPT_DIR / "sunwell-oathblade-raw-v1.png"
ICON_PADDING = 128

with Image.open(SOURCE_PATH) as opened:
    if opened.mode != "RGBA" or opened.size != (1254, 1254):
        raise ValueError(f"Expected RGBA 1254x1254 ImageGen source; got {opened.mode} {opened.size}")
    source = opened.copy()

icon_canvas = Image.new(
    "RGBA",
    (source.width + ICON_PADDING * 2, source.height + ICON_PADDING * 2),
    (0, 0, 0, 0),
)
icon_canvas.paste(source, (ICON_PADDING, ICON_PADDING))

outputs = [
    (icon_canvas.resize((128, 128), Image.Resampling.NEAREST), REPO_ROOT / "public/assets/interface/item-sunwell-oathblade-v1.png"),
    (source.resize((64, 64), Image.Resampling.NEAREST), REPO_ROOT / "public/assets/equipment/sunwell-oathblade-v1.png"),
]
for asset, output_path in outputs:
    alpha = asset.getchannel("A")
    alpha_min, alpha_max = alpha.getextrema()
    if alpha.getbbox() is None or alpha_min != 0 or alpha_max == 0:
        raise AssertionError(f"Expected visible pixels and transparent canvas in {output_path}")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    asset.save(output_path, format="PNG", optimize=True)
    print(f"Wrote {output_path}: {asset.mode} {asset.size}; alpha={alpha.getextrema()}; bounds={alpha.getbbox()}")

preview_path = SCRIPT_DIR / "sunwell-oathblade-preview-32px.png"
preview = outputs[0][0].resize((32, 32), Image.Resampling.NEAREST)
preview.save(preview_path, format="PNG", optimize=True)
print(f"Wrote {preview_path}: {preview.mode} {preview.size}; alpha={preview.getchannel('A').getextrema()}; bounds={preview.getchannel('A').getbbox()}")