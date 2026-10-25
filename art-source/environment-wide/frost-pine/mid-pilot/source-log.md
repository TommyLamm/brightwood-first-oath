# Frost Pine mid v2 source log

Date: 2026-10-24
Scope: Frost Pine mid layout asset, accepted by parent on 2026-10-24 and copied unchanged to public. No game code, manifest, or release file was changed.

## Instructions and references
- Read local `AGENTS.md`, the ImageGen skill, and `art-source/expansion-frost/pine/env-frost-pine-mid-prompt.md`. The current Playroom template and its seven linked specifications were fetched in full with uncached HTTP requests; URLs and UTC read times are in `../../frost/source-log.md`.
- Visually inspected the original Pine mid source and Pine sky-v1. The original prompt is preserved as `mid-prompt-source.md`; the exact generation prompt is `pine-mid-v2-prompt.txt`.
- Baselines in `reference-baseline/`:
  - `env-frost-pine-mid-source.png` (1672x941), SHA-256 `16DBEFC620215DB705ADAB6AECF429F39F5F510696463C7AAA0B9481B90D1FDF`
  - `env-frost-pine-mid-v1.png` (960x540), SHA-256 `E39F324F6780FAC28D229BC5E65FEDE46D59E676AC2780C2F2284EAD740B384C`
  - `env-frost-pine-sky-v1.png` (960x540), SHA-256 `18FF80DA95251CA737667985F05BACE7849EB049F473E687037B46FF13F140BD`
  - `forest-style-reference-v1.png` (2117x743), SHA-256 `CFD7D9BAE4C6433F645F6B5344F2ABDF85E5DD5AA8E8996CCC4E4697A40A8E95`
- These three generation references were passed to ImageGen: Pine mid source, Pine sky-v1, and forest-style reference. Pine mid-v1 was copied as a baseline only.

## Generation and alpha cleanup
- Built-in ImageGen was used; `transparent_background: true` was passed explicitly. The prompt was saved before generation.
- Original raw output: `C:\Users\Tommy\.codex\generated_images\01a16d80-b179-72c1-81f6-b7c3333477ba\exec-2c26ec7e-b30d-47f1-a5ce-19cb7f6048d3.png`; copied unchanged to `pine-mid-v2-generated-raw.png`.
- Raw: 2103x748 PNG, Format32bppArgb, 980,443 bytes, SHA-256 `978BC55663146C68F8FB13680A16E276179B57989B8CD155DB0DEE00E5C5445F`. Alpha samples: (0,0)=214, (540,0)=0, (540,374)=0, (1051,747)=0.
- Parent authorized one cleanup pass in a separate copy: set only nonzero alpha A<=3/255 to zero, preserve RGB, leave raw unchanged. The cleanup affected 37,228 pixels; max cleared alpha was 3. Premultiplied channel delta was at most 3/255 and averaged 0.7264/255 across cleared pixels. Clean copy: `pine-mid-v2-generated-cleaned-alpha3.png`, 1,187,096 bytes, SHA-256 `2DDEE9AF178AC550ECBE7CC22DD7144242627FFCBF7DE447FEBDBCBABF809991`.
- Remaining alpha>0 x-runs: 0..501, isolated x=503, 567..908, 1253..1591, 1654..2102. The x=503 pixel was preserved with the first group; the four crops are x=0..503, 567..908, 1253..1591, 1654..2102. The gaps between these crop groups are fully transparent.

## Source-only layout previews
- Each unique crop was used once, not flipped or duplicated. A single uniform factor 180/388 = 0.463918 was used. The top edges remain at y=0. Destinations: x=0, 600, 1250, and 1712 (last group right-aligned). Scaled sizes: 234x180, 159x123, 157x138, and 208x158; deepest art is 180px.
- Source-only preview: `previews/frost-pine-mid-v2-layout-source-only-1920x540.png`, 260,632 bytes, SHA-256 `E9DBB4442EEA6AE71AB644B376D8234ADED9D6374D7EE1FB5AF7D0C576891875`.
- Sky/far/mid illustrative review contact sheet: `previews/frost-pine-mid-v2-layout-composite-three-views-2880x540.png`, 2,735,418 bytes, SHA-256 `7FD8CBAF61D3749D3F027FBD2EF3FA6BA7086438D8C49957841FB3EE5AF64F42`. Individual 960x540 start/middle/max crops are also in `previews/`. The previews use Pine sky-v1, far-v2 offsets 0/240/480, and mid offsets 0/480/960. This is a color/layout preview, not runtime parallax validation.
- Parent reviewed and accepted the layout. Final asset: `public/assets/environment/env-frost-pine-mid-v2.png`, 1920x540 PNG, Format32bppArgb, 260,632 bytes, SHA-256 `E9DBB4442EEA6AE71AB644B376D8234ADED9D6374D7EE1FB5AF7D0C576891875`. The public file is byte-identical to the source-only preview; zero nonzero-alpha pixels occur below y=180.

No browser, build, or test suite was run. No commit or release was made.