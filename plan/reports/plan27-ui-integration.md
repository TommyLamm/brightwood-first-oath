# Plan27 W02・AP 預覽 UI 整合

## 範圍與來源

依 `plan/27-ap-allocation-preview.md` 將 `previewApAllocation` 接入能力面板與 `allocate-ap` 點擊處理。面板沿用原本的 +1／最多 +5 去重、出現條件、可見文字、按鈕工廠、dataset 與 append 次序；每個原有加點按鈕預覽一次，失敗時停用並以 domain message 作 title，成功時 title 與 aria-label 提示預計消耗 AP、攻擊、防禦、暴擊率前後值及剩餘 AP。一般按鈕的 aria-label 由原可見 `+1`／`+5` 起頭，全部力量按鈕則由原完整可見文字起頭。

點擊處理保留原 `available` 與 amount clamp；以 `currentView` 的最新 player 與 rules 預覽同一 clamped amount，缺少資料或 domain 預覽失敗時不派送，成功時只派送原 `{ stat, amount }` payload，沒有套用預覽快照。

## 進度與驗證

- 已讀：repo `AGENTS.md`、Plan27、本批 helper 與 W01 報告；Playroom 範本及其七份線上規格由 root 在同一任務完整讀取。
- 僅修改 `src/ui/illustrated-panels.ts`、`src/ui/index.ts`，新增本報告。
- 驗證命令：`& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules/typescript/bin/tsc --noEmit`
- 結果：exit code 0。編譯後只補了 aria-label／title 的力量或敏捷文案，依本批一次限制未重跑。
- 未實測 tooltip hover、screen reader、click、keyboard 或 focus 行為；沒有跑 tests、DOM/browser、server、build 或 pack。

## 交接

W02 已完成來源整合，待 root 審閱兩處 diff 與本報告。候選建立與 UI 人工互動驗收仍待後續批次。
