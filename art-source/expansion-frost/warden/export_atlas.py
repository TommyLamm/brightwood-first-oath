from pathlib import Path

from PIL import Image


SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[2]
SOURCE_PATH = SCRIPT_DIR / "frost-tide-warden-atlas-spacing-edit-1373x1145.png"
OUTPUT_PATH = REPO_ROOT / "public/assets/actors/monsters/frost-tide-warden-atlas-v1.png"
REPORT_PATH = SCRIPT_DIR / "atlas-export-report.md"

SOURCE_CELL = 229
CELL = 272
ATLAS_COLUMNS = 6
ATLAS_ROWS = 5
BASELINE = 251

# Each row uses its first N authored poses; remaining cells repeat the last pose.
STATE_ROWS = [
    ("idle", 1, 2),
    ("shuffle-walk", 2, 6),
    ("attack", 3, 4),
    ("hurt", 4, 2),
    ("collapse-dead", 5, 4),
]


def source_crop(raw: Image.Image, source_row: int, source_col: int):
    x0 = (source_col - 1) * SOURCE_CELL
    y0 = (source_row - 1) * SOURCE_CELL
    x1 = x0 + SOURCE_CELL
    y1 = y0 + SOURCE_CELL

    # Assign the three-row row-3/column-3 overflow to that complete frame.
    # Start row-4/column-3 below the same strip so those pixels are not duplicated.
    if (source_row, source_col) == (3, 3):
        y1 += 3
    elif (source_row, source_col) == (4, 3):
        y0 += 3

    patch = raw.crop((x0, y0, x1, y1))
    alpha_box = patch.getchannel("A").getbbox()
    if alpha_box is None:
        raise ValueError(f"Empty source sprite at row {source_row}, col {source_col}")

    sprite = patch.crop(alpha_box)
    global_box = (
        x0 + alpha_box[0],
        y0 + alpha_box[1],
        x0 + alpha_box[2],
        y0 + alpha_box[3],
    )
    return sprite, (x0, y0, x1, y1), global_box


def make_cell(sprite: Image.Image):
    width, height = sprite.size
    if width > CELL or height > CELL:
        raise ValueError(f"Sprite {width}x{height} does not fit {CELL}x{CELL}")

    x = (CELL - width) // 2
    y = BASELINE - height + 1
    if y < 0 or y + height > CELL:
        raise ValueError(f"Sprite {width}x{height} does not fit at baseline {BASELINE}")

    cell = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    # Paste copies the generated RGBA pixels directly; there is no resampling,
    # alpha thresholding, recoloring, or drawing.
    cell.paste(sprite, (x, y))
    if cell.crop((x, y, x + width, y + height)).tobytes() != sprite.tobytes():
        raise AssertionError("Generated sprite pixels changed during placement")
    return cell, (x, y, x + width, y + height)


