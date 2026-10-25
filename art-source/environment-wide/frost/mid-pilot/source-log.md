# Frost mid pilot source log

Date: 2026-10-24
Scope: Frost mid-layer layout asset, accepted by parent on 2026-10-24. The accepted source-only arrangement was copied unchanged to `public/`. No game code, manifest, or release file was changed.

## Instructions and references
- Local `AGENTS.md`, the ImageGen skill, and `art-source/expansion-frost/environment/mid-prompt.md` were read. Current Playroom template and seven linked specifications were fetched in full with uncached HTTP requests; URLs and UTC read times are recorded in `../source-log.md`.
- Visually inspected the original mid source, current mid-v1, sky-v1, accepted forest style reference, and world map. Immutable copies and SHA-256 values are under `reference-baseline/`.
- Original prompt is `mid-prompt-source.md`; first and correction prompts are preserved in `frost-mid-v2-prompt.txt` and `frost-mid-v2-correction-01-prompt.txt`.

## Generated drafts
- Both generations used built-in ImageGen and explicitly passed `transparent_background: true` with mid source, sky, forest style, and world-map references.
- First raw output: `C:\Users\Tommy\.codex\generated_images\01a16d80-b179-72c1-81f6-b7c3333477ba\exec-6d144acf-1af7-478a-9d9a-ddae5273cdf1.png`; preserved as `frost-mid-v2-generated-raw.png` (2172x724, Format32bppArgb, 1,592,517 bytes, SHA-256 `0A31C20396B11E6C8FD9F4A013C0ED74A61C95F848913A162ABBAE357C69B60F`). Parent rejected this draft because its heavy lower rock/island forms occupied the actor area and had conspicuous bright edges. It was not processed into a public asset.
- Targeted correction raw output: `C:\Users\Tommy\.codex\generated_images\01a16d80-b179-72c1-81f6-b7c3333477ba\exec-31fa478f-0c41-44ed-b36b-5ffe3e9bd5d1.png`; preserved unchanged as `frost-mid-v2-correction-01-generated-raw.png` (2170x725, Format32bppArgb, 821,969 bytes, SHA-256 `CA4C53C5AB6E776DA6287307E5DABC52854439293A0FDE0BB49EBE913230C934`). Its open lower field and four visible top-edge clusters were considered suitable for a source-only layout test, but the raw is not a deliverable mid asset.

## Authorized source-only layout preview
- Parent authorized one cleanup pass: set nonzero alpha values A<=3/255 to zero in a separate copy, preserve RGB, and leave the raw immutable. `frost-mid-v2-correction-01-cleaned-alpha3.png` contains this copy. Cleanup affected 49,708 nonzero-alpha pixels (max source alpha 3); maximum premultiplied channel difference was 3/255, with 1.0621/255 average over cleared pixels.
- After cleanup, four full-transparent vertical cut gaps separated the unique clusters. Crops used once each: x=0..517, 528..824, 1320..1588, and 1710..2169. A single proportional factor of 180/448=0.401786 was used, with tops at y=0 and destinations x=0, 600, 1250, and 1735 on a 1920x540 transparent canvas. The actual cluster depths were 135, 113, 86, and 150 pixels, leaving the lower area transparent. No cluster was flipped, tiled, duplicated, or painted over.
- Source-only preview: `previews/frost-mid-v2-layout-source-only-1920x540.png` (1920x540 PNG, 168,104 bytes, SHA-256 `1D0F159EC2D80493D74542BFC8CCA96EB9EAF3487C6E0C1EFAD69239984C174A`).
- Three illustrative sky/far/mid window composites are `previews/frost-mid-v2-layout-composite-start-960x540.png`, `...-middle-960x540.png`, and `...-max-960x540.png`. The contact sheet is `previews/frost-mid-v2-layout-composite-three-views-2880x540.png` (2,259,835 bytes, SHA-256 `B85DC615191AA0162FBD729E2E5C0C48B606BC8ED05A9EB8B44D01626207C0A2`). These are layer-color/layout previews only, not runtime parallax verification. They use far source crops x=0/240/480 and mid crops x=0/480/960 over the existing 960x540 sky.
- Parent reviewed and accepted this layout. Final asset: `public/assets/environment/env-frost-mid-v2.png`, 1920x540 PNG, Format32bppArgb, 168,104 bytes, SHA-256 `1D0F159EC2D80493D74542BFC8CCA96EB9EAF3487C6E0C1EFAD69239984C174A`. Rows y=180..539 contain zero nonzero-alpha pixels; sample alpha at (0,0)=204, (100,100)=228, and (960,179/180/539)=0. The public asset is byte-identical to the source-only preview.

No browser, build, or test suite was run. No commit or release was made.