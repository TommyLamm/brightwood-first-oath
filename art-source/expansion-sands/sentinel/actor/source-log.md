# Sunwell Sentinel actor source log

Package: `actor:sunwell-sentinel`
Source folder: `art-source/expansion-sands/sentinel/actor/`
Intended runtime asset: `public/assets/actors/monsters/sunwell-sentinel-atlas-v1.png` (384×384 RGBA, 4×4 cells of 96×96; display 192×192; pivot 0.5/1; shared baseline y=94)

## Identity anchor v1

- Tool: built-in ImageGen; transparent background requested and true alpha preserved.
- Reference images: none passed. Textual style cue only: compact Brightwood enemy sprite scale, clear pixel silhouette, restrained shading; no animal features copied.
- Original output: `C:\Users\Tommy\.codex\generated_images\01a16c63-64a1-7fd1-85a3-ac84e03bd270\exec-4e6e04e5-69eb-4892-bde3-c6bedcf2e36a.png`
- Preserved source: `sunwell-sentinel-identity-raw-v1.png` (1297×1213 RGBA), SHA-256 `B0AF84337881A9150F728D839C34EBCEF885C8A1B4B9F6F3209485C9F5BD2D45`.
- Review files: `sunwell-sentinel-identity-preview-96px-sky-v1.png` and `sunwell-sentinel-identity-preview-192px-sky-v1.png`.
- Exact prompt: `sunwell-sentinel-identity-prompt-v1.md`.
- Final runtime atlas: pending assembly with all 16 poses.

### Exact prompt text

Use case: stylized-concept
Asset type: original single-character boss sprite identity for a 2D side-scrolling pixel-art RPG
Primary request: create one original compact ancient Sunwell Sentinel stone golem boss for Brightwood First Oath.
Scene/backdrop: genuinely transparent background.
Subject: a broad sandstone block torso, two massive stone fists, short sturdy legs, and one circular turquoise inset core in the chest. The core is solid opaque turquoise stone carved into the chest; it has no light, halo, bloom, or glow. Add restrained muted-gold sun engravings and a few chipped warm limestone edges. The character is facing right in a readable side/three-quarter profile. No weapon or shield. It is a stone statue, with no beetle, scorpion, insect, or animal parts.
Style/medium: crisp, colorful 2D pixel-art RPG sprite with hard stepped pixel clusters, a restrained dark-umber outline, simple readable shading, and warm sandstone colors with muted gold and turquoise accents. Match the compact pixel scale, silhouette clarity, and restrained shading of the existing Brightwood First Oath enemy sprites. No 3D rendering, painterly texture, smooth gradients, or soft antialiasing.
Composition/framing: one complete neutral standing pose, centered alone; full body, both fists and both feet visible. Use a large readable boss silhouette while preserving generous clear transparent padding around the entire outline. The silhouette should fit safely inside a 96×96 game cell and leave room near the feet for a shared baseline.
Lighting/mood: neutral diffuse sprite lighting, no directional light effects.
Constraints: preserve a single coherent stone golem identity; true transparent alpha outside the natural outline; hard pixel edges; no detached pixels.
Avoid: aura, halo, glow, bloom, light spill, rimlight, cast shadow, floor, ground, smoke, particles, background, checkerboard, text, grid, frame, watermark, extra characters, extra objects, weapon, shield, insect parts, animal parts.

- Idle v1: 2026-10-24; built-in ImageGen, transparent background, reference-only accepted identity raw. Prompt/source/hash/provenance in sunwell-sentinel-idle-prompt-v1.md and sunwell-sentinel-idle-source-v1.md; review frames exported by export_idle_previews_v1.py.

- Walk v1: 2026-10-24; built-in ImageGen with accepted identity reference and transparent background; accepted third bounded generation after two visible-mark drafts. Prompt/source/hash/provenance in sunwell-sentinel-walk-prompt-v1.md and sunwell-sentinel-walk-source-v1.md; all four frame crops use shared scale in export_walk_previews_v1.py.
