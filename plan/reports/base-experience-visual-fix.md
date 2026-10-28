# Plan17 beta23 quickbar 與互動提示視覺修復

日期：2026-10-28（Asia/Hong_Kong）  
狀態：SOURCE_DELIVERED／ZIP_VALIDATED；Terra已完成限定複驗：動作／排隊／冷卻所見通過，portal toast另遮操作鈕由beta24修正，並在恢復環境後640實畫所見PASS；詳[視覺報告](base-experience-visual-beta22.md)、[beta24修正](base-experience-toast-fix.md)及[啟動恢復](base-experience-browser-recovery.md)。未發布，下方為本包交付時記錄。

## 依據與範圍

- 本次局部工作讀取 `AGENTS.md`、`plan/reports/base-experience-ui-integration.md`、`base-experience-candidate-fix.md`，以及 `src/ui/index.ts`、`src/ui/journal.css` 和直接相關 quickbar 樣式。
- 遠端依據：完整讀取 Playroom `game-agent-template.md`；按此包讀取 `game-development.md` 的成品／建置／pack 要求、完整 `game.schema.json`、完整 `sdk-versioning.md` 的固定工具及 Node 段。主代理另已完成模板列出的其餘規格閱讀。
- 沿用固定遊戲 ID、desktop、相對資源、iframe 契約與 cloudSave 格式；保留玩法、命令、快捷鍵、按鈕 disabled 規則、buffer 時間及存檔行為。只修本次確認的三處 UI 呈現，不發布。
- Terra 回報的 beta22 證據：`output/playwright/base-experience-visual-beta22/02-action-960-review.jpg`、`action-visual.log`、`03-quickbar-crop-review.jpg`、`03-npc-potion-640.png`；第三處為 `06-portal-overlap-crop-review.jpg`（來源 `06-portal-toast-640.png`）。本報告作者未自行查看圖片；驗收由 Terra 執行。

## 修正

- **排隊／動作狀態**：`updateQuickButtons` 在每次更新先清除 `has-action-feedback`；只有 `canAct`、沒有 MP／學習／冷卻等 `reason`、沒有有效 buff，且該技能已排隊或 `actionLock > 0` 時才加入。這與 `displayState` 的優先序一致，reason、buff、focus gate 或 action lock 到期後不會留下 class。沒有改 `button.disabled`、buffer 或戰鬥規則。
- **quick-slot badge**：原本只對不可用、有效 buff 顯示的狀態 badge 現在有界於格內、置中、可換行且不使用省略號；可見 cooldown／action-lock 秒數把 `1.0 秒`緊湊成 `1.0秒`。DOM 的 title／aria-label 仍使用原本完整狀態文案。藥水的無藥／冷卻原因也會標上 unavailable 樣式；數量 pill 保留角落配置。兩行 badge 使用 10px 字及 12px 行高，短格會覆蓋圖示下緣但不遮鍵帽或整個圖示，也不延伸到相鄰格或 footer。
- **窄尺寸 toast 避讓**：`updateInteractionHint` 僅在 hint 實際可見時切換 shell 的 `has-interaction-hint` class。`@container (max-width: 720px) and (max-height: 520px)` 下，只有有此 class 且不是 `.ms-toast--top` 的 toast 移至左側，寬度限制為 320px／容器內可用寬度。沒有 hint、一般尺寸與 panel top toast 沿用原位置；沒有調整 z-index、縮小字級或移除提示，也未遮住快捷列或 save footer。

## beta23 候選

- 封裝前確認 package/package-lock/public manifest 是 beta22、`v1.0.0-beta.23` tag 不存在、beta23 候選目錄不存在；只同步三個版本欄位至 `1.0.0-beta.23`。ID 為 `brightwood-first-oath`、schema 2、devices `desktop`、cloudSave readable `[1,2,3,4,5]`／write `5`。
- 最終 build：[dist](../../artifacts/base-experience-1.0.0-beta.23/dist/)（274 files、135,735,083 bytes；tree SHA-256 `3c4a1560cc647402d425ee3e581d0d3ae510a6f90eff41464318b4f6a6f492bd`）。
- ZIP：[game.zip](../../artifacts/base-experience-1.0.0-beta.23/game.zip)（274 entries、131,523,004 bytes；SHA-256 `9e15b875d6f848a747eb02e6b9ac7ee0a2c79831a7ccfb2817a0912b2d67b1cc`）。ZIP entry tree SHA-256 與 dist tree 相同。
- Source scope：[source-files.sha256](../../artifacts/base-experience-1.0.0-beta.23/source-files.sha256)（351 files、135,075,587 bytes；tree SHA-256 `3715e56947e3b18023069aed580e407cbb6cd5279d03a211779221801b22f65e`）。其他摘要與有限文字掃描結果見 [fingerprints.json](../../artifacts/base-experience-1.0.0-beta.23/fingerprints.json)；清單腳本為 [fingerprint.ps1](../../artifacts/base-experience-1.0.0-beta.23/fingerprint.ps1)。

## 檢查與驗收界線

- Bundled Node `v24.22.1`：`node_modules/typescript/bin/tsc --noEmit` 最終執行一次，通過。第一次 UI 修正後亦曾通過；加入 portal toast 修正後又執行最終檢查。
- Vite `8.3.4` build：執行兩次，均通過（68 modules）。第一次 dist 尚未封包；加入 portal toast 修正後重建一次，只有第二次 dist 用於 beta23 ZIP。
- 固定 Playroom tools `1.2.0` archive SHA-256 `24a2fd36b405ae9f1ce1303e53ac6b0a0d0a2798c04e796f5790a2663d46f022`：pack 一次成功，完整 ZIP validate 一次成功：`Valid: brightwood-first-oath v1.0.0-beta.23 (tools 1.2.0)`。
- 沿用 beta22 fingerprint 腳本做有限掃描：掃描 14 個文字 entries，五類 token／私鑰樣式 potential matches 0；binary files 未掃描，此項不是完整機密稽核。
- 沒有新增或重跑 unit／整合測試、content check、全套測試或 browser。Terra 尚待確認 960×540 排隊 badge、640×360 冷卻／藥水 badge，以及 640×360 blocked portal hint 和非 top toast 同時可讀；本報告不宣稱視覺驗收通過。beta21／22 候選檔案未改；沒有 commit、push、tag、Release 或平台上架。
