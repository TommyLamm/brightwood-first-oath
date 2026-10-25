# 苔陶蟲素材來源與審視記錄

## Source chain

All image requests used the built-in ImageGen tool; no CLI or hand-drawn substitute was used. The exact prompts and generated sources are retained here:

- `profile-prompt.txt` → `ruins-moss-carapace-profile.png` (ImageGen output `exec-98133fd4-be04-4e7b-b75c-cf64b5461b0b.png`).
- `profile-prompt-v2.txt` → `ruins-moss-carapace-profile-v2.png` (ImageGen output `exec-18b3ae3c-546d-4046-abfa-5ad4415b0e81.png`).
- `sprite-sheet-prompt.txt` → `ruins-moss-carapace-atlas-generated.png` (ImageGen output `exec-114f292b-58af-421e-a7cd-9ecfc92cb03f.png`).
- `sprite-sheet-prompt-v2.txt` → `ruins-moss-carapace-atlas-generated-v2.png` (ImageGen output `exec-a087ae40-a5e9-4820-80ea-e93591fed7aa.png`).
- `sprite-sheet-prompt-v3.txt` → `ruins-moss-carapace-atlas-generated-v3.png` (ImageGen output `exec-afd02d94-6681-4603-8595-f2dd5ccbb4bb.png`).

Neutral-matte JPEG previews for visual review are in `review/`; the PNG originals retain their alpha. `repack-atlas.py` and `review/candidate-runtime-v1-not-accepted.png` preserve a first crop/downscale/padding attempt for provenance only. That candidate was removed from `public/assets/actors/` and must not be used as a runtime asset.

## Profile review

The first profile was painterly and had translucent background haze. Profile v2 carries the approved design reference: a consistent low, broken-ceramic silhouette; visible shell bell motif; moss in cracks; fine root feelers; slow crawl and forward bite. It was reviewed composited on a neutral matte and is a design reference, not runtime artwork.

## Atlas review and remaining gap

All three atlas PNGs have an exactly divisible 6x5 layout at 1374x1145 pixels, so their source cells are 229x229. V1 was scaled cell-by-cell to 96x96 and padded in unused cells, but that normalized candidate was rejected. V2 and v3 were also rejected for runtime use: although the grid dimensions divide cleanly, alpha content from roots/limbs reaches or crosses internal cell boundaries. `check-grid.py` records the per-cell margins and number of alpha pixels near grid edges. V3 still showed 150–256 alpha>8 pixels per internal vertical border. The full source images are preserved for the next art pass to assess whether independent components can be separated and re-aligned.

No generated atlas has been accepted as the runtime sheet, and the actor manifest has not been changed. The required runtime is still six columns by five rows of 96x96 RGBA cells, with idle 2x200ms, walk 6x120ms, attack 4 frames timed to the 550/80/770ms bite (`[275,275,80,770]`), hurt 2x100ms, and dead 4x100ms. Unused cells must duplicate the last effective frame. Pivot remains (0.5,1).
