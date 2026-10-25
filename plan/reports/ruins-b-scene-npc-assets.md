# Ruins B: scene, NPC, item, and SFX handoff

Date: 2026-10-25 (Hong Kong time)  
Status: **owner scope complete; actor manifest released to atlas assembly; no commit**

## Sources and provenance

Read `AGENTS.md`, `plan/13-ruins-echo-exploration.md` §8/§10, `plan/reports/ruins-b-dispatch.md`, `plan/reports/ruins-b-app-ui-render.md`, and `plan/reports/ruins-b-monster-profiles.md`. The main agent had already read the Playroom template and its seven linked specifications for this work session; this owner relied on that recorded review. The ImageGen skill was read before source recovery and review.

Recovered metadata only from the exact prior owner rollout `01a1717f-aeba-7ef1-8712-5a5aa386d30e` (`C:/Users/Tommy/.codex/sessions/2026/10/25/rollout-2026-10-25T13-19-15-01a1717f-aeba-7ef1-8712-5a5aa386d30e.jsonl`). Seven existing raw files matched their saved ImageGen outputs byte-for-byte. The missing `muted-bell-fragment` was already generated in that session; it was copied from its exact saved path and was not regenerated. All eight complete submitted prompts, saved paths, output path call IDs, wrapper call IDs, hashes, reference inputs, and acceptance notes are recorded under `art-source/ruins-b/scene-npc/metadata/` and `prompts/`.

The wrapper returned `image_url` and `output_hint`, but no `revisedPrompt`; every metadata record states `revisedPrompt: null` and `revisedPromptReturnedByTool: false`. The exact submitted prompts were recovered from the matching call input and preserved without inventing revisions. One earlier sky attempt had no saved path/output hint; it is recorded as unused in `metadata/attempts.json`.

| Frame ID | Raw source | Raw SHA-256 | Saved output call ID |
| --- | --- | --- | --- |
| `env:ruins-gallery:sky` | `ruins-gallery-sky-source.png` | `481A94884088DCE663C85230F41E8D9692E1270B93BA1B86BE5ABC0F681FF4E2` | `exec-0563c136-a8bf-4a7d-904b-dec61596f86a` |
| `env:ruins-gallery:far` | `ruins-gallery-far-source.png` | `62D4CA1F826954ACBA4ACCC922A4B5C80AAF1C138F83EAEBDDAF864F56216D9F` | `exec-bebb97ca-c98e-4a3e-a42a-efd53a04c074` |
| `env:ruins-gallery:mid` | `ruins-gallery-mid-source.png` | `8AD640C2CC999EC2FC4FCBAA3E2AC076681BFFADA89269C599096F2AC4F231F2` | `exec-5f5e9b2d-23de-4f69-a017-7fa1ba86922b` |
| `npc:ruins-pathfinder:idle-0` | `ruins-pathfinder-idle-0-source.png` | `8EFA24486966C82EBD0FD7666E633E6A32C08DFDA2E5EDEB6F528562283EB703` | `exec-309927a5-e863-425f-aae6-c7aaa1274af9` |
| `npc:ruins-pathfinder:idle-1` | `ruins-pathfinder-idle-1-source.png` | `CF820B030374CC74E0FF747A36976730C1FA2DA6CDD2216215F81D78F376635E` | `exec-d22825fd-64e3-4895-a9df-6d550bebe3fd` |
| `actor:ruins-stele` | `ruins-stele-source.png` | `EADE70EAB4830DB81A642F66A2B51B12B71A0021D4BCF3AB9A9EB362323EDA1B` | `exec-1584f79b-099a-417d-ae07-1e0db760ec87` |
| `item:broken-copper-thread` | `broken-copper-thread-source.png` | `6F99B3F19A81C6CCF5BDAAD7A0C33AE405442490A7A577B6308769F56EAB8EDB` | `exec-ec2e11de-3f27-4dae-8cf3-7276a68a5cff` |
| `item:muted-bell-fragment` | `muted-bell-fragment-source.png` | `0C7CAEEB3C490D7FD7593221D1DF52F0178C6C97BAB273A5F5B5D04EBA057E53` | `exec-438ecd74-c899-4c25-b3f9-7ae290659e3e` |

Each `savedPath` is under `.codex/generated_images/01a1717f-aeba-7ef1-8712-5a5aa386d30e/` and is recorded in that frame's metadata. All eight raw hashes were rechecked against their exact saved source. Raw PNGs remain unchanged.

## Runtime assets and normalization

