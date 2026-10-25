# Ruins B Prowler Motion Handoff

Date: 2026-10-25 (Hong Kong time)  
Status: **accepted motion set complete**. Reused the accepted `idle-1`; generated and accepted `walk-0..5`. No atlas, public asset, manifest, runtime, or commit changes.

## Read sources and applicable requirements

- Read `AGENTS.md`, plan/13-ruins-echo-exploration.md §§8 and 10, `plan/reports/ruins-b-dispatch.md`, and `plan/reports/ruins-b-monster-profiles.md`.
- Read the existing Prowler `idle-1` prompt, metadata and frame processor, plus the accepted Prowler profile and `attack-2-v2` prompts and metadata. The rejected `attack-2-v1` was not used.
- Read the built-in ImageGen skill. The main agent's same-day read of the Playroom template and seven linked specs is recorded in the dispatch report; this task only added art-source files and did not publish or modify runtime.
- Applied requirements: one real pose per image; genuine transparent background; exact Prowler identity; complete right-facing four-legged silhouette; preserve the copper bell and clapper; keep every frame as source art plus prompt, call provenance, SHA-256, review and normalized metadata. Normalize to 96×96 RGBA, center x=48, visible baseline y=92, with at least 3px transparent padding. Use only `art-source/ruins-b/prowler-motion/` for this owner.

## Accepted deliverables

`idle-1` was reused from the existing accepted raw and normalized files; it was not generated again. The six new walk poses use four approved references: raw profile, raw `attack-2-v2`, normalized `idle-0`, and normalized `attack-2`. Each call's output hint, saved path, call ID, prompt path, raw SHA, adoption decision and normalization are in its per-frame metadata JSON.

| Frame | Raw | Normalized | ImageGen call ID | Raw SHA-256 |
| --- | --- | --- | --- | --- |
| walk-0 | `art-source/ruins-b/prowler-motion/raw/ruins-bell-prowler-walk-0.png` | `art-source/ruins-b/prowler-motion/normalized/ruins-bell-prowler-walk-0.png` | `exec-052da131-7b97-4388-b428-ed0abcf5415c` | `3eb3e31833d12bb2c8843a86f162044fbfd6957659752e203d66851e97bf5a97` |
| walk-1 | `art-source/ruins-b/prowler-motion/raw/ruins-bell-prowler-walk-1.png` | `art-source/ruins-b/prowler-motion/normalized/ruins-bell-prowler-walk-1.png` | `exec-56d41119-13f2-4e7a-8e7a-a8017eed8b67` | `848a10739e79ffa06d1b455815e098bf5c2eba903e3f9ce6b5f238965b9df828` |
| walk-2 | `art-source/ruins-b/prowler-motion/raw/ruins-bell-prowler-walk-2.png` | `art-source/ruins-b/prowler-motion/normalized/ruins-bell-prowler-walk-2.png` | `exec-93336aa7-ac12-4b11-816f-5d3d938bdde5` | `68eb147924d308ea25bf087791e4d6c00c25690c1f13d8ff340f971d91abd0f1` |
| walk-3 | `art-source/ruins-b/prowler-motion/raw/ruins-bell-prowler-walk-3.png` | `art-source/ruins-b/prowler-motion/normalized/ruins-bell-prowler-walk-3.png` | `exec-e0c72704-3a23-410a-9d95-2193041e53b5` | `b21f9aaccb30f374b24399636fb7e047304a4f5f6132b9e05f9ae5b0aac1a124` |
| walk-4 | `art-source/ruins-b/prowler-motion/raw/ruins-bell-prowler-walk-4.png` | `art-source/ruins-b/prowler-motion/normalized/ruins-bell-prowler-walk-4.png` | `exec-b63e3f8c-1f6c-4d7f-8a9d-8fe3873ac639` | `dfe932b3f94d3a01c5102ab96a7ca665a45a5317c03b4bbbf917bfe1a959f1d5` |
| walk-5 | `art-source/ruins-b/prowler-motion/raw/ruins-bell-prowler-walk-5.png` | `art-source/ruins-b/prowler-motion/normalized/ruins-bell-prowler-walk-5.png` | `exec-3d27ee65-8eaf-4efb-9d4a-84eed75b50fb` | `4b2d86c6630d9860c7bf7d369b8421d329239869c08e778165af3ec8f7414b8a` |

For each row, the complete prompt is in `art-source/ruins-b/prowler-motion/prompts/ruins-bell-prowler-{walk-0..5}.txt`; per-call JSON is in `art-source/ruins-b/prowler-motion/metadata/ruins-bell-prowler-{walk-0..5}.metadata.json`.

## Review and verification

- Each raw image is 1254×1254 RGBA with zero visible alpha pixels on the canvas edges. All six passed `tools/process-frame.py` and normalized to 96×96 RGBA; recorded alpha bounds have center x=48, visible bottom y=92, and 3–5px minimum transparent padding.
- Reviewed one neutral-matte JPEG contact sheet at `art-source/ruins-b/prowler-motion/review/ruins-bell-prowler-motion-contact-q70.jpg` (1248×660, quality 70). The six frames read as separate articulated walk phases beside the idle anchors; they face right and retain the low body, four legs/paws, copper bell and clapper without cropping.
- Individual raw reviews are stored as `art-source/ruins-b/prowler-motion/review/ruins-bell-prowler-walk-{0..5}-q70.jpg` (JPEG quality 70, max edge 1254, neutral matte RGB 223/227/219).
- Recovered the earlier unused `idle-1` call from the exact specified old rollout and updated its metadata with its call ID, saved path and returned revised prompt. It remains unused and unreviewed; no raw hash is claimed. The accepted `idle-1` files remain unchanged.
- No game tests, build, browser, atlas assembly or runtime integration were run. No action poses were generated.

## Handoff

Downstream can use the existing accepted `idle-1` plus normalized `walk-0..5` as the Prowler's motion source frames. This owner is done; proceed to the separate action batch and later atlas assembly only when assigned.

