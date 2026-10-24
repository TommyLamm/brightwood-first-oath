# Sunwell Basin Environment Source Log

Generated: 2026-10-24
Owner: Codex asset packet
Runtime theme: `sunwell` (`env:sunwell:sky`, `env:sunwell:far`, `env:sunwell:mid`)
Purpose: three-layer, 960x540 side-scrolling background for the Sunwell Basin map.

All selected layers were generated with the built-in ImageGen tool. Existing sand and dune layers were inspected for project scale and visual conventions, but no reference image was passed to ImageGen so the basin composition remains original. Two initial far-layer drafts were discarded for saturated edge pixels; the selected far layer is a fresh third generation. The generated source PNGs below are preserved unchanged in this folder. Exact selected prompts are in `prompts.md`.

| Layer | Preserved ImageGen source | Runtime image | Source format | Source SHA-256 | Runtime format | Runtime alpha | Runtime SHA-256 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Sky | `env-sunwell-sky-generated-v1.png` | `public/assets/environment/env-sunwell-sky-v1.png` | 1672x941 RGB | `887eb7d5966cfaaf2478f8450396ab89b0e79fecd1ce773a640da1b6a982d9c6` | 960x540 RGB | opaque | `01f3dee1f67d378b5cbdd95591a85a1bce03132ab8fe36697590a50bb9655ec0` |
| Far, selected generation 3 | `env-sunwell-far-generated-v3.png` | `public/assets/environment/env-sunwell-far-v1.png` | 1672x941 RGBA | `6bf12e979630b6e42875d6d6de06badeb21c70d6627f3901cc68db65041f77f4` | 960x540 RGBA | 0..255 | `db304945d9c9dcb7cfdabacacf8edc78e5796b80498cc83479c3b0596ae6abfd` |
| Mid | `env-sunwell-mid-generated-v1.png` | `public/assets/environment/env-sunwell-mid-v1.png` | 1672x941 RGBA | `3953598bde0cb84126dcca450e903afe69dddc6e1e91495b8f738163103bb655` | 960x540 RGBA | 0..255 | `51173d43b02caf239a06a69e192d85c6c01ce6bb15fdbeea6ee5aed42a5a69a5` |

The runtime PNGs were resized from the original generated outputs with nearest-neighbor sampling to exactly 960x540. Far and mid retain their generated RGBA alpha; no background keying, alpha thresholding, recoloring, or edge cleanup was applied. The three runtime PNGs total 1,129,066 bytes (about 1.08 MiB).

The requested 960x540 layer composite preview is `preview-env-sunwell-composite-960x540.png` in this folder. It composites runtime sky, far, and mid layers in that order. It is a source preview and is not referenced by game code.

ImageGen source locations before archival:
- Sky: `C:\Users\Tommy\.codex\generated_images\01a16c33-63a8-7f62-a0e6-25b5fdeed697\exec-2b5c8772-5df6-47ef-8f60-dd28042c3897.png`
- Far, selected third generation: `C:\Users\Tommy\.codex\generated_images\01a16c33-63a8-7f62-a0e6-25b5fdeed697\exec-c8af8ec9-762a-428e-8cc3-a55ca5a9a147.png`
- Mid: `C:\Users\Tommy\.codex\generated_images\01a16c33-63a8-7f62-a0e6-25b5fdeed697\exec-98217121-aaf9-4f60-a243-e732f2841793.png`
