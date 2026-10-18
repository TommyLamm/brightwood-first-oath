# T10 actor source log

## T10-01 — hero style reference

- Asset ID: hero-style-reference-v1
- Purpose: temporary style and outfit reference for the original short-haired traveling swordsman.
- Tool: built-in image_gen (ImageGen skill); generated on 2026-10-17.
- Input references: none. There was no initial local image reference in the project and no image was supplied. The generation used no referenced_image_paths or prior conversation images.
- Original generated file: D:\dev-data\codex-home\generated_images\01a14a64-0a2c-7323-ad2b-b420cb2b694b\exec-b12988d8-b5d4-48ce-a1de-dcf9bc61928a.png
- Project copy: F:\Desktop\MapleStory\art-source\actors\hero-style-reference-v1.png
- Dimensions / encoding: 1536 × 1024 px, PNG, RGB (24bpp; no alpha).
- Status: temporary/reference only. This is a three-view character design board, not a spritesheet, animation, or formal runtime asset. It is not included in public runtime assets and has no manifest entry.

### Full generation prompt

Use case: stylized-concept
Asset type: temporary character style and outfit reference for an original 2D side-scrolling adventure game
Primary request: Create a clean character-design reference board for one original short-haired traveling swordsman, shown as three consistent full-body views (front, side profile facing right, and back). Keep the same cute big-head proportions, face, hair, clothing, colors, and simple travel sword across all views. The figure should read clearly at a small game scale and have a distinctive, friendly silhouette.
Subject: A young, upbeat traveler with short tousled dark chestnut hair and a side-swept fringe, large expressive eyes, a cream neck wrap, a muted teal tunic with a small original leaf-shaped clasp, a warm ochre belt, practical dark brown boots, and a simple sheathed short sword. Modest, layered adventure clothing with visible fabric shapes; no armor plating.
Style/medium: Original polished 2D pixel-art character illustration with a classic side-view game-sprite feel, compact pixel clusters, crisp stepped contours, limited warm palette, and clean readable shading. Whimsical nostalgic early-era Taiwanese/Hong Kong side-scrolling adventure mood, expressed only as broad genre atmosphere; fully original character design. Not 3D, not vector, not photorealistic.
Composition/framing: Three evenly spaced, full-body turnaround views on one uncluttered reference board, consistent scale, neutral relaxed stance, generous separation, all features and feet visible. Side profile faces right. Quiet pale sage and parchment backdrop with only a faint, soft forest color hint; keep the character dominant.
Lighting/mood: Gentle warm daylight, welcoming and adventurous.
Color palette: Muted teal, cream, ochre, chestnut, dark brown, soft sage.
Materials/textures: Crisp pixel-art texture, simple cloth folds and leather details.
Text (verbatim): None.
Constraints: Keep all three views recognizably the same character. This is a style reference, not a production sprite sheet or animation atlas.
Avoid: Any text, letters, labels, symbols resembling a logo, watermark, existing game or anime character, trademark, recognizable franchise design, copied sprite, extra characters, multiple weapons, cut-off limbs, dynamic action, 3D rendering, smooth vector outlines, photorealism, interface elements.

## T10-02 — hero-cloth sheet attempts (UNFINISHED)

Two built-in ImageGen attempts were made for `actor:hero-cloth`. Neither is a usable 8×8 sheet; neither was copied to the project or added to any manifest.

| Attempt | Input reference | Generated PNG | Dimensions / encoding | Outcome |
| --- | --- | --- | --- | --- |
| 1 | `F:\Desktop\MapleStory\art-source\actors\hero-style-reference-v1.png` via `referenced_image_paths` | `D:\dev-data\codex-home\generated_images\01a14a64-0a2c-7323-ad2b-b420cb2b694b\exec-c5823ca1-70c8-4db8-ae10-9834f0995e39.png` | 1254 × 1254 px, PNG, RGBA | Not divisible by 8; visible red/green edge artifacts and a visible sheath. UNFINISHED. |
| 2 | Attempt 1 generated PNG via `referenced_image_paths` | `D:\dev-data\codex-home\generated_images\01a14a64-0a2c-7323-ad2b-b420cb2b694b\exec-83dcc532-be9d-4f59-80aa-62f1a8bb81c3.png` | 1254 × 1254 px, PNG, RGBA | Not divisible by 8; red edge fragments remain. UNFINISHED. |

The full prompt text for these two earlier calls was not retained in the resumed task context and is intentionally not reconstructed. No runtime file or key was created for `actor:hero-cloth`.

## T10-04 — formal gear subset (7 assets)

