# Sunwell far panorama generation prompts

All three attempts used the built-in ImageGen tool. Attempts 1 and 2 omitted the tool argument transparent_background, so the tool defaulted to an opaque background. Attempt 3 explicitly set transparent_background=true.

## Attempt 1

Input references:
- Image 1: public/assets/environment/env-sunwell-far-v1.png
- Image 2: public/assets/environment/env-sunwell-sky-v1.png
- Tool argument transparent_background: omitted (default false)

Use case: stylized-concept
Asset type: replacement far-parallax scenery cutout for a side-scrolling fantasy RPG, intended for a 1440x540 extra-wide transparent canvas.
Input images: Image 1 is the existing Sunwell far layer, used as subject and composition reference only; redraw the complete landscape to clean its fringed edges and fit the wider panorama. Image 2 is the Sunwell sky, used only as a palette and lighting reference.
Primary request: Create a polished, original, crisp pixel-art far panorama for Sunwell Basin in Brightwood First Oath.
Scene/backdrop: A broad inland sunken sandstone oasis, with pale blue-gray distant mesas and low terraced canyon rims leading toward one small broken circular sundial ruin at the center of a distant basin. The ruin is a simple stone ring with one short central marker. Show a restrained turquoise water patch only inside the ring and a few connected basin pools behind it.
Style/medium: Charming, clear 16-bit pixel-art game scenery with deliberate readable pixel clusters, crisp stepped contours, flat matte shading, and limited muted tan, ochre, umber, pale blue-gray and restrained turquoise colors. Match the soft blue-to-warm late-afternoon light of Image 2 without drawing any sky.
Composition/framing: Extra-wide 8:3 panoramic cutout, target 1440x540. Keep the whole landscape low and anchored to the bottom edge, with the horizon and basin rim around the lower third-to-half, close to the original's vertical framing. Leave the upper majority and all gaps between distant mesas fully transparent. Keep the central play area calm and readable. Show only one circular ruin; no extra altars. Make the panorama naturally varied from left to right; do not mirror, repeat, tile, or duplicate any feature.
Lighting/mood: Even diffuse late-afternoon warmth, calm and inviting, with no directional glow.
Transparency: Genuine RGBA with clean hard pixel edges and transparent empty space; no background fill. Opaque scenery stops at its dark-brown contour and transitions directly to transparent alpha. Keep edge alpha crisp, preferably binary.
Constraints: Maintain a low distant landscape silhouette and the existing bottom-aligned view. Do not bake any runtime scale or camera adjustment into the art. No sky, clouds, continuous foreground floor, foreground collision terrain, close framing pillars, vegetation, characters, creatures, monsters, interface, text, labels, logos, borders or watermarks.
Avoid: Red, pink, cyan, yellow or white fringe; detached colored pixels; soft antialiasing; glow, bloom, neon, rim lighting, gradients, texture noise, painterly blur, photorealism, dense scenery, multiple repeated ruins or blocked play space.

## Attempt 2

Input references:
- Image 1: first ImageGen output at C:\Users\Tommy\.codex\generated_images\01a16d80-e1f9-7380-9640-c8fe3dce3210\exec-29c83667-32a9-4168-b53b-3e0182178c72.png
- Image 2: public/assets/environment/env-sunwell-far-v1.png
- Image 3: public/assets/environment/env-sunwell-sky-v1.png
- Tool argument transparent_background: omitted (default false)

