# Ruins A actor source log

日期：2026-10-25（香港時間）。全部圖片呼叫使用內建 ImageGen，`transparent_background=true`；未使用CLI/API。所有原始輸出保存在本目錄 `generated/`，所有prompt保存在本目錄文字檔。

NPC風格參考縮圖：`review/npc-style-refs.jpg`（keeper/healer，各取一格、合成中性底）；monster像素風格參考縮圖：`review/monster-style-ref.jpg`。所有審圖檔為中性底JPEG、q70、長邊不超過1280。

NPC最終檔採用ImageGen v2及 `normalize-npcs.py`，輸入兩格來源均為1774×887 RGBA，切成兩個887×887完整姿勢；以alpha>8主體bbox裁切並加3px邊緣，兩姿勢共用縮放係數，底部對齊，輸出192×96 RGBA。逐格檢查透明alpha、完整主體、閉嘴及小幅呼吸差異。

| ID / call | 工具輸出 | 原始檔 | Prompt | 參考 | 輸出 / 狀態 |
| --- | --- | --- | --- | --- | --- |
| ruins-moss-carapace idle row v1 / `exec-d929472e-1f46-47ad-ad0d-5990cbd84bd1` | built-in ImageGen | `generated/moss-carapace-idle-generated-v1.png` (2172×724 RGBA) | `moss-carapace-idle-prompt-call-v1.txt` | `profile-v2.png; public/assets/actors/monsters/snail-atlas-v2.png` | `—`；未採用：同一strip內有高alpha主體跨界連通，不可安全等分裁格。 |
| ruins-moss-carapace walk row v1 / `exec-c1eabf2d-6e84-4e14-be14-4cf83a451dfa` | built-in ImageGen | `generated/moss-carapace-walk-generated-v1.png` (2172×724 RGBA) | `moss-carapace-walk-prompt-call-v1.txt` | `profile-v2.png; public/assets/actors/monsters/snail-atlas-v2.png` | `—`；未採用：跨界高alpha主體互連及外側姿勢裁切。 |
| ruins-moss-carapace attack row v1 / `exec-89da230d-9ff4-46fe-b779-73a6bca398e4` | built-in ImageGen | `generated/moss-carapace-attack-generated-v1.png` (2172×724 RGBA) | `moss-carapace-attack-prompt-call-v1.txt` | `profile-v2.png; public/assets/actors/monsters/snail-atlas-v2.png` | `—`；未採用：未進runtime；保留原始動作提案供後續姿勢參考。 |
| ruins-moss-carapace hurt row v1 / `exec-2c3fa094-bed7-4f44-839b-3c212635b76d` | built-in ImageGen | `generated/moss-carapace-hurt-generated-v1.png` (2172×724 RGBA) | `moss-carapace-hurt-prompt-call-v1.txt` | `profile-v2.png; public/assets/actors/monsters/snail-atlas-v2.png` | `—`；未採用：未進runtime；保留原始動作提案供後續姿勢參考。 |
| ruins-moss-carapace dead row v1 / `exec-11c09c5c-a2ee-4687-aba1-f84a81d4a4af` | built-in ImageGen | `generated/moss-carapace-dead-generated-v1.png` (2172×724 RGBA) | `moss-carapace-dead-prompt-call-v1.txt` | `profile-v2.png; public/assets/actors/monsters/snail-atlas-v2.png` | `—`；未採用：未進runtime；保留原始動作提案供後續姿勢參考。 |
| ruins-moss-carapace idle row v2 / `exec-f6d5576a-28fe-452e-9874-03bb2da6e1b6` | built-in ImageGen | `generated/moss-carapace-idle-generated-v2.png` (2172×724 RGBA) | `moss-carapace-idle-prompt-v2.txt` | `profile-v2.png; public/assets/actors/monsters/snail-atlas-v2.png` | `—`；未採用：外側alpha超出strip格範圍，跨格主體不可安全切分。 |
| ruins-archivist NPC v1 / `exec-ad48c90e-3f96-4166-87f9-baa6ef2b3ca8` | built-in ImageGen | `generated/npc-ruins-archivist-generated-v1.png` (1774×887 RGBA) | `npc-ruins-archivist-prompt.txt` | `public/assets/actors/npcs/keeper-idle-v1.png; public/assets/actors/npcs/healer-idle-v1.png` | `—`；未採用：第二idle pose張嘴，350ms循環呈現說話感。 |
| ruins-medic NPC v1 / `exec-f52e3441-86f7-4fb8-9fb3-fa9b111d58d1` | built-in ImageGen | `generated/npc-ruins-medic-generated-v1.png` (1774×887 RGBA) | `npc-ruins-medic-prompt.txt` | `public/assets/actors/npcs/keeper-idle-v1.png; public/assets/actors/npcs/healer-idle-v1.png` | `—`；未採用：第二idle pose張嘴並抬手，超出指定的微幅呼吸。 |
| ruins-archivist NPC v2 (final) / `exec-79af0ace-47e2-4143-935b-3087ef723cc3` | built-in ImageGen | `generated/npc-ruins-archivist-generated-v2.png` (1774×887→192×96 RGBA) | `npc-ruins-archivist-prompt-v2.txt` | `npc v1 identity; keeper-idle-v1.png; healer-idle-v1.png` | `public/assets/actors/npc-ruins-archivist-v1.png`；正式NPC素材：嘴閉合，雙格差異為細微呼吸。 |
| ruins-medic NPC v2 (final) / `exec-6e1f0943-e265-4d30-9ef2-49f0fb2f54cf` | built-in ImageGen | `generated/npc-ruins-medic-generated-v2.png` (1774×887→192×96 RGBA) | `npc-ruins-medic-prompt-v2.txt` | `npc v1 identity; keeper-idle-v1.png; healer-idle-v1.png` | `public/assets/actors/npc-ruins-medic-v1.png`；正式NPC素材：嘴閉合，雙格差異為細微呼吸。 |
| moss-carapace idle anchor v1 / `exec-ebba0ea6-dc9f-4c89-8e38-25d3b4cc588c` | built-in ImageGen | `generated/moss-carapace-idle-anchor-generated-v1.png` (1254×1254→96×96 RGBA) | `moss-carapace-idle-anchor-prompt.txt` | `profile-v2.png; public/assets/actors/monsters/snail-atlas-v2.png` | `moss-carapace-idle-anchor-v1-mirrored-right.png`；素材身份參考：原始輸出朝左，按normalize-moss-anchor.py水平鏡像後供新單幀代理共用，不是runtime。 |
| moss-carapace idle anchor orientation correction v2 (not used) / `exec-971f3b82-7abb-4b90-bc44-7a53a9492b11` | built-in ImageGen | `generated/moss-carapace-idle-anchor-generated-v2-right-orientation.png` (1254×1254 RGBA) | `moss-carapace-idle-anchor-prompt-v2.txt` | `moss-carapace-idle-anchor-generated-v1.png` | `—`；保留來源供追溯；父代理指定以v1確定性鏡像為正式anchor，因此不採用此變體。 |

