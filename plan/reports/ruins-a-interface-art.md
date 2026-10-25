# 遠古遺跡 A：介面素材與音訊規格修正交接

日期：2026-10-25。此批只交付介面圖示、區域圖及遺跡音樂 AAC fallback 規格修正；沒有處理 actors、environment、B/C/D 或發布。

## 已讀規格與採用要求

已完整讀取本地 `AGENTS.md`、`plan/12-next-chapter-ancient-ruins.md`、`plan/10-asset-spec.md`、`plan/reports/ruins-a-atlas-audio.md` 與 ImageGen 技能。並以 `?read=20261025` 完整讀取 Playroom `game-agent-template.md` 及其列出的七份 `main` 文件：game-development、command-contracts、game.schema.json、game-release.yml、playroom-sdk.js、sdk-versioning、save-compatibility。

本批套用的要求：素材須用內建 ImageGen、保存完整 prompt 與來源鏈；透明圖示要保留真 alpha；介面 icon 使用 32×32 runtime 尺寸；區域圖節點由 UI 繪製、背景不帶文字或節點；音樂 fallback 遵守 AAC M4A 160k；發布未獲要求時不發布。

## 成品

- `public/assets/interface/item-moss-ceramic-v1.png`：128×128 RGBA 單枚潮濕象牙白陶片，覆有青綠苔與鐘形浮紋；`public/assets/interface/manifest.json` 只追加 `item:moss-ceramic`，display 32×32、pivot `(0.5,0.5)`。
- `public/assets/interface/region-ancient-ruins-map-v1.png`：960×540 區域圖，畫有西南潮痕營站、海岸殘塔、中左盤根石道與遠景封閉遺跡；無文字、可玩節點、UI 導航路線、icon 或其他 UI。依要求以 URL 載入，未加入 manifest。
- `tools/audio/scores/music.mjs` 移除遺跡曲目的 120k 特例；`tools/audio/generate-audio.mjs` 移除 AAC 可調 bitrate 新分支，沿用既有 160k encoder 設定。重產 `theme-ruins` base/combat 的 Ogg 與 M4A 四檔。
- 遺跡音樂四檔共 5.69 MiB，低於新增 runtime 24 MiB 預算。`plan/reports/ruins-a-atlas-audio.md` 已同步更新規格與檔案大小，避免保留先前 120k/4.89 MiB 的過時敘述。
- 原始生成圖、完整 prompts、參考縮圖與審圖 JPEG 位於 `art-source/ruins-a/interface/`；詳見 `art-source/ruins-a/interface/source-log.md`。

## 驗證結果

- 已對 icon 與區域圖作縮圖目視檢查；縮圖最長邊不超過 1280px，品質 72。Icon alpha 範圍為 0–255，含 9,378 個完全透明像素。
- `node tools/audio/generate-audio.mjs --only theme-ruins` 完成，輸出 base -16.0 LUFS、combat -16.3 LUFS，並報告 40 個音訊 manifest 項目驗證完成。
- `ffprobe` 確認兩支 M4A 均為 AAC-LC、48 kHz、雙聲道，stream bitrate 約 161.3/165.1 kbps（以 160k 編碼目標輸出）；Ogg/M4A fallback 路徑仍沿用原 manifest。
- 未跑遊戲測試、typecheck、build、browser 或正式存檔驗收；A 的其它入口／角色／環境工作由主代理及其他批次處理。未建立 tag、Release 或上架。

## 下一步

主代理整合本批與其他批次素材後，依總體計畫執行一次必要的統一驗證。區域圖中的兩個真節點須由 UI 定位於 `(16,72)` 與 `(40,55)`；此批只驗背景圖，不宣稱 UI 疊圖或遊戲內視覺整合已驗收。
