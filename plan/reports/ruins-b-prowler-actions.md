# Ruins B Prowler Action Pose Handoff

Date: 2026-10-25 (Hong Kong time)  
Status: **9 accepted single-pose sources complete**. Reused the accepted `attack-2`; no re-generation of `attack-2`, no atlas, public asset, manifest, runtime, or commit changes.

## Scope and sources

- Read `AGENTS.md`, `plan/13-ruins-echo-exploration.md` §§6, 8, 10, `plan/reports/ruins-b-dispatch.md`, `plan/reports/ruins-b-monster-profiles.md`, and `plan/reports/ruins-b-prowler-motion.md`.
- Read the ImageGen skill and its shared prompt guidance. The main agent's same-day read of the Playroom template and seven linked specifications is recorded in the dispatch report; this art-only task did not change runtime or publish anything.
- Used the accepted Prowler profile and accepted `attack-2-v2` as the only identity references. The rejected `attack-2-v1` was not used. ImageGen received the existing neutral-matte q70 reference JPEGs at `art-source/ruins-b/references/review/ruins-bell-prowler-profile-v1-q70.jpg` and `art-source/ruins-b/references/review/ruins-bell-prowler-attack-2-v2-q70.jpg`.
- Each pose was a separate built-in ImageGen call with genuine transparency requested. Every complete submitted prompt is saved in its `.txt` and duplicated in per-frame metadata. The wrapper returned only `image_url` and `output_hint`; exact `savedPath` and call ID were recovered from that call's output hint. It returned no revised prompt, recorded as `revisedPrompt: null` rather than inferred.

## Accepted frames

`attack-2` is the existing accepted source at `art-source/ruins-b/references/normalized/ruins-bell-prowler-attack-2.png`; downstream should use it directly. The 9 new frames are:

| Frame ID | Raw source | Normalized 96×96 RGBA | Call ID | Raw SHA-256 |
| --- | --- | --- | --- | --- |
| `attack-0` | `art-source/ruins-b/prowler-actions/raw/ruins-bell-prowler-attack-0-v1.png` | `art-source/ruins-b/prowler-actions/normalized/ruins-bell-prowler-attack-0-v1.png` | `exec-8e6d777a-0b40-4c12-a36b-dbd6fd417bde` | `e23a95a16af48c6782f77d92fbbcbd557d2ca9f42a8ed83a9ff02f147bad6db2` |
| `attack-1` | `art-source/ruins-b/prowler-actions/raw/ruins-bell-prowler-attack-1-v1.png` | `art-source/ruins-b/prowler-actions/normalized/ruins-bell-prowler-attack-1-v1.png` | `exec-127bb597-f958-47fc-bcf8-150f2a3b6161` | `ae152def4dad28b52f66ccaabd2a39574a8bcf23ac9fbd496e4772eb8d8f1850` |
| `attack-3` | `art-source/ruins-b/prowler-actions/raw/ruins-bell-prowler-attack-3-v1.png` | `art-source/ruins-b/prowler-actions/normalized/ruins-bell-prowler-attack-3-v1.png` | `exec-2afa8470-7ede-480d-af17-ef779e974cc3` | `41948b1373b9d1b00f5a7d5b61bc5410668392c2a5b048e8f36400e8b544ffd4` |
| `hurt-0` | `art-source/ruins-b/prowler-actions/raw/ruins-bell-prowler-hurt-0-v1.png` | `art-source/ruins-b/prowler-actions/normalized/ruins-bell-prowler-hurt-0-v1.png` | `exec-3d451aa8-3891-40a3-b3d0-931c9dccea28` | `132dc763b14ad0ce9334eda7b2ad985a1f369fdf7e392f0bf43d4788579d1dd6` |
| `hurt-1` | `art-source/ruins-b/prowler-actions/raw/ruins-bell-prowler-hurt-1-v1.png` | `art-source/ruins-b/prowler-actions/normalized/ruins-bell-prowler-hurt-1-v1.png` | `exec-e7745d9c-bd0e-4e48-8961-6cfda75a9a45` | `56bec7270c8e9ec52fbb692ed785a3c08d016166b4ecc14b8d7336c9d71316d5` |
| `dead-0` | `art-source/ruins-b/prowler-actions/raw/ruins-bell-prowler-dead-0-v1.png` | `art-source/ruins-b/prowler-actions/normalized/ruins-bell-prowler-dead-0-v1.png` | `exec-bac47d31-cb8a-47e9-907a-472a03a2c8d6` | `9a90dc4bc5e32dd3cdae49c0af0bb29dcf92ef84733882bdc38e0035b9287a82` |
| `dead-1` | `art-source/ruins-b/prowler-actions/raw/ruins-bell-prowler-dead-1-v1.png` | `art-source/ruins-b/prowler-actions/normalized/ruins-bell-prowler-dead-1-v1.png` | `exec-cde12dae-1daf-4241-82ee-5ec102742b52` | `d03fe136dfb3aecbfbeddd114478d5c2e2e69d932b9af5a94d42b770544fe2ee` |
| `dead-2` | `art-source/ruins-b/prowler-actions/raw/ruins-bell-prowler-dead-2-v1.png` | `art-source/ruins-b/prowler-actions/normalized/ruins-bell-prowler-dead-2-v1.png` | `exec-0566d038-fd1d-4cd3-974a-349f8c270448` | `a042020f6f223e0d03f3ccbfd3d2ca678ed3600e3ac62446a033ef5488c2eadd` |
| `dead-3` | `art-source/ruins-b/prowler-actions/raw/ruins-bell-prowler-dead-3-v1.png` | `art-source/ruins-b/prowler-actions/normalized/ruins-bell-prowler-dead-3-v1.png` | `exec-b192cd4a-b1b5-407b-a548-f9c45e914500` | `2b5328215624facffa3c9a29822fea0f60686955fe848c24e285125c6e76fbd5` |

