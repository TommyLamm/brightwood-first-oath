# Plan36 W02・裝卸能力預覽 UI

2026-10-29（Asia/Hong_Kong）。依 `AGENTS.md`、`plan/36-equipment-stats-preview.md`、`src/ui/equipment-stats-preview.ts` 閱讀指定的 `src/ui/index.ts` import、裝卸 UI 與 click handler 後完成。Playroom 範本及 game-development、command-contracts、Schema、release workflow、SDK、sdk-versioning、save-compatibility 線上規格由主代理本批完整閱讀。

## 實際變更

- 在 `src/ui/index.ts` 匯入 `previewEquipmentStats` 與 `EquipmentStatsPreview`，新增局部純文字 `formatEquipmentStatsPreview`，只用既有 `formatNumber` 格式化攻擊、防禦、生命上限的 before／after。
- 背包裝備及裝備欄卸下 renderer 各呼叫一次新預覽。成功時在原操作鈕前顯示「裝備後預覽：」或「卸下後預覽：」及摘要，並在原操作／對象標題後附上摘要；失敗時停用操作鈕，標題與可見理由使用 domain `message`。
- 背包既有能力比較、裝備鈕 aria-label／文字／data 保留。卸下鈕維持原文字與 data，新增依裝備欄位及物品名稱組成的 aria-label。所有 click handler 仍使用既有 `previewEquipmentAction` 判定並 dispatch 原命令。
- 未新增 state、timer、簽名、CSS、domain 邏輯、測試或 metadata。

## 驗證與限制

- 唯一執行命令：`C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules/typescript/bin/tsc --noEmit`；exit 0。
- 未新增或執行測試，未啟動 DOM、browser、build 或 server。
- 真實版面、焦點、讀屏與 click 行為未驗；需由主代理審閱本次局部變更。
