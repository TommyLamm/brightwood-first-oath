# Sunwell Far Panorama Pilot Source Log

Updated: 2026-10-24 (UTC; current recorded checkpoint 10:52:45 UTC)
Owner: Codex asset packet
Scope: Sunwell far-v2 and mid-v2 environment art only.

## Instructions and acceptance

Read the local AGENTS.md, imagegen SKILL.md, the existing Sunwell environment source-log.md and prompts.md, then fetched the Playroom game-agent template and all seven linked main-branch specifications directly with Invoke-WebRequest using Cache-Control: no-cache. The complete no-cache read finished before 2026-10-24 10:49:14 UTC.

Online specifications read:
- https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md
- https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/game-development.md
- https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/command-contracts.md
- https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game.schema.json
- https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-release.yml
- https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/examples/starter/playroom-sdk.js
- https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/sdk-versioning.md
- https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/save-compatibility.md

Applicable project requirements: preserve the current game format and runtime, do not edit manifests or source code for this image-only pilot, and do not publish without explicit release authorization. The current main specs set ZIP limits to 512 MiB / 2 GiB / 50,000 entries when game tools 1.2.0 or later are used; this pilot does not alter tools or packaging.

Asset acceptance: 1440x540 RGBA, genuinely transparent empty space, Sunwell palette and low bottom-aligned far scenery, one distant ring ruin, no red fringe, no runtime 1.6 vertical scaling baked into the image. Inspect the image over the existing sky with the runtime 1.6 vertical scale and bottom alignment. This was a full redraw, so there is no artificial join or seam.

## Attempts

All generated sources are preserved unchanged in this folder, along with the exact prompts in prompts.md.

| Attempt | Source copy | Original generated file | Tool transparency parameter | Result |
| --- | --- | --- | --- | --- |
| 1 | env-sunwell-far-attempt-1-no-alpha.png | C:\Users\Tommy\.codex\generated_images\01a16d80-e1f9-7380-9640-c8fe3dce3210\exec-29c83667-32a9-4168-b53b-3e0182178c72.png | Omitted; tool defaulted to false | 2048x768 RGB PNG color type 2; 24bpp RGB; alpha 255 everywhere. Rejected because the checkerboard was baked in. |
| 2 | env-sunwell-far-attempt-2-no-alpha.png | C:\Users\Tommy\.codex\generated_images\01a16d80-e1f9-7380-9640-c8fe3dce3210\exec-ae79804c-5286-4d6e-aa08-7f3d6f23c787.png | Omitted; tool defaulted to false | 2048x768 RGB PNG color type 2; 24bpp RGB; alpha 255 everywhere. Rejected because the checkerboard was baked in. |
| 3 | env-sunwell-far-generated-v3-alpha-source.png | C:\Users\Tommy\.codex\generated_images\01a16d80-e1f9-7380-9640-c8fe3dce3210\exec-5b88a257-fced-4f24-bbff-e7e2f408a039.png | Explicitly true | 2048x768 RGBA PNG color type 6; 1,171,914 bytes; SHA-256 C489B38EFEF79F154002DC3E76EA5BCA55EE2259E03F25C6CA2C93EC6D294BC6. This is the current candidate source. |

The first two calls omitted the explicit tool argument; they do not demonstrate a limitation in the built-in image tool. Attempt 3 used the original far-v1 and sky-v1 references, not either opaque failed generation.

## Candidate and visual review files

- Candidate runtime-size PNG: env-sunwell-far-candidate-1440x540.png
- Full sky composite with runtime far placement: preview-sunwell-far-runtime-1440x540.png
- Section previews: preview-sunwell-far-runtime-start-0-480.png, preview-sunwell-far-runtime-middle-480-960.png, preview-sunwell-far-runtime-end-960-1440.png
- Prompt history: prompts.md

The 2048x768 source was downscaled proportionally to 1440x540 using nearest-neighbor sampling. Its alpha channel was preserved. The 1.6 vertical runtime scale was not baked into the candidate.

Runtime preview recipe: stretch existing sky-v1 to 1440x540; draw the 1440x540 far candidate at 1440x864 with its top at y=-324 and bottom at y=540. This preview contains only the far layer over the sky; the existing mid layer is omitted.

Candidate check: 1440x540, Format32bppArgb / PNG RGBA, 517,072 bytes, SHA-256 AB82281803B337CF661F415CC006B7F5DD2F874E7C3BF1A2C9DE268830A2CD05. Alpha range 0..254; alpha=0 pixels 570,420; partial alpha pixels 207,180; alpha=255 pixels 0. Any nonzero-alpha pixels span x=0..1439 and y=28..539; the main scenery where alpha>127 spans x=0..1439 and y=271..537 (195,006 pixels). The source has scattered near-transparent pixels above the main scenery; see the sky composite previews when judging them.

Vertical comparison using alpha>127 to ignore faint edge pixels: original far-v1 main scenery spans y=304..506 of 540. Candidate spans y=271..537, so its highest main scenery is 33 pixels higher and its lower edge 31 pixels lower than the original before runtime scaling. With 1.6x bottom alignment, those top coordinates map to approximately y=166 (old) and y=110 (candidate). This difference is recorded for review; the candidate was not vertically stretched or shifted to force a match.

## Status and limits

At this checkpoint the candidate was ready for root's visual review and had not yet been copied to the public path; the later approved-copy section records the final disposition. No manifest, game.json, runtime code, sky-v1 or other asset was changed. No build, browser run, full test suite, commit, push, tag or release was performed.
## Composition alignment and viewport comparison

