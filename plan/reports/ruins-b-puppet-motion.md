# Ruins B Puppet Motion Handoff

Date: 2026-10-25 (Hong Kong time)  
Status: **complete** for the puppet idle-1 and walk-0..5 source frames. No atlas, manifest, public asset, runtime, or commit changes.

## Sources and applicable requirements

- Read project `AGENTS.md`, `plan/13-ruins-echo-exploration.md` §§8 and 10, `plan/reports/ruins-b-dispatch.md`, and `plan/reports/ruins-b-monster-profiles.md`.
- Read all seven puppet-motion prompts and the existing idle-1, idle-0, and attack-2 source metadata. The built-in ImageGen skill was followed. The main agent's handoff records the required Playroom template and seven linked specs as fully read on 2026-10-25.
- Kept one complete, right-facing pose per image; used the accepted profile and attack-2 as identity references; requested true transparency; retained raw sources, prompts, per-call provenance, SHA-256, decisions, review images, and normalization data under this batch's directory.

## Accepted frames

| Frame ID | Raw source | Normalized frame | Metadata |
| --- | --- | --- | --- |
| `ruins-string-puppet:idle-1` | `art-source/ruins-b/puppet-motion/raw/ruins-string-puppet-idle-1-v1.png` | `art-source/ruins-b/puppet-motion/normalized/ruins-string-puppet-idle-1.png` | `art-source/ruins-b/puppet-motion/metadata/ruins-string-puppet-idle-1.json` |
| `ruins-string-puppet:walk-0` | `art-source/ruins-b/puppet-motion/raw/ruins-string-puppet-walk-0-v1.png` | `art-source/ruins-b/puppet-motion/normalized/ruins-string-puppet-walk-0.png` | `art-source/ruins-b/puppet-motion/metadata/ruins-string-puppet-walk-0.json` |
| `ruins-string-puppet:walk-1` | `art-source/ruins-b/puppet-motion/raw/ruins-string-puppet-walk-1-v1.png` | `art-source/ruins-b/puppet-motion/normalized/ruins-string-puppet-walk-1.png` | `art-source/ruins-b/puppet-motion/metadata/ruins-string-puppet-walk-1.json` |
| `ruins-string-puppet:walk-2` | `art-source/ruins-b/puppet-motion/raw/ruins-string-puppet-walk-2-v1.png` | `art-source/ruins-b/puppet-motion/normalized/ruins-string-puppet-walk-2.png` | `art-source/ruins-b/puppet-motion/metadata/ruins-string-puppet-walk-2.json` |
| `ruins-string-puppet:walk-3` | `art-source/ruins-b/puppet-motion/raw/ruins-string-puppet-walk-3-v1.png` | `art-source/ruins-b/puppet-motion/normalized/ruins-string-puppet-walk-3.png` | `art-source/ruins-b/puppet-motion/metadata/ruins-string-puppet-walk-3.json` |
| `ruins-string-puppet:walk-4` | `art-source/ruins-b/puppet-motion/raw/ruins-string-puppet-walk-4-v1.png` | `art-source/ruins-b/puppet-motion/normalized/ruins-string-puppet-walk-4.png` | `art-source/ruins-b/puppet-motion/metadata/ruins-string-puppet-walk-4.json` |
| `ruins-string-puppet:walk-5` | `art-source/ruins-b/puppet-motion/raw/ruins-string-puppet-walk-5-v1.png` | `art-source/ruins-b/puppet-motion/normalized/ruins-string-puppet-walk-5.png` | `art-source/ruins-b/puppet-motion/metadata/ruins-string-puppet-walk-5.json` |

Submitted prompt files are in `art-source/ruins-b/puppet-motion/prompts/`. Reuse the already accepted `ruins-string-puppet-idle-0.png` and `ruins-string-puppet-attack-2.png` from `art-source/ruins-b/references/normalized/`; neither was regenerated.

## Provenance and review

- Idle-1 was reused from the existing raw PNG (SHA-256 `695ca0a49e1af0a3689b36f17d1e67bcd0547ce5874f232cf6dc47ad8b7c276d`). The owner path `/root/puppet_motion` was confirmed from the old session's `session_meta`; its direct result at line 98 supplied the saved path and revised prompt, and the saved path exists. The workspace raw hash matches the recovered record. The earlier unmapped attempt record was corrected in `metadata/attempts.json`; no additional uncopied puppet-motion ImageGen result was found in that owner log.
- Walk-0..5 each use a separate built-in ImageGen call with the exact saved prompt file and both accepted identity references. Per-frame metadata stores the tool, call ID, source path, raw hash, and observed result keys (`image_url`, `output_hint`). The tool did not return a `revisedPrompt` field for these calls, so each is explicitly recorded as null with that limitation noted.
- Raw previews use a neutral RGB (223, 227, 219) matte, JPEG quality 70, maximum edge 1280. The idle comparison is `review/ruins-string-puppet-idle-pair-q70.jpg`; the six-pose walk review is `review/ruins-string-puppet-walk-cycle-q70.jpg` (1172×822). The walk contact sheet shows visibly different stride, weight-transfer, push-off, passing, opposite-stride, and landing silhouettes.
- `tools/normalize_motion.py` applies alpha>8 cropping with 3.5% margin and Lanczos scaling to fit 90×76, centers at x=48, and places the lowest nonzero alpha pixel at y=92 on a transparent 96×96 RGBA canvas. Each output has at least 3 transparent pixels at every edge. `tools/make_motion_review.py` and `tools/record_review_decision.py` preserve the review workflow and per-frame decision.

## Verification and next handoff

- Reviewed the idle pair and one six-frame walk contact sheet at the requested q70 matte-preview scale. All seven frames were accepted; each retains the full puppet and strings and matches the right-facing identity.
- A focused artifact integrity check confirmed accepted metadata, raw/normalized/prompt SHA-256 matches, 1254×1254 RGBA raw images, 96×96 RGBA normalized frames, baseline and transparent-padding bounds, existing q70 JPEG reviews, and a walk sheet below 1280px.
- No tests, browser, build, runtime integration, atlas assembly, shared-reference edit, manifest edit, or publication was run. The next asset step is the independent puppet action batch; the downstream assembly owner should wait for all action and other monster frames plus the explicit manifest handoff.
