# 遠古遺跡包 A — Environment Source Log

Date: 2026-10-25
Status: Six formal runtime layers prepared. Game rendering and Playroom acceptance remain unverified.

## Scope and references

Two side-view themes were generated: Tide Camp / coastal ruins and Root Causeway / root-overgrown ruins. The chapter source is plan/12-next-chapter-ancient-ruins.md; the asset contract is plan/10-asset-spec.md. The intended progression is from humid pale coastal stone and a broken signal tower to an irregular root bridge, broken columns and canopy.

Reviewed references:
- art-source/environment/forest-style-reference-v1.png — project background style reference.
- public/assets/environment/env-camp-mid-v2.png — existing user-maintained transparent upper-edge layer structure, used only as a parallax-layout reference.
- Review thumbnails are in review/, with long edge at most 1280px and JPEG quality 70; transparent images were composited on a neutral gray-green background for inspection.

The parallax factors are sky=0, far=0.2, mid=0.5. These backgrounds do not use the Sunwell-specific Y 1.6 offset. No runtime platform, walkable floor, character, NPC, monster, text, or UI was baked into the backgrounds.

## Generated files and selection

Built-in image_gen was used (one independent generation call per asset). Original tool outputs were copied unchanged to raw/; intermediate corrections remain source-only. Tool output directory: C:/Users/Tommy/.codex/generated_images/01a17113-ef73-7d22-81c6-14b14c49d928/.

| Runtime key | Selected raw source | Original generation output | Source dimensions | Selected for runtime |
| --- | --- | --- | --- | --- |
| env:ruins-camp:sky | raw/generated-01-source.png | exec-b861155f-1854-41d2-8286-436cf547f618.png | 1672x941 RGBA | Yes |
| env:ruins-camp:far | raw/generated-02-source.png | exec-bac6d5cb-65d7-4bbc-badc-7fbfc0d40522.png | 2048x768 RGBA | Yes |
| env:ruins-camp:mid | raw/camp-mid-final-correction-source.png | exec-93d6ac8f-a487-42d7-9446-ea83dc95c9bf.png | 2172x724 RGBA | Yes |
| env:ruins-root:sky | raw/generated-04-source.png | exec-d5e340bd-b30b-4ea1-a83b-8ddfcb04498a.png | 1672x941 RGBA | Yes |
| env:ruins-root:far | raw/generated-05-source.png | exec-f471fbcc-618e-40f7-964d-247dc6ea43bb.png | 2048x768 RGBA | Yes |
| env:ruins-root:mid | raw/root-mid-recomposition-source.png | exec-4f1df2d5-4e77-44d5-96b8-5f860f5671f9.png | 2048x768 RGBA | Yes |

Superseded mid candidates are also preserved under raw/: generated-03-source.png, camp-mid-correction-source.png, generated-06-source.png, root-mid-correction-source.png, root-mid-final-correction-source.png, root-mid-silhouette-correction-source.png, and the two normalized pre-correction intermediates. Their output paths correspond respectively to exec-be5f0a60-033e-4dd3-90cc-78413b7d2185.png, exec-6304d09d-4aa1-435c-a68d-4fe863e40cdf.png, exec-ca571b89-6e5e-42d1-8286-436cf547f618.png, exec-91d920e6-cebe-4d6a-996c-56cca479c821.png, exec-dafa55d5-2bbd-4c57-9f25-9ae36d62ac18.png, and exec-d7133166-94e8-4f20-8bf4-2a87752a9051.png. These are not referenced by the runtime manifest.

## Runtime normalization and checks

Sky layers were resampled with Lanczos to 960x540; far layers were resampled to 1440x540. Mid layers were uniformly scaled to 540px high and centered on transparent 1920x540 canvases, preserving artwork proportions. Camp mid uses a 12px alpha fade over rows 168..179; Root mid uses a 48px alpha fade over rows 132..179 to preserve an irregular soft canopy edge. For both, rows 180..539 are alpha 0. The alpha changes are row-based layer-boundary normalization after ImageGen correction, not chroma-key removal.

