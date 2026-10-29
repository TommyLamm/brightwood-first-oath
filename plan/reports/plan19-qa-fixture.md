# Plan19 W06 商店／背包合成前置

狀態：**fixture 與 validator preflight 完成；W06 browser route 未執行。**

## 範圍與來源

依 Plan19 §3、W06、`AGENTS.md` 與 `tools/qa/browser-lifecycle.md` 建立一個全新、只供本次使用的合成 format 5 fixture。線上 Playroom 範本及七份規格由主代理在本輪完整讀取，本包沿用其前置。只新增本報告及 `output/playwright/plan19-local-beta25-20261028-01/` 內的生成 script、fixture 和 JSON 證據；未改 `src/`、`tests/`、存檔、profile 或任何既有 QA 原件。

Fixture 由當前 `composeContentCatalog()` 與 `createPlayer("Plan19 合成 QA", catalog.rules)` 產生，沒有讀取玩家 profile、portal fixture 或 private app state。原始 envelope 位於 [`merchant-bag-format5.json`](../../output/playwright/plan19-local-beta25-20261028-01/merchant-bag-format5.json)，SHA-256：`0651d976637714e35d19fa52905dabce2bf439cf9293d7bf19e1b07feae38f1c`（3,350 bytes）。可用 [`make-fixture.mjs`](../../output/playwright/plan19-local-beta25-20261028-01/make-fixture.mjs) 重建；script SHA-256：`f94cee74373e220201afc3e7d3d3d5e32ca14bb9dda1dde09f1f40516d1103f0`。

[`provenance.json`](../../output/playwright/plan19-local-beta25-20261028-01/provenance.json) 記錄生成來源、run ID、完整 raw hash，以及 catalog、`createPlayer`、town merchant placement 和 persistence source 檔的 SHA-256。[`validator-evidence.json`](../../output/playwright/plan19-local-beta25-20261028-01/validator-evidence.json) 保存本次實際驗證結果。

## 前置狀態與 W06 route

- 玩家由 `createPlayer` 建立，金幣設為 10,000；背包共 32 格：index 0 `small-red ×98`、index 1 `small-blue ×5`、index 2–31 各一件 `cloth-cap`。
- 現行定義的 stackLimit 為紅藥水 99、藍藥水 99、布帽 1。town `center` 為 `(960,600)`，merchant 為 `(1000,600)`，距離 40 px。`visitedMaps` 為 `camp`、`town`，位置為 `town/center`，音效設定 `muted: true`。
- `quests` 是空物件，沒有任何 claimed 任務；不偽造 q01 完成紀錄。
- Terra 使用前先在自己的全新隔離 origin 執行並保存 **canonical save 為 null** 的 guard 證據。之後載入此 fixture，從 town/center 與商人互動，依序觀察：紅藥水買 1 可補至 99、買 2 預期 `BAG_FULL`；藍藥水買 1 可疊加；布帽購買預期 `BAG_FULL`。這些是 fixture 條件與待驗案例，並非已執行交易或 browser 結果。
- 背包 route：先選 index 1 的藍藥水並填出售數量，再賣光 index 0 的紅藥水；確認結構改變後 selection 與數量草稿清除、不轉到移位後的布帽。另依 W06 確認數量欄仍有焦點時相鄰單擊會正常執行一次，不吞 click 或造成第二次出售。UI route 尚未執行。

## 實際驗證

執行 generator：

```text
C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe --import tsx output/playwright/plan19-local-beta25-20261028-01/make-fixture.mjs
```

- `composeContentCatalog()`：accepted。
- `validateSave(envelope.data, catalog)`：accepted；正規化結果保留 town location，bag 長度 32。
- `prepareSave(envelope.data, catalog)`：accepted，`repaired: false`，沒有 repair message。
- `createPersistence.initialize()`：使用僅載入此 fixture 的 Map-backed `StorageLike`、`cloud: null`、`development: true`；結果 `mode: local`、`status: ready`、`saveUpgrade: null`，town location 保留。初始化前後 raw envelope SHA-256 相同，沒有升級或改寫。

## 尚未驗證與交接

本包沒有啟動 browser、server、portal、profile 或 canonical storage origin；沒有執行 W06 route、交易、畫面檢查或 browser cleanup。Canonical-null guard 明確記為 `not-run`，不能視作通過。主代理已核對 `artifacts/plan19-1.0.0-beta.25` 在本包開始時不存在，後續預定 candidate 為 ID `brightwood-first-oath`／版本 `1.0.0-beta.25`／該 artifacts 路徑；fixture 尚未綁定 candidate fingerprint。W06 Terra owner 須核對實際 candidate 與本次 source，再於新隔離 origin 保存 guard 後使用 fixture；本包不把 fixture 驗收等同候選或遊戲驗收。

未執行 tests、typecheck、build、pack 或完整 validator 流程；本次只執行上列 generator 中直接要求的 catalog、save validator 與 memory-backed persistence 初始化檢查。
