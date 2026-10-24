# Sunwell Oathblade reward sword source v1

Generated with the built-in ImageGen tool using `transparent_background: true`. The accepted Frost Tide Sword icon was referenced for sword orientation and pixel readability only; the accepted Sunwell Beetle identity was referenced for palette and pixel finish only. Neither design was copied.

Original ImageGen output: `C:\Users\Tommy\.codex\generated_images\01a16c63-c877-72d3-858c-feab1a9b2887\exec-01b94a79-28fa-4419-a0a3-4f072cbefe99.png`
Reference 1: `public/assets/interface/item-frost-tide-sword-v1.png` (accepted sword direction and small-icon pixel finish)
Reference 2: `art-source/expansion-sands/sunwell/beetle/sunwell-beetle-identity-raw-v1.png` (Sunwell palette and pixel finish)
Preserved raw source: `sunwell-oathblade-raw-v1.png`
SHA-256: `E68B361CCD8445EB70F8158B15E78B1BED8DEFC1E2A6C6DFDFEC1DF7AAF5D4B1`
Raw PNG: 1254×1254 RGBA; alpha range 0–255; alpha bounds `(33,45,1176,1123)`. The preserved source is byte-identical to the original ImageGen output.

## Exact ImageGen prompt

```text
Use case: stylized-concept
Asset type: original inventory and equipped sword sprite for Brightwood First Oath
Input images: Image 1: accepted Frost Tide Sword icon, style and silhouette-readability reference only; do not copy its ice blade, colors, exact guard, ornaments, or silhouette. Image 2: accepted Sunwell Beetle identity, palette and pixel-finish reference only; do not copy any beetle anatomy or shape.
Primary request: One original, clearly recognizable straight sword for the Sunwell Oathblade reward.
Subject: A complete one-handed sword with a straight warm ivory-and-steel blade, one small turquoise inset near the hilt, a muted sandstone-gold sun-disc guard, and a dark-brown leather grip.
Style/medium: Crisp colorful pixel-art RPG asset with clean hard-edged clusters, a restrained dark-umber outline, and simple shading matching the accepted small-scale game art.
Composition/framing: Diagonal from the grip at lower-left to the complete blade tip at upper-right. Center the full sword on a square canvas with generous transparent padding. Keep it readable when shown at 32×32; preserve the same orientation for its 64×64 equipped use.
Color palette: Warm ivory and steel for the blade, muted sandstone-gold for the small guard, one restrained turquoise inset, dark-brown grip and dark-umber outline; coordinate with the Sunwell Basin turquoise water and sandstone.
Lighting/mood: Flat, unlit sprite shading; crisp highlights only within the sword.
Constraints: One sword only; true transparent background and preserved alpha. Keep the full blade tip, guard, grip, and pommel inside the canvas. No text, frame, UI, hand, character, ground, cast shadow, aura, glow, light spill, extra objects, blur, antialiasing, checkerboard, logo, or watermark.
```

## Runtime exports

`export_sunwell_oathblade_v1.py` performs packaging only. It preserves the source RGBA pixels and alpha values, adds transparent padding only for the icon, and uses nearest-neighbor resizing; it does not draw, recolor, remove backgrounds, threshold alpha, or repair edges.

- Icon: `public/assets/interface/item-sunwell-oathblade-v1.png`, 128×128 RGBA, displayed at 32×32 as `item:sunwell-oathblade`. Added 128 transparent pixels on each side before nearest-neighbor resize. Alpha bounds `(36,30,101,99)`. SHA-256: `4E96A1DD7C63EEFDCD3E98CD4CDF4AD7621CC06F32F0ACDB619F233B477F3EDF`.
- Equipment sprite: `public/assets/equipment/sunwell-oathblade-v1.png`, 64×64 RGBA, displayed at 64×64 as `equip:sunwell-oathblade`. Resized directly from the preserved full canvas with nearest-neighbor to keep the hand position aligned to the established Frost Tide pivot `(0.25,0.8)`. Alpha bounds `(15,12,54,53)`. SHA-256: `4761693A5833098BF0ACF0F2D3DA314EDBB4F7C74E93F2A594784FF580EE3F9D`.
- Actual-size preview: `sunwell-oathblade-preview-32px.png`, nearest-neighbor resize from the runtime icon. Alpha bounds `(9,8,25,24)`. SHA-256: `8593DB98BA7A510FFACBB9C792A4C15494D4BA8E32AB5075A8271CE7BB0F1906`.

The 64×64 equipment display size, sword direction, and pivot match `equip:frost-tide-sword`; integration confirmed the same pivot `(0.25,0.8)` for the new asset.