## 完整生成prompt（逐檔原文）

以下prompt檔保存每次呼叫的完整文字，包含已拒絕原稿與採用版本；重組代理可按表格狀態挑選。

### ruins-moss-carapace idle row v1 — `moss-carapace-idle-prompt-call-v1.txt`

```text
Use case: stylized-concept
Asset type: one transparent sprite-action row for a 2D RPG runtime atlas
Input images: Image 1 is the approved moss-carapace design reference only. Image 2 is an existing project monster used only for pixel-art style and scale; do not copy its snail design.
Primary request: Create a single horizontal strip of exactly six equally sized frame slots for the idle animation of the same squat ancient crawler in Image 1. Keep its broken pale ceramic carapace, subtle bell engraving, small moss patches, and a few fine root feelers. Show only two genuine idle poses: frame 1 settled, frame 2 a very small breathing lift with a slight feeler movement. Slots 3–6 must be exact repeats of frame 2.
Style/medium: crisp pixel-art RPG sprite matching Image 2's chunky clean pixel clusters and limited palette, with readable solid shapes and no painterly haze.
Composition/framing: one row, six equal-width square frame slots laid out left to right; the complete creature is fully inside every slot, at identical scale and bottom pivot, facing right. Keep each silhouette comfortably inset from all slot edges with transparent gaps. Each frame must depict one complete separate creature; do not draw borders or grid lines.
Color palette: weathered ivory ceramic, muted stone-gray, jade and olive moss, restrained warm brown root details.
Constraints: transparent background and genuine alpha; keep the body low and squat; no cast shadow; no movement trail; no extra objects. Make the two idle poses subtly different, and duplicate only unused slots 3–6 exactly.
Avoid: extra creature copies beyond the six slots, text, symbols, UI, watermark, background, checkerboard, cell overlap, cropped body parts, detached particles, glow, blur, gradients, 3D rendering.
The requested row is an isolated horizontal animation strip, not a character concept sheet.
```

