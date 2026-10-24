# Sunwell Sentinel attack poses source v1

Generated with the built-in ImageGen tool using transparent_background: true. The accepted Sunwell Sentinel identity raw image was the only visual reference; it was used for character identity, facing, palette, and pixel finish.

Original ImageGen output: C:\Users\Tommy\.codex\generated_images\01a16c63-c877-72d3-858c-feab1a9b2887\exec-86d60d0c-0aa6-468a-8d7e-044201cc2c24.png
Preserved raw source: sunwell-sentinel-attack-raw-v1.png
SHA-256: B11C4A121902558F9408B611BB92F57CB52D9F02C74F8950A523B53E7905BA0F
Raw PNG: 1296×1213 RGBA; alpha range 0–255; alpha bounds (0,17,1284,1185). The preserved source is byte-identical to the original ImageGen output.

Identity reference: C:\Users\Tommy\Desktop\brightwood-first-oath\.worktrees\sentinel-actor-art\art-source\expansion-sands\sentinel\actor\sunwell-sentinel-identity-raw-v1.png
Reference SHA-256: B0AF84337881A9150F728D839C34EBCEF885C8A1B4B9F6F3209485C9F5BD2D45

The four frames correspond to attack poses 6–9 in row-major order: low wind-up, fists raised high, forward low double-fist smash, and recovery. The intended attack timing is 900 ms wind-up, 100 ms active, and 850 ms recovery. The shared actor contract is a 384×384 atlas with 96×96 cells, 192×192 display, 72×84 collision, and baseline y=94. These files are pose sources and previews for the actor owner to assemble into the final atlas.

## Exact ImageGen prompt

    Make a single transparent-background 2×2 contact sheet of FOUR separate full-body pixel-art sprites. The four equal frame areas are top-left, top-right, bottom-left, bottom-right, in that order. Keep a plainly visible transparent gutter between every pair: the middle vertical 10% of the canvas and middle horizontal 8% of the canvas must contain no character pixels. Each character stays completely inside its own quadrant and never touches or overlaps another character. Leave margin around every silhouette.

    Use the attached accepted Sunwell Sentinel identity image as the identity reference only. Preserve the same compact right-facing sandstone idol, broad block torso, two enormous stone fists, short legs, solid turquoise chest core, sandstone-gold etched markings, and dark umber outlines. Keep the accepted warm palette and recognizable face. Render crisp low-resolution pixel art: hard-edged clusters, clean limited color ramps, simple readable facets, no painterly finish, gradients, antialiasing, or surface noise. Match the proportions and design language of the reference sprite at game size.

    Each sprite should be about 76% of its quadrant's width and 82% of its quadrant's height, so there is abundant transparent separation. Use the same apparent body scale in all four frames. Top-row feet share one baseline at 46% of the total canvas height; bottom-row feet share a baseline at 96% of canvas height. Keep body movement pose-driven, not zoomed or perspective-scaled.

    Pose order:
    1 top-left: low wind-up start, knees and torso sink slightly, both large fists held low beside and slightly behind the body.
    2 top-right: both fists lifted overhead in a high wind-up, elbows bent, body upright, feet planted.
    3 bottom-left: active low double-fist slam, strong forward lean to the right, fists thrust down and forward close to the feet.
    4 bottom-right: recovery, fists pulled back from the strike and torso rising toward the accepted neutral stance.

    Only the four stone characters on fully transparent pixels. No background, ground, floor, shadows, dust, rubble, cracks, impacts, shockwaves, particles, glow, aura, weapons, shields, text, labels, frames, or extra objects. Keep generous blank transparency between all four silhouettes.

## Pose crops

export_sunwell_sentinel_attack_v1.py preserves the complete raw RGBA source, extracts each listed source rectangle without altering its pixels, and creates the 96px contact preview using one shared nearest-neighbor scale. It does not draw, recolor, remove backgrounds, threshold alpha, or repair edges. Tight crop rectangles use the alpha≥8 bounds plus 8 source pixels of transparent margin.

- Pose 6, low wind-up: crop (46,155,623,614), 577×459 RGBA. sunwell-sentinel-attack-06-windup-low-crop-v1.png, SHA-256 9781A1B67D30F884D29A5E89609DF9F258E81AB5BC68C1AD252D3A4C6ACDCB4B.
- Pose 7, fists high: crop (747,32,1236,614), 489×582 RGBA. sunwell-sentinel-attack-07-fists-high-crop-v1.png, SHA-256 566AB7B8886A8E435FA113E76C0E89E104C6F01CC34C9E982E2154184E6C1107.
- Pose 8, low smash: crop (65,766,674,1182), 609×416 RGBA. sunwell-sentinel-attack-08-low-smash-crop-v1.png, SHA-256 7CA2A23840AC49AF565CBF26478E013CBB93F630813593C0B14882E143E76DBA.
- Pose 9, recovery: crop (714,696,1289,1183), 575×487 RGBA. sunwell-sentinel-attack-09-recover-crop-v1.png, SHA-256 E0691B73EDC9A8BCC545CB9885398A2745FDCC30CAE81061C1C7E35C6E741366.

The four source crops remain at the generated source scale for core-based alignment by the actor owner. Their turquoise chest-core component bounds at alpha/color threshold used for inspection are approximately 54×60, 53×61, 50×57, and 53×60 raw pixels, respectively. The actor owner should set one shared final scale against the accepted identity chest core and preserve baseline y=94 rather than fitting each pose to its silhouette bounds.

## 96px contact previews

The preview export uses one common scale of 96/648 source pixels for all four crops, nearest-neighbor resampling, horizontal centering, and a shared local foot baseline at y=94. It is a visual contact preview, not the final actor atlas.

- sunwell-sentinel-attack-06-windup-low-preview-96px-v1.png, 96×96 RGBA, SHA-256 15C458144CA191D9F9EBB1BC9B216B92FE208D92AC2DA20057A7EB6D8B7FC412.
- sunwell-sentinel-attack-07-fists-high-preview-96px-v1.png, 96×96 RGBA, SHA-256 BD22EC2A5E2398B800AD59C3C2C841DF59485D381B31F2FCA82A779475A2113D.
- sunwell-sentinel-attack-08-low-smash-preview-96px-v1.png, 96×96 RGBA, SHA-256 D8B1DF7A6C4DC97692CB45B40B1F9CA8C0EFDAE00F947714B938B2C6EC542987.
- sunwell-sentinel-attack-09-recover-preview-96px-v1.png, 96×96 RGBA, SHA-256 3EE2062AB22403E2D2772EE0B2D31D886C5BF5C7C407DB232B2E2A657502E583.
- Four-frame horizontal contact strip: sunwell-sentinel-attack-poses-preview-384x96-v1.png, 384×96 RGBA, SHA-256 C4CFC45065604B955CDC547C5F47DFF5606EC88D9085687C1369AE8037BFD27.

The preview crop/scale/placement is reproducible by running export_sunwell_sentinel_attack_v1.py from this directory.
Crop boxes use image-local (left, top, right, bottom) coordinates with right and bottom exclusive.