Updated: 2026-10-24 10:56:15 UTC. No new image generation was used for this step. Root requested that the complete canvas, including transparent margins and RGBA values, be vertically normalized to match the original far-v1 scene bounds. The unaligned candidate was 1440x540; its main scenery (alpha >127) spanned y=271..537. The old far-v1 main scenery spanned y=304..506. The aligned candidate resizes the full canvas to 1440x410 with nearest-neighbor sampling (scale 410/540 = 0.759259), then places it at y=98 on a transparent 1440x540 canvas. Horizontal scale remains 1. The 1.6 runtime scale is not baked into this asset.

Aligned candidate:
- File: env-sunwell-far-candidate-aligned-1440x540.png
- Dimensions: 1440x540, Format32bppArgb / RGBA
- Bytes: 269,726
- SHA-256: d1fd5a6c8091565e27fb8cf9dc5f48d6aa04a1bc360bc41fe884c49def501487
- Alpha: 0..254; alpha=0 pixels 620,387; alpha=255 pixels 0
- Main scenery (alpha >127): x=0..1439, y=304..505 (147,927 pixels)

Runtime comparison uses a fixed 960x540 viewport with the sky left at its original 960x540 size. Each far is vertically drawn at 1.6x and bottom-aligned only in preview. The old-v1 preview uses scrollX=0/farOffset=0. The aligned-v2 previews use scrollX=0/farOffset=0, scrollX=920/farOffset=184, and scrollX=1840/farOffset=368. The one contact sheet is preview-v1-v2-alignment-contact-1920x1080.png: top-left old v1, top-right new start, bottom-left new middle, bottom-right new end. Individual 960x540 views are also preserved. The previews omit the mid layer and are for visual review only.

Visual inspection of the contact sheet showed the aligned version retained a clear basin and single ring ruin. At this checkpoint, root review was still pending; the following section records the subsequent approval and public copy.
## Root-approved runtime asset

Root reviewed the aligned candidate and approved it. The exact candidate was copied without further image edits to public/assets/environment/env-sunwell-far-v2.png.
- Runtime bytes: 269,726
- Runtime SHA-256: D1FD5A6C8091565E27FB8CF9DC5F48D6AA04A1BC360BC41FE884C49DEF501487
- Dimensions and alpha match env-sunwell-far-candidate-aligned-1440x540.png.
No manifest or runtime code was changed.

---

# Sunwell mid pilot source log

Updated: 2026-10-24. Scope: one Sunwell mid-layer pilot and its one root-authorized targeted correction only.

## Attempt 1 — not accepted

Built-in ImageGen was called with `transparent_background=true`, using the Sunwell sky-v1 and approved far-v2 as references. The original output is archived unchanged as `env-sunwell-mid-pilot-raw.png`, from `C:\Users\Tommy\.codex\generated_images\01a16d80-e1f9-7380-9640-c8fe3dce3210\exec-b2082ac7-fa7b-4b2f-8bee-c1fb4aab3f23.png`.

- Source: 2048x768 RGBA, 971,821 bytes, SHA-256 `fc6e863c24dcf312faa8c2f60b288d036a6024469969f28f99ff590467a5fe14`.
- Alpha min/max 0..254; alpha=0: 1,387,563; partial alpha: 185,301; opaque alpha=255: 0.
- Main alpha>127 art bounds y=0..252, but nonzero alpha extends to y=693 from broad semitransparent glow. The lower region is not genuinely transparent, so no runtime-size candidate was made or published.
- The full exact prompt is in `prompts.md`.

Root authorized one targeted correction to make a crisp upper-edge decoration with solid forms confined to the top quarter and no haze, glow, shadows, or gradient. Exact correction prompt is saved in `prompts.md` before its ImageGen call. If the correction still violates the transparency and height requirements, stop; do not erase or threshold alpha to force a pass.

No mid runtime asset, manifest, game.json or runtime code has been changed. No browser, build, full test, commit, push, tag or release was performed.


## Source-only layout candidate for root review

No new generation or alpha cleanup was used. The correction raw has a full-height zero-alpha vertical seam at source column x=1024. It was divided into its unique left and right 1024x768 halves at that exact transparent column, each half used once, and each was uniformly resized with nearest-neighbor sampling by 67/256 (0.26171875) to 268x201. The left half sits at (0,0); the right half is right-aligned at (1652,0) on a 1920x540 transparent canvas. No source column with nonzero alpha was removed or repeated.

- Candidate: `env-sunwell-mid-layout-candidate-1920x540.png`, RGBA, 37,720 bytes, SHA-256 `bd8dc0a71b104121f74c657a8a96cc2e634fcca46e5bb28f88130cd877f9df76`.
- Candidate nonzero alpha bounds: x=0..1919, y=0..160; rows 180..539 are fully transparent (360 rows). Alpha=0: 1,024,636 pixels; partial alpha: 12,164; alpha=255: 0.
- Review preview: `preview-env-sunwell-mid-layout-contact-2880x540.png`. It shows three 960x540 viewport crops over the existing sky and far-v2 source with far runtime 1.6 applied only in preview; mid offsets are 0, 480 and 960. No mid runtime manifest entry was changed.

Root reviewed the three-window contact and accepted this layout candidate as the Sunwell mid v2 asset. The right arch cap and leaves read clearly and do not cover the basin or character activity area. The left small stone fragments have a slight floating appearance; this limitation is recorded for future review. The approved image was copied unchanged to `public/assets/environment/env-sunwell-mid-v2.png` (1920x540 RGBA, 37,720 bytes, SHA-256 `bd8dc0a71b104121f74c657a8a96cc2e634fcca46e5bb28f88130cd877f9df76`).
