# Plan47 W01・商店分類 UI

2026-10-29（Asia/Hong_Kong）。

## 變更

- `src/ui/index.ts` 的 `shop-filter` handler 保留 `SHOP_FILTERS` 白名單查找；所選分類已是 `shopFilter` 時立即返回，不更新分類或重繪。
- `buildShopPanel` 的原 `SHOP_FILTERS` 迴圈逐類使用 `selectShopOffers(view.catalog.rules.items, category.id).length`。按鈕文字顯示「分類（N）」並帶有「商店分類：分類，N 件貨品」`aria-label`。
- 保留原按鈕 kind、focus key、class、`aria-pressed` 與順序；零數分類仍可選。數量沿用現有選品結果，只表示貨品數，不代表購買資格。
- offers、note、empty state、grid、買賣 handler、數量 map、selection、state、signature、CSS、timer、helper、domain、catalog 與存檔未修改。

## 驗證

- 依專案指定 Node runtime，將其 `bin` 加到 `PATH` 後，執行一次 `node_modules/typescript/bin/tsc --noEmit`；exit code 為 `0`。完整命令、輸出與 exit code 存於 `.playroom/tmp/plan47-integration-review/tsc.log`。
- 未執行 tests、DOM、browser、build 或 server。真實 click、focus、raw 數量草稿、讀屏與 layout 尚未驗證。

## 規格來源

- 本機 `AGENTS.md`、`plan/47-shop-category-counts.md` 與 `plan/reports/plan47-handoff.md`。
- Playroom 範本：<https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md>。handoff 記錄本批八份 Playroom 規格已由 root 完整網讀（refs173–176）。
