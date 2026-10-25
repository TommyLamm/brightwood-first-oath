# Sand Far Wide-Layer Source Log

Updated: 2026-10-24 11:03:17 UTC
Owner: Codex asset packet
Scope: Sand far and mid-layer v2 source work. Sand Dune Pass remains separately archived.

Local environment-generation records were read at art-source/expansion-sands/environment/source-log.md. The accepted sand sky was viewed and passed as the only style/palette reference. Existing far-v1 art was not passed to ImageGen because it has colored alpha-edge pixels.

## Acceptance

Target: 1440x540 RGBA, warm Gold Sand Sea coast and wind-carved sandstone, no canyon-pass props, true transparent empty space, no runtime scale baked into the image, no colored edge fringe. Sky remains separate. Inspect target-scale composites over the existing 960x540 sky. Any crop must preserve aspect ratio and remove only fully transparent margins.

## Attempts and alpha

| Attempt | Source copy | Original source | Dimensions / alpha | Status |
| --- | --- | --- | --- | --- |
| 1 | env-sand-far-attempt1-raw.png | C:\Users\Tommy\.codex\generated_images\01a16d80-e1f9-7380-9640-c8fe3dce3210\exec-f7ffd40f-cf90-4041-afed-992db3efcb8d.png | 1983x793 RGBA; alpha 0..255; transparent=1,158,533; partial=413,766; opaque=220; alpha>127 body y=395..792 | Selected and root-approved visual candidate |
| 2 | env-sand-far-attempt2-raw.png | C:\Users\Tommy\.codex\generated_images\01a16d80-e1f9-7380-9640-c8fe3dce3210\exec-1526fae1-4ccc-49c0-9cc8-694d2fa9346b.png | 2048x768 RGBA; alpha 0..254; transparent=1,074,951; partial=497,913; opaque=0; alpha>127 body y=353..767 | Target ratio matches, but visible outer glow on the sky composite; not selected |

Attempt 1 was proportionally resized from 1983x793 to 1440x576, then cropped to rows 36..575. The cropped top 36 rows were fully transparent after resizing (nonzero-alpha count 0), so no scenic pixels were removed. Resulting fit candidate: env-sand-far-attempt1-fit-1440x540.png, 405,783 bytes, SHA-256 59ac3a9bee7535b7174ef1288d4678c4e147f9ddc2a02cc6ced93db14dce07a0. It is RGBA; alpha=0 pixels 559,277, partial-alpha pixels 218,211, alpha=255 pixels 112; body bounds at alpha>127 are x=0..1439, y=251..539.

Attempt 2 was proportionally resized to 1440x540 without cropping. Fit candidate: env-sand-far-attempt2-fit-1440x540.png, 740,821 bytes, SHA-256 7d6153ac0bdab9cdc5f97848aa0753f43c9ecd5af7e593fc35be24b5c97781e8. It is RGBA; alpha=0 pixels 531,483, partial-alpha pixels 246,117, alpha=255 pixels 0; body bounds at alpha>127 are x=0..1439, y=248..539.

## Visual comparison

The contact sheet preview-sand-far-attempts-contact-1920x1620.png compares both target-size fits over the accepted sky in a fixed 960x540 viewport. The left column is attempt 1; the right column is attempt 2. Rows show far offsets 0, 184 and 368. The sky remains at its native 960x540 size. Attempt 1 has the more natural coastline and no strong colored fringe visible at target scale; attempt 2 has a noticeable bright halo. Exact prompts are in prompts.md.

Attempt 1 scenery begins at y=251/540, so it occupies more vertical space than the initial 35–40 percent composition request. This is recorded for root review rather than being hidden by a measurement threshold.

At the initial comparison checkpoint the public v2 copy had not yet been written. Root later approved attempt 1 and it was copied unchanged to the authorized public v2 path, recorded below. No manifest, runtime code, sky, or other theme was changed.
## Root-approved v2 runtime asset

Root reviewed the attempt 1 target-size candidate over the existing sky at offsets 0, 184 and 368 and approved its coastline, silhouette and target-scale edges. The candidate was copied unchanged to `public/assets/environment/env-sand-far-v2.png`.

- Dimensions: 1440x540 RGBA
- Bytes: 405,783
- SHA-256: `59ac3a9bee7535b7174ef1288d4678c4e147f9ddc2a02cc6ced93db14dce07a0`
- No manifest, source code, sky or unrelated asset was changed.


## Mid pilot and source-only layout candidate

One mid pilot was generated with the built-in ImageGen tool using `transparent_background=true`; the exact prompt and references are preserved in `prompts.md`. Raw source: `env-sand-mid-pilot-raw.png`, 2048x768 RGBA, 944,092 bytes, SHA-256 `f46b99dae13db67cc4e91d609ac9261bb23eb7adb4627b8c521504ea3e4f6ac7`.

Raw alpha check: 0 pixels 1,395,815; alpha 1..3 pixels 21,172; alpha 4..254 pixels 155,877; alpha 255 pixels 0. Root authorized one limited cleanup that sets only alpha 1..3 to zero in the separate `env-sand-mid-clean-alpha3.png`; raw source remains unchanged. RGB channels were preserved. Premultiplied-color difference from this cleanup is max 2.518 on a 0..255 channel (0.987% of full scale), mean 0.649. After cleanup, the remaining nonzero vertical depth is 299 pixels, and full transparent source columns divide three unique groups at x=687..1298 and x=1603..1737.

For review, each unique group is used once, scaled uniformly by 180/299=0.6020067 with nearest-neighbor sampling, and placed at the upper left, upper center and upper right on a 1920x540 transparent canvas. No group is mirrored or repeated; the bottom 360 rows are exactly transparent. Candidate: `env-sand-mid-layout-candidate-1920x540.png`, RGBA, 153,434 bytes, SHA-256 `ba0edeb26ff95201e3e0c0792cfc0fce4bbbd1e8387b918184aefaab071ff158`. The three-view source-only preview over the unchanged sky and far-v2 is `preview-env-sand-mid-layout-contact-2880x540.png`; it is not a runtime file.

Root reviewed the three-window contact and accepted the candidate. It was copied unchanged to `public/assets/environment/env-sand-mid-v2.png` (1920x540 RGBA, 153,434 bytes, SHA-256 `ba0edeb26ff95201e3e0c0792cfc0fce4bbbd1e8387b918184aefaab071ff158`). No manifest, code, sky, commit or release was changed.


## Project specification audit

Before asset production, read the repository `AGENTS.md`, the imagegen skill, and the existing theme source logs/prompts. The Playroom online template and its seven linked specifications were fetched directly with `Invoke-WebRequest` and `Cache-Control: no-cache`; the complete read finished before `2026-10-24 10:49:14 UTC`. URLs read:

- https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md
- https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/game-development.md
- https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/command-contracts.md
- https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game.schema.json
- https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-release.yml
- https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/examples/starter/playroom-sdk.js
- https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/sdk-versioning.md
- https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/save-compatibility.md

Applicable requirements: preserve game format and runtime; do not change manifest, `game.json`, sky-v1 or source code for this image-only task; do not publish or release beyond the authorized asset copies. No build, browser session or test suite was run; no commit, push, tag or release was made.