### ruins-moss-carapace walk row v1 — `moss-carapace-walk-prompt-call-v1.txt`

```text
Use case: stylized-concept
Asset type: one transparent sprite-action row for a 2D RPG runtime atlas
Input images: Image 1 is the approved moss-carapace design reference only. Image 2 is an existing project monster used only for pixel-art style and scale; do not copy its snail design.
Primary request: Create a single horizontal strip of exactly six equally sized frame slots for the walk animation of the same squat ancient crawler in Image 1. Preserve the broken pale ceramic carapace with a subtle bell engraving, moss in the cracks, and a few fine root feelers. Show six genuinely distinct sequential slow-crawl poses: alternate the short legs, body bob, and feelers naturally through one readable locomotion cycle; the final pose should flow back to the first.
Style/medium: crisp pixel-art RPG sprite matching Image 2's chunky clean pixel clusters and limited palette, with readable solid shapes and no painterly haze.
Composition/framing: one row, six equal-width square frame slots laid out left to right; the complete creature is fully inside every slot, at identical scale and bottom pivot, facing right. Keep each silhouette comfortably inset from all slot edges with transparent gaps. Each frame must depict one complete separate creature; do not draw borders or grid lines.
Color palette: weathered ivory ceramic, muted stone-gray, jade and olive moss, restrained warm brown root details.
Constraints: transparent background and genuine alpha; body remains low and squat; all six frames are distinct real crawl poses; no cast shadow; no movement trail; no extra objects.
Avoid: duplicate poses, extra creature copies, text, symbols, UI, watermark, background, checkerboard, cell overlap, cropped body parts, detached particles, glow, blur, gradients, 3D rendering.
The requested row is an isolated horizontal animation strip, not a character concept sheet.
```

### ruins-moss-carapace attack row v1 — `moss-carapace-attack-prompt-call-v1.txt`

```text
Use case: stylized-concept
Asset type: one transparent sprite-action row for a 2D RPG runtime atlas
Input images: Image 1 is the approved moss-carapace design reference only. Image 2 is an existing project monster used only for pixel-art style and scale; do not copy its snail design.
Primary request: Create a single horizontal strip of exactly six equally sized frame slots for the bite attack of the same squat ancient crawler in Image 1. Preserve its broken pale ceramic shell, subtle bell engraving, moss patches and fine root feelers. The first four slots are distinct action poses in this order: 1) brace low and draw back as a windup, 2) lean forward and gather force, 3) make one sharp forward bite with the front root-claws extended, 4) return to a low settled recovery pose. Slots 5–6 must be exact repeats of pose 4.
Style/medium: crisp pixel-art RPG sprite matching Image 2's chunky clean pixel clusters and limited palette, with readable solid shapes and no painterly haze.
Composition/framing: one row, six equal-width square frame slots laid out left to right; the complete creature is fully inside every slot, at identical scale and bottom pivot, facing right. Keep each silhouette comfortably inset from all slot edges with transparent gaps. Each frame must depict one complete separate creature; do not draw borders or grid lines.
Color palette: weathered ivory ceramic, muted stone-gray, jade and olive moss, restrained warm brown root details.
Constraints: transparent background and genuine alpha; exactly one bite, clearly readable as a creature pose, no projectile, no drawn hit effect, no cast shadow. Duplicate only unused slots 5–6 exactly. All poses keep the same facing and body identity.
Avoid: extra attack or weapon, effect lines, extra creature copies, text, symbols, UI, watermark, background, checkerboard, cell overlap, cropped body parts, detached particles, glow, blur, gradients, 3D rendering.
The requested row is an isolated horizontal animation strip, not a character concept sheet.
```

