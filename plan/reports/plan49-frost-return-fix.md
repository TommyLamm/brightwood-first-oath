# Plan49・霜潮洞窟返回標籤修正

2026-10-29（Asia/Hong_Kong）

## 規格與適用要求

- 讀取 AGENTS.md、Plan49 journal 最新收尾指示、`src/ui/world-map.ts` 原末段、`src/app/gameplay.ts` 的 `returnTown` 分支，以及 `src/ui/index.ts` 的 result return label。
- 本任務開始前，root 已完整網讀 Playroom 規範列出的八份文件（refs199–202，含尾段）；保留 brightwood-first-oath／TommyLamm／desktop 身分、Lv30 四區 18 圖、讀 1–5 寫 5、SDK 1.1.0、protocol 1、schema 2、tools 1.2.0、相對資源與 iframe 契約。
- 驗收範圍限於 `world-map.ts` 的 Frost 戰後返回標籤及首領戰 disabled title；維持其他標籤、按鈕資料、focus、disabled、action、append 與順序。保留 beta56 及所有既有 dirty work；不改路由、政策、存檔、候選或 Release 資料。

## 修改

- 在 `src/ui/world-map.ts` 增加 `frostBossResult`，只在目前地圖為 `frost-tide-cavern` 且可返回時，將地圖按鈕顯示為「返回雪痕海岸」。bell、sunwell 與預設 label 原樣保留。
- 將 `frost-tide-cavern` 加入原首領戰 disabled title 的 map ID 條件，沿用「首領戰尚未結束，不能返回安全地點。」
- 對照既有 `src/app/gameplay.ts`：霜潮洞窟首領戰後仍依原路由前往 `frost-shore`；`src/ui/index.ts` 的 result 畫面已顯示「返回雪痕海岸」。本次沒有修改 domain 路由或 result 畫面。
- `.playroom/tmp/plan49-frost-return-review/world-map-before.ts` 作為唯讀基線，未修改。

## 檢查與限制

- 依指定 Node 執行一次 `node_modules/typescript/bin/tsc --noEmit`，exit code 0；實際命令與完整輸出記錄於 [tsc.log](../../.playroom/tmp/plan49-frost-return-review/tsc.log)。
- 未執行 tests、DOM／browser、server 或 build。真實畫面呈現、點擊與旅行流程未由本批實測。
