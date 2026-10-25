# Ruins-A 苔陶蟲攻擊／受傷／死亡影格恢復

狀態：**完成原稿保全與 normalized 交付**；未改 runtime、manifest、其他 actor/NPC 或 spritesheet 組裝。

## 可交付路徑

- 十張逐位元原稿：`art-source/ruins-a/action-frames/raw/generated-batch-a/`。
- 可供組裝的單格圖：`art-source/ruins-a/action-frames/normalized/frame-12.png`、`frame-13.png`、`frame-14.png`、`frame-15.png`、`frame-18.png`、`frame-19.png`、`frame-24.png`、`frame-25.png`、`frame-26.png`、`frame-27.png`。
- Prompt 全文：`art-source/ruins-a/action-frames/prompts/action-prompts.md`。
- 雜湊、逐 prompt 映射與正規化紀錄：`art-source/ruins-a/action-frames/source-log.md`。
- 審圖縮圖：`art-source/ruins-a/action-frames/review/source-contact-sheet-q70.jpg` 與 `source-contact-sheet-detail-q70.jpg`。

## 編排與來源

依原 prompt 的動作順序輸出 attack 4 格（蓄勢→張口準備→向前咬擊→收勢）、hurt 2 格（後縮→回復）、dead 4 格（腿軟→殼歪→伏下→靜止）。兩張 contact sheet 自審確認十張都是同一苔陶蟲、右向、完整短根；dead 影格以姿勢表現倒下與靜止，沒有透明淡出。沒有缺少上述指定姿勢。

十張的逐 call `savedPath`／`revisedPrompt` 映射均從本任務 session 恢復並記入 source log。`frame-12` 還與原有 raw 的 SHA-256 完全比對。生成原始檔沒有重製。

## 最小檢查

- 10 個來源 PNG 均逐位元保留原檔名；各 SHA-256 與生成輸出一致。
- 所有 normalized 檔為 96×96 RGBA；完整輸出 alpha bbox 水平中心 x=48、腳底 y=92、四邊透明至少 3 px，寬不超過 84、高不超過 70；hash 與 bbox 見 source log。
- normalized 十張輸出雜湊互異；相鄰姿勢均有 alpha 與像素差異。原稿及中性底縮圖已視覺檢視。
- `raw/frame-12.png` SHA-256 仍是 `d108d2aadaa2b7794142f2b58f7a706f0c917ef3f0703f0cc74ae3686bacf41c`，未覆寫。
- 未執行瀏覽器、遊戲測試、typecheck 或 build（此為素材保全與正規化工作）。

## 接續

組裝可直接使用 `normalized/` 指定影格；精確原稿與 prompt 對應已記錄於 source log。此批沒有修改 spritesheet、manifest 或 runtime。
