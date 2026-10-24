# Sands guide image prompts

Both prompts were sent to the built-in ImageGen tool on 2026-10-24. The first generated a transparent 1774x887 two-cell sheet; a targeted edit refined only the second idle pose. The original and refined images are preserved in this folder.

## Initial generation

```text
Use case: stylized-concept
Asset type: two-frame transparent idle sprite sheet for a small side-scrolling fantasy game NPC, intended for 96x96 display per frame
Primary request: Create an original friendly desert route guide for Brightwood First Oath, named conceptually as the Sand Dune Pass guide.
Subject: A warm, approachable adult guide with a pale turquoise scarf and matching practical headwrap, a simple tan travel cloak, sturdy brown boots, and one tiny map satchel at the hip. Noncombatant, relaxed standing idle pose, facing right, both hands empty.
Style/medium: Crisp pixel-art character sprite with deliberate compact pixel clusters, readable dark-brown outlines, warm amber highlights and restrained shading; charming chibi proportions suitable for the game's illustrated fantasy world.
Composition/framing: Strict 2:1 horizontal atlas with exactly two equal square cells. Show one complete character centered in each cell at identical size. Left cell is the neutral pose; right cell is the same character with only a slight breathing lift in shoulders and scarf. Align both boot soles to exactly the same baseline. Leave generous truly transparent margin around each figure and between cells; every part stays inside its cell.
Lighting/mood: Soft golden highlights, friendly calm mood.
Color palette: Pale turquoise, tan, sandstone, warm amber and dark brown.
Materials/textures: Simple cloth folds and a small leather map satchel; keep details legible at small size.
Constraints: True transparent alpha PNG, no background or floor. No checkerboard, grid, shadows, glow, text, lettering, logo, watermark, weapon, magic, extra object, or extra character. Preserve the same identity, scale and right-facing profile in both frames.
```

## Targeted refinement

```text
Use case: precise-object-edit
Asset type: two-frame transparent idle sprite sheet for a game NPC
Input images: Image 1: edit target; preserve the same original desert guide and atlas
Primary request: Make one narrowly targeted refinement to this two-frame desert guide sprite.
Constraints: Preserve the exact 1774x887 canvas, two equal square horizontal cells, true transparent background, character identity, right-facing pose, outfit, turquoise scarf and headwrap, tan cloak, satchel, boots, palette, crisp pixel-art style, scale, and cell positions. Leave the entire left frame unchanged. In the right frame only, make the breathing pose clearly but gently different by lifting shoulders and upper chest about 4 percent and slightly raising the scarf folds and chin; keep both feet planted at the identical baseline and keep hands relaxed. Keep each figure fully inside its own cell with generous clear transparent space around it. Clean the cutout edge so the silhouette has a crisp dark-brown outline with no red or coral halo outside it. Preserve genuine transparent alpha in the background and gap. No checkerboard, glow, shadow, floor, grid, text, lettering, logo, watermark, weapon, magic, or additional object.
```
