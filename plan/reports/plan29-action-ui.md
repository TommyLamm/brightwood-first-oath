# Plan 29 W01 — 技能與任務動作名稱

日期：2026-10-28（Asia/Hong_Kong）  
狀態：實作完成，待 root 審閱三處 diff。

## 本批變更

- `src/ui/index.ts` 的 `buildSkillsPanel` 將原三態可見按鈕文字保存在 `actionLabel`，仍以原字串建立按鈕；新增 aria-label，包含技能名稱及原 `rank`／`maxRank`。
- `buildDialoguePanel` 的接取任務按鈕新增「接取任務：{任務標題}」aria-label。
- 同 builder 的領取任務獎勵按鈕新增「領取任務獎勵：{任務標題}」aria-label。
- 按鈕仍在原位置 append。`className`、可見文字、`disabled`、`title`、`data`（含 focus key）、領獎預覽／reason 與周邊 append 順序均未改。

## 驗證

- 對照 `.playroom/tmp/plan29-integration-review/ui-before.ts` 檢視 diff：只有上述三處 inline button 提取、aria-label 設定與原位置 append 變更。
- 執行一次：`C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules/typescript/bin/tsc --noEmit`，exit code `0`。
- 未執行 tests、DOM／browser、螢幕閱讀器、截圖或 build。螢幕閱讀器實際朗讀、滑鼠 click、鍵盤操作與版面效果均未驗證。

## 交接

請 root 審閱 `src/ui/index.ts` 相對基線的完整三處 diff。工作樹中其他既有 dirty 檔案未納入本批變更。
