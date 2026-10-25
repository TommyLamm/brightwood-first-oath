# Environment-wide Asset Plan
> Current status (2026-10-24): delivery complete; see [handoff-20261024.md](handoff-20261024.md). Pending items below are historical pilot-plan notes and are superseded by that handoff.


Last updated: 2026-10-24

## Goal

Create 20 new environment layers for the 10 themes: `camp`, `town`, `forest`, `rock`, `frost`, `frost-pine`, `frost-cave`, `sand`, `sand-dune`, and `sunwell`. Runtime display canvas is 960×540; far files are 1440×540 and mid files are 1920×540.

## Sequence

1. `town` far v2 is the accepted first pilot and has been exported.
2. `forest`, `rock`, and final `camp` far v2 have each been visually accepted by root and exported.
3. `town` mid v2 was visually accepted and exported as 1920×540 RGBA. Its three-window contact is a normalized illustration, not a runtime max-scroll preview.
4. Current added scope: create one mid v2 each for `camp`, `forest`, and `rock`, using separate built-in image generation calls and theme-specific content. Send each raw and its source-only 1920×540 layout plus three 960×540 sky/far/mid previews to root for review before export.
5. After root reviews these three mids, stop and report the eight approved far/mid files to the integrator. Further groups and themes require a new assignment.
6. Have one integrator update the manifest after approval, prepare a combined scroll preview using each map's real maximum scroll and asset metrics, and run only the necessary typecheck.

## Current delegated scope

Accepted and exported far layers:

- `town` far v2 1440×540 → `art-source/environment-wide/town/` and `public/assets/environment/env-town-far-v2.png`
- `forest` far v2 1440×540 → `art-source/environment-wide/forest/` and `public/assets/environment/env-forest-far-v2.png`
- `rock` far v2 1440×540 → `art-source/environment-wide/rock/` and `public/assets/environment/env-rock-far-v2.png`
- final fresh `camp` far v2 1440×540 → `art-source/environment-wide/camp/` and `public/assets/environment/env-camp-far-v2.png`

Accepted and exported mid layer:

- `town` mid v2 1920×540 → `art-source/environment-wide/town/` and `public/assets/environment/env-town-mid-v2.png`

Pending raw/layout review and export:

- `camp`, `forest`, and `rock` mid v2, each 1920×540, in their own `art-source/environment-wide/<theme>/` folder

The two rejected camp far attempts remain source-only. The final camp prompt did not reference either failed image. Keep all existing v1 assets, sky layers, `src/game.json`, and unrelated environment files unchanged. No manifest change, build, browser/game test, full test suite, commit, push, tag, archive, or release is part of this work.

## Rendering and review decisions

- Use the built-in ImageGen tool with the actual `transparent_background:true` argument. Inspect each raw PNG's mode and alpha before layout or public export; prompt text alone does not prove transparency.
- Retain each unmodified generated source, exact prompt, baseline copy, alpha-clean derivative (if used), and layout/preview evidence beside the export. Use only clean sky/style references and accepted artwork; do not use rejected fringe images as references.
- The user explicitly authorized complete redraws for best visual quality; the previous left-pixel lock is superseded. Do not claim v2 left-edge identity with v1.
- For far layers, keep scenery low and distant with natural silhouettes, no character/text/sign/UI/collision surfaces, no ground plane, continuous horizontal base, fog sheet, glow, outline, halo, or colored fringe. Each far generation is one full canvas with no splice seam at x=960; use x=960 details diagnostically without forced smoothing.
- For mids, keep branches/canopy entering only from the upper edge, with low contrast, open ground and character lane, and actual alpha=0 across output rows 180..539. No ground/rock islands, complete tree islands, platforms, NPCs, monsters, or text. If alpha≤3 cleanup is needed, root authorized only that exact threshold, with RGB preserved and the raw left untouched.
- Mid layout may use each distinct cluster separated by columns that are fully transparent after the permitted cleanup exactly once. Use one uniform scale shared across clusters so the deepest nonzero alpha is ≤180px; keep original side-cut clusters at the corresponding outside edges, align at y=0, and keep the remaining bottom transparent. Do not mirror/tile/repeat motifs. Report alpha bounds and any cleanup/crop/placement/scale.
- The `town` mid raw output was 2048×768 rather than the requested 32:9; root accepted a layout built from two unique clusters at scale 30/53. The permitted process does not imply future outputs should be forced into that same layout.
- The requested fully transparent center 55% and foliage clusters spaced across it cannot both hold as hard constraints. Measure and report the actual alpha layout without claiming both pass.
- Per-map three-window composites requested during this pilot use the matching sky/far/mid sources. Any normalized viewport offsets are illustrative only; the integrator's final scrolling preview must use each map's real maximum scroll.

## Integration constraints reviewed by root

- Runtime canvas is 960×540 with smoothing disabled; far/mid files target 1440×540 and 1920×540.
- Keep the existing sunwell far 1.6 parallax behavior in code; do not bake it into artwork.
- Latest raw Playroom main specs read directly without cache on 2026-10-24: ZIP ≤512 MiB, extraction ≤2 GiB, ≤50,000 entries, requiring game tools 1.2.0. A repository pinned to tools 1.1.0 still uses 64 MiB / 256 MiB / 10,000 until upgraded; web cache was older. Packaging and tool upgrade are outside this work.
- Root reviewed the existing settling-jitter fix in commit `d97363d`; this task does not change runtime logic.
## 2026-10-24 integration completion addendum

All ten far and ten mid v2 images are now accepted and exported at their planned 1440×540 and 1920×540 sizes. Root approved the final camp, forest, and rock mid contact previews; their public files are exact copies of the reviewed layouts. The integrator updated the twenty far/mid manifest URLs and display widths, ran the existing validation helper once, and saved the metrics and 14-map scroll overview under metrics/. This supersedes the earlier pending raw/layout review and export note above.

The scroll composite is an offline simulation using the real map maximum scrolls and the agreed far×0.2 / mid×0.5 offsets. The current renderer still pins background layers, so the preview is not a runtime parallax check. Runtime integration is a separate next task. No src, game.json, build, tests, package, commit, push, tag, or release was changed/performed here.
