# Sand Dune Pass far-wide pilot source log

Updated: 2026-10-24
Scope: dune far and mid-layer v2 source work. This is separate from the coastal Gold Sand Sea art.

## Brief and review

The far layer depicts a dry inland caravan canyon with wind-cut sandstone arches, mesas and a broad distant corridor. It contains no coastline or sea. The existing dune sky remains at its native 960x540 size in previews. Root reviewed the generated candidate across start/middle/end parallax views and accepted it as the dune far v2 asset.

The tool call used the built-in ImageGen with `transparent_background=true` and only the dune sky as visual reference. The untouched raw source is archived as `env-sand-dune-far-pilot-raw.png`; generated original path: `C:\Users\Tommy\.codex\generated_images\01a16d80-e1f9-7380-9640-c8fe3dce3210\exec-374096ef-33a2-48f0-92c8-804a8a602d62.png`.

## Files and checks

- Raw source: `env-sand-dune-far-pilot-raw.png`, 1,429,781 bytes, SHA-256 `3e57c151ac4be860ec48677baf222d48d90f1f0c07be9b64dcacb6f7be487b24`.
- Target candidate: `env-sand-dune-far-fit-1440x540.png`, 1440x540 RGBA, 504,364 bytes, SHA-256 `347b4d835abbd4a8677cd0af1394850c99e978aafd731beccffad08745acab72`.
- Candidate alpha: min/max 0..255; alpha=0: 506,158 pixels; partial alpha: 271,041; alpha=255: 401; alpha>127 bounds x=0..1439, y=247..539.
- The raw 2048x768 source was resized proportionally to 1440x540 with Lanczos filtering. No crop, padding, mirror, tile, horizontal repeat, color-key, alpha threshold, runtime scale or compositing was applied to the candidate.
- Runtime preview contact: `preview-env-sand-dune-far-v1-runtime-contact.png`; the filename's `v1-runtime` part is a working-label mistake. It shows the new v2 candidate over the unchanged v1 sky at offsets 0/184/368 (scrollX 0/920/1840; far factor 0.2). The preview uses an unscaled 960x540 sky and is not a runtime asset.
- Root-approved public copy: `public/assets/environment/env-sand-dune-far-v2.png`, 504,364 bytes, SHA-256 `347b4d835abbd4a8677cd0af1394850c99e978aafd731beccffad08745acab72`.

At the far approval checkpoint, no manifest, game.json, source code, sky, mid layer or other theme was changed. The mid pilot and its review are recorded below. No build, browser run, full test suite, commit, push, tag or release was performed.

Exact ImageGen wording, references and tool transparency setting are preserved in `prompts.md`.


## Mid pilot and source-only layout candidate

One mid pilot was generated with the built-in ImageGen tool using `transparent_background=true`; the exact prompt and references are preserved in `prompts.md`. Raw source: `env-sand-dune-mid-pilot-raw.png`, 2048x768 RGBA, 922,119 bytes, SHA-256 `b62eeb502af9b66f91360338f80ff27123d30fefc3e903c50a0e1206d895b0b0`.

Raw alpha check: 0 pixels 1,391,152; alpha 1..3 pixels 15,420; alpha 4..254 pixels 166,292; alpha 255 pixels 0. Root authorized one limited cleanup that sets only alpha 1..3 to zero in the separate `env-sand-dune-mid-clean-alpha3.png`; raw source remains unchanged. RGB channels were preserved. Premultiplied-color difference from this cleanup is max 2.447 on a 0..255 channel (0.960% of full scale), mean 0.567. After cleanup, the remaining nonzero vertical depth is 283 pixels, and full transparent source columns divide three unique groups at x=748..1240 and x=1425..1522.

For review, each unique group is used once, scaled uniformly by 180/283=0.6360424 with nearest-neighbor sampling, and placed at the upper left, upper center and upper right on a 1920x540 transparent canvas. No group is mirrored or repeated; the bottom 360 rows are exactly transparent. Candidate: `env-sand-dune-mid-layout-candidate-1920x540.png`, RGBA, 156,591 bytes, SHA-256 `d9f6da83338d5fba851a2be8f2fd08e52403cfcd13295e0a610d8153f70094d2`. The three-view source-only preview over the unchanged sky and far-v2 is `preview-env-sand-dune-mid-layout-contact-2880x540.png`; it is not a runtime file.

The first layout was reviewed and rejected because its central small rock read as floating. That source-only candidate remains archived for comparison and was not copied to `public/assets`.


## Revised mid composition after review

Root asked to omit the independent central fragment (source x=1241..1424) while retaining the two outer groups. The revised source-only candidate uses only the unique outer groups at x=0..747 and x=1523..2047, each once, resized uniformly by 180/283=0.6360424 to widths 476 and 334. They remain attached to the top and left/right canvas edges; no alpha cleanup, deletion, mirroring or duplication was applied in this layout step. Bottom rows 180..539 are fully transparent.

- Candidate: `env-sand-dune-mid-layout-candidate-edges-1920x540.png`, RGBA, 147,383 bytes, SHA-256 `6c27534c9fbea77a5621bb84afaaadf6ad903a12f5feaf3c6fa079b70381ba82`.
- Three-view preview: `preview-env-sand-dune-mid-layout-edges-contact-2880x540.png`, over the existing sky and far-v2.
- Root reviewed and accepted the revised contact. The candidate was copied unchanged to `public/assets/environment/env-sand-dune-mid-v2.png`.


## Approved public v2 copy

- Path: `public/assets/environment/env-sand-dune-mid-v2.png`
- Dimensions: 1920x540 RGBA
- Bytes: 147,383
- SHA-256: `6c27534c9fbea77a5621bb84afaaadf6ad903a12f5feaf3c6fa079b70381ba82`
- No manifest, game.json, runtime code, sky-v1, or unrelated asset was changed.


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
