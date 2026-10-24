# Sand Dune Pass environment source log

Generated 2026-10-24 using the built-in ImageGen tool. Existing `env-sand-*` shore layers and `public/assets/environment/manifest.json` were inspected for presentation and layer conventions. This is a new canyon composition, not a copy of the Gold Sand Sea shore scene.

| Layer | Preserved ImageGen source | Runtime image | Source format | Runtime format | Runtime SHA-256 |
| --- | --- | --- | --- | --- | --- |
| Sky | `env-sand-dune-sky-generated-v1.png` | `public/assets/environment/env-sand-dune-sky-v1.png` | 1672x941 RGB | 960x540 RGB, opaque | `08e1a63f618f97f0c9af2bbf20e5acbb0e846dc832c6b7cf17a6c155c9d426d9` |
| Far | `env-sand-dune-far-generated-v1.png` | `public/assets/environment/env-sand-dune-far-v1.png` | 1672x941 RGBA | 960x540 RGBA, alpha 0..255 | `cfa8445f35fc0b2a982f002b7d8583c67e408005e1271516ab56fc04cba56caa` |
| Mid | `env-sand-dune-mid-generated-v1.png` | `public/assets/environment/env-sand-dune-mid-v1.png` | 1672x941 RGBA | 960x540 RGBA, alpha 0..255 | `cc77c9c6be334734416451be50abf58e781ecf5f141640488ca60d783548045f` |

The runtime layers were resized with nearest-neighbor sampling. The far and mid source alpha was preserved; no background keying or fringe thresholding was applied. Exact prompts are in `prompts.md`.

ImageGen source locations before archival:
- Sky: `C:\Users\Tommy\.codex\generated_images\01a16b8f-eb9d-7842-9898-e6b03644678c\exec-0aad88a4-1119-48ce-a16e-36153559c71c.png`
- Far: `C:\Users\Tommy\.codex\generated_images\01a16b8f-eb9d-7842-9898-e6b03644678c\exec-3388b298-960d-472e-bfa5-7b2028808453.png`
- Mid: `C:\Users\Tommy\.codex\generated_images\01a16b8f-eb9d-7842-9898-e6b03644678c\exec-bbd5690d-e893-4f3c-a375-1a6aaeba2d3a.png`
## Clean replacement far/mid v2 (current runtime)

The initial far/mid runtime exports were rejected in integration review for saturated colored pixels around the alpha boundary. Their v1 raw sources remain preserved above. Fresh replacement layers were generated with the built-in ImageGen tool and no reference image; they replace only the far and mid runtime files. The accepted sky and guide are unchanged. The replacement sources were resized to 960x540 with nearest-neighbor sampling; RGBA alpha was preserved without thresholding or pixel decontamination.

| Layer | Preserved replacement source | Runtime image | Source format | Runtime format | Runtime SHA-256 |
| --- | --- | --- | --- | --- | --- |
| Far v2 | env-sand-dune-far-generated-v2.png | public/assets/environment/env-sand-dune-far-v1.png | 1672x941 RGBA | 960x540 RGBA, alpha 0..255 | 58037fa139ed5f04cb1ce4c1044cb998eecd9a44b48ad91702b7b9d89915b213 |
| Mid v2 | env-sand-dune-mid-generated-v2.png | public/assets/environment/env-sand-dune-mid-v1.png | 1672x941 RGBA | 960x540 RGBA, alpha 0..255 | edd6c0981e78eef3671f91d9eebeadaa053ebdb20c487120f5aa307e0983bcf3 |

Replacement outputs were inspected at 960x540, composited over the accepted sky and on light and dark solid backgrounds. The target-scale silhouettes read with dark-brown contours and no visible saturated fringe. Exact generation prompts are recorded in prompts.md.

ImageGen replacement source locations before archival:
- Far v2: C:\Users\Tommy\.codex\generated_images\01a16b8f-eb9d-7842-9898-e6b03644678c\exec-a74fdc4e-ef78-4fee-92e6-9da20d4f7e6e.png
- Mid v2: C:\Users\Tommy\.codex\generated_images\01a16b8f-eb9d-7842-9898-e6b03644678c\exec-e5b0bea4-05c7-418d-9711-2938e642e368.png