### ruins-moss-carapace hurt row v1 — `moss-carapace-hurt-prompt-call-v1.txt`

```text
Use case: stylized-concept
Asset type: one transparent sprite-action row for a 2D RPG runtime atlas
Input images: Image 1 is the approved moss-carapace design reference only. Image 2 is an existing project monster used only for pixel-art style and scale; do not copy its snail design.
Primary request: Create a single horizontal strip of exactly six equally sized frame slots for the hurt animation of the same squat ancient crawler in Image 1. Preserve the shell silhouette, bell engraving, moss and root feelers. Show two distinct brief recoil poses: frame 1 flinches backward and tucks the front legs; frame 2 settles into a low recoiled crouch. Slots 3–6 must be exact repeats of frame 2.
Style/medium: crisp pixel-art RPG sprite matching Image 2's chunky clean pixel clusters and limited palette, with readable solid shapes and no painterly haze.
Composition/framing: one row, six equal-width square frame slots laid out left to right; the complete creature is fully inside every slot, at identical scale and bottom pivot, facing right. Keep each silhouette comfortably inset from all slot edges with transparent gaps. Each frame must depict one complete separate creature; do not draw borders or grid lines.
Color palette: weathered ivory ceramic, muted stone-gray, jade and olive moss, restrained warm brown root details.
Constraints: transparent background and genuine alpha; no visible injury or gore; no cast shadow; no incoming projectile. Duplicate only unused slots 3–6 exactly.
Avoid: extra creature copies, text, symbols, UI, watermark, background, checkerboard, cell overlap, cropped body parts, detached particles, glow, blur, gradients, 3D rendering.
The requested row is an isolated horizontal animation strip, not a character concept sheet.
```

### ruins-moss-carapace dead row v1 — `moss-carapace-dead-prompt-call-v1.txt`

```text
Use case: stylized-concept
Asset type: one transparent sprite-action row for a 2D RPG runtime atlas
Input images: Image 1 is the approved moss-carapace design reference only. Image 2 is an existing project monster used only for pixel-art style and scale; do not copy its snail design.
Primary request: Create a single horizontal strip of exactly six equally sized frame slots for the defeat animation of the same squat ancient crawler in Image 1. Preserve its broken pale ceramic carapace, bell engraving, moss patches and root feelers. The first four slots show a readable progressive non-violent collapse: 1) begin to buckle, 2) legs give way and shell dips, 3) settle onto its side, 4) lie still in a low final pose. Slots 5–6 must be exact repeats of pose 4.
Style/medium: crisp pixel-art RPG sprite matching Image 2's chunky clean pixel clusters and limited palette, with readable solid shapes and no painterly haze.
Composition/framing: one row, six equal-width square frame slots laid out left to right; the complete creature is fully inside every slot, at identical scale and bottom pivot, facing right. Keep each silhouette comfortably inset from all slot edges with transparent gaps. Each frame must depict one complete separate creature; do not draw borders or grid lines.
Color palette: weathered ivory ceramic, muted stone-gray, jade and olive moss, restrained warm brown root details.
Constraints: transparent background and genuine alpha; no gore, debris burst or cast shadow; duplicate only unused slots 5–6 exactly. All body parts remain unbroken and visible.
Avoid: extra creature copies, text, symbols, UI, watermark, background, checkerboard, cell overlap, cropped body parts, detached particles, glow, blur, gradients, 3D rendering.
The requested row is an isolated horizontal animation strip, not a character concept sheet.
```

