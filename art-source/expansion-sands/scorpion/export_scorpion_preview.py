from pathlib import Path
from PIL import Image
from statistics import median

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "art-source" / "expansion-sands" / "scorpion"
SAND_SKY = Path(r"C:\Users\Tommy\Desktop\brightwood-first-oath\public\assets\environment\env-sand-sky-v1.png")
CELL = 96
PAD = 24
TARGET_SILHOUETTE_WIDTH = 72
# Thresholds are used only to find crop coordinates, never to alter alpha/RGB.
# The raw ImageGen files remain byte-identical; source pixels inside each crop
# are preserved and resampled with nearest-neighbor for the 96px runtime.
POSE_SOURCES = [
    ("idle", "sand-scorpion-idle-2pose-raw-v1.png", 2, 1, 32),
    ("walk", "sand-scorpion-walk-4pose-raw-v1.png", 4, 1, 32),
    ("attack", "sand-scorpion-sting-4pose-raw-v1.png", 2, 2, 128),
    ("hurt", "sand-scorpion-hurt-2pose-raw-v2.png", 2, 1, 32),
    ("dead", "sand-scorpion-dead-4pose-raw-v1.png", 4, 1, 32),
]


def threshold_bbox(alpha, threshold):
    return alpha.point(lambda value: 255 if value > threshold else 0).getbbox()


def expand_box(box, bounds, padding):
    left, top, right, bottom = box
    min_x, min_y, max_x, max_y = bounds
    return (
        max(min_x, left - padding),
        max(min_y, top - padding),
        min(max_x, right + padding),
        min(max_y, bottom + padding),
    )


frames = []
for state, filename, columns, rows, threshold in POSE_SOURCES:
    source = Image.open(SOURCE / filename).convert("RGBA")
    for row in range(rows):
        for column in range(columns):
            cell_bounds = (
                column * source.width // columns,
                row * source.height // rows,
                (column + 1) * source.width // columns,
                (row + 1) * source.height // rows,
            )
            raw_cell = source.crop(cell_bounds)
            bbox = threshold_bbox(raw_cell.getchannel("A"), threshold)
            if bbox is None:
                raise RuntimeError(f"No visible pose: {filename} row {row} col {column}")
            absolute_bbox = (
                bbox[0] + cell_bounds[0],
                bbox[1] + cell_bounds[1],
                bbox[2] + cell_bounds[0],
                bbox[3] + cell_bounds[1],
            )
            crop_box = expand_box(absolute_bbox, cell_bounds, PAD)
            crop = source.crop(crop_box)
            frames.append({
                "state": state,
                "source": filename,
                "row": row,
                "column": column,
                "threshold_for_crop_only": threshold,
                "cell_bounds": cell_bounds,
                "bbox": absolute_bbox,
                "crop_box": crop_box,
                "crop": crop,
            })
            print(f"{state}[{row},{column}] cell={cell_bounds} bbox={absolute_bbox} crop={crop_box}")

source_widths = {}
for frame in frames:
    source_widths.setdefault(frame["source"], []).append(frame["bbox"][2] - frame["bbox"][0])
group_scales = {
    filename: TARGET_SILHOUETTE_WIDTH / median(widths)
    for filename, widths in source_widths.items()
}
for filename, scale in group_scales.items():
    print(f"source_scale[{filename}]={scale:.6f} median_hard_width={median(source_widths[filename])}")

atlas = Image.new("RGBA", (4 * CELL, 4 * CELL), (0, 0, 0, 0))
for index, frame in enumerate(frames):
    scale = group_scales[frame["source"]]
    resized_size = (
        max(1, round(frame["crop"].width * scale)),
        max(1, round(frame["crop"].height * scale)),
    )
    if resized_size[0] > CELL or resized_size[1] > CELL:
        raise RuntimeError(f"Pose does not fit 96px cell: {frame['state']} {resized_size}")
    sprite = frame["crop"].resize(resized_size, Image.Resampling.NEAREST)
    col, row = index % 4, index // 4
    x = col * CELL + (CELL - sprite.width) // 2
    y = row * CELL + CELL - 2 - sprite.height
    atlas.alpha_composite(sprite, (x, y))
    print(f"frame[{index}]={frame['state']} crop={frame['crop_box']} scale={scale:.6f} scaled={resized_size} at={(x, y)}")

atlas_path = SOURCE / "sand-scorpion-atlas-preview-96px.png"
atlas.save(atlas_path)

sky = Image.open(SAND_SKY).convert("RGBA")
preview = Image.new("RGBA", atlas.size, (0, 0, 0, 0))
for row in range(4):
    for col in range(4):
        sx = min(sky.width - CELL, col * 144)
        sy = min(sky.height - CELL, 260 + row * 56)
        patch = sky.crop((sx, sy, sx + CELL, sy + CELL))
        preview.alpha_composite(patch, (col * CELL, row * CELL))
preview.alpha_composite(atlas)
preview_path = SOURCE / "sand-scorpion-preview-96px-sky-v1.png"
preview.save(preview_path)
print(f"saved={atlas_path}")
print(f"saved={preview_path}")
print(f"frames={len(frames)} atlas_size={atlas.size} mode={atlas.mode} alpha={atlas.getchannel('A').getextrema()}")


