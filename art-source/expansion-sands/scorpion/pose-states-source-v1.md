# Sand scorpion state-pose ImageGen sources

All images below were generated with built-in ImageGen using `transparent_background: true`. Raw generated PNGs were copied byte-identically into this directory. They remain the source of record; runtime packing is documented separately in `atlas-export-v1.md`.

The accepted character reference is `sand-scorpion-identity-amberglow-v1.png`. Its warm amber charge-glow is part of the approved design. Warm outline pixels are acceptable at runtime size; obvious detached red/coral artifacts and opaque backdrops are not.

## Walk: four frames

Reference images: accepted identity and `sand-scorpion-idle-2pose-raw-v1.png` for design/layout scale only.

ImageGen original: `C:\Users\Tommy\.codex\generated_images\01a16a02-5b2c-79c3-858d-ba8b26ec8e5a\exec-01cc082f-0b17-44aa-a46a-996e076e21f1.png`

Preserved raw copy: `sand-scorpion-walk-4pose-raw-v1.png` (2172×724 RGBA, alpha 0–255).

Exact prompt:

> Create a clean horizontal 4-pose walk-cycle source strip for this exact original amber scorpion character. Use the references only for character identity, colors, outline and pixel-art finish; do not repeat the static idle pose. Four complete separate side-view scorpions all facing right, evenly spaced on one horizontal row, matching size and exact foot baseline, with broad clear transparent gaps. Show four distinct walking phases with alternating leg positions and subtle body bob while keeping the curled raised tail, two pincers, amber shell and small eye consistent. Keep the character compact and fully inside each pose area; do not let any leg, claw, tail or glow touch another pose. Preserve crisp dark-umber pixel outlines and simple warm amber/gold shading; a restrained soft amber charge-glow is acceptable, but no red/coral fringe. No ground, cast shadow, floor, scenery, grid, frame, text, labels, extra objects or extra creatures.

Four separate right-facing walking poses were accepted after review at the actual 96px display size. No obvious detached red pixels remain at that size.

## Hurt: rejected first attempt

Reference image: accepted identity.

ImageGen original: `C:\Users\Tommy\.codex\generated_images\01a16a02-5b2c-79c3-858d-ba8b26ec8e5a\exec-c0f424eb-b887-49f2-ad29-a7a4d6730be7.png`

Preserved rejected raw: `sand-scorpion-hurt-2pose-rejected-v1.png` (2172×724 RGBA). Rejected because the output had a broad opaque amber haze and strong saturated red/coral fringe.

Exact rejected prompt:

> Make a 2-pose horizontal hurt-animation source strip for this exact amber scorpion character. Keep the same right-facing side profile, proportions, warm amber shell, raised segmented tail, two pincers, dark umber pixel outline and pixel-art finish. Pose one is a clear brief hit recoil: body flinches backward, legs draw inward, tail tenses. Pose two is a distinct recovery pose: body settles back toward its normal stance with legs regaining balance. Exactly two complete separate scorpions, same scale and foot baseline, fully visible with generous transparent gap and padding. Keep the amber charge effect subtle and contained close to the sprite, no red or coral fringe, no red damage flash. No blood, ground, cast shadow, scenery, grid, border, text, extra objects or extra creatures.

## Hurt: accepted two frames

Reference image: accepted identity.

ImageGen original: `C:\Users\Tommy\.codex\generated_images\01a16a02-5b2c-79c3-858d-ba8b26ec8e5a\exec-80fcbe0d-1dff-480c-bae6-6eefd929d75e.png`

Preserved raw copy: `sand-scorpion-hurt-2pose-raw-v2.png` (2172×724 RGBA, alpha 0–255).

Exact prompt:

> Create exactly two separate side-view hurt poses of the same small amber scorpion, in one horizontal 2-pose sprite strip. Preserve the creature design, right-facing profile, warm golden shell, dark umber pixel outline, two front pincers and curled raised tail from the reference. Pose A: compact backward flinch with legs tucked slightly inward. Pose B: distinct recovery stance with legs braced and body settled. Both are complete, same compact scale and foot baseline, with generous transparent gap and padding. Render as a flat, unlit game sprite: NO aura, NO glow, NO bloom, NO atmosphere, NO background haze, NO cast shadow, NO red or coral pixels outside the dark outline. True transparent pixels everywhere outside the crisp sprite silhouette. No damage flash, blood, environment, floor, grid, text, border or extra creatures.

The flinch and recovery poses were accepted in the root-approved 96px atlas preview. There is a fine warm-colored edge at enlarged raw size, but no obvious detached red fragment at actual display size.

## Dead: four frames

Reference image: accepted identity.

ImageGen original: `C:\Users\Tommy\.codex\generated_images\01a16a02-5b2c-79c3-858d-ba8b26ec8e5a\exec-628096c1-8510-4958-97b6-6e5e289ec5c8.png`

Preserved raw copy: `sand-scorpion-dead-4pose-raw-v1.png` (2172×724 RGBA, alpha 0–255).

Exact prompt:

> Create a 4-pose horizontal death-animation source strip for this same small amber scorpion, using the reference only for its character identity, colors, outline and pixel-art style. Keep all four complete sprites facing right and the same compact scale. Show a clear non-graphic collapse sequence: 1) legs buckle and body lowers, 2) body tips forward slightly as the raised tail begins to fall, 3) tail and pincers settle lower while legs fold, 4) still resting defeated pose. Each pose must be visibly distinct, fully inside its own area, spaced apart with generous transparent padding. Preserve the golden amber shell, dark umber crisp pixel outline, two claws and segmented tail. Flat unlit sprite rendering; no aura, bloom, background haze, red flash, red/coral fringe, blood, ground or cast shadow. True transparent pixels outside the sprites. No scenery, grid, border, text or extra objects.

Four non-graphic collapse frames were accepted in the root-approved 96px atlas preview.