### ruins-moss-carapace idle row v2 — `moss-carapace-idle-prompt-v2.txt`

```text
Use case: stylized-concept
Asset type: one transparent sprite-action row for a 2D RPG runtime atlas
Input images: Image 1 is the approved moss-carapace design reference only. Image 2 is an existing project monster used only for pixel-art style and scale; do not copy its snail design.
Primary request: Create a single horizontal strip of exactly six equally sized frame slots for the idle animation of the same squat ancient crawler in Image 1. Keep its broken pale ceramic carapace, subtle bell engraving, small moss patches, and a few fine root feelers. Show only two genuine idle poses: frame 1 settled, frame 2 a very small breathing lift with a slight feeler movement. Slots 3–6 must be exact repeats of frame 2.
Style/medium: crisp pixel-art RPG sprite matching Image 2's chunky clean pixel clusters and limited palette, with readable solid shapes and no painterly haze.
Composition/framing: one row, six equal-width square frame slots laid out left to right; the complete creature is fully inside every slot, at identical scale and bottom pivot, facing right. Keep each silhouette comfortably inset from all slot edges with transparent gaps. Each frame must depict one complete separate creature; do not draw borders or grid lines.
Color palette: weathered ivory ceramic, muted stone-gray, jade and olive moss, restrained warm brown root details.
Constraints: transparent background and genuine alpha; keep the body low and squat; no cast shadow; no movement trail; no extra objects. Make the two idle poses subtly different, and duplicate only unused slots 3–6 exactly.
Avoid: extra creature copies beyond the six slots, text, symbols, UI, watermark, background, checkerboard, cell overlap, cropped body parts, detached particles, glow, blur, gradients, 3D rendering.

Critical frame-spacing requirement: use six equal horizontal cells, but keep the complete character small inside each cell, occupying no more than 55% of the cell width and 35% of its height. Center each silhouette exactly in its own cell, align all feet to one shared baseline, and leave a wide fully transparent gap on both sides of every pose. No alpha pixels, feelers, toes, strokes, or highlights may touch a slot boundary or enter the gap between slots. This is a small in-game sprite strip with large transparent margins, not enlarged concept art. Keep the identical six-slot layout; do not overlap or connect neighboring frames.
```

### ruins-archivist NPC v1 — `npc-ruins-archivist-prompt.txt`

```text
Use case: stylized-concept
Asset type: transparent two-frame NPC idle sprite strip for a 2D RPG
Input images: Image 1 and Image 2 are existing project NPCs used only as style and scale references; do not copy their characters or outfits.
Primary request: Create a new keeper and archivist named Zhiheng: a gentle young adult researcher with short dark hair, a clean pale-stone white outfit with restrained teal-green accents, a small notebook and a compact tool for studying carved inscriptions. Show the same character in two subtly different idle breathing poses, with a very small hand/notebook and shoulder movement.
Style/medium: match the existing cute big-head side-view RPG pixel sprite style and clear silhouette of the reference NPCs; crisp hand-placed-looking pixel clusters and restrained shading, not a 3D render.
Composition/framing: exactly two equal square frames arranged left to right in one row, full body visible, facing right, same scale and baseline, both frames isolated and complete. Preserve generous transparent padding; no frame boundary lines.
Color palette: warm ivory and pale stone, muted sea-green/teal trim, dark natural hair, restrained brown leather notebook/tool accents.
Constraints: genuine transparent alpha; keep the figure recognizable at 96x96; just one character per frame; keep notebook and inscription tool small and clearly non-weapon-like; no scene backdrop.
Avoid: weapons, armor, staff, speech bubbles, readable marks, text, labels, logos, watermark, UI, checkerboard, background, floor shadow, cropped feet or head, extra people, glow, blur, gradients, 3D rendering.
```

### ruins-medic NPC v1 — `npc-ruins-medic-prompt.txt`