Final runtime files, byte sizes and SHA-256:
| File | Dimensions | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| public/assets/environment/env-ruins-camp-sky-v1.png | 960x540 | 771267 | c093ad1df64e38bacac59bb3fbf8d2acf4c4a2300905e74d631693600c14d5bc |
| public/assets/environment/env-ruins-camp-far-v1.png | 1440x540 | 906622 | d0368904ca3e9ed8caf94f3b5fd4747c3815751981a7d23b27de33b0d333b789 |
| public/assets/environment/env-ruins-camp-mid-v1.png | 1920x540 | 401261 | aa12e39d36756a14a58510fce5e575d8473cd81c5aa258c0e21133126d952f5a |
| public/assets/environment/env-ruins-root-sky-v1.png | 960x540 | 777063 | 9d1c805592a907ee75dca25ff459412d304a37f6b09767aa98507c787c01876f |
| public/assets/environment/env-ruins-root-far-v1.png | 1440x540 | 1178982 | b58d4ffbb87a16981f8fd36a2c504e368d2852085c986a8bb80e81ef5e2e6106 |
| public/assets/environment/env-ruins-root-mid-v1.png | 1920x540 | 494531 | f0a794dedf0f178d8d48125b0f521d23ca981e4a8bad7bffc77fc8b0a8751e4e |

Total new runtime PNG size is 4,529,726 bytes (4.32 MiB), below the 24 MiB incremental budget. All six decode as RGBA; sky alpha is fully opaque, far layers have real transparent pixels, and both mid layers are fully transparent at y>=180. Manifest uses columns=rows=1, pivots (0,0), and display dimensions matching the runtime images.

## Reference and correction prompts

Initial generations used the style reference for all six assets. Mid layers also used the existing env-camp-mid-v2 layer as a layout reference. Where strict alpha bounds or the lower silhouette needed correction, ImageGen edits were attempted; the final root mid uses a fresh recomposition after edit attempts kept a flat lower band.

The exact prompts are preserved below and in the corresponding prompt files.

### env-ruins-camp-sky-v1
File: prompts/env-ruins-camp-sky-v1.prompt.txt

    Use case: stylized-concept
    Asset type: formal 2D side-view fantasy RPG parallax sky background, one landscape PNG layer.
    Input images: Image 1 is only a style reference for the project's softly painted, clustered game-background texture; do not copy its forest scene.
    Primary request: create the sky layer for Tide Camp, the first location in a humid ancient coastal-ruins chapter.
    Scene/backdrop: full-bleed open sky above a distant calm sea; pale limestone-colored sea haze at a low horizon, soft layered clouds, humid coastal air.
    Subject: only atmosphere, sky and a thin distant sea horizon; no landforms or architecture.
    Style/medium: charming hand-painted pixel-art-inspired 2D game background, broad clear color masses, softly clustered brush pixels, atmospheric depth, consistent with the style reference; not 3D, not photorealistic.
    Composition/framing: exact target composition 960x540, wide 16:9 horizontal side-view backdrop, horizon low in frame, subtle variation across the full width.
    Lighting/mood: quiet overcast daylight after rain, gentle pale light.
    Color palette: blue-grey, warm limestone mist, muted sea-glass teal, tiny restrained oxidized-copper cloud accents.
    Constraints: opaque sky image; no transparency, no text, no signage, no watermark. Keep this strictly a sky layer. Avoid cliffs, shore, buildings, broken towers, tents, trees, roots, characters, NPCs, monsters, platforms, paths, ground, or any walkable terrain.

### env-ruins-camp-far-v1
File: prompts/env-ruins-camp-far-v1.prompt.txt

    Use case: stylized-concept
    Asset type: formal 2D side-view fantasy RPG far-parallax scenery layer, PNG with true transparency.
    Input images: Image 1 is only a style reference for the project's softly painted, clustered game-background texture; do not copy its forest scene.
    Primary request: create the distant scenery for Tide Camp, a humid ancient coastal-ruins outpost.
    Scene/backdrop: isolated distant forms of wet pale limestone coast ruins against empty transparent space: eroded sea cliffs, a slender broken signal tower and a few ancient wall fragments, with one small canvas shelter silhouette tucked among the ruins and subtle oxidized-copper braces.
    Subject: only distant coastline and architectural silhouettes, with calm readable shapes and broad gaps between clusters.
    Style/medium: charming hand-painted pixel-art-inspired 2D game background, broad color masses, softly clustered brush pixels and atmospheric sea mist; not 3D, not photorealistic.
    Composition/framing: exact target composition 1440x540 landscape 8:3; scenery occupies the lower half in broken groups, skyline stays irregular and low, sea-facing silhouettes fade into haze.
    Lighting/mood: quiet post-rain coastal daylight.
    Color palette: pale wet limestone, muted blue-grey, desaturated teal sea haze, sparse oxidized-copper accents.
    Constraints: request genuine transparent background and preserve alpha. Transparent pixels between forms; no sky or filled backdrop. No complete continuous foreground strip, flat top edge, walkable ledge, floor, platform, road, stairs or ground plane. No characters, NPCs, monsters, text, UI, signage or watermark.

