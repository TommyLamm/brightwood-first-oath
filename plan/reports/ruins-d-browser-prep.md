# 遠古遺跡包 D：瀏覽器驗收準備交接

日期：2026-10-25（香港時間）。狀態：**fixture 與隔離靜態 harness 已備妥；尚未啟動服務、browser 或 build**。此批只擁有 `artifacts/ruins-d/fixtures/`、`artifacts/ruins-d/browser/` 與本報告；沒有改 `src/`、`tests/`、`package.json`、manifest 或玩家資料。

## 依據與停止範圍

已讀 `plan/15-ruins-acceptance-and-package.md` §5/§6、`plan/reports/ruins-c-handoff.md`、`plan/reports/ruins-c-world.md` 與 `plan/reports/ruins-c-runtime.md`。依轉述的 D 契約，固定 ID 為 `brightwood-first-oath`、desktop-only、schema 2、讀取1–4／寫入4；本機 iframe 僅驗相對路徑與隔離玩法，不代表平台雲端。只建立本機 fixture/harness；不操作平常玩家 origin、帳號、發布或共用5173。

## Fixtures

- 產生器：[generate-fixtures.ts](../../artifacts/ruins-d/fixtures/generate-fixtures.ts) 動態匯入當前 production `rulesCatalog`／`worldCatalog`，先跑 `validateRules`／`validateWorld`，逐筆以 `validateSave` 驗證後才輸出 envelope。
- 清單與 SHA：[fixture-index.json](../../artifacts/ruins-d/fixtures/fixture-index.json) 記錄manifest版本、當前catalog source hash、fixture SHA/bytes、角色數值、任務狀態、裝備與來源。
- 六個玩法fixture：`main-q15-start`（q14 claimed、q15未接、琥珀砂岸）、`q17-q20-ready`（兩任務同時 ready）、`q18-full-bag-ready`（q18 ready、32格背包）、`boss-death-1hp`、`boss-retry-ready`、`alternate-frost-tide-stats`。
- 五個存檔namespace fixture：舊 ID key `maplewood-swordsman:save:v1` 的 format 1–4，以及 canonical `brightwood-first-oath:save:v1` 的 format 4。資料均為synthetic、局部測試用，不是玩家備份或真實雲端快照。
- 主線角色：Lv30 劍士，總AP145全用；STR128、DEX33、AP0；SP21全用於重斬10、橫掃10、生命鍛鍊1。裝備日井誓刃（q14獎勵）、鐵環甲（q06獎勵）、鐵盔（q07獎勵）。
- 替代短分支：Lv30，STR94、DEX67、AP0；重斬6、橫掃6、生命鍛鍊1、休息恢復1、剩餘SP7；冰潮長鋒為q11獎勵，防具沿用q06/q07獎勵。兩種配點的 AP/SP、背包、裝備欄與 HP/MP 均由當前存檔validator核對。

實際執行：

```powershell
& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --import tsx 'artifacts/ruins-d/fixtures/generate-fixtures.ts'
```

使用 Node **v24.22.1**；輸出為11個fixture，`validateRules`、`validateWorld`、全部11筆 `validateSave` 均通過。當次 `public/game.json` 仍是 beta.14，故 `fixture-index.json` 反映的是該次 catalog/source hash。**D source 穩定後、browser owner 開始前，需用同一命令重生並確認 index 版本、hash 及validators。**

## 兩 origin 靜態 harness

- 父頁：[harness-parent.html](../../artifacts/ruins-d/browser/harness-parent.html)，不提供開發／作弊入口，僅按參數將 iframe 指到 D 成品。
- 服務：[serve-static-harness.mjs](../../artifacts/ruins-d/browser/serve-static-harness.mjs)，只讀 `artifacts/ruins-d/dist/`，檢查其 `game.json` 固定 ID、版本與 `index.html`；以兩個不同的 ephemeral `127.0.0.1` port 分開父頁與遊戲 origin，不碰5173。
- 遊戲 origin 僅開放 `/<version>/...` 與 `/preview/games/brightwood-first-oath/<version>/...` 兩個子目錄路徑；兩者指向同一 frozen D dist。父頁 iframe 保留 `sandbox="allow-scripts allow-same-origin allow-pointer-lock"` 與 `allow="fullscreen; autoplay; gamepad"`。
- 安全 Node 下檢查過 server script 語法；**沒有**啟動服務或 browser。啟動後服務會列出兩個父頁 URL、PID、port、dist root，並新建 `artifacts/ruins-d/browser/harness-ownership-<pid>.json`；browser owner 以該PID停止自己啟動的服務，stdout/瀏覽器證據存此 browser 目錄。
- CLI盤點：`playwright-cli`／`playwright` 不在 PATH；repo無 `playwright`、`@playwright/test` package，`npm cache ls playwright-cli` 無輸出。未安裝套件；新 browser owner依主代理已讀 skill 的流程，若 wrapper 不可用就使用已啟用的 CUA browser。

啟動命令（待 beta.15 D dist 穩定後執行）：

```powershell
& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'artifacts/ruins-d/browser/serve-static-harness.mjs'
```

服務是兩個本機 origin 的資源路徑／iframe harness，不能證明平台授權、SDK、正式雲端保存、原生全螢幕或正式發布。

## 驗證與下一步

- 通過：安全 Node v24.22.1 下產生11 fixture，production rules/world validator及11筆 save validator全通過；server `.mjs` 語法檢查通過。
- 未執行：typecheck、test suite、build、browser、Playwright/CUA、服務啟停、平台preview／雲端／release。未寫入任何玩家 origin/localStorage。
- 下一步：主代理穩定 namespace修正與 beta.15 D dist 後，重生 fixtures；由全新 browser owner 專用一個browser context／這兩個本機 origin，按 §5/§6 路線測試，所有截圖與長日誌存 `artifacts/ruins-d/browser/`。不沿用其他批次 browser/context，也不清理 A/B/C 產物。
