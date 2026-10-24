# Sand scorpion runtime atlas export

Runtime asset: `public/assets/actors/monsters/sand-scorpion-atlas-v1.png`

The runtime PNG is a transparent 384×384 RGBA atlas with 4 columns × 4 rows and 96×96 cells. The runtime displays each cell at 96×96, with bottom-center pivot and collision 52×44. The sky-backed review image `sand-scorpion-preview-96px-sky-v1.png` is source-only; it is not the runtime atlas.

## Frame mapping

| Atlas index | State | Source pose |
|---:|---|---|
| 0–1 | idle | two accepted idle poses |
| 2–5 | walk | four accepted walking poses |
| 6–9 | attack | four sting poses, reading order from the original 2×2 strip |
| 10–11 | hurt | flinch, recovery |
| 12–15 | dead | four collapse poses, first to resting pose |

The 4×4 reading order is row-major: row 0 = idle 0–1 then walk 0–1; row 1 = walk 2–3 then attack 0–1; row 2 = attack 2–3 then hurt 0–1; row 3 = dead 0–3. Integration timings: idle 200ms looping; walk 120ms looping (four genuine frames); attack non-looping; hurt 100ms non-looping; dead 100ms non-looping. Other actor animation counts remain unchanged.

## Technical export

The raw ImageGen files are preserved byte-identically beside their prompt logs. The export script `export_scorpion_preview.py` extracts the poses in source reading order, selects a crop rectangle from each pose's visible alpha bounds, adds 24 source pixels of padding where the cell allows, then nearest-neighbor resizes and packs onto transparent 96×96 cells. Alpha/RGB values inside each selected crop are not cleaned, thresholded or repainted. Threshold values are only used to locate crop coordinates: 32 for idle/walk/hurt/dead, 128 for the sting source whose warm ambient effect crosses its original center seam. Each crop remains within its original equal source cell/quadrant so adjacent poses cannot enter the export. The broadest original glow outside a pose crop is intentionally omitted from the runtime frame; the raw source remains intact.

One uniform scale is shared by all poses from each source strip, normalizing its median visible-pose width to 72 pixels. The source scales are idle `0.094303`, walk `0.145161`, attack `0.115108`, hurt `0.105033`, dead `0.156013`. There is no per-frame scale change within a strip. Frames are horizontally centered and their crop bottoms are placed at local y=94, giving all states a consistent baseline and two transparent bottom pixels.

Crop boxes below use source-image coordinates `(left, top, right, bottom)` and are listed in atlas order:

| Index | State | Source crop |
|---:|---|---|
| 0 | idle 0 | `(251,46,1066,696)` |
| 1 | idle 1 | `(1156,19,1964,696)` |
| 2 | walk 0 | `(0,146,543,601)` |
| 3 | walk 1 | `(546,134,1086,606)` |
| 4 | walk 2 | `(1086,141,1629,612)` |
| 5 | walk 3 | `(1633,134,2166,606)` |
| 6 | attack 0 | `(86,18,758,512)` |
| 7 | attack 1 | `(785,71,1478,512)` |
| 8 | attack 2 | `(74,512,749,1009)` |
| 9 | attack 3 | `(823,512,1484,1007)` |
| 10 | hurt 0 | `(265,76,944,689)` |
| 11 | hurt 1 | `(1187,63,1975,689)` |
| 12 | dead 0 | `(32,190,543,589)` |
| 13 | dead 1 | `(575,221,1083,593)` |
| 14 | dead 2 | `(1086,314,1576,587)` |
| 15 | dead 3 | `(1629,368,2139,587)` |

## Acceptance check

The 384×384 transparent atlas and a 384×384 sky-backed montage were visually inspected at the actual 96px-per-frame size. The root approved the preview: all 16 frames are complete and readable, share a visible baseline, and show no obvious detached red fragments. Fine warm edge colors remain subtle at runtime size. Atlas alpha extrema are 0–255; the raw source files remain available for review.