### env-ruins-camp-mid-v1
File: prompts/env-ruins-camp-mid-v1.prompt.txt

    Use case: stylized-concept
    Asset type: formal 2D side-view fantasy RPG near-overhead parallax canopy layer, PNG with true transparency.
    Input images: Image 1 is only a project style reference; Image 2 is only a reference for the existing environment pack's transparent upper-edge layer structure. Do not reproduce either scene.
    Primary request: an overhead canvas-shelter fringe for Tide Camp, a humid coastal ruin outpost.
    Scene/backdrop: isolated pale sailcloth awnings and short hanging ropes clipped to the upper frame edge, with a few oxidized-copper rings and tiny salt-worn vine leaves; this is a near foreground canopy, not a tent body.
    Subject: two partial canvas awning edges framing the upper corners, softly varied folds, clean readable silhouette, large central opening.
    Style/medium: charming softly painted pixel-art-inspired 2D game environment, clustered brush pixels, restrained detail; not 3D or photorealistic.
    Composition/framing: exact target 1920x540; composition is only the top 180px of a very wide landscape strip. All artwork must stay in rows y=0 through y=179. Every pixel at y>=180 is fully transparent. Anchor cloth and ropes to the top edge and let them hang only a short distance.
    Lighting/mood: soft humid daylight after rain.
    Color palette: pale wet canvas, sage and sea-glass teal, subtle oxidized copper.
    Constraints: genuine alpha transparency, no background plate or checkerboard; transparent below the top fringe. No people, characters, NPCs, monsters, text, symbols, signs, watermark, sky, cliffs, tower, furniture, floor, path, ground, platform or walkable terrain.

### env-ruins-root-sky-v1
File: prompts/env-ruins-root-sky-v1.prompt.txt

    Use case: stylized-concept
    Asset type: formal 2D side-view fantasy RPG parallax sky background, one landscape PNG layer.
    Input images: Image 1 is only a style reference for the project's softly painted, clustered game-background texture; do not copy its forest scene.
    Primary request: create the open sky layer above Root Causeway, transitioning inland from the coast toward ancient ruins overtaken by tree roots.
    Scene/backdrop: luminous humid sky, thin mist, pale distant limestone air and a few soft cloud banks visible through a broad opening above the forest canopy.
    Subject: only atmosphere and sky; no tree silhouettes or architecture.
    Style/medium: charming hand-painted pixel-art-inspired 2D game background, softly clustered brush pixels and calm atmospheric depth; not 3D, not photorealistic.
    Composition/framing: exact target 960x540 landscape 16:9, open brighter area toward the center and subtle humid haze across the width.
    Lighting/mood: filtered daylight after rain, tranquil but ancient.
    Color palette: pale limestone light, misty turquoise, blue-grey cloud shadows, very restrained oxidized copper.
    Constraints: opaque sky image; no transparency, text, signage or watermark. Keep this strictly a sky layer. Avoid cliffs, sea, shore, rocks, buildings, columns, roots, tree crowns, characters, NPCs, monsters, platforms, paths, ground or any walkable terrain.

