# Frost Cave mid v2 source log

Date: 2026-10-24
Scope: Frost Cave mid layout asset, accepted by parent on 2026-10-24 and copied unchanged to public. No game code, manifest, or release file was changed.

## Instructions and references
- Read local `AGENTS.md`, the ImageGen skill, and `art-source/expansion-frost/cave/env-frost-cave-mid-prompt.md`. The current Playroom template and its seven linked specifications were fetched in full with uncached HTTP requests; URLs and UTC read times are in `../../frost/source-log.md`.
- Visually inspected the original Cave mid source and Cave sky-v1. The original prompt is preserved as `mid-prompt-source.md`; the exact generation prompt is `cave-mid-v2-prompt.txt`.
- Baselines in `reference-baseline/`:
  - `env-frost-cave-mid-source.png` (1672x941), SHA-256 `4567ABC41459D6A9D19A6A5D36B39A524853549D99FA0F4C4A97B9751C0FE65D`
  - `env-frost-cave-mid-v1.png` (960x540), SHA-256 `5CA73E8FA5F59E52117547D7877D5C7E98F9DDAFD9DAAC18BD1579D823E95082`
  - `env-frost-cave-sky-v1.png` (960x540), SHA-256 `53932283994F664DD07D2813F3E45AD5FE40F2A7656F39E068691BD130016210`
  - `env-frost-cave-far-v2.png` (1440x540), SHA-256 `46C6D2161899CCDCB6E468DA2C7601A9E4F2B0E519DA314FD1FC9CF84CE6633B`
- These three generation references were passed to ImageGen: Cave mid source, Cave sky-v1, and accepted Cave far-v2. Cave mid-v1 was copied as a baseline only.

## Generation and alpha cleanup
- Built-in ImageGen was used; `transparent_background: true` was passed explicitly. The prompt was saved before generation.
- Original raw output: `C:\Users\Tommy\.codex\generated_images\01a16d80-b179-72c1-81f6-b7c3333477ba\exec-b98548ad-7f8b-48f1-8e41-ff6cff33be6f.png`; copied unchanged to `cave-mid-v2-generated-raw.png`.
- Raw: 2059x764 PNG, Format32bppArgb, 532,711 bytes, SHA-256 `75E51C5516583B3115901A6F92C6BD8B43EE0F0BAB9949AE69BC0E2CFB50BE4F`. Alpha samples: (0,0)=246, (500,0)=0, (500,382)=0, (1029,763)=0.
- Parent authorized one cleanup pass in a separate copy: set only nonzero alpha A<=3/255 to zero, preserve RGB, leave raw unchanged. The cleanup affected 23,360 pixels; max cleared alpha was 3. Premultiplied channel delta was at most 3/255 and averaged 0.8024/255 across cleared pixels. Clean copy: `cave-mid-v2-generated-cleaned-alpha3.png`, 745,182 bytes, SHA-256 `E278A468FE8E0A48B4C84CBA47F8C09C3A0ACAD88A304E05A202683470ECD9B6`.
- Remaining alpha>0 x-runs: 0..440, isolated x=442, 566..850, 1111..1460, 1633..2058. The x=442 pixel was preserved with the first group; the four crops are x=0..442, 566..850, 1111..1460, 1633..2058. The gaps between these crop groups are fully transparent.

## Source-only layout previews
- Each unique crop was used once, not flipped or duplicated. A single uniform factor 180/300 = 0.6 was used. The top edges remain at y=0. Destinations: x=0, 600, 1250, and 1664 (last group right-aligned). Scaled sizes: 266x173, 171x166, 210x158, and 256x180; deepest art is 180px.
- Source-only preview: `previews/frost-cave-mid-v2-layout-source-only-1920x540.png`, 268,808 bytes, SHA-256 `DCFECA456A6FDD5D22397DCF15D990EF47327CA509B9974AE46EC6374F6688F9`.
- Sky/far/mid illustrative review contact sheet: `previews/frost-cave-mid-v2-layout-composite-three-views-2880x540.png`, 3,466,142 bytes, SHA-256 `6B57A4B308B15629651577F09E872C8B7A660F04C8C2426F110116723A19CD29`. Individual 960x540 start/middle/max crops are also in `previews/`. The previews use Cave sky-v1, far-v2 offsets 0/240/480, and mid offsets 0/480/960. This is a color/layout preview, not runtime parallax validation.
- Parent reviewed and accepted the layout. Final asset: `public/assets/environment/env-frost-cave-mid-v2.png`, 1920x540 PNG, Format32bppArgb, 268,808 bytes, SHA-256 `DCFECA456A6FDD5D22397DCF15D990EF47327CA509B9974AE46EC6374F6688F9`. The public file is byte-identical to the source-only preview; zero nonzero-alpha pixels occur below y=180.

No browser, build, or test suite was run. No commit or release was made.