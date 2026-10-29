# Plan22 W02・NPC 對話領獎 UI

2026-10-28（Asia/Hong_Kong）。依 Plan22 W02 將共用領獎預覽接到 NPC 對話 ready 任務卡與點擊分支。

## 實作

- `src/ui/index.ts` 直接匯入 `resolveQuestClaim`。ready 卡以目前 snapshot 的 `saveData`、任務 ID 與 catalog 預覽；只讀結果的 `ok`／`message`，不採用成功結果中的 player、任務或 reward。不可領取時停用按鈕，將原因放在 title 與既有 `.ms-disabled-reason` 可見文字中；保留原獎勵文字、「領取任務獎勵」標籤及 `dialogue-claim-<questId>` focus key。
- `claim-quest` 點擊時讀取最新 `currentView.saveData` 與按鈕上的任務 ID，再呼叫同一 helper。只有計算成功才派原 `claimQuest` 命令；app 仍負責正式執行、NPC 距離 gate 及存檔。
- `src/ui/styles.css` 已有 `.ms-disabled-reason` 規則，無需修改。未更動接取任務、交易、輸入、focus 管理或其他 panel。

## 驗證與界線

- 按 W02 指定只執行一次 TypeScript typecheck：
  `C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules/typescript/bin/tsc --noEmit` — 通過，exit code 0。
- 未重跑 W01 focused／app 測試；未執行 browser、build 或完整測試套件。此次 typecheck 不驗證實際瀏覽器操作、NPC 距離或命令執行／保存結果。
