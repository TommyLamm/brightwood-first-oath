# Frost Tide Warden atlas export report

- Runtime output: `public/assets/actors/monsters/frost-tide-warden-atlas-v1.png`
- Output: RGBA 1632x1360; 6x5 equal cells of 272x272; game display remains 192x192.
- Source: `frost-tide-warden-atlas-spacing-edit-1373x1145.png`, RGBA 1373x1145. A transparent pixel is appended at the right in memory to make six 229px columns; the raw file is unchanged.
- Layout baseline: local y=251 in every output cell; all extracted full-alpha bounds fit with at least 16px transparent clearance.
- Processing: generated sprite pixels were copied directly into transparent cells. No resampling, drawing, recoloring, alpha thresholding, or background removal.
- Source coordinates below are zero-based, half-open `(x0,y0,x1,y1)` rectangles. Row 3/column 3 extends through y=690 to retain its complete generated pose; row 4/column 3 starts at y=690 so the shared three-row spill is assigned only to the upper pose.

## Output-to-source mapping

| State | Output row/col | Source row/col | Source crop | Source alpha bounds | Output local alpha bounds | Sprite size | Margins L/T/R/B |
|---|---:|---:|---|---|---|---:|---:|
| idle | 1/1 | 1/1 | (0, 0, 229, 229) | (23, 19, 224, 229) | (35, 42, 236, 252) | 201x210 | 35/42/36/20 |
| idle | 1/2 | 1/2 | (229, 0, 458, 229) | (233, 9, 458, 229) | (23, 32, 248, 252) | 225x220 | 23/32/24/20 |
| idle | 1/3 | 1/2 | (229, 0, 458, 229) | (233, 9, 458, 229) | (23, 32, 248, 252) | 225x220 | 23/32/24/20 |
| idle | 1/4 | 1/2 | (229, 0, 458, 229) | (233, 9, 458, 229) | (23, 32, 248, 252) | 225x220 | 23/32/24/20 |
| idle | 1/5 | 1/2 | (229, 0, 458, 229) | (233, 9, 458, 229) | (23, 32, 248, 252) | 225x220 | 23/32/24/20 |
| idle | 1/6 | 1/2 | (229, 0, 458, 229) | (233, 9, 458, 229) | (23, 32, 248, 252) | 225x220 | 23/32/24/20 |
| shuffle-walk | 2/1 | 2/1 | (0, 229, 229, 458) | (39, 229, 224, 455) | (43, 26, 228, 252) | 185x226 | 43/26/44/20 |
| shuffle-walk | 2/2 | 2/2 | (229, 229, 458, 458) | (233, 229, 422, 456) | (41, 25, 230, 252) | 189x227 | 41/25/42/20 |
| shuffle-walk | 2/3 | 2/3 | (458, 229, 687, 458) | (483, 229, 687, 455) | (34, 26, 238, 252) | 204x226 | 34/26/34/20 |
| shuffle-walk | 2/4 | 2/4 | (687, 229, 916, 458) | (687, 229, 916, 456) | (21, 25, 250, 252) | 229x227 | 21/25/22/20 |
| shuffle-walk | 2/5 | 2/5 | (916, 229, 1145, 458) | (916, 229, 1145, 456) | (21, 25, 250, 252) | 229x227 | 21/25/22/20 |
| shuffle-walk | 2/6 | 2/6 | (1145, 229, 1374, 458) | (1146, 229, 1357, 456) | (30, 25, 241, 252) | 211x227 | 30/25/31/20 |
| attack | 3/1 | 3/1 | (0, 458, 229, 687) | (49, 477, 222, 687) | (49, 42, 222, 252) | 173x210 | 49/42/50/20 |
| attack | 3/2 | 3/2 | (229, 458, 458, 687) | (233, 461, 452, 687) | (26, 26, 245, 252) | 219x226 | 26/26/27/20 |
| attack | 3/3 | 3/3 | (458, 458, 687, 690) | (469, 500, 687, 690) | (27, 62, 245, 252) | 218x190 | 27/62/27/20 |
| attack | 3/4 | 3/4 | (687, 458, 916, 687) | (687, 459, 913, 687) | (23, 24, 249, 252) | 226x228 | 23/24/23/20 |
| attack | 3/5 | 3/4 | (687, 458, 916, 687) | (687, 459, 913, 687) | (23, 24, 249, 252) | 226x228 | 23/24/23/20 |
| attack | 3/6 | 3/4 | (687, 458, 916, 687) | (687, 459, 913, 687) | (23, 24, 249, 252) | 226x228 | 23/24/23/20 |
| hurt | 4/1 | 4/1 | (0, 687, 229, 916) | (47, 687, 194, 905) | (62, 34, 209, 252) | 147x218 | 62/34/63/20 |
| hurt | 4/2 | 4/2 | (229, 687, 458, 916) | (233, 687, 424, 905) | (40, 34, 231, 252) | 191x218 | 40/34/41/20 |
| hurt | 4/3 | 4/2 | (229, 687, 458, 916) | (233, 687, 424, 905) | (40, 34, 231, 252) | 191x218 | 40/34/41/20 |
| hurt | 4/4 | 4/2 | (229, 687, 458, 916) | (233, 687, 424, 905) | (40, 34, 231, 252) | 191x218 | 40/34/41/20 |
| hurt | 4/5 | 4/2 | (229, 687, 458, 916) | (233, 687, 424, 905) | (40, 34, 231, 252) | 191x218 | 40/34/41/20 |
| hurt | 4/6 | 4/2 | (229, 687, 458, 916) | (233, 687, 424, 905) | (40, 34, 231, 252) | 191x218 | 40/34/41/20 |
| collapse-dead | 5/1 | 5/1 | (0, 916, 229, 1145) | (31, 940, 220, 1113) | (41, 79, 230, 252) | 189x173 | 41/79/42/20 |
| collapse-dead | 5/2 | 5/2 | (229, 916, 458, 1145) | (235, 973, 432, 1145) | (37, 80, 234, 252) | 197x172 | 37/80/38/20 |
| collapse-dead | 5/3 | 5/3 | (458, 916, 687, 1145) | (465, 916, 674, 1111) | (31, 57, 240, 252) | 209x195 | 31/57/32/20 |
| collapse-dead | 5/4 | 5/4 | (687, 916, 916, 1145) | (693, 918, 889, 1145) | (38, 25, 234, 252) | 196x227 | 38/25/38/20 |
| collapse-dead | 5/5 | 5/4 | (687, 916, 916, 1145) | (693, 918, 889, 1145) | (38, 25, 234, 252) | 196x227 | 38/25/38/20 |
| collapse-dead | 5/6 | 5/4 | (687, 916, 916, 1145) | (693, 918, 889, 1145) | (38, 25, 234, 252) | 196x227 | 38/25/38/20 |

## Cutline check

All 9 internal atlas cutline pairs are fully transparent: x=272: transparent, x=544: transparent, x=816: transparent, x=1088: transparent, x=1360: transparent, y=272: transparent, y=544: transparent, y=816: transparent, y=1088: transparent.

Unused output poses repeat the last authored frame of their state: idle cols 3-6 repeat col 2; attack cols 5-6 repeat col 4; hurt cols 3-6 repeat col 2; collapse/dead cols 5-6 repeat col 4.
