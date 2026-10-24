# Sand scorpion sting-attack pose source

This four-pose attack strip uses the root-approved clean amber scorpion identity at sand-scorpion-identity-amberglow-v1.png as its only reference, specifically for identity, facing, palette, outline, proportions and pixel-art finish. Built-in ImageGen was used with transparent_background: true.

Original ImageGen path: C:\Users\Tommy\.codex\generated_images\01a16a02-5b2c-79c3-858d-ba8b26ec8e5a\exec-5822fa4c-5ecb-4bbf-b3ff-8f42dc8f48ba.png
Raw copied byte-identically: sand-scorpion-sting-4pose-raw-v1.png
Actual output: 1536×1024 RGBA, alpha extrema 0–253. Outer corner alpha is 0. The visual sheet contains four complete, distinct right-facing attack beats in reading order: brace/curl back, tail sweep, down-forward sting, recoil. Visual inspection shows the same amber identity and dark-brown edges, with no obvious coral fringe. The warm amber aura is intended and acceptable.

The generated layout is 2×2, each source cell 768×512. The vertical seam at x=768 and its immediate neighbors have no alpha>8. The original horizontal seam at y=512 is crossed by alpha from the sprites/aura, so the raw source must not be sliced mechanically at y=512. For runtime packing, extract each whole pose from its visually isolated quadrant, preserve all original RGBA pixels, align baselines and add transparent padding. Do not use a 2×2 equal-row cut directly.

Exact prompt:

> Create a four-frame 2×2 attack animation strip for the scorpion in the reference image. Use the reference only for the same identity, facing, warm amber shell, dark umber pixel outline, proportions and pixel-art finish. Keep one complete scorpion in each equal square cell with generous transparent margins; same scale and foot baseline, facing right. Change only pose and tail angle. Read order left-to-right, top-to-bottom: (1) low brace, tail curls higher and draws back to telegraph; (2) tail sweeps forward above the body; (3) stinger thrusts down-forward in a clear tail strike, body leans slightly; (4) recoils to ready stance with tail lifted. Make the four poses distinct and complete; keep pincers and all legs inside their own cell. Preserve the clean amber-charged sprite look with at most a restrained warm amber aura tightly around each creature. True transparent background. No red or coral fringe. No connecting motion trail, no grid lines, no ground, shadows, scenery, text, frame, watermark, extra objects or clipped body parts.

This is an accepted four-pose source batch only; final runtime extraction/packing is a later technical export after remaining state poses are available.