```text
Use case: stylized-concept
Asset type: transparent two-frame NPC idle sprite strip for a 2D RPG
Input images: Image 1 and Image 2 are existing project NPCs used only as style and scale references; do not copy their characters or outfits.
Primary request: Create a new camp medic named Qinghe: a kind young adult healer in a simple sea-green and white field tunic, with a compact medicine satchel and one small visible herb pouch or vial. Keep the outline clean and distinct from the archivist reference. Show the same character in two subtly different idle breathing poses, with a small shoulder and hand movement while resting.
Style/medium: match the existing cute big-head side-view RPG pixel sprite style and clear silhouette of the reference NPCs; crisp hand-placed-looking pixel clusters and restrained shading, not a 3D render.
Composition/framing: exactly two equal square frames arranged left to right in one row, full body visible, facing right, same scale and baseline, both frames isolated and complete. Preserve generous transparent padding; no frame boundary lines.
Color palette: muted sea-green and teal, clean warm white cloth, natural dark hair, small restrained leather-brown satchel details.
Constraints: genuine transparent alpha; keep the figure recognizable at 96x96; exactly one character per frame; medicine satchel and herb pouch/vial must read as healer supplies; no scene backdrop.
Avoid: weapons, armor, staff, readable marks, text, labels, logos, watermark, UI, checkerboard, background, floor shadow, cropped feet or head, extra people, glow, blur, gradients, 3D rendering.
```

### ruins-archivist NPC v2 (final) — `npc-ruins-archivist-prompt-v2.txt`

```text
Use case: stylized-concept
Asset type: transparent two-frame NPC idle sprite strip for a 2D RPG
Input images: Image 1 is the current Zhiheng archivist sprite and is the identity reference: preserve the same short dark hair, gentle face, ivory and teal researcher robe, notebook, inscription stylus, small tool pouch, proportions and side-facing direction. Images 2 and 3 are existing project NPCs used only for pixel style and scale.
Primary request: Recreate the same archivist in exactly two idle frames with a closed, relaxed mouth in both frames and the same small calm smile. Frame 1 is settled; frame 2 shows only a tiny breath: shoulders and upper robe rise a few pixels, with no hand gesture. This is a quiet resting idle, not a talking animation.
Style/medium: match the existing cute big-head side-view RPG pixel sprite style of Images 2 and 3, with crisp restrained clusters and readable silhouette.
Composition/framing: exactly two equal square frames in one horizontal row; same complete full-body figure, same scale and bottom baseline, facing right. Keep each pose fully isolated with transparent space around it. No frame lines.
Constraints: transparent alpha; preserve the first image's design, no speech or talking; notebook remains a notebook and stylus remains a small writing tool, not a weapon; only the shoulder/robe breath changes between frames.
Avoid: open mouth, changing expression, arm raise, pointing, extra tools, staff or weapon, background, floor shadow, text, marks, UI, watermark, checkerboard, blur, 3D rendering.
```

### ruins-medic NPC v2 (final) — `npc-ruins-medic-prompt-v2.txt`

```text
Use case: stylized-concept
Asset type: transparent two-frame NPC idle sprite strip for a 2D RPG
Input images: Image 1 is the current Qinghe medic sprite and is the identity reference: preserve the same young woman, tied dark hair, sea-green and white healer tunic, medicine satchel, herb pouch, small vial, proportions and side-facing direction. Images 2 and 3 are existing project NPCs used only for pixel style and scale.
Primary request: Recreate the same medic in exactly two idle frames with a closed, relaxed mouth in both frames and the same gentle expression. Frame 1 is settled; frame 2 shows only a tiny breath: shoulders and upper robe rise a few pixels, with both hands and arms staying in the same resting positions. This is a quiet resting idle, not a talking or greeting animation.
Style/medium: match the existing cute big-head side-view RPG pixel sprite style of Images 2 and 3, with crisp restrained clusters and readable silhouette.
Composition/framing: exactly two equal square frames in one horizontal row; same complete full-body figure, same scale and bottom baseline, facing right. Keep each pose fully isolated with transparent space around it. No frame lines.
Constraints: transparent alpha; preserve the first image's design; medicine satchel, herb pouch and vial stay in place in both poses; only the shoulder/robe breath changes between frames.
Avoid: open mouth, changing expression, lifted hand, extra gestures, weapons, staff, background, floor shadow, text, labels, UI, watermark, checkerboard, blur, 3D rendering.
```