Generated on 2026-10-18 with the built-in `image_gen.imagegen` tool following the imagegen skill. Every generation call explicitly passed the local T10-01 reference at `F:\Desktop\MapleStory\art-source\actors\hero-style-reference-v1.png` in `referenced_image_paths`, with `transparent_background: true`. Original ImageGen outputs remain in the generated-images directory. Copies exist both here as source and under `public/assets/actors/` as selected formal single-frame assets. They are 1×1 images, not sprite sheets; display dimensions and pivots are in `public/assets/actors/gear-subset-manifest-v1.json`. That is a partial subset manifest, not the complete actors manifest.

### `equip:starter-sword` — `equip-starter-sword-v1.png`

- Generated file: `D:\dev-data\codex-home\generated_images\01a14a64-0a2c-7323-ad2b-b420cb2b694b\exec-e6d019b5-cb82-4a42-8247-177e20a02de0.png`.
- Source copy: `art-source/actors/equip-starter-sword-v1.png`; runtime copy: `public/assets/actors/equip-starter-sword-v1.png`.
- Dimensions: 1278 × 1230 px, PNG, 32bpp ARGB; display 64 × 64, pivot (0.25, 0.8). Formal single-frame gear asset; not an animation.
- Full prompt:

```text
Create one original, isolated equipment icon for a small 2D pixel-art adventure game, matching the handmade classic Taiwanese/Hong Kong fantasy-adventure mood and the warm earthy/teal palette of the referenced traveler. Subject: a modest starter sword, a short simple iron blade with a dark leather grip and tiny brass pommel, no scabbard, diagonally tilted from lower-left hilt to upper-right point. Crisp readable pixel-art clusters with deliberate pixels, limited palette, no outline artifacts. Entire item fully visible and centered, substantial transparent padding, a single object only. True transparent background. No character, no scene, no shadows outside the object, no grid, no UI, no letters, no logos, no watermark. This is a reference-quality single item icon, not a sprite sheet.
```

### `equip:iron-sword` — `equip-iron-sword-v1.png`

- Generated file: `D:\dev-data\codex-home\generated_images\01a14a64-0a2c-7323-ad2b-b420cb2b694b\exec-e1196874-9280-4a2c-a303-acbe0389be81.png`.
- Source copy: `art-source/actors/equip-iron-sword-v1.png`; runtime copy: `public/assets/actors/equip-iron-sword-v1.png`.
- Dimensions: 1254 × 1254 px, PNG, 32bpp ARGB; display 64 × 64, pivot (0.25, 0.8). Formal single-frame gear asset; not an animation.
- Full prompt:

```text
Create one original isolated equipment icon: an iron adventurer sword that belongs visually to the short-haired traveler in the reference, classic Taiwanese/Hong Kong fantasy adventure tone. Single compact straight iron sword, broad clean gray blade with one simple pale highlight, dark brown wrapped grip, small restrained brass crossguard and pommel. Diagonal lower-left hilt to upper-right point, fully visible, centered with generous transparent margins, unmistakable simple silhouette designed to fit a 64 by 64 inventory icon, deliberate chunky pixel clusters and restrained palette. True transparent background, no shadow detached from the object. No character, scene, text, logo, watermark, UI, spritesheet, or extra item.
```

### `equip:steel-sword` — `equip-steel-sword-v1.png`

- Generated file: `D:\dev-data\codex-home\generated_images\01a14a64-0a2c-7323-ad2b-b420cb2b694b\exec-f5a79246-5bb5-4a48-b28e-ccfa12bf3e9b.png`.
- Source copy: `art-source/actors/equip-steel-sword-v1.png`; runtime copy: `public/assets/actors/equip-steel-sword-v1.png`.
- Dimensions: 1536 × 1024 px, PNG, 32bpp ARGB; display 64 × 64, pivot (0.25, 0.8). Formal single-frame gear asset; not an animation.
- Full prompt:

```text
A single original steel sword equipment icon for the short-haired traveler from the reference, in the same friendly old Taiwanese/Hong Kong 2D pixel adventure palette. Upgraded longer sword with cool medium-steel blade, one restrained cyan-blue glint near the crossguard, dark brown leather grip and compact silver guard. Diagonal lower-left handle to upper-right tip, fully visible, centered with generous transparent margins, unmistakable simple silhouette at 64px inventory display. Chunky deliberate pixel clusters; no photorealism. Transparent background only. No character, scene, shadow, text, logo, watermark, UI, sheet, extra item.
```

### `equip:guardian-sword` — `equip-guardian-sword-v1.png`

- Generated file: `D:\dev-data\codex-home\generated_images\01a14a64-0a2c-7323-ad2b-b420cb2b694b\exec-9766a847-3381-4166-b172-f9241c958ac1.png`.
- Source copy: `art-source/actors/equip-guardian-sword-v1.png`; runtime copy: `public/assets/actors/equip-guardian-sword-v1.png`.
- Dimensions: 1536 × 1024 px, PNG, 32bpp ARGB; display 64 × 64, pivot (0.25, 0.8). Formal single-frame gear asset; not an animation.
- Full prompt:

