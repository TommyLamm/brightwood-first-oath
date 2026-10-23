# Frost fang inventory icon

Generated on 2026-10-24 with the built-in `image_gen` tool. This icon represents the frost-fang drop from the Lv32 frost wolf and is intended for the one-cell inventory item key managed by `game_expansion`.

- Final asset: `public/assets/interface/item-frost-fang-v1.png`
- Final dimensions and mode: 128 × 128 RGBA, matching existing item icon files; runtime display is 32 × 32.
- Final alpha: real alpha channel retained; alpha extrema 0–255.
- Generation output: `C:\Users\Tommy\.codex\generated_images\01a16a05-d08d-7e72-b24c-599efeb1c5cc\exec-bc87ffdf-1ed5-43a9-aa4e-2cee174a5d9b.png` (1254 × 1254 RGBA; alpha extrema 0–255; alpha bounding box `(57, 23, 1208, 1236)`). The generated original remains at its default path.
- Export preparation: premultiplied-alpha Lanczos resize to the project’s established 128 × 128 item icon size.
- Local style references supplied to imagegen:
  - `C:\Users\Tommy\Desktop\brightwood-first-oath\public\assets\interface\item-stone-chip-v1.png`
  - `C:\Users\Tommy\Desktop\brightwood-first-oath\public\assets\interface\item-metal-shard-v1.png`
- Preview review: inspected the generated original, final 128 × 128 asset and a temporary 32 × 32 runtime-size preview. At 32 × 32 the silhouette still reads as one curved ivory fang with a small ice-blue crystal root; no lettering, frame, scenery or extra object is visible.

## Prompt

```text
Use case: stylized-concept
Asset type: single-cell game UI inventory item icon, displayed in game at 32x32 pixels
Input images: Image 1: C:\Users\Tommy\Desktop\brightwood-first-oath\public\assets\interface\item-stone-chip-v1.png, accepted local material icon used only as a style and finish reference. Image 2: C:\Users\Tommy\Desktop\brightwood-first-oath\public\assets\interface\item-metal-shard-v1.png, accepted local material icon used only as a style and finish reference.
Primary request: One original frost-wolf fang inventory icon: a single gently curved ivory-white wolf tooth with a small muted ice-blue crystalline root/cap. Its tooth shape must remain immediately recognizable when reduced to 32x32.
Style/medium: match the supplied accepted material icons' clear silhouette, restrained pixel-art shading, compact color complexity, and crisp dark blue-gray outline; polished fantasy game inventory icon.
Composition/framing: one centered diagonal fang, root toward lower left and tip toward upper right, generous transparent padding, no clipping.
Lighting/mood: subtle cool top-left highlights, clean and readable.
Materials/textures: smooth dense ivory enamel, small pale ice-blue crystal facets only around the root.
Text (verbatim): none.
Constraints: real transparent alpha; only the single fang icon; preserve the visual scale and outline clarity of the local references.
Avoid: any words, letters, numerals, UI frame, tile, background, scenery, wolf or other creature, shield, sword, ice blade, extra objects, particles, glow, cast shadow, checkerboard pattern, logo, or watermark.
```