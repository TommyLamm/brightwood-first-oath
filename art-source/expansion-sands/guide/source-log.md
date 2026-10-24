# Sands guide idle sprite source log

Generated 2026-10-24 using the built-in ImageGen tool. The existing accepted NPC sheets and the frost-guide contract were inspected before generation. The raw output is preserved as a 1774x887 RGBA two-cell atlas with two 887x887 frames; the refined source preserves that canvas and genuine transparent alpha.

Runtime contract supplied by the integration owner: `actor:sands-guide`; 2 columns x 1 row; one 128x128 cell per pose; 96x96 display; pivot (0.5, 1); `npc:sands-guide:idle` frames [0,1], 350 ms each, looping.

| Asset | Dimensions / mode | SHA-256 |
| --- | --- | --- |
| `sands-guide-idle-generated-v1.png` (initial output) | 1774x887 RGBA | `911538c9c0580b15e4afcdc4c7f28dbea30442e1bb484abdca530ccf26a2e45e` |
| `sands-guide-idle-refined-v2.png` (selected ImageGen edit) | 1774x887 RGBA | `25cfc088498eadb798c8d8c9c229e5ffe4a68061ea68c05ff706e119ecd14c44` |
| `public/assets/actors/npcs/sands-guide-idle-v1.png` (runtime atlas) | 256x128 RGBA; 2 x 128x128 cells | `8af9aa839a6627340e43365be760c94f4d2b818f2fbb67d9713d114b65e1eee6` |

The runtime atlas was packed by resizing each full source cell to 120x120 with nearest-neighbor sampling and placing it in a 128x128 transparent cell with 4 px padding. Both cells use the same placement baseline. The alpha channel was retained; no thresholding, background keying or hand-drawn cleanup was applied. The atlas was composited on a neutral preview background to inspect the cutout and frame alignment.

ImageGen source locations before archival:
- Initial generation: `C:\Users\Tommy\.codex\generated_images\01a16b8f-eb9d-7842-9898-e6b03644678c\exec-4074ed82-b3a6-43e8-809c-21740cc76d6b.png`
- Refinement: `C:\Users\Tommy\.codex\generated_images\01a16b8f-eb9d-7842-9898-e6b03644678c\exec-11a01ec8-1801-48b6-9f42-eee6dd3781b4.png`

Exact prompts are in `prompt.md`.