Use case: stylized-concept
Asset type: revised far-parallax pixel-art cutout for the Sunwell Basin side-scrolling game.
Input images: Image 1 is the current panorama to correct. Image 2 is the original far layer, a reference for the low silhouette and bottom-aligned vertical framing. Image 3 is the sky, a reference for palette and light only.
Primary request: Keep the same broad landscape layout, color family and single central broken circular sundial ruin from Image 1, but make the art style clearly match crisp intentional 16-bit pixel art.
Style/medium: Replace the soft painted shading and smooth shapes with deliberate square pixel clusters, clearly stepped silhouettes, crisp hard edges, flat matte shading and a restrained number of color bands. Use muted sandstone tan, ochre, umber, pale blue-gray and quiet turquoise. Keep the late-afternoon blue-to-warm atmosphere from Image 3 without drawing sky.
Composition/framing: Keep the existing 8:3 panoramic layout and landscape anchored to the bottom. Lower and compress the outer cliff faces so the highest rock silhouette begins around 55–58% of canvas height, similar to Image 2. Keep distant central mesa peaks around the lower third-to-half. Leave the upper majority and all mesa gaps fully transparent. Keep exactly one ring-shaped ruin and its short central marker; do not add or duplicate objects.
Transparency: Genuine transparent RGBA, not a checkerboard fill. Maintain crisp hard boundaries between opaque scenery and transparent empty space; no fringes, detached pixels or soft semi-transparent edge glow.
Constraints: Preserve the current left-to-right variety, basin, water patches and one central ring. Keep the view low, distant, quiet and bottom-aligned. No runtime scale or camera effect baked into the art. No sky, cloud, foreground floor, collision terrain, close pillars, plants, characters, creatures, text, interface, logos or watermark.
Avoid: Painterly brush texture, gradients, smooth antialiasing, red/pink/cyan/yellow/white edge fringe, glow, bloom, neon, dense detail, extra ruins or altered panorama proportions.

## Attempt 3

Input references:
- Image 1: public/assets/environment/env-sunwell-far-v1.png
- Image 2: public/assets/environment/env-sunwell-sky-v1.png
- Tool argument transparent_background: true

Use case: stylized-concept
Asset type: true-transparent far-parallax scenery for a side-scrolling fantasy RPG, target canvas 1440x540 (8:3).
Input images: Image 1 is the existing Sunwell far layer, used as subject, palette and vertical-composition reference; redraw the entire panorama cleanly to remove its fringe artifacts and widen the scene. Image 2 is the Sunwell sky, used only as a color and lighting reference.
Primary request: Create an original, polished, crisp pixel-art panorama for Sunwell Basin in Brightwood First Oath.
Scene/backdrop: A broad inland sunken sandstone oasis, with pale blue-gray distant mesas and low terraced canyon rims leading toward one small broken circular sundial ruin at the center of a distant basin. The ruin is one simple stone ring with one short central marker. Show a modest turquoise pool inside the ring, with a few connected shallow basin pools behind it.
Style/medium: Charming clear 16-bit pixel-art game scenery. Use deliberate square pixel clusters, stepped outlines, hard pixel edges and flat matte shading. Keep a restrained palette of muted tan, ochre, umber, pale blue-gray and turquoise, with the gentle late-afternoon blue-to-warm light from Image 2.
Composition/framing: Very wide 8:3 landscape composition for 1440x540. Keep all land low and anchored to the bottom edge. Preserve the original low distant horizon and bottom-aligned view: highest outer rock silhouette around y=300 of 540, central mesa peaks around y=360, and water/ruin in the lower portion. Keep the upper majority and all gaps between mesas transparent and visually open. Make the scene naturally varied from left to right; do not mirror, tile, repeat, or duplicate features.
Lighting/mood: Even diffuse late-afternoon warmth; calm and inviting, with no directional glow.
Constraints: Genuine transparent RGBA; empty areas must be transparent, not black, white, gray, or checkerboard. Scenery should end at clean dark-brown pixel contours and transition directly to transparent alpha. Do not bake runtime scale or camera adjustments into the image.
Avoid: Sky, clouds, continuous foreground floor, collision terrain, close framing pillars, vegetation, characters, creatures, interface, words, labels, logos, borders, watermarks, red/pink/cyan/yellow/white edge fringe, detached pixels, anti-aliasing, gradients, glow, bloom, neon, dense scenery, multiple ruins, painterly blur or photorealism.


---

# Sunwell mid pilot prompts

## Attempt 1 — rejected for diffuse alpha haze

