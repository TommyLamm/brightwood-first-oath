# 包 A 苔陶蟲圖集組裝交接

日期：2026-10-25（香港時間）。狀態：runtime 圖集與 manifest 已完成；待主代理檢查 loader 引用並執行指定的獨立 build。

## 成品

- `public/assets/actors/monster-ruins-moss-carapace.png`：576×480 RGBA，6 欄×5 列，每格 96×96。
- `public/assets/actors/manifest.json` 只追加 `actor:ruins-moss-carapace` image 與五個 `ruins-moss-carapace:{idle,walk,attack,hurt,dead}` 動畫；既有 image／animation 陣列項目逐項保持原序及內容。
- 圖片 manifest 使用相對 URL `assets/actors/monster-ruins-moss-carapace.png`，display 96×96、pivot (0.5, 1)。

## 動畫與格位

| 狀態 | frames | 每格毫秒 | loop |
| --- | --- | --- | --- |
| idle | 0–1 | 200, 200 | 是 |
| walk | 6–11 | 120 × 6 | 是 |
| attack | 12–15 | 275, 275, 80, 770 | 否 |
| hurt | 18–19 | 100, 100 | 否 |
| dead | 24–27 | 100 × 4 | 否 |

Unused 格位原像素複製來源：2–5←1、16–17←15、20–23←19、28–29←27。腳本逐格比較 atlas crop 與對應 normalized source 的 RGBA bytes，確認完全相同。

## 素材來源與視覺檢查

- 共同身份錨點：`art-source/ruins-a/actors/moss-carapace-idle-anchor-v1-mirrored-right.png`。
- Idle／walk 來源及精確 prompt／輸出對照：`plan/reports/ruins-a-motion-frames.md`、`art-source/ruins-a/motion-frames/source-log.md`。
- Attack／hurt／dead 來源及精確 prompt／輸出對照：`plan/reports/ruins-a-action-frames.md`、`art-source/ruins-a/action-frames/source-log.md`。最終 source log 記錄 10/10 `savedPath`／`revisedPrompt` 映射。
- 單格來源路徑、SHA-256、pixel SHA-256、alpha bounds 與 atlas cell mapping：`art-source/ruins-a/assembly/metadata.json`。完整來源與被拒絕的舊圖集留在 `art-source/ruins-a/`，未移除或提升為 runtime。
- 總覽審圖：`art-source/ruins-a/assembly/moss-carapace-contact-sheet.jpg`，中性底 JPEG q70，768×610。最終素材更新後重新組圖並再次審視。18 個有效姿勢均完整、朝右、尺度與腳底基準一致；walk 六格和 attack 四格均有可見差異，dead 四格保持不透明並依序倒下至靜止。透明邊距每側至少 3px。

## 驗證

- `python art-source/ruins-a/assembly/assemble_moss_carapace.py --commit-runtime`：18 張來源均為獨立 96×96 RGBA PNG；依 alpha>0 驗證四側透明邊距至少 3px；禁止 pixel-identical 姿勢；建立 576×480 runtime atlas 並核對每個 cell 的精確來源像素。
- 同一腳本的 manifest checker 通過：全 manifest image／animation key 無重複；影像 key、相對 URL、格數、顯示尺寸與 pivot 正確；五個動畫的 frames、frameMs、loop 精確符合規格；`animationConformsToUse` 全數通過。
- 音訊生成器未修改（`git diff --quiet -- tools/audio/generate-audio.mjs` 通過）。本代理未執行 browser、build、typecheck 或遊戲測試；由主代理完成 loader 引用檢查與一次獨立 build。
