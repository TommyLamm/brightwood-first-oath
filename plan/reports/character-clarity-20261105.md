# 角色清晰度升級交接

- 日期：2026-11-05（Asia/Hong_Kong）。遊戲 ID：`brightwood-first-oath`；本機版本：`1.0.0-beta.59`。
- 使用者指定失序司鐘者為清晰度標準：清楚輪廓、立體陰影、可辨識材質，同時保留各角色身份及原有遊戲比例。
- 已於本對話透過網路閱讀 Playroom `game-agent-template.md` 及其列出的開發標準、操作契約、Manifest Schema、release workflow、SDK、SDK 版本指引與存檔相容規格；本階段重新取得 main 範本。來源根目錄：`https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/`。

## 已完成

1. 以內建 ImageGen 重製主角旅行布衣、輕革甲、鐵環甲三套完整動畫。原稿、完整 prompt 及未採用的修補稿保存在 `art-source/actors/clarity-v1/`。
2. 從既有高解析原稿重新匯出 18 組素材：11 種普通怪物、5 位 NPC 及古礦守衛／日井守衛。去除舊匯出流程造成的低解析與減色損失；不把放大既有低解析貼圖稱為升級。
3. 共 21 組版本化 runtime PNG；其餘 9 組已具細節的角色外觀沿用原圖。失序司鐘者原圖保留作標準。
4. 普通角色與主角每格至少 192px，兩位首領每格 384px，商人維持 384px。Manifest 顯示框、動畫狀態／節拍、碰撞尺寸及身形位置保留。新舊有效身形邊界最大差異 0.25 邏輯 px。
5. Phaser 內部畫布從 960×540 提高至 1920×1080，沿用 renderer 的 960×540 邏輯世界和既有相機縮放，維持原視野與角色遊戲尺寸。同步調整載入文字位置與字級。
6. 更新 package、lockfile 與 game manifest 至 beta.59；完成本機 `dist/` 建置。未發布。

## 來源及交付

- 可重現匯出：`art-source/actors/clarity-v1/export-clarity.py`。
- 來源 SHA-256、原／新路徑、每格 mapping：`art-source/actors/clarity-v1/export-report.json`。
- 原有 manifest：`art-source/actors/clarity-v1/manifest-before.json`；原 runtime PNG 均保留。
- 當前映射：`public/assets/actors/manifest.json`。
- 前後對照：`output/character-clarity-20261105/01-hero-comparison.jpg`、`02-npc-comparison.jpg`、`03-monster-comparison.jpg`、`04-boss-comparison.jpg`。
- 裝備疊圖：`output/character-clarity-20261105/05-hero-equipment-anchors.jpg`。
- 圖片為素材合成對照，不是本次遊玩截圖。完整 PNG 留在同目錄，JPEG 檢視圖長邊 ≤1280px、品質 75。

## 驗證

- 21 組實際 PNG／334 個有效動畫格：RGBA、尺寸整除、真透明、有效格非空、身形邊界一致性通過。
- 已視覺檢視角色／NPC／怪物／首領對照，並檢視三套主角在待機、移動及一個攻擊姿勢下的原帽子／武器疊圖。
- `npm run typecheck`：通過。
- `npm run check:content`：通過。
- `npm test -- src/render/geometry.test.ts tests/integration/app-hero-anchors.test.ts src/render/animation-contract.test.ts`：3 個檔案、15 項通過；包括既有 1920×1080 → zoom 2 且視野 960×540 的測例。
- `npm run build`：通過。
- 未執行全套測試、瀏覽器實玩、手機效能／iframe／全螢幕驗收、ZIP 驗證或發布；不宣稱上述項目通過。

## 下一步與限制

本機素材及程式已接入；下一步在實際遊戲檢視動作銜接、左向裝備、全螢幕與效能。新貼圖合計約 11.7 MiB，舊檔仍保留在 public，因此此次成品亦保留舊版資源。若後續準備發布，再依平台規範執行完整成品／iframe 驗收及 ZIP 驗證；需要明確發布授權。

未修改工作開始時已有變更的 `plan/status.md` 與兩份 beta57 terra 報告。

## 使用者指定無頭測試後的嘗試

使用者要求瀏覽器不要在桌面顯示視窗。後續一律優先使用明確 `headless:true` 的設定，以截圖視審。2026-11-05 新建 `beta59-headless-20261105-01` 隔離 run，Chrome launch 確認帶 `--headless`；但在初始 `about:blank` 階段因 crashpad pipe 0x6D／crash server failed to launch 自行退出，未載入遊戲。因此仍無本次瀏覽器實玩驗收或遊戲截圖，不把環境失敗視為遊戲缺陷。未改用有視窗模式、未升權重試；僅正常關閉本輪 session 並停止本輪 server。詳細記錄在 `output/playwright/beta59-headless-20261105-01/run-record.md`。

後續使用者明確要求診斷修復及繼續測試後，已在工具審批通過的一般使用者環境中，以 `headless:true` 成功完成 run 02。實玩另發現並修復背景縮放原點、可見範圍裁切及視差問題；正常操作擊殺一隻蝸牛，驗證 1280×720／960×540，22 項相關測試、型別及建置通過。最新結果與未驗邊界以 `plan/reports/beta59-headless-recovery-20261105.md` 為準；前段失敗紀錄保留作歷史。
