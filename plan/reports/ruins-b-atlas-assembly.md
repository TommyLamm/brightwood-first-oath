# Ruins B Monster Atlas Assembly Handoff

Date: 2026-10-25 (Hong Kong time)  
Status: **both monster atlases and actor manifest entries assembled**. No commit.

## Sources and applicable requirements

- Read `AGENTS.md`, `plan/13-ruins-echo-exploration.md` §§6, 8, 10, and the accepted profile, motion, action, and scene/NPC handoffs: `ruins-b-monster-profiles.md`, `ruins-b-puppet-motion.md`, `ruins-b-puppet-actions.md`, `ruins-b-prowler-motion.md`, `ruins-b-prowler-actions.md`, and `ruins-b-scene-npc-assets.md`.
- The main agent read the Playroom game-agent template and its seven linked specifications for this work session; `plan/13-ruins-echo-exploration.md` §12 records the documents and applicable release requirements.
- Applied the approved atlas contract: 576×480 RGBA, 6×5 cells at 96×96, pivot `(0.5, 1)`, 18 distinct effective poses, right-facing complete bodies, at least 3px of alpha-zero padding on every edge, alpha-visible bottom at `y=92`, and alpha-bbox center `x=48` within 0.5px. Keep source/raw/prompt records intact and append two image plus ten animation entries after all existing actor-manifest entries.

## Source mapping and outputs

Each pose was mapped explicitly from its accepted normalized PNG, raw PNG, prompt, and per-pose metadata. The assembler checks the accepted frame ID, prompt text where recorded, and both raw and normalized SHA-256 values before packing. See [`monster-atlas-assembly.json`](../../art-source/ruins-b/assembly/monster-atlas-assembly.json) for the full per-cell source paths and hashes, source and packed alpha bounds, frame hashes, and cell mappings.

| Monster | Runtime atlas | Bytes | Image key | Animations |
| --- | --- | ---: | --- | --- |
| String Puppet | `public/assets/actors/monster-ruins-string-puppet.png` | 141,629 | `actor:ruins-string-puppet` | `ruins-string-puppet:idle`, `walk`, `attack`, `hurt`, `dead` |
| Bell Prowler | `public/assets/actors/monster-ruins-bell-prowler.png` | 195,544 | `actor:ruins-bell-prowler` | `ruins-bell-prowler:idle`, `walk`, `attack`, `hurt`, `dead` |

Both images are 576×480 RGBA with 30 row-major cells. Effective poses use cells `0–1` idle, `6–11` walk, `12–15` attack, `18–19` hurt, and `24–27` dead. Unused cells copy the required pose exactly: `2–5` copy `1`, `16–17` copy `15`, `20–23` copy `19`, and `28–29` copy `27`.

Animation contracts were appended as specified: idle `[0,1]` at `[200,200]` ms looping; walk `[6..11]` at 120 ms looping; attack `[12..15]` non-looping at `[500,500,100,900]` ms for the puppet and `[550,550,100,900]` ms for the prowler; hurt `[18,19]` at 100 ms non-looping; dead `[24..27]` at 100 ms non-looping. Both image entries use `assets/actors/monster-….png`, display size 96×96, and pivot `(0.5,1)`.

The actor manifest retains the existing 37 image and 106 animation entries in their original order and content, then adds the two monster images and ten animations. The scene owner’s existing pathfinder and stele entries remain present.

## Strict alpha-bound adjustments

The source normalizers used alpha `>8` for bounds, so I measured each accepted 96×96 PNG using actual alpha `>0`. Only outputs under `art-source/ruins-b/assembly/adjusted/` were adjusted; all accepted normalized inputs, raw images, prompts, and owner metadata remain unchanged. No scaling or body/line cropping was used.

- Eight puppet frames had an alpha-bbox center at `x=47.0`; each received a one-pixel right translation. Their bottom row was already `y=92`.
- Seventeen prowler frames needed adjustment. For frames with faint Lanczos spill below `y=92`, only alpha values `1–8` at rows `93–95` were cleared; no pixel with alpha `>8` was cleared. Across those frames 599 weak-alpha pixels were cleared. The accepted `attack-2` frame had its actual alpha bottom at `y=91` and was translated down one pixel. The `idle-0` source needed no adjustment.
- Final effective frames all have at least 3px alpha-zero padding, bottom `y=92`, and alpha-bbox center `x=47.5` or `48.0`. The adjustments and before/after bounds are recorded per frame and repeated on each affected cell mapping.

## Review and focused checks

- Reviewed the two final neutral-matte contact sheets: [`ruins-string-puppet-atlas-contact-q70.jpg`](../../art-source/ruins-b/assembly/review/ruins-string-puppet-atlas-contact-q70.jpg) and [`ruins-bell-prowler-atlas-contact-q70.jpg`](../../art-source/ruins-b/assembly/review/ruins-bell-prowler-atlas-contact-q70.jpg). Each is a 1152×960 JPEG at quality 70 on matte RGB `(223,227,219)`. The 18 effective poses read distinctly; the full puppet, copper strings, four prowler feet, bell, and clapper remain inside their cells.
- Confirmed every atlas cell’s RGBA pixels match its exact normalized or adjusted source frame, including transparent-pixel RGB; confirmed all required unused-cell copies; confirmed all 18 effective frames per monster are pixel-distinct.
- Confirmed the manifest contains 39 images and 116 animations after appending the new entries, with the expected URLs, frames, timings, loop flags, and image keys.
- Runtime PNG total: **337,173 bytes** (141,629 + 195,544).
- No game tests, typecheck, content check, browser, full loader, or build were run. The integration owner should perform the assigned loader/build checks after the remaining runtime integration is ready.

## Changed paths and handoff

- Added the deterministic assembler at `art-source/ruins-b/assembly/tools/assemble_ruins_b_monster_atlases.py`.
- Added the two PNG atlases, 25 adjusted 96×96 frames, two review sheets, and `art-source/ruins-b/assembly/monster-atlas-assembly.json`.
- Appended only the two monster image entries and ten monster animation entries to `public/assets/actors/manifest.json`.
- Added this report. Assembly scope is complete; runtime integration and its loader/build verification remain with the integration owner. No commit was created.
