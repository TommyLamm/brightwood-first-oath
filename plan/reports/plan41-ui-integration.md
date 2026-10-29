# Plan41 W02・技能學習 UI 接線

2026-10-29（Asia/Hong_Kong）。本批只在技能面板接入 W01 的純預覽，並新增此報告與指定 TypeScript 檢查日誌；沒有修改 domain、content、app、命令流程、存檔或樣式。

## 變更

- `src/ui/index.ts` 匯入 `previewSkillLearning`。每張玩家技能卡只呼叫一次，使用 `player`、`view.catalog.rules` 和該技能 ID；按鈕停用原因改由預覽回傳的 domain message 提供。
- 保留 `rankReady`、原「已滿級」按鈕標籤，以及只在 `rankReady` 時顯示可處理原因的條件；移除只用於舊手寫原因的 `levelReady`、`jobReady`。
- 可學習時，在原動作按鈕前加上 `ms-panel-note`：「學習後：SP before → remainingSp」。最大 HP 有變化時，附加「；最大 HP before → after」。顯示數字均使用 `formatNumber`；成功按鈕標題保留消耗說明並附上同一摘要。
- 預覽失敗時，按鈕標題及原因使用 domain message，不顯示成功摘要。技能詳情、下一級效果、生命提示、卡片排序、label／ARIA／data、action 與 handler 均保留；沒有套用預覽結果或新增 dispatch。

## 規格與驗證

本次讀取 `AGENTS.md`、`plan/41-skill-learning-preview.md`、`plan/reports/plan41-skill-preview.md`、`src/ui/skill-learning-preview.ts`，以及 Playroom 線上範本和其列出的 game-development、command-contracts、Manifest Schema、release workflow、starter SDK、SDK versioning、save compatibility 文件。適用要求是沿用既有程式模式並保留 SDK、存檔及發布契約；本批沒有發布操作。

只執行一次指定 Node runtime 的 `tsc --noEmit`。完整命令、輸出與 exit code 保存在 `.playroom/tmp/plan41-integration-review/tsc.log`。未執行 tests、browser、build 或 Git 寫入；未驗證實際畫面、點擊／焦點與螢幕閱讀器行為。W01 helper 的 focused tests 已由前一批執行，本批未重跑。

## 下一步

由 root 審閱 W02 diff。候選版本、成品建置與平台驗收仍待後續工作，不能由本批 TypeScript 檢查推定通過。
