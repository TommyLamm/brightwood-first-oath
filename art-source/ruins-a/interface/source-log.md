# 遠古遺跡 A：介面圖像來源記錄

日期：2026-10-25。兩項成品均由內建 ImageGen 生成，作為正式介面素材；沒有使用 CLI、外部 API 或 SVG placeholder。完整 prompts 分別保存在 `prompts/item-moss-ceramic-v1.prompt.txt` 與 `prompts/region-ancient-ruins-map-v1.prompt.txt`。

## 參考縮圖

所有供審圖／生成參考的圖長邊不超過 1280px，以 JPEG 品質 72 存於 `references/`：

- `item-forest-seed-reference.jpg`：由 `public/assets/interface/item-forest-seed-v1.png` 縮放，物品 icon 色塊與輪廓參考。
- `sands-guide-style-reference.jpg`：由 `public/assets/actors/npcs/sands-guide-idle-v1.png` 縮放，點陣風格參考。
- `forest-far-style-reference.jpg`：由 `public/assets/environment/env-forest-far-v1.png` 縮圖，森林色彩參考。
- `region-map-style-reference.jpg`：由 `public/assets/interface/region-frost-isles-map-v1.png` 縮圖，區域地形豐富度參考。

## `item:moss-ceramic`

- Prompt：`prompts/item-moss-ceramic-v1.prompt.txt`（全文亦附於下方）。
- 工具：Codex 內建 ImageGen，要求透明背景；採用的生成原稿是 `raw/item-moss-ceramic-v1-generated.png`，原始工具輸出位於 `C:/Users/Tommy/.codex/generated_images/01a1711e-a25d-70a1-b37c-6ca7d5eb0de5/exec-9941f0e1-7f17-48a4-a531-c79cd06158ff.png`。
- 參考：`references/item-forest-seed-reference.jpg`、`references/sands-guide-style-reference.jpg`。
- 正式成品：`public/assets/interface/item-moss-ceramic-v1.png`，128×128 RGBA，含透明像素；runtime 顯示 32×32，manifest pivot `(0.5, 0.5)`。
- 審圖：`review/item-moss-ceramic-v1-review.jpg`。確認單一陶片、苔面及鐘形浮紋；未見文字或背景。

完整 prompt：

```text
Use case: stylized-concept
Asset type: 2D game inventory material icon, final canvas 128×128 PNG with real alpha; runtime display 32×32
Primary request: one small wet ceramic shard from an ancient ruin, a collectible item called moss-ceramic
Input images: Image 1 is an existing inventory item pixel-art style reference only; Image 2 is an existing NPC pixel-art style reference only. Do not include the referenced seed or NPC in the output.
Scene/backdrop: transparent background
Subject: a single broken piece of pale ivory-white pottery with rich green moss growing in the crack and along one edge; a small simple bell-shaped embossed motif is clearly visible on the ceramic face
Style/medium: cute classic 2D pixel-art game icon with a crisp dark outline, tactile hand-pixelled shading, readable silhouette and color treatment consistent with the references
Composition/framing: isolated side-view three-quarter angle; one complete shard centered and filling about 80% of the square, large simple shapes that remain legible at 32×32
Lighting/mood: soft cool wet highlights, calm ancient-fantasy collectible
Color palette: damp ivory, muted jade and moss green, a restrained warm stone shadow
Materials/textures: glazed chipped ceramic, subtle water sheen, tiny moss leaves, carved bell mark
Text (verbatim): none
Constraints: exactly one shard; actual transparent pixels outside the object; keep the bell motif as a simple pictorial emboss, not a letter or word
Avoid: extra items, characters, scenery, frame, labels, UI, watermark, checkerboard transparency preview, photorealism, 3D render, overly fine detail
```

## `region-ancient-ruins-map-v1.png`

- Prompt：`prompts/region-ancient-ruins-map-v1.prompt.txt`（全文亦附於下方）。
- 工具：Codex 內建 ImageGen，非透明背景；生成原稿為 `raw/region-ancient-ruins-map-v1-generated.png`，原始工具輸出位於 `C:/Users/Tommy/.codex/generated_images/01a1711e-a25d-70a1-b37c-6ca7d5eb0de5/exec-90b8c28d-e373-4a7e-805e-f1b7ec3b4b02.png`。
- 參考：`references/forest-far-style-reference.jpg`、`references/region-map-style-reference.jpg`。
- 正式成品：`public/assets/interface/region-ancient-ruins-map-v1.png`，960×540 RGB；區域圖由直接 URL 載入，不新增 manifest entry。UI 自行繪製節點 `(16,72)`、`(40,55)`。
- 審圖：`review/region-ancient-ruins-map-v1-review.jpg`。包含西南海岸營站、中左盤根石道與遠景封閉遺跡輪廓；沒有文字、可玩節點、圖標或 UI 路線。

完整 prompt：

```text
Use case: illustration-story
Asset type: 960×540 fantasy RPG region map background for UI; the game draws two real nodes at (16,72) and (40,55)
Primary request: a hand-painted fantasy parchment map of the ancient ruins coast, with damp white stone, teal-green roots and oxidized copper details
Input images: Image 1 is a forest environment palette/style reference only; Image 2 is an existing game region map reference for geographic richness and painterly game-map detail only. Do not include ice, snow, UI, or any symbols from either image.
Scene/backdrop: a wide, aged parchment chart viewed from above at a gentle isometric angle, showing a coastal ruin region
Subject: along the southwest coast, a small canvas expedition camp beside tide-worn steps and a broken coastal watchtower; across the center-left, an old stone causeway winding among thick green roots and several broken pillars; in the far distance, a faint dark silhouette of a sealed ruin enclosed by cliffs
Style/medium: richly hand-painted 2D fantasy map illustration on warm weathered parchment, soft brush texture and clear readable landforms, consistent with a charming classic RPG world map
Composition/framing: wide 16:9 landscape; keep the southwest camp and center-left root-stone causeway distinct; leave natural clear parchment/terrain around the upper-left and middle-left for later UI nodes; no cartographic overlays
Lighting/mood: cool damp coastal haze with subtle warm parchment light, mysterious but welcoming
Color palette: ivory limestone, muted teal water, moss and jade roots, restrained oxidized copper, parchment tan and soft slate shadows
Materials/textures: fibrous aged parchment, wet pale stone, tangled roots, worn canvas, sea haze
Text (verbatim): none
Constraints: background art only; do not draw playable nodes, routes, dotted paths, labels, lettering, symbols, icons, compass, legend, borders, or UI; preserve open regions where nodes can be added by the UI
Avoid: modern map conventions, text, readable marks, numbers, badges, quest markers, bright fantasy portals, oversized foreground props, photorealism, 3D rendering, snow/ice theme
```
