# Rock environment v2 source log

## Far v2 — accepted and exported (2026-10-24)

- The user authorized a complete redraw for best visual quality. Root visually accepted the raw low hills and rock peaks as natural and continuous before authorizing the export.
- Exact prompt: `env-rock-far-v2.prompt.txt`, 2,272 bytes, SHA-256 `604D63BFD922D8955F64DBCED8D7DA968CF0B539A18047A1F3594B1398041A9B`.
- References: rock sky for palette/lighting, the clean forest style reference, and the already accepted town far v2 for shared visual language. No rejected far image was referenced.
- Generated original: `env-rock-far-v2-generated-original.png`, 2048×768, 1,039,806 bytes, Format32bppArgb, SHA-256 `FF1182A039352CA094ED12CE65F4F826816432BEDC02F846FAD0505E1EBCA9E1`. Tool source: `C:\Users\Tommy\.codex\generated_images\01a16d80-797a-79d0-8d2e-38aac47d9301\exec-40408264-5de6-4c35-a423-88fb2e8453a2.png`. True alpha was checked; no full-width opaque base was present.
- Baseline: `env-rock-far-v1-reference.png`, 1672×941, 513,002 bytes, SHA-256 `9BB8BF37CA444CFA9FEF997AC0579BBB2D7E1DD074D09525820D14007D0A87D7`.
- Export: `public/assets/environment/env-rock-far-v2.png`, 1440×540 RGBA, 306,858 bytes, SHA-256 `B81B522447C771846BA359D9691F47741D36319DE9957F4E1EEA0F5CECA60116`. Derived uniformly from the 8:3 original using System.Drawing `CompositingMode.SourceCopy`, nearest-neighbor interpolation, and `PixelOffsetMode.Half`; no alpha threshold, recolor, or edge removal. Review files: `env-rock-far-v2-review-full.png` and `env-rock-far-v2-x960-detail.png`. This was one full-frame generation, so x=960 is not a stitched seam.

No manifest, `src/game.json`, sky/v1 asset, build, typecheck, test, browser/game run, commit, push, tag, or release was changed/performed for this asset.
## env:rock:mid v2 — accepted and exported (2026-10-24)

Root visually reviewed and approved the existing three-window contact preview; this task performed no image generation or redesign. The original, alpha-clean derivative, layout, prompt, and contact preview remain in this folder. The public asset is an exact copy of the approved layout; its SHA-256 matches the layout PNG.

- Exact prompt: env-rock-mid-v2.prompt.txt, 1646 bytes, SHA-256 2192720E24A8450F71BF6A8E70BB8DAA9645623351D32869DBB6049477FEEFA7.
- Generated original: env-rock-mid-v2-generated-original.png, 2048×768 RGBA, 1134910 bytes, SHA-256 975FAAE0FB3378D2904780E8247F66EA777DB832D624427FE6D2BB4C39E84C86; retained unmodified.
- Alpha-clean derivative: env-rock-mid-v2-alpha-clean.png, 2048×768 RGBA, 1626003 bytes, SHA-256 0AC1E16C7177FC54A786EC01387D58DA776EAB09EB930C8369F53D8ED992F770. Only pixels with alpha ≤3/255 were made fully transparent; RGB was preserved and the generated original was not changed.
- Accepted layout: env-rock-mid-v2-layout.png, 1920×540 RGBA, 226776 bytes, SHA-256 20068B1CCD3DAF13B22951067397A020E5CFD54030CDC0E9D134763D2A8AA3B2. The approved unique clusters are used once with open transparent gaps; no mirrored or repeated extension was added.
- Public copy: public/assets/environment/env-rock-mid-v2.png, 1920×540 RGBA, 226776 bytes, SHA-256 20068B1CCD3DAF13B22951067397A020E5CFD54030CDC0E9D134763D2A8AA3B2; byte-identical to the layout.
- Existing contact sheet: env-rock-mid-v2-review-contact-3x960.png, 2880×540 RGBA, 1529125 bytes, SHA-256 F0BB28281991D30F6A6688A961E08586176B175E76932CCCF8C6AA6FC5C1C3BB. Root approved this visual review before export.
- The single integration helper confirmed zero nontransparent pixels at y≥180 for this mid image.
- No source image was regenerated. No src, game.json, runtime parallax code, build, test, browser run, commit, push, tag, or release was changed/performed for this asset.