Each frame has its exact prompt at `art-source/ruins-b/prowler-actions/prompts/ruins-bell-prowler-{frame}.txt` and provenance/acceptance/normalization metadata at `art-source/ruins-b/prowler-actions/metadata/ruins-bell-prowler-{frame}.metadata.json`. The metadata records the saved path, full output hint, call ID, prompt text, reference paths, raw hash, revised-prompt null, accepted decision, and normalization details.

## Review and checks

- Processed all 9 raws with the copied, unmodified Prowler motion normalizer at `art-source/ruins-b/prowler-actions/tools/process-frame.py`. All sources were 1254×1254 with no alpha-visible pixels on canvas edges. All outputs are 96×96 RGBA; the recorded normalized alpha bounds have at least 3px transparent padding, horizontal center x=48, and visible bottom y=92.
- Reviewed one normalized contact sheet at [ruins-bell-prowler-actions-contact-q70.jpg](../../art-source/ruins-b/prowler-actions/review/ruins-bell-prowler-actions-contact-q70.jpg): 1224×984, JPEG quality 70, neutral matte RGB 223/227/219, nearest-neighbor 3× frames. It includes the accepted idle and `attack-2` anchors alongside all new poses. The attack frames read as anticipation, loaded windup, accepted contact, and recovery; hurt frames read as recoil and recovery; dead frames progressively lower the intact, opaque body into the final resting pose. All retain the right-facing low stone beast, copper shell, and clapper.
- Verified all nine raw, normalized and prompt files exist, all nine metadata files parse, and each `submittedPrompt` exactly matches its prompt file. All nine metadata decisions are accepted after the contact-sheet review.
- No game tests, browser, build, atlas assembly, runtime integration, or manifest edits were run.

## Downstream handoff

Use `attack-0`, `attack-1`, existing accepted `attack-2`, `attack-3`, `hurt-0`, `hurt-1`, and `dead-0..3` from their normalized paths above. Source PNGs, prompt text, per-frame metadata, normalizer, and review sheet remain under `art-source/ruins-b/prowler-actions/`. No further work remains in this owner scope.