### moss-carapace idle anchor v1 — `moss-carapace-idle-anchor-prompt.txt`

```text
Use case: stylized-concept
Asset type: one transparent single-frame monster sprite design anchor for a 2D RPG
Input images: Image 1 is the approved moss-carapace creature design reference. Image 2 is an existing project monster used only for crisp pixel-art style and scale; do not copy the snail design.
Primary request: Create one complete neutral idle sprite of the same squat ancient crawler: a broken pale ceramic shell with a subtle engraved bell motif, small moss patches in cracks, a few fine root feelers, and short segmented legs. It is low to the ground, calm and alert, and faces right.
Style/medium: clean 2D pixel-art game sprite with chunky readable clusters, limited palette and sharp sprite edges, consistent with Image 2; not a painterly concept sheet or 3D render.
Composition/framing: a single character only on a square transparent canvas, full silhouette visible, bottom-centered pivot, with enough empty margin around every root, leg, feeler and shell edge. Make it suitable to normalize to a 96x96 runtime frame; the visual body should be squat and low, not enlarged to fill the whole canvas.
Color palette: weathered ivory ceramic, muted stone gray, moss green and olive, restrained warm brown root details.
Constraints: genuine transparent alpha, no cast shadow; preserve all body parts; no additional frames, no sheet, no cell grid, no environment.
Avoid: text, labels, symbols, watermark, UI, checkerboard, background, detached effects, glow, blur, gradients, cropping, extra creatures, weapons, 3D rendering.
```

### moss-carapace idle anchor orientation correction v2 (not used) — `moss-carapace-idle-anchor-prompt-v2.txt`

```text
Use case: style-transfer
Asset type: one transparent idle-sprite identity anchor for a 2D RPG
Input images: Image 1 is the generated moss-carapace sprite identity reference.
Primary request: Keep the same single complete ancient crawler, its pixel-art palette, broken pale ceramic shell with subtle bell engraving, moss patches, root feelers and low segmented legs. Change only its horizontal facing direction so the front pincers and feelers clearly point to the RIGHT, with the decorated shell body trailing to the LEFT. This is a horizontal orientation correction, not a new character design.
Style/medium: preserve Image 1's crisp pixel-art sprite look and hard clean edges.
Composition/framing: one full-body side-view creature only on a square transparent canvas, no sheet, no second pose, centered with complete feet, shell and roots visible; bottom-centered pivot; leave transparent padding around the character.
Constraints: genuinely transparent background, no shadow; keep all body parts intact and in the same pose. The front end must be visibly on the right.
Avoid: left-facing creature, extra frames, other creatures, text, symbols, watermark, background, checkerboard, blur, glow, cropping, 3D rendering.
```

## 確定性處理與驗證

- `normalize-npcs.py`：NPC最終輸出檔為`public/assets/actors/npc-ruins-archivist-v1.png`及`npc-ruins-medic-v1.png`；兩者均192×96 RGBA、alpha範圍0–255，來源兩格完整且內縮，最終兩格各自有明確主體。
- `normalize-moss-anchor.py`：用alpha>8 bbox `(50,477)-(1203,1073)`及2px邊界裁切，等比縮放置於96×96底pivot畫布，並水平鏡像；映射輸出`moss-carapace-idle-anchor-v1-mirrored-right.png`。
- Monster各列strip v1（2172×724）與idle strip v2經alpha邊界／連通主體檢查及中性底局部縮圖審視，未直接切格；至少walk row有高alpha跨格與主連通塊跨多個姿勢，外側主體亦觸及畫布邊緣。所有不合格原稿只留source，不納入public或manifest。
- 目前`public/assets/actors/manifest.json`只新增兩個NPC image entries及其idle animations；苔陶蟲尚未有runtime PNG或manifest entry，交由整合代理完成完整6×5圖集。
