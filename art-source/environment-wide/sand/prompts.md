# Sand Far Panorama Generation Prompts

Both calls used built-in ImageGen with transparent_background=true. The reference was the accepted sand sky only; neither call referenced the existing far-v1 art, so its edge colors were not passed into the generation.

## Attempt 1

Input image: public/assets/environment/env-sand-sky-v1.png (palette, light and style reference only).
Tool argument: transparent_background=true.
Raw ImageGen source: C:\Users\Tommy\.codex\generated_images\01a16d80-e1f9-7380-9640-c8fe3dce3210\exec-f7ffd40f-cf90-4041-afed-992db3efcb8d.png

Use case: stylized-concept
Asset type: extra-wide far-parallax scenery cutout for a side-scrolling fantasy game, final target 1440x540 (8:3).
Input images: Image 1 is the accepted Gold Sand Sea sky, used only for warm coastal palette, soft daylight and overall game-art finish; do not copy its clouds or sky.
Primary request: Create an original distant far panorama for the Gold Sand Sea coast in Brightwood First Oath.
Scene/backdrop: Warm sea-facing sandstone ridges and low wind-carved ochre mesas receding toward a quiet turquoise shoreline. Show a thin calm band of turquoise sea at the distant lower horizon, with pale sea haze. This is the warm coast landscape; it must read as a dry sandy coast with distant rock forms, not as a canyon pass.
Style/medium: Polished 2D pixel-illustration game scenery with readable stepped silhouettes, crisp pixel clusters, matte sandstone shading and a restrained palette of warm amber, pale sand, ochre, umber, soft blue haze and quiet turquoise, consistent with Image 1's warm coastal sky.
Composition/framing: Very wide 8:3 panoramic cutout for 1440x540. Keep the distant landform low, mostly in the bottom 35–40 percent, with the land edge near the lower horizon. Leave the upper majority and every gap between mesas completely transparent. Keep a broad calm central play area. Landscape features should vary naturally from left to right; do not mirror, tile, repeat or duplicate them.
Lighting/mood: Soft warm late-afternoon sunlight, calm, bright coastal air; no dramatic directional glow.
Transparency: Genuine transparent RGBA with empty upper space, not black, white, gray or checkerboard. Rock and shoreline silhouettes have clean hard contours and transition directly to transparent alpha; no colored pixels beyond their edges.
Constraints: Far distance only. No sky, clouds, foreground floor, collision terrain, close palms or rocks, buildings, boats, characters, creatures, interface, text, signs, map labels, frame or watermark.
Avoid: Dry inland canyon arches or caravan-route props; red, pink, cyan, yellow or white color fringe; detached pixels; antialiasing; glow, bloom, lens effects, neon, gradients, noisy textures, painterly blur, photorealism or blocked gameplay space.

## Attempt 2 (targeted aspect-ratio correction)

Input images:
- Image 1: Attempt 1 raw source above.
- Image 2: public/assets/environment/env-sand-sky-v1.png (palette and light only).
Tool argument: transparent_background=true.
Raw ImageGen source: C:\Users\Tommy\.codex\generated_images\01a16d80-e1f9-7380-9640-c8fe3dce3210\exec-1526fae1-4ccc-49c0-9cc8-694d2fa9346b.png

Use case: stylized-concept
Asset type: true-transparent far-parallax panorama for a side-scrolling fantasy game, exact 8:3 aspect ratio, equivalent to 2048x768 and exportable without distortion to 1440x540.
Input images: Image 1 is a composition and subject reference for the Gold Sand Sea coastline; Image 2 is a warm color and lighting reference only.
Primary request: Recompose the Gold Sand Sea far scenery for a true extra-wide 8:3 canvas. Preserve the recognizable warm sandy coastline, low wind-carved mesas and thin turquoise sea horizon from Image 1, but use the full 8:3 width naturally.
Composition/framing: Exact 8:3 wide panoramic frame. Do not crop the scene to a narrower format, do not add side bars or margin padding, and do not stretch the existing image. Redraw the panorama so natural varied coastal terrain fills the full width from left edge to right edge. Keep the highest landforms near the lower half and the sea and shoreline at the bottom. Leave the upper majority and all gaps fully transparent. Do not mirror or repeat any mesa, cliff, or shore pattern.
Style/medium: Polished 2D pixel-illustration game scenery with crisp stepped silhouettes, readable pixel clusters and matte sandstone shading. Use warm amber, pale sand, ochre, umber, soft blue haze and quiet turquoise, in the gentle coastal light of Image 2.
Transparency: Genuine RGBA. Empty space is alpha-transparent, never black, white, gray or checkerboard. Keep clean hard contours; no color spill beyond the land or sea shapes.
Constraints: This is a dry warm sea coast, not a canyon pass. Far distance only. No sky, clouds, foreground floor, collision terrain, palms, buildings, boats, characters, creatures, interface, text, signs, map labels, frame or watermark.
Avoid: Inland arches or caravan-route props, red/pink/cyan/yellow/white fringe, detached pixels, antialiasing, glow, bloom, gradient haze, painterly blur, photorealism, side padding, crops, stretched landforms, mirrored or tiled scenery.

## Sand mid framing pilot

Built with the built-in ImageGen tool. Tool argument `transparent_background=true`. References: `public/assets/environment/env-sand-sky-v1.png` for warm coast palette/light and `public/assets/environment/env-sand-far-v2.png` for crisp game-art style only.

```text
Use case: stylized-concept.
Asset type: true-transparent middle-parallax framing cutout for the Gold Sand Sea coast in a side-scrolling fantasy game.
Target: ultra-wide 32:9 panorama, final 1920x540. If the tool renders a taller 2048x768 canvas, confine every visible art pixel to the top quarter only (y=0..191), leaving all lower rows fully transparent alpha=0.
References: Image 1 is only the existing Gold Sand Sea sky's warm coastal palette and soft light. Image 2 is only the approved Sand far-v2's crisp pixel-art finish. Do not copy its sea or skyline.
Create a few sparse decorative near-layer forms entering from the top edge and upper outer corners: small wind-worn sandstone overhang tips and restrained palm-frond clusters. Use only 3–5 distinct forms, separated by broad fully transparent gaps. Keep them low-contrast and visually attached to the top edge, not floating. Leave the full lower 360 pixels of the final canvas completely transparent for actors and gameplay. Keep the middle open.
Style: clean readable pixel-art color blocks, hard stepped edges, matte pale sand, muted amber and umber with restrained leaf green. No painterly shading.
Transparency: genuine RGBA; all empty pixels alpha=0. No background, checkerboard, haze or soft alpha outside the shapes.
No coast, sea, waterline, continuous ground, island, platform, ledge, lower rocks, full-height wall, character, creature, monster, text, UI, logo, border, watermark, glow, bloom, fog, gradient, cast shadow, lens effect or detached pixels. Do not mirror, tile, repeat, duplicate, stretch or bake runtime scale into the image.
```
