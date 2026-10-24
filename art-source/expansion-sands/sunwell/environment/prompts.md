# Sunwell Basin environment prompts

All selected layers were generated with the built-in ImageGen tool on 2026-10-24. No reference images were passed to ImageGen; existing sand and dune layers were inspected only for project style and scale. The far layer selected below is the third fresh generation; the first two far drafts were discarded for visible saturated edge pixels and are not archived.

## Sky

```text
Use case: stylized-concept
Asset type: opaque sky background layer for a side-scrolling fantasy RPG, designed for a final 16:9 960x540 canvas.
Primary request: Create an original charming crisp pixel-art sky for Sunwell Basin, a sunken sandstone oasis in Brightwood First Oath.
Scene/backdrop: Clear open blue sky, shifting subtly toward pale blue-gray and gentle warmth near the low horizon; keep the middle visually calm and open.
Style/medium: Polished 2D fantasy game pixel art with deliberate readable pixel clusters, crisp edges, and restrained colors; no photorealism or painterly blur.
Composition/framing: Full-frame wide 16:9 sky only. A quiet blue upper sky with a subtle warm horizon; no physical land or horizon silhouettes.
Lighting/mood: Neutral diffuse late-afternoon warmth, calm and inviting.
Color palette: Clear blue, pale blue-gray, and a soft muted warm tint near the horizon.
Constraints: Fully opaque RGB sky layer. No terrain, canyon rims, mesas, dunes, ruins, water, pillars, plants, characters, creatures, monsters, interface, writing, labels, logos, frame, or watermark.
Avoid: Bright rim lighting, bloom, neon, red or cyan fringe, glow, lens flare, dramatic sunlight beams, high-saturation gradients.
```

## Far (selected third generation)

```text
Use case: stylized-concept
Asset type: pixel-art far scenery cutout for a side-scrolling fantasy RPG, final use 16:9 at 960x540.
Primary request: Original distant scenery for Sunwell Basin, an inland sunken sandstone oasis in Brightwood First Oath.
Scene/backdrop: Low terraced canyon rims and pale blue-gray mesas lead toward a small, unmistakable broken circular sundial ruin at the center of a distant basin. The ruin is a simple stone ring with a short central marker. Keep the turquoise water as a small interior patch behind the ruin, away from transparent silhouette edges.
Style/medium: Charming crisp 16-bit pixel-art game background, simplified blocky forms, deliberate square pixel clusters, flat matte shading, limited palette of muted tan, ochre, umber, pale blue-gray and restrained turquoise. Use a single dark-brown outer contour integrated into each form.
Composition/framing: Wide panorama. Entire landscape stays low in the bottom third; central sundial remains clearly visible in the far distance. Broad center and lower playfield remain open. Upper two thirds and all gaps through the ring and between distant mesas are completely transparent. Only distant landscape shapes are visible.
Lighting/mood: Even neutral diffuse light with gentle late-afternoon warmth; no directional lighting.
Transparency: True RGBA cutout. Opaque scenery ends exactly at its dark-brown contour, then goes directly to fully transparent alpha; use clean hard pixel boundaries with binary alpha and no soft edge pixels.
Constraints: No sky, clouds, foreground ground or floor, collision terrain, close pillars, vegetation, characters, creatures, monsters, interface, text, labels, logos, border, or watermark.
Avoid: Any red, pink, cyan, yellow, white, or pale edge fringe outside forms; separate colored outline; anti-aliasing; glow; bloom; rim lighting; texture noise; painterly realism; gradients; dense detail; blocked gameplay space.
```

## Mid

```text
Use case: stylized-concept
Asset type: true-transparent middle-parallax environment layer for a side-scrolling fantasy RPG, designed for a final 16:9 960x540 canvas.
Primary request: Create original near framing scenery for Sunwell Basin, a sunken sandstone oasis in Brightwood First Oath.
Scene/backdrop: Sparse broken gold-stone pillars and a few small hardy desert plants frame the far left and far right edges. They belong to a distant ancient sundial complex; keep the forms low and open. A few short sandstone fragments may sit at the outer lower corners.
Style/medium: Charming crisp 2D pixel-art game environment, deliberate readable square pixel clusters, flat matte shading, muted tan, ochre and umber, with clean dark-brown contours. Restrained details and friendly fantasy adventure finish.
Composition/framing: Wide 16:9 transparent layer. Build two separate sparse clusters at the outer 15 percent of the left and right margins. Keep the central 70 percent completely clear and transparent from top to bottom; keep the full lower middle line transparent across the whole canvas for gameplay ground and characters. No object crosses into the center or central lower lane. Only side-framing pillars and tiny hardy plants are opaque.
Lighting/mood: Neutral diffuse late-afternoon warmth, no directional edge lighting.
Transparency and edge handling: Genuine transparent RGBA. Empty space is fully transparent, never black. Use hard pixel boundaries and a dark-brown outer contour only; beyond each contour the pixels are fully transparent with no colored edge halo or detached fragments.
Constraints: No sky, distant mesas, basin, water, continuous floor, collision terrain, broad walls, characters, creatures, monsters, interface, writing, labels, logos, border, or watermark.
Avoid: Red, pink, cyan, yellow, or white edge fringe; glow, bloom, neon, rim lighting, soft antialiasing, painterly blur, photorealistic textures, repeating patterns, dense scenery, or blocked gameplay space.
```
