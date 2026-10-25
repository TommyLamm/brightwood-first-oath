# Frost Cave far v2 source log

Date: 2026-10-24
Scope: Wide Frost Cave far-layer asset only. The parent reviewed and accepted the generated composition. No game code, manifest, or release file was changed.

## Instructions and references
- Local `AGENTS.md`, the ImageGen skill, and `art-source/expansion-frost/environment/env-frost-cave-far-prompt.md` were read. Current Playroom template and seven linked specifications were fetched in full with uncached HTTP requests; URLs and UTC read times are recorded in `../frost/source-log.md`.
- Visually inspected the edited cave far source, its original generation source, current cave far-v1, and cave sky-v1. The edited source was used; the original generation source is preserved as `env-frost-cave-far-generation-source-not-used.png` and was not sent to ImageGen.
- Baseline copies are in `reference-baseline/`:
  - `env-frost-cave-far-source.png` (1671x941), SHA-256 `D1205EB51E9ACF5AC9A45A51A9D96F68266987A7F0447C98D76895D13C900760`
  - `env-frost-cave-far-generation-source-not-used.png` (1672x941), SHA-256 `14554394DA1773B820EEECCF9937B588AE39C7FB1860AF34CDD81C2236D7E849`
  - `env-frost-cave-far-v1-960x540.png`, SHA-256 `6DCACAC42C8A5310600F771C5BC7E777AB51CFE8E088FB39B1E236BF73AF6505`
  - `env-frost-cave-sky-v1-960x540.png`, SHA-256 `53932283994F664DD07D2813F3E45AD5FE40F2A7656F39E068691BD130016210`
- Local source prompt is preserved in `far-prompt-source.md`; exact generation prompt is `frost-cave-far-v2-prompt.txt`.

## Generation and processing
- Tool: built-in ImageGen; `transparent_background: true` was passed as an argument.
- References: edited `env-frost-cave-far-source.png` and `env-frost-cave-sky-v1-960x540.png`.
- Original ImageGen output: `C:\Users\Tommy\.codex\generated_images\01a16d80-b179-72c1-81f6-b7c3333477ba\exec-ea73a3a7-fe26-429d-87bc-83e2b690b3f0.png`; copied unchanged to `frost-cave-far-v2-generated-raw.png`.
- Raw: 2048x768 PNG, Format32bppArgb, 2,308,104 bytes, SHA-256 `BF71616D5703F6BC4DDDD70BB2FEFCE5CF65095040458ED585F4B6CECDBDBF9B`.
- Final: `public/assets/environment/env-frost-cave-far-v2.png`, 1440x540 PNG, Format32bppArgb, 1,462,586 bytes, SHA-256 `46C6D2161899CCDCB6E468DA2C7601A9E4F2B0E519DA314FD1FC9CF84CE6633B`.
- Processing was a uniform proportional high-quality downscale from 2048x768 to 1440x540 (8:3 to 8:3); no crop, mirror, tile, or manual seam.
- Alpha samples in the final asset: (720,0)=0, (720,100)=0, (720,200)=252, and (720,300/400/500/530)=0. Pixel format is Format32bppArgb. The cave's upper arch is intentional, so ordinary upper-sky transparency checks do not apply to the ceiling silhouette.
- Diagnostic crop at x=960 is `previews/frost-cave-far-v2-x960-diagnostic-crop-no-join.png`, 480x1080, Format32bppArgb, 188,514 bytes, SHA-256 `7BB34651FB7AD4B8CC762CE28F6DD60FAF7A7CCE3A3AA587AFED40F8B91ED7E4`. It is only a review crop; no join was made there.
- Visual inspection showed a continuous cave arch and icy rock formations; parent reviewed and accepted it.

No browser preview, build, or test suite was run for this standalone art asset. No commit or release was made.