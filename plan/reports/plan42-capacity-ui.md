# Plan42 W01・出售後格數預覽 UI

日期：2026-10-29（Asia/Hong_Kong）  
狀態：完成

## 已讀資料與適用要求

- 已讀 `AGENTS.md`、`plan/42-material-sale-capacity.md` 與 `plan/reports/plan42-handoff.md`。
- root 已完整讀取本批八份線上 Playroom 規格（refs143–146）。本次只實作 W01 指定的純呈現：沿用唯一既有 `previewMaterialSale` 結果，在批次出售按鈕後、部分成交說明前追加成功預覽 note。
- 驗收：成功預覽時以 `player.bag.length`、`expectedSoldStacks` 和兩者相減計算已用格數；零成功不追加 note；只執行一次指定 TypeScript 檢查並保存命令、完整輸出及 exit code。

## 實作

在 `src/ui/index.ts` 的 `buildShopPanel` 中，僅當 `materialSalePreview.expectedSoldStacks > 0` 時追加：

> 出售後預覽：背包已用 N／32 → M／32 格；騰出 K 格。

N、M、K 分別由 `formatNumber(player.bag.length)`、`formatNumber(player.bag.length - materialSalePreview.expectedSoldStacks)`、`formatNumber(materialSalePreview.expectedSoldStacks)` 顯示。未以 `candidateStacks` 推估格數；沒有宣稱已成功出售。

## 驗收紀錄

- 與 `.playroom/tmp/plan42-integration-review/ui-before.ts` 比對，`src/ui/index.ts` 差異只有上述 note 區塊。
- 唯一指定檢查已執行：前置 Node bin 至 `PATH`，再以 `C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules/typescript/bin/tsc --noEmit` 執行；exit code 為 `0`。完整命令、輸出與 exit code 保存在 `.playroom/tmp/plan42-capacity-ui-tsc.log`。
- 未新增或執行 tests、browser、build、server；未驗證真實 click、focus、layout 或 reader 行為。此變更為純呈現，相關互動與輔助科技行為仍待人工檢視。