### env-ruins-root-far-v1
File: prompts/env-ruins-root-far-v1.prompt.txt

    Use case: stylized-concept
    Asset type: formal 2D side-view fantasy RPG far-parallax scenery layer, PNG with true transparency.
    Input images: Image 1 is only a style reference for the project's softly painted, clustered game-background texture; do not copy its forest scene.
    Primary request: create distant scenery for Root Causeway, where ancient coastal ruins transition into a root-filled inland passage.
    Scene/backdrop: separate distant silhouettes of a massive old tree crown, looping and broken teal roots arching through the air as a background landmark, and several weathered white-stone column fragments; traces of coastal haze remain at the far edge.
    Subject: the root bridge landmark is distant scenery only: irregular tangled roots with a broken, uneven underside and visible gaps, clearly not a flat walkable bridge; scattered broken columns; no continuous ground.
    Style/medium: charming hand-painted pixel-art-inspired 2D game background, broad silhouettes, clustered brush pixels, mist-softened depth; not 3D, not photorealistic.
    Composition/framing: exact target 1440x540 landscape 8:3; transparent gaps between separated lower-half forms, high irregular crown silhouette, no full-width strip.
    Lighting/mood: humid daylight through old foliage after rain.
    Color palette: weathered pale limestone, deep sage and sea-glass teal roots, muted blue-grey mist, restrained oxidized copper.
    Constraints: request genuine transparent background and preserve alpha. No sky plate, no background fill, no flat horizontal top, no walkable ledge, platform, path, stairs, floor, road or ground plane. No characters, NPCs, monsters, text, UI, signage or watermark.

### env-ruins-root-mid-v1
File: prompts/env-ruins-root-mid-v1.prompt.txt

    Use case: stylized-concept
    Asset type: formal 2D side-view fantasy RPG near-overhead parallax tree-canopy layer, PNG with true transparency.
    Input images: Image 1 is only a project style reference; Image 2 is only a reference for the existing environment pack's transparent upper-edge layer structure. Do not reproduce either scene.
    Primary request: create the near foreground canopy for Root Causeway, a humid ancient ruin path under a vast tree crown.
    Scene/backdrop: isolated broad branches and knotted hanging roots attached to the top edge, dense but readable leaf clusters, a few broken pale-stone column-cap fragments caught high in the foliage; frame the upper corners without forming a ceiling across the full image.
    Subject: an irregular old tree crown with a few long root tendrils dropping from above.
    Style/medium: charming softly painted pixel-art-inspired 2D game environment, clustered brush pixels and clear silhouettes; not 3D or photorealistic.
    Composition/framing: exact target 1920x540; composition is only the top 180px of a very wide landscape strip. All artwork must stay in rows y=0 through y=179. Every pixel at y>=180 is fully transparent. Anchor the canopy to the top edge and keep the central opening generous.
    Lighting/mood: soft filtered humid daylight after rain.
    Color palette: deep sage and blue-green leaves, oxidized-copper shadows, pale limestone fragments, subtle teal.
    Constraints: genuine alpha transparency, no background plate or checkerboard; transparent below the canopy fringe. No characters, NPCs, monsters, text, symbols, signs, watermark, sky, cliffs, columns below the canopy, furniture, floor, path, ground, platform or walkable terrain.

### camp-mid-alpha-correction-1
File: prompts/camp-mid-alpha-correction-1.prompt.txt

    Use case: precise-object-edit
    Asset type: correction to a formal 2D game parallax layer.
    Input images: Image 1 is the edit target, the generated Tide Camp canvas-awning mid layer.
    Primary request: make only the required transparent-area correction while preserving the existing artwork and its composition.
    Constraints: keep the pale canvas awnings, ropes, copper rings, small leaves, colors, texture, lighting, and upper-edge placement unchanged. The final target canvas is 1920x540. Keep the awning fringe in the top 180 pixels only; every pixel at y>=180 must be fully transparent RGBA alpha 0. Shorten any long hanging strands naturally so they end before y=180. Preserve genuinely transparent pixels elsewhere; do not add a background plate, checkerboard, floor, platform, text, or new objects.

### root-mid-alpha-correction-1
File: prompts/root-mid-alpha-correction-1.prompt.txt

    Use case: precise-object-edit
    Asset type: correction to a formal 2D game parallax layer.
    Input images: Image 1 is the edit target, the generated Root Causeway tree-canopy mid layer.
    Primary request: make only the required transparent-area correction while preserving the existing artwork and its composition.
    Constraints: keep the old tree crown, branches, leaf clusters, hanging roots, and pale broken column-cap details, colors, texture, lighting, and upper-edge placement unchanged. The final target canvas is 1920x540. Recompose or shorten the hanging roots so all artwork stays within the top 180 pixels; every pixel at y>=180 must be fully transparent RGBA alpha 0. Preserve genuinely transparent pixels elsewhere; do not add a background plate, checkerboard, floor, platform, text, or new objects.