`art-source/ruins-b/scene-npc/tools/normalize-scene-assets.py` performs the deterministic crop/resize, RGBA output, and PNG compression (`optimize=True`, compression level 9) without palette conversion. It writes runtime PNGs only when the destination does not already exist.

| Runtime key | Output | Dimensions | Runtime use | Bytes |
| --- | --- | ---: | --- | ---: |
| `env:ruins-gallery:sky` | `public/assets/environment/env-ruins-gallery-sky-v1.png` | 960×540 RGBA | fixed sky | 717,145 |
| `env:ruins-gallery:far` | `public/assets/environment/env-ruins-gallery-far-v1.png` | 1440×540 RGBA | far parallax | 817,828 |
| `env:ruins-gallery:mid` | `public/assets/environment/env-ruins-gallery-mid-v1.png` | 1920×540 RGBA | mid parallax | 454,456 |
| `actor:ruins-pathfinder` | `public/assets/actors/npcs/ruins-pathfinder-idle-v1.png` | 192×96 RGBA | 2×96px cells; display 96×96, pivot `(0.5,1)` | 15,864 |
| `actor:ruins-stele` | `public/assets/actors/npcs/ruins-stele-v1.png` | 192×256 RGBA | display 96×128, pivot `(0.5,1)` | 44,940 |
| `item:broken-copper-thread` | `public/assets/interface/item-broken-copper-thread-v1.png` | 128×128 RGBA | display 32×32 | 12,394 |
| `item:muted-bell-fragment` | `public/assets/interface/item-muted-bell-fragment-v1.png` | 128×128 RGBA | display 32×32 | 15,188 |
| `stele-tune` | `public/assets/audio/stele-tune.wav` | 48 kHz mono PCM16, 0.55 s | one-shot SFX | 52,844 |

The pathfinder frames share one combined source crop and scale to avoid breathing-frame jitter. Both are full-body, right-facing, and closed-mouth; the idle animation uses `[0,1]` at `[350,350]` ms. The single stele actor is reused by both placements; west/east idle metadata uses `[0,0]`, `[350,350]` ms, looping. The mid layer's alpha is exactly zero for every pixel at `y >= 180`; its source pixels below that required boundary were cleared during normalization.

The three environment layers read as calm open galleries with separated far detail and a top-edge stone/root frame. Visual review found their surfaces more softly hand-painted than strict chunky pixel clusters; they were retained from the recovered sources without regeneration, as instructed. Pathfinder, stele, and item silhouettes remain readable in the saved runtime-size reviews.

## SFX and manifests

Added the original deterministic `stele-tune` recipe in `tools/audio/scores/sfx.mjs`: a muted stone tap under paired mineral/copper partials with a short echo. Ran `node tools/audio/generate-audio.mjs --only stele-tune`; the existing music tracks were not regenerated. The WAV header reports PCM format 1, mono, 48,000 Hz, 16-bit, 26,400 frames (0.55 s). SFX provenance and hash are in `metadata/stele-tune.metadata.json`.

Added only these new entries while retaining prior working-tree entries:

- `public/assets/actors/manifest.json`: 2 images and 3 animations.
- `public/assets/environment/manifest.json`: 3 images.
- `public/assets/interface/manifest.json`: 2 images.
- `public/assets/audio/manifest.json`: `stele-tune`.

The audio generation rewrote its manifest from the current catalogs. The pre-existing `theme-ruins` base/combat entries remain in their prior order, and no prior audio entry was removed or changed; the diff adds those already-present-in-worktree music keys relative to committed HEAD and the new `stele-tune` key. All new manifest URLs resolve to files. **Actor manifest ownership is now released to the atlas assembly owner.**

## Checks and limits

- Rechecked all 8 raw-source SHA-256 mappings against the exact recovered saved paths; all match. Confirmed prompt files exist and `revisedPrompt` is explicitly absent in the source tool output.
- Checked runtime image dimensions and alpha channels. Far and mid are RGBA with transparency; mid rows `180..539` have alpha max 0.
- Checked the SFX WAV header, sample rate, bit depth, channels, frame count, and duration.
- Verified the new actor/environment/interface/audio manifest keys and referenced file existence. Reviews were saved as neutral-matte JPEGs at quality 70, each no larger than 1280px on the long edge.
- New runtime assets total **2,130,659 bytes (about 2.03 MiB)**, under the 4 MiB B target.
- No game tests, typecheck, content check, loader suite, build, browser review, or commit was performed. Runtime composition and in-game audio remain unverified here.
