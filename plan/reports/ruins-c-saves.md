# 遠古遺跡包 C：存檔與格式 4 交接

日期：2026-10-25。依 `AGENTS.md`、`plan/14-ruins-bell-sanctum.md` 與本輪 `plan/reports/ruins-c-dispatch.md`、`ruins-c-runtime.md`、`ruins-c-world.md` 完成本批。Playroom main 模板及模板列出的七份規格由主代理本輪完整讀取並記錄於派工報告，本批沿用該規格記錄。

## 已完成

- `src/persistence/validate.ts` 將新寫入格式設為 4，接受 1／2／3／4。載入仍以本輪傳入的完整 catalog 驗證 SaveData；未知地圖位置現在拒絕載入，不會將記錄搬回 town 或 camp。既有已知地圖但失效的 spawn 修復行為保留。
- `src/persistence/index.ts` 首次將本機格式 1／2／3 寫成 4 前，以同一 save key 的 `:formatN-backup` 保存原始 JSON 字串並回讀確認。相同既存備份可續寫；內容不同、備份讀寫／確認失敗時保留原存檔並停止或回報可重試錯誤。未知格式仍不進入寫入流程。
- 新增 `tests/ruins-c-save.test.ts`：覆蓋格式 1／2／3 遷移與原始備份、q17／q20 保留、q18／q19 claimed 驗證、格式 7 拒寫、格式 3 備份衝突／失敗，以及雲端讀 1–4、寫 4。
- 舊 persistence、Ruins B／前一批遺跡存檔與 Playroom port 測試中的「新寫入格式 3」預期更新為 4；舊格式讀取 fixtures 仍保留。

## 本批檔案

- `src/persistence/index.ts`
- `src/persistence/validate.ts`
- `src/platform/playroom-port.test.ts`
- `tests/persistence.test.ts`
- `tests/ruins-b-save.test.ts`
- `tests/ruins-save.test.ts`
- `tests/ruins-c-save.test.ts`

## 驗證

實際執行：

```text
npx vitest run tests/ruins-c-save.test.ts tests/ruins-save.test.ts tests/ruins-b-save.test.ts tests/persistence.test.ts src/platform/playroom-port.test.ts --exclude '**/.worktrees/**'
```

結果：5 個測試檔、49 個測試通過。未執行全套測試、typecheck、content check、build、瀏覽器、ZIP 或正式雲端存檔驗收。

## 待整合與限制

- 主代理確認由 integration owner 更新 `public/game.json` 的 `cloudSave.readableFormats`／`writeFormat`，並升候選版至 beta.14；本批未改 manifest 或版本。
- 本地候選的 cloud port fixture 僅驗證格式介面。正式雲端寫 4 尚未驗證，須待公開版實際理解 C IDs 並能讀格式 4；不應以改 metadata 或橋接部署代替。
- 未發布，未操作真實帳號／雲端；仍由 D 的正式瀏覽器、SDK、ZIP 與發布驗收處理。