### camp-mid-alpha-correction-2
File: prompts/camp-mid-alpha-correction-2.prompt.txt

    Use case: precise-object-edit
    Asset type: final 1920x540 2D parallax layer for a side-view fantasy game.
    Input images: Image 1 is the edit target, a normalized Tide Camp canvas-awning layer.
    Primary request: keep the pale canvas awnings, ropes, copper rings, small leaves and wide upper-corner framing, but fit the entire artwork into the top band only.
    Constraints: The target image already has exact 1920x540 dimensions. Keep all visible art within rows y=0..179; remove every pixel, feather, shadow, or stray alpha below that line. Rows y=180..539 must be exactly transparent alpha 0. Shorten hanging ropes and canvas fringe cleanly to fit above y=180. Preserve the existing watercolor-pixel style and true RGBA alpha. Do not add any background fill, checkerboard, objects, text, floor, platform or walkable terrain.

### root-mid-alpha-correction-2
File: prompts/root-mid-alpha-correction-2.prompt.txt

    Use case: precise-object-edit
    Asset type: final 1920x540 2D parallax layer for a side-view fantasy game.
    Input images: Image 1 is the edit target, a normalized Root Causeway tree-canopy layer.
    Primary request: keep the old tree crown, broad branches, leaf clusters, hanging roots and pale broken column-cap accents, but fit the entire artwork into the top band only.
    Constraints: The target image already has exact 1920x540 dimensions. Keep all visible art within rows y=0..179; remove every pixel, feather, shadow, or stray alpha below that line. Rows y=180..539 must be exactly transparent alpha 0. Shorten the hanging roots cleanly to fit above y=180. Preserve the existing watercolor-pixel style and true RGBA alpha. Do not add any background fill, checkerboard, objects, text, floor, platform or walkable terrain.

### root-mid-silhouette-correction
File: prompts/root-mid-silhouette-correction.prompt.txt

    Use case: precise-object-edit
    Asset type: final 1920x540 near-overhead parallax layer for a side-view fantasy game.
    Input images: Image 1 is the edit target, the current Root Causeway tree-canopy layer with the correct transparent lower region.
    Primary request: revise only the canopy's lower silhouette so it ends naturally instead of as a flat horizontal clipped strip.
    Constraints: preserve the existing broad old branches, leaf clusters, root tendrils, pale broken column-cap accents, colors, texture, lighting, and upper-corner framing. Keep all visible artwork entirely within rows y=0..179, using a ragged organic contour of foliage and root tips that finishes above y=180. The target is 1920x540; every pixel at y>=180 must be fully transparent alpha 0. Rows y=180..539 must contain no color or alpha. Preserve true RGBA transparency, no background fill or checkerboard. Do not add text, characters, floor, platform, or walkable terrain.

### root-mid-recomposition
File: prompts/root-mid-recomposition.prompt.txt

    Use case: stylized-concept
    Asset type: formal near-overhead parallax tree-canopy layer for a side-view fantasy game, transparent PNG.
    Input images: Image 1 is a style reference for the softly painted pixel-art-inspired environment pack. Image 2 is only a reference for its wide top-edge layer structure. Do not copy either scene.
    Primary request: a very wide, shallow foreground fringe of the ancient tree crown over Root Causeway.
    Scene/backdrop: isolated broad branches and dense leaf clusters attached to the top edge, with a few short knotted root tips hanging down and tiny pale broken-column caps nested at the outer corners.
    Subject: an old sage-green canopy framing the upper edge; the lower contour must be naturally irregular with a large open center.
    Style/medium: charming 2D hand-painted pixel-art-inspired game background, readable clustered shapes and softly textured brush pixels, consistent with the style reference; not 3D or photorealistic.
    Composition/framing: exact intended canvas 1920x540. Treat the canvas as a screen-wide shallow strip: keep the canopy and every root tip within the top 150 pixels, never below y=150. All pixels from y=180 to the bottom must be fully transparent. The lower edge is a broken, uneven silhouette with gaps, not a straight horizontal band. Cover only the upper corners and top edge; leave most of the center open.
    Lighting/mood: soft filtered humid daylight after rain.
    Color palette: deep sage and sea-glass teal, warm bark, pale limestone, restrained oxidized copper.
    Constraints: genuine transparent background and alpha; no sky or filled backdrop, no checkerboard. No long hanging trunks or roots, no columns below the canopy, no characters, NPCs, monsters, text, signs, floor, path, platform, ground or walkable terrain.

