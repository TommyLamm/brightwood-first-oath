# Ruins B Monster Profile / Active Pose Handoff

Date: 2026-10-25 (Hong Kong time)  
Status: **4 accepted single-pose references complete**; one first prowler active attempt retained as rejected provenance. No atlas, public asset, manifest, runtime, or commit changes.

## Read sources and applicable requirements

- Read project AGENTS.md, plan/13-ruins-echo-exploration.md §8 and §10, and plan/12-next-chapter-ancient-ruins.md §7–10.
- Read the Ruins A handoff and A actor source notes/prompt to match its accepted monster style: crisp pixel clusters, compact limited palette, clean silhouette, no painterly haze.
- Read imagegen/SKILL.md, references/prompting.md, and references/sample-prompts.md; used built-in ImageGen with genuine transparency.
- The Playroom main template and its seven linked specs were fully read by the main agent on 2026-10-25, as recorded in the A handoff; this turn used the network tool to verify the template and all seven URLs. This art-only batch does not publish or modify game runtime.
- Applicable acceptance: one real pose per generated image; all accepted frames face right; each profile is reusable as idle-0, each active pose as attack-2; original image, complete submitted prompt, tool/call provenance, SHA-256, acceptance/rejection reason, frame ID, review and normalization metadata stay under art-source/ruins-b/.

## Accepted frames

| Monster / frame ID | Identity and pose | Original ImageGen PNG | Normalized 96×96 RGBA frame | Prompt | Call metadata |
| --- | --- | --- | --- | --- | --- |
| ruins-string-puppet:idle-0 | Slender wooden marionette, asymmetrical long forward arm, snapped copper strings and moss flecks | art-source/ruins-b/references/raw/ruins-string-puppet-profile-v1.png | art-source/ruins-b/references/normalized/ruins-string-puppet-idle-0.png | art-source/ruins-b/references/prompts/ruins-string-puppet-profile-v1.txt | art-source/ruins-b/references/ruins-string-puppet-profile-v1.metadata.json |
| ruins-string-puppet:attack-2 | Same identity, planted forward slap with the long arm fully extended to the right | art-source/ruins-b/references/raw/ruins-string-puppet-attack-2-v1.png | art-source/ruins-b/references/normalized/ruins-string-puppet-attack-2.png | art-source/ruins-b/references/prompts/ruins-string-puppet-attack-2-v1.txt | art-source/ruins-b/references/ruins-string-puppet-attack-2-v1.metadata.json |
| ruins-bell-prowler:idle-0 | Low four-legged stone beast, chipped copper bell shell, clapper and moss seams | art-source/ruins-b/references/raw/ruins-bell-prowler-profile-v1.png | art-source/ruins-b/references/normalized/ruins-bell-prowler-idle-0.png | art-source/ruins-b/references/prompts/ruins-bell-prowler-profile-v1.txt | art-source/ruins-b/references/ruins-bell-prowler-profile-v1.metadata.json |
| ruins-bell-prowler:attack-2 | Same identity, body compressed low with the near foreleg sweeping forward/right and three legs braced | art-source/ruins-b/references/raw/ruins-bell-prowler-attack-2-v2.png | art-source/ruins-b/references/normalized/ruins-bell-prowler-attack-2.png | art-source/ruins-b/references/prompts/ruins-bell-prowler-attack-2-v2.txt | art-source/ruins-b/references/ruins-bell-prowler-attack-2-v2.metadata.json |

All accepted originals are 1254×1254 RGBA. Their visible alpha (alpha > 8) stays inside the source canvas (zero visible alpha pixels on its edge). Individual neutral-matte review JPEGs are in art-source/ruins-b/references/review/, q70, longest edge 1254px. The final 96px pose pairs were also reviewed at 6× nearest-neighbor in puppet-normalized-pair-q70.jpg and prowler-normalized-pair-q70.jpg.

## Rejected attempt

The first prowler active pose is preserved as ruins-bell-prowler-attack-2-v1.png; it was too close to idle after normalization for the low sweep to read clearly. The candidate normalization was moved to art-source/ruins-b/references/normalized/rejected/ruins-bell-prowler-attack-2-v1-rejected.png. Its metadata marks it rejected and records the reason and SHA-256. The v2 prompt explicitly calls for a clearly extended low foreleg; the resulting normalized attack frame reads distinctly from idle.

An initial redundant puppet-profile generation call returned no nested content blocks through the wrapper fields inspected at the time, so its savedPath/call ID could not be captured or mapped. That result was not used; the approved profile is the separate recorded call listed above. It is not represented as a saved/reviewed asset.

## Normalization and source records

- art-source/ruins-b/tools/normalize-frames.py deterministically crops the alpha > 8 subject box with a 3.5% margin, scales with Lanczos to fit max 90×76, centers at x=48 and places the lowest nontransparent pixel at y=92 on a 96×96 RGBA canvas. It stores each accepted frameId, source/output paths and SHA-256, crop/scale, pivot, facing and acceptance reason in references/normalized/normalization-summary.json and the per-call metadata JSON.
- art-source/ruins-b/tools/make-review.py composites source art over RGB (223,227,219) and saves q70 JPEG reviews; make-normalized-pair-reviews.py creates small, separate review pairs and is not a runtime atlas.
- Built-in ImageGen returned output_hint with savedPath and call ID, but no revisedPrompt property. Each metadata file therefore records revisedPrompt: null and revisedPromptReturnedByTool: false; the exact submitted prompt is preserved in its prompt file. No tool revision text was invented.

## Verification and handoff

- Ran the normalizer successfully. It enforces 96×96 output, minimum 3px canvas padding, alpha-visible subject, x-centered placement and the y=92 baseline; the recorded outputs are RGBA with alpha extrema 0–255.
- Visually reviewed each accepted original via a neutral-matte q70 JPEG no larger than 1280px, then reviewed both normalized idle/attack pairs. The prowler v1 rejection was based on its normalized pair; v2 was rechecked and accepted.
- No tests, browser, build, atlas assembly or runtime integration were run. No further poses are included.

Downstream can use the four normalized paths above directly as idle-0 and attack-2. The accepted profiles and raw PNGs are also available as identity references for the next motion/action batches. Scene owner retains exclusive ownership of shared actor manifests.