```text
Original endgame guardian sword equipment icon for the same short-haired traveler concept in the reference image. Design a recognizable single fantasy sword, with a clean broad pale-steel blade, one restrained amber-gold guard shaped like simple protective wings, a small teal gem at the hilt, and dark chestnut leather grip. Make it visibly more ornate than a basic sword while retaining the same warm classic Taiwanese/Hong Kong adventure pixel-art language. Diagonal lower-left grip to upper-right point, fully in frame, centered, compact silhouette readable at 64x64, clean stepped pixels and limited colors. True transparent background and generous transparent margin. No glow, no cast shadow, no scene, no character, no text, no logo, no watermark, no UI, no spritesheet, no second object.
```

### `equip:cloth-cap` — `equip-cloth-cap-v1.png`

- Generated file: `D:\dev-data\codex-home\generated_images\01a14a64-0a2c-7323-ad2b-b420cb2b694b\exec-ca3edc5c-ac58-4f6a-b2c0-e9aca997ac12.png`.
- Source copy: `art-source/actors/equip-cloth-cap-v1.png`; runtime copy: `public/assets/actors/equip-cloth-cap-v1.png`.
- Dimensions: 1536 × 1024 px, PNG, 32bpp ARGB; display 48 × 32, pivot (0.5, 1). Formal single-frame gear asset; not an animation.
- Full prompt:

```text
Generate one isolated original cloth-cap equipment icon for the short-haired adventurer shown in the reference. A small soft muted-teal cloth travel cap with a cream stitched band, simple rounded top and tiny original leaf-shaped brass clasp; friendly beginner gear in warm classic Taiwanese/Hong Kong side-scrolling pixel-art style. Show cap only, front three-quarter view, fully visible and centered, broad simple silhouette readable at 48x32 display size, deliberate chunky pixel clusters and restrained palette. True transparent background with margin. No person, head, hair, mannequin, scene, attached shadow or glow, no text, logo, watermark, UI, sheet, or extra item.
```

### `equip:leather-cap` — `equip-leather-cap-v1.png`

- Generated file: `D:\dev-data\codex-home\generated_images\01a14a64-0a2c-7323-ad2b-b420cb2b694b\exec-f026ce63-af4d-4ac1-9521-4461ccacd0a1.png`.
- Source copy: `art-source/actors/equip-leather-cap-v1.png`; runtime copy: `public/assets/actors/equip-leather-cap-v1.png`.
- Dimensions: 1536 × 1024 px, PNG, 32bpp ARGB; display 48 × 32, pivot (0.5, 1). Formal single-frame gear asset; not an animation.
- Full prompt:

```text
Single isolated original leather cap equipment icon for the same traveler in the reference. A practical warm brown leather adventurer cap with a slightly raised crown, stitched seams, a small downturned brim and one modest muted-teal cloth tie/clasp; clearly a stronger upgrade than a cloth cap but not a helmet. Three-quarter front view, cap only with no head, fully visible, centered, readable broad silhouette at 48x32 display size, deliberate chunky pixel clusters, classic friendly Taiwanese/Hong Kong 2D pixel adventure mood. True transparent background with margin. No glow, no background, no cast shadow, no character, no text, logo, watermark, UI, sheet, or extra object.
```

### `equip:iron-helm` — `equip-iron-helm-v1.png`

- Generated file: `D:\dev-data\codex-home\generated_images\01a14a64-0a2c-7323-ad2b-b420cb2b694b\exec-eff3e863-6333-4a2b-ab03-a90f8306d562.png`.
- Source copy: `art-source/actors/equip-iron-helm-v1.png`; runtime copy: `public/assets/actors/equip-iron-helm-v1.png`.
- Dimensions: 1536 × 1024 px, PNG, 32bpp ARGB; display 48 × 32, pivot (0.5, 1). Formal single-frame gear asset; not an animation.
- Full prompt:

```text
Create one original isolated iron helmet equipment icon that fits the same short-haired traveler concept in the reference. A compact practical iron half-helm with rounded steel crown, simple cheek guards leaving the face opening empty, a small dark teal cloth tie, and restrained brass rivets. Clearly armor, distinct from cloth and leather caps, friendly classic Taiwanese/Hong Kong 2D pixel adventure style with warm restrained palette and chunky deliberate pixels. Three-quarter front view, helmet only, no wearer or mannequin, fully visible and centered, broad silhouette for 48x32 display, leave clear transparent margin. True transparent background. No glow, shadow, scene, character, text, logo, watermark, UI, sheet, or extra object.
```
