# Sand Dune Pass far-wide generation prompt

Built with the built-in ImageGen tool on 2026-10-24. Tool argument `transparent_background=true`. Input image: `public/assets/environment/env-sand-dune-sky-v1.png` (palette and style reference only). Exact prompt recovered from this task's session record:

```text
Use case: stylized-concept
Asset type: extra-wide far-parallax scenery cutout for a side-scrolling fantasy game, final target 1440x540 (8:3).
Input images: Image 1 is the accepted Sand Dune Pass sky, used only for blue evening haze, warm light and crisp game-art style; do not copy or include its clouds or sky.
Primary request: Create original distant scenery for Sand Dune Pass, a dry traversable caravan route through sandstone country in Brightwood First Oath.
Scene/backdrop: Layered wind-carved sandstone arches, distant mesas, narrow canyon ridges and a few tiny half-buried wheel or marker-stone relic silhouettes far in the distance. The scene should clearly read as an arid inland pass with a broad traversable canyon corridor. Use cool blue atmospheric haze between warm sandstone ridges.
Style/medium: Charming crisp pixel-art fantasy game scenery with deliberate readable pixel clusters, stepped silhouettes, matte shading, thin hard dark-brown contours and a restrained palette of muted tan, sandstone, ochre, umber and pale blue-gray.
Composition/framing: Very wide 8:3 panorama equivalent to 2048x768, exportable to 1440x540 without distortion. Keep the distant arches and ridges low, mostly in the bottom 40 percent. Leave the upper majority and open spaces between arches fully transparent. Keep the center open and readable with a clear canyon route; keep any relics tiny and away from the central play lane. Vary landforms naturally across the width; do not mirror, tile, repeat or duplicate.
Lighting/mood: Calm late-evening warmth over dry sand with cool blue distance haze, no dramatic glow.
Transparency: Genuine RGBA, not black, white, gray or checkerboard. Only the far scenery silhouettes are opaque; all empty space and arch openings are transparent. Keep clean hard contours with no color spill beyond them.
Constraints: This is a dry inland pass, not a coast. No sea, water, shoreline, palms, close foreground floor, collision terrain, nearby walls, buildings, caravans, people, characters, creatures, enemies, interface, text, signs, map labels, frame or watermark.
Avoid: Coastal props or turquoise water; red, pink, cyan, yellow or white fringe; detached pixels; antialiasing; glow, bloom, lens flare, neon, soft gradients, noisy textures, painterly blur, photorealism, dense detail, repeated arches or blocked gameplay space.
```


## Sand Dune Pass mid framing pilot

Built with the built-in ImageGen tool. Tool argument `transparent_background=true`. References: `public/assets/environment/env-sand-dune-sky-v1.png` for blue evening haze/warm light and `public/assets/environment/env-sand-dune-far-v2.png` for crisp sandstone style only.

```text
Use case: stylized-concept.
Asset type: true-transparent middle-parallax framing cutout for Sand Dune Pass, a dry inland caravan route in a side-scrolling fantasy game.
Target: ultra-wide 32:9 panorama, final 1920x540. If the tool renders a taller 2048x768 canvas, confine every visible art pixel to the top quarter only (y=0..191), leaving all lower rows fully transparent alpha=0.
References: Image 1 is only the existing Sand Dune Pass sky's blue-evening and warm sandstone light. Image 2 is only the approved dune far-v2's crisp pixel-art finish. Do not copy its distant arches or mesas.
Create a few sparse decorative near-layer fragments entering from the top edge and upper outer corners: small dry sandstone arch ends and a few tiny clusters of hardy desert scrub. Use 3–5 distinct forms, separated by broad fully transparent gaps. Keep them attached to the top edge, not floating. Leave the full lower 360 pixels of the final canvas completely transparent for actors and gameplay. Keep the center open and the scene clearly dry and inland.
Style: clean readable pixel-art color blocks, hard stepped edges, matte muted tan, sandstone, ochre and umber with restrained pale blue-gray shadow. No painterly shading.
Transparency: genuine RGBA; all empty pixels alpha=0. No background, checkerboard, haze or soft alpha outside the shapes.
No sea, coastline, water, palm trees, continuous ground, island, platform, ledge, lower rocks, full-height wall, character, creature, monster, text, UI, logo, border, watermark, glow, bloom, fog, gradient, cast shadow, lens effect or detached pixels. Do not mirror, tile, repeat, duplicate, stretch or bake runtime scale into the image.
```