def main():
    with Image.open(SOURCE_PATH) as opened:
        if opened.size != (1373, 1145) or opened.mode != "RGBA":
            raise ValueError(f"Expected RGBA 1373x1145 source, got {opened.mode} {opened.size}")
        raw = opened.copy()

    # The source is one pixel narrower than six 229px cells. Add only transparent
    # canvas space at the right so all six columns have equal source coordinates.
    padded = Image.new("RGBA", (ATLAS_COLUMNS * SOURCE_CELL, raw.height), (0, 0, 0, 0))
    padded.paste(raw, (0, 0))

    atlas = Image.new("RGBA", (ATLAS_COLUMNS * CELL, ATLAS_ROWS * CELL), (0, 0, 0, 0))
    export_rows = []
    cell_records = []

    for output_row, (state, source_row, pose_count) in enumerate(STATE_ROWS):
        unique_cells = {}
        for source_col in range(1, pose_count + 1):
            sprite, crop_coords, source_bbox = source_crop(padded, source_row, source_col)
            cell, placed_bbox = make_cell(sprite)
            unique_cells[source_col] = (cell, crop_coords, source_bbox, placed_bbox, sprite.size)

        output_mapping = []
        for output_col in range(1, ATLAS_COLUMNS + 1):
            source_col = min(output_col, pose_count)
            cell, crop_coords, source_bbox, placed_bbox, sprite_size = unique_cells[source_col]
            x = (output_col - 1) * CELL
            y = output_row * CELL
            atlas.paste(cell, (x, y))
            alpha_box = cell.getchannel("A").getbbox()
            if alpha_box is None or alpha_box[3] - 1 != BASELINE:
                raise AssertionError(f"Unexpected sprite baseline in {state}, output col {output_col}")
            margins = (
                alpha_box[0],
                alpha_box[1],
                CELL - alpha_box[2],
                CELL - alpha_box[3],
            )
            if min(margins) < 16:
                raise AssertionError(f"Insufficient cell margin in {state}, col {output_col}: {margins}")

            output_mapping.append((output_col, source_col))
            cell_records.append(
                (state, output_row + 1, output_col, source_row, source_col,
                 crop_coords, source_bbox, placed_bbox, sprite_size, margins)
            )
        export_rows.append((state, source_row, pose_count, output_mapping))

    alpha = atlas.getchannel("A")
    seam_checks = []
    for x in range(CELL, atlas.width, CELL):
        strip = alpha.crop((x - 1, 0, x + 1, atlas.height))
        if strip.getbbox() is not None:
            raise AssertionError(f"Nontransparent vertical cell seam near x={x}")
        seam_checks.append(f"x={x}: transparent")
    for y in range(CELL, atlas.height, CELL):
        strip = alpha.crop((0, y - 1, atlas.width, y + 1))
        if strip.getbbox() is not None:
            raise AssertionError(f"Nontransparent horizontal cell seam near y={y}")
        seam_checks.append(f"y={y}: transparent")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(OUTPUT_PATH, format="PNG", optimize=True)

    report = [
        "# Frost Tide Warden atlas export report",
        "",
        f"- Runtime output: `{OUTPUT_PATH.relative_to(REPO_ROOT).as_posix()}`",
        f"- Output: RGBA {atlas.width}x{atlas.height}; {ATLAS_COLUMNS}x{ATLAS_ROWS} equal cells of {CELL}x{CELL}; game display remains 192x192.",
        f"- Source: `{SOURCE_PATH.name}`, RGBA 1373x1145. A transparent pixel is appended at the right in memory to make six 229px columns; the raw file is unchanged.",
        f"- Layout baseline: local y={BASELINE} in every output cell; all extracted full-alpha bounds fit with at least 16px transparent clearance.",
        "- Processing: generated sprite pixels were copied directly into transparent cells. No resampling, drawing, recoloring, alpha thresholding, or background removal.",
        "- Source coordinates below are zero-based, half-open `(x0,y0,x1,y1)` rectangles. Row 3/column 3 extends through y=690 to retain its complete generated pose; row 4/column 3 starts at y=690 so the shared three-row spill is assigned only to the upper pose.",
        "",
        "## Output-to-source mapping",
        "",
        "| State | Output row/col | Source row/col | Source crop | Source alpha bounds | Output local alpha bounds | Sprite size | Margins L/T/R/B |",
        "|---|---:|---:|---|---|---|---:|---:|",
    ]
    for (state, output_row, output_col, source_row, source_col,
         crop_coords, source_bbox, placed_bbox, sprite_size, margins) in cell_records:
        report.append(
            f"| {state} | {output_row}/{output_col} | {source_row}/{source_col} | "
            f"{crop_coords} | {source_bbox} | {placed_bbox} | "
            f"{sprite_size[0]}x{sprite_size[1]} | {margins[0]}/{margins[1]}/{margins[2]}/{margins[3]} |"
        )
    report.extend([
        "",
        "## Cutline check",
        "",
        f"All 9 internal atlas cutline pairs are fully transparent: {', '.join(seam_checks)}.",
        "",
        "Unused output poses repeat the last authored frame of their state: idle cols 3-6 repeat col 2; attack cols 5-6 repeat col 4; hurt cols 3-6 repeat col 2; collapse/dead cols 5-6 repeat col 4.",
    ])
    REPORT_PATH.write_text("\n".join(report) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH} ({atlas.width}x{atlas.height}, RGBA)")
    print(f"Wrote {REPORT_PATH}")
    print(f"Maximum extracted sprite dimensions: {max(r[8][0] for r in cell_records)}x{max(r[8][1] for r in cell_records)}")
    print(f"Cell margins all >= 16px; baseline={BASELINE}; internal cutlines transparent.")


if __name__ == "__main__":
    main()
