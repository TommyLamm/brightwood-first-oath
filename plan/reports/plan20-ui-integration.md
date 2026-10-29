# Plan20 W03：裝備與單筆出售 UI 整合

2026-10-28（Asia/Hong_Kong）。W03 已接線；本報告僅記錄本包的 UI 整合與檢查。

## 實際接線

- `src/ui/index.ts` 匯入既有 `previewEquipmentAction` 與 `previewSale`。
- 背包物品詳情的裝備鈕及裝備面板的卸下鈕，依裝卸預覽設定 disabled、title 與可見拒絕原因。滿格時仍由 domain 決定背包換裝是否可用；空裝備槽仍不顯示卸下鈕，原裝備能力比較保留。
- 背包物品詳情與商店出售列以當前堆疊數量 clamp 到 1..stack.quantity，再共用出售預覽呈現數量、收入、按鈕狀態、title 與拒絕原因。商人前置拒絕由 helper 優先呈現。沒有套用購買的 99 上限。
- `equip-bag`、`unequip`、`sell-bag` 點擊處理以當前 `UiSnapshot` 再跑 helper；僅預覽可用時派送原命令，不套用預覽結果。被拒絕的單筆出售會在清除 `sellQuantities` 草稿之前返回；成功出售仍沿用既有草稿清理與 reconciliation。
- 「出售全部素材」分支保持原樣。沒有修改 `onInput`、`onChange`、數量草稿 clamp、`pendingBinding`、Plan19 焦點／reconciliation、購買、藥水或 HUD 路徑。
- 未需修改 `journal.css`：已存在的 `.ms-disabled-reason` 顯示樣式可用，面板顏色亦已有定義。

## 驗證與未驗

- 執行一次：`C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules/typescript/bin/tsc --noEmit`。完成，exit code 0，沒有 TypeScript 診斷。
- W01 equipment preview 的 6 項 focused tests 與 W02 sale preview 的 5 項 focused tests 已由各 helper 報告為通過；本包沒有重跑。
- 未開 browser，也未實際點擊或檢查 focus、原因換行及面板布局。此環境已有記錄的 `0x6D` 啟動限制；本次只完成 source/typecheck 核對。
