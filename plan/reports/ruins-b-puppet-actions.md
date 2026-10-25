# Ruins B — Puppet Action Frames Handoff

Date: 2026-10-25 (Hong Kong time)  
Status: **9 action frames accepted and normalized**. `attack-2` remains the previously accepted reference and was not regenerated. This batch changed only `art-source/ruins-b/puppet-actions/` and this report; no public assets, manifests, runtime, tests, build, browser, or commit work.

## Sources and applicable requirements

- Read `AGENTS.md`, `plan/13-ruins-echo-exploration.md` §§6, 8, 10, `plan/reports/ruins-b-monster-profiles.md`, and `plan/reports/ruins-b-dispatch.md`.
- Read the ImageGen skill and its shared prompting guidance. The main agent had already read the Playroom game-agent template and its seven linked specifications on 2026-10-25; the dispatch records those URLs and requirements. This art-only batch does not publish or change runtime behavior.
- Used the accepted raw identity anchor `art-source/ruins-b/references/raw/ruins-string-puppet-profile-v1.png` and accepted raw active pose `art-source/ruins-b/references/raw/ruins-string-puppet-attack-2-v1.png` as the two references for every generation call. The accepted active frame at `art-source/ruins-b/references/normalized/ruins-string-puppet-attack-2.png` is reused downstream.
- Applied the task contract: one genuine pose per image; right-facing planted slap windup/recovery; two readable recoil poses; four successive defeat poses with the body complete and opaque; retain the marionette identity, long forward arm, snapped copper strings and moss marks. Every generated call's submitted prompt, call ID, `output_hint`, saved path, raw SHA-256, frame ID, revised-prompt status and review decision are recorded in its metadata JSON.

## Accepted frame sources

| Frame ID | Raw source | Normalized output | Raw SHA-256 | Acceptance reason |
| --- | --- | --- | --- | --- |
| `attack-0` | `art-source/ruins-b/puppet-actions/raw/ruins-string-puppet-attack-0-v1.png` | `art-source/ruins-b/puppet-actions/normalized/ruins-string-puppet-attack-0.png` | `d670b4b8b59c562e9d8117a5161c130ada88dba14b8c15f04714e55a2658d01e` | Early windup; long arm folded back low, planted and distinct. |
| `attack-1` | `art-source/ruins-b/puppet-actions/raw/ruins-string-puppet-attack-1-v1.png` | `art-source/ruins-b/puppet-actions/normalized/ruins-string-puppet-attack-1.png` | `fdcecf289a16ff1ffc1c8241296a14abf917ca68114d1573eed28a012f3e7925` | Late windup; long arm cocked high behind shoulder. |
| `attack-3` | `art-source/ruins-b/puppet-actions/raw/ruins-string-puppet-attack-3-v1.png` | `art-source/ruins-b/puppet-actions/normalized/ruins-string-puppet-attack-3.png` | `b12ebf15d6d07c23ea65635c64cbc9b7db4c422310c6dd73a9d92e3254058410` | Post-slap recovery; arm lowered forward/right, body remains in place. |
| `hurt-0` | `art-source/ruins-b/puppet-actions/raw/ruins-string-puppet-hurt-0-v1.png` | `art-source/ruins-b/puppet-actions/normalized/ruins-string-puppet-hurt-0.png` | `f0746177cbe0226e9db17339ce0ceb0c29e6565ca363c2b42f5717b119e76393` | First recoil; upper body jolts back and long arm guards the chest. |
| `hurt-1` | `art-source/ruins-b/puppet-actions/raw/ruins-string-puppet-hurt-1-v1.png` | `art-source/ruins-b/puppet-actions/normalized/ruins-string-puppet-hurt-1.png` | `6076a9d923ca9008000a6247f5bc11841e1793d9107a5888af74b5624d9e3651` | Settling recoil; dipped head/shoulder and slack long arm, parts intact. |
| `dead-0` | `art-source/ruins-b/puppet-actions/raw/ruins-string-puppet-dead-0-v1.png` | `art-source/ruins-b/puppet-actions/normalized/ruins-string-puppet-dead-0.png` | `d156b3994e98a9d307c1c194d55b4343fb0bd4196e0203801692748ef1cb01d6` | First slump; knees soften, torso/head dip and strings go slack. |
| `dead-1` | `art-source/ruins-b/puppet-actions/raw/ruins-string-puppet-dead-1-v1.png` | `art-source/ruins-b/puppet-actions/normalized/ruins-string-puppet-dead-1.png` | `f2f28654e6c5764dc16283de0db61d54e395b09d24ba7ebf08a543e33097a975` | Deeper crouched collapse; body remains complete and opaque. |
| `dead-2` | `art-source/ruins-b/puppet-actions/raw/ruins-string-puppet-dead-2-v1.png` | `art-source/ruins-b/puppet-actions/normalized/ruins-string-puppet-dead-2.png` | `5faf50e8405ac2a737b203f731a2f857e8af0a6ff63a2909e1aca89310a32443` | Near-ground collapse on bent knees and one hand; body remains intact. |
| `dead-3` | `art-source/ruins-b/puppet-actions/raw/ruins-string-puppet-dead-3-v1.png` | `art-source/ruins-b/puppet-actions/normalized/ruins-string-puppet-dead-3.png` | `5dacbdd6f351c313e6fd74071cdfd7c2ce69244fc410d25933ef300855118638` | Final still pose; fully fallen, complete and opaque, head/arm toward right. |

For each frame, the complete submitted prompt is also saved at `art-source/ruins-b/puppet-actions/prompts/ruins-string-puppet-<frame>.txt`; the corresponding `metadata/ruins-string-puppet-<frame>.metadata.json` contains the same prompt and tool provenance plus normalization data and acceptance decision. The ImageGen wrapper returned no revised-prompt field, so each record stores `revisedPrompt: null` and `revisedPromptReturnedByTool: false`.

## Normalization and review

- `tools/process_actions.py` crops the alpha>8 subject with a 3.5% margin, uses a fixed 0.072776 scale derived from the accepted idle-0 and attack-2 source scales, resizes with Lanczos, centers at x=48 and aligns the last nontransparent row to y=92 on a transparent 96×96 RGBA canvas. It refuses a frame that would exceed its bounds rather than crop the sprite.
- The normalizer accepted all nine generated files: all outputs are 96×96 RGBA, their nontransparent bounds are at least 3px from the canvas edges, and the last visible row is y=92. Output SHA-256 and bounds are recorded per metadata file.
- Made and visually reviewed one contact sheet: `art-source/ruins-b/puppet-actions/review/puppet-actions-contact-q70.jpg` (1192×974, JPEG quality 70, neutral matte). It places idle-0 and accepted attack-2 beside the nine new normalized frames. The attack, recoil, and defeat progression reads distinctly; dead-3 remains complete and opaque.
- No rejected frame or regeneration was needed. No tests, browser, build, atlas assembly, manifest edit, runtime integration, or commit was performed.

## Downstream handoff

The future monster-assembly owner can consume the nine normalized outputs in the table directly and reuse the accepted attack-2 frame at `art-source/ruins-b/references/normalized/ruins-string-puppet-attack-2.png`. Exact prompts, ImageGen saved paths/call IDs/output hints, raw PNGs, SHA values and review decisions are preserved under `art-source/ruins-b/puppet-actions/`. This owner did not change shared manifests or motion assets.