Built with the built-in ImageGen tool on 2026-10-24. Tool argument `transparent_background=true`. References: `public/assets/environment/env-sunwell-sky-v1.png` and `public/assets/environment/env-sunwell-far-v2.png`.

```text
Use case: stylized-concept.
Asset type: true-transparent middle-parallax framing cutout for Sunwell Basin in a side-scrolling fantasy game.
Target composition: ultra-wide 32:9 panorama, 1920x540. If the tool renders a taller canvas, keep every designed object wholly within the top quarter only, leaving all remaining area fully transparent so it can be cropped without cutting art.
References: Image 1 is the exact Sunwell sky color and lighting reference. Image 2 is the approved Sunwell far-layer pixel-art style reference. Do not copy its basin or ring ruin.
Create a sparse, low-contrast near framing layer made of a few separate sandstone arch caps and small palm fronds that enter from the canvas top edge or the upper outer corners. Use 3–5 distinct small fragments, widely separated, with large true-transparent gaps. Keep every visible form within the upper 180 pixels of the final 540px composition. The central 60 percent across the whole canvas stays fully transparent; the entire lower 360 pixels stay fully transparent for characters and gameplay ground.
Pixel art: crisp deliberate pixel clusters, simple readable shapes, matte muted ochre and umber with restrained dusky blue-gray shadow, clean contours, subtle colors that do not compete with the far layer. Keep the forms as decorative framing silhouettes, not obstacles.
Genuine RGBA transparency with absolutely empty transparent space; use the tool's transparent-background setting. No filled sky or checkerboard.
Do not add a floor, continuous terrain, islands, ledges, platforms, a basin, water, mesas, a ring ruin, altar, columns rising from below, full-height walls, large center object, characters, creatures, monsters, text, UI, logo, watermark, border, glow, bloom, fringe, detached pixels, painterly blur, or photorealism. Do not mirror, tile, repeat, or duplicate forms. Do not bake any runtime scale or camera effect into the art.
```

## Attempt 2 — one targeted correction, authorized after root review of alpha metrics

Built with the built-in ImageGen tool. Tool argument will be `transparent_background=true`. References will be the existing Sunwell sky and approved far-v2 style only. This prompt is saved before generating the correction.

```text
Use case: stylized-concept.
Asset type: clean true-transparent upper-edge framing cutout for the middle-parallax layer of Sunwell Basin in a side-scrolling fantasy game.
Target: ultra-wide 32:9, final 1920x540. Ask for a 2048x768 source if needed, but confine every real art pixel to the top quarter only; the lower three quarters must remain fully transparent alpha=0.
References: Image 1 is only the blue-to-warm palette and lighting of the existing Sunwell sky. Image 2 is only the crisp matte pixel-art finish and sandstone palette of the approved Sunwell far-v2. Do not copy any basin, water, ring ruin, or landscape silhouette.
Draw only a few sparse, solid sandstone arch tips and small palm-frond silhouettes entering from the top edge and the upper outer corners. Use 3–5 small separated forms with very wide transparent gaps. All visible art must end within the upper quarter of the source canvas (for a 2048x768 source, no visible pixels below y=192). Keep the center open. Do not let any form extend down from the bottom edge. Lower 75 percent must be genuinely empty transparent RGBA, not translucent haze.
Use crisp, simple pixel-art color blocks with hard edges, matte muted ochre and umber, restrained blue-gray shadow. Keep framing low-contrast and decorative.
Transparency requirements: genuine RGBA; every empty pixel is exactly alpha 0. No checkerboard or background color. No soft alpha outside shapes.
Do not add fog, atmospheric haze, glow, bloom, light rays, cast shadows, gradient, antialiasing, painterly softness, fringe, detached pixels, sky, ground, a continuous floor, islands, ledges, platforms, basin, water, mesas, ring ruin, altar, full-height wall, column rising from below, central object, character, creature, monster, text, UI, logo, watermark, border. Do not mirror, tile, repeat, duplicate, stretch, or bake runtime scale or camera adjustments.
```
