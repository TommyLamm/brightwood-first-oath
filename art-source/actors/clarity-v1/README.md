# Bell Keeper clarity upgrade — 2026-11-05

Reference: `public/assets/actors/monster-ruins-bell-keeper-v1.png`, first idle frame. User selected this character as the clarity standard.

Preserve existing character identities, palettes, animation states, relative body/head/hand positions and foot anchors. Upgrade actual sprite craftsmanship; enlarged old pixels do not satisfy the request. The benchmark is crisp contours and material shading, not adopting the Bell Keeper's anatomy or costume.

Tools: built-in ImageGen, transparent-background edits. Preserve raw originals here; use versioned runtime filenames only for accepted art. Prompt files and source metadata accompany each candidate.

Status: integrated into local game version `1.0.0-beta.59`; not published.

## Selected art and production export

- Three hero atlases were redrawn using built-in ImageGen. `hero-{cloth,leather,iron}-candidate-1.png` are the preserved selected raw outputs; corresponding `.prompt.txt` files contain the exact prompts. The original tool outputs are also retained under `C:/Users/Tommy/.codex/generated_images/01a1a951-d349-7641-9734-ed5049f38f49/`.
- Cloth candidate 2 was a targeted ImageGen alpha repair attempt. It did not remove the colored fringe sufficiently and was not selected. Both its raw PNG and complete prompt are retained.
- The selected outputs use the project's existing mechanical color-key cleanup and connected-component recovery rules, without the old 40-color hero palette reduction. No poses are drawn by the exporter.
- Eighteen additional atlases were re-exported from their retained, previously generated high-resolution sources. These are source-detail recoveries, not AI redraws or enlargements of low-resolution runtime files.
- `export-clarity.py` maps each source pose onto its existing normalized silhouette bounds. Ordinary/hero frames are at least 192px; two upgraded boss frames are 384px; the merchant retains 384px cells. Existing game display dimensions, animation frame lists/timings, facing, collision bodies, and foot positions are retained. Head/hand anchors retain their original v9 128px measurement space and 96px logical coordinates.
- `export-report.json` records every source path, SHA-256, runtime path, cell mapping and frame geometry. `manifest-before.json` preserves the prior runtime mapping. Existing runtime PNGs were not overwritten.
- Nine already detailed actor appearances, including the Bell Keeper reference, retain their existing textures.

## Verification and handoff

Runtime changes: `public/assets/actors/manifest.json` points to 21 versioned clarity atlases; the Phaser backing canvas is 1920×1080 while the renderer retains its 960×540 world baseline. Loading messages use the corresponding canvas center and text size. No save-format, gameplay or score changes were made.

Passed: real runtime atlas checks for 21 RGBA assets and 334 active frames; nonempty animation frames, divisible grid sizes, transparent backgrounds, and maximum logical silhouette-bounds difference of 0.25px. Reviewed old/new hero, NPC, monster and boss sheets, plus selected hero equipment overlays. Typecheck, content validation, 15 focused tests, and Vite build passed.

Not performed: live browser playthrough, mobile/performance/iframe acceptance, ZIP validation, GitHub Release or platform publishing. Build output: `dist/`. Review sheets and structural-check summary: `output/character-clarity-20261105/`.

Next: use the local game to review animation transitions, left-facing equipment, full-screen clarity and performance; only publish after explicit release authorization and required platform acceptance. The generated-art comparison sheets are not screenshots of a running game.
