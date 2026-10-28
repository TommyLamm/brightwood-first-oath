# 有界首領輸入樣本：未取得完整時長（2026-10-26）

**狀態：右截斷，未驗證 45–80 秒目標。** 唯一正式樣本在 80.005 秒上限沒有出現可見勝利結果；不能據此推定之後何時勝利，也不作 PASS 或產品缺陷結論。

主代理讀取 `formal-run.js` 補充方法限制：起點固定右移6500ms後，正式迴圈沒有再次調整水平站位，也沒有逐次確認攻擊命中或記錄boss HP。因此這是固定輸入策略的有界樣本，不能當成已熟悉且持續有效輸出的代表戰鬥，更不能由未勝推定需要改平衡。下次若補此缺口，先在正常可見操作中確認有效攻擊距離與命中，再量完整勝利邊界；本輪沒有為追PASS重試。

## 成品與 fixture gate

- SUT：`artifacts/overnight-20261026/import-feedback/dist`，`brightwood-first-oath`、schema 2、`1.0.0-beta.17`、入口 `index.html`。
- JS bundle：`assets/index-C1-e-S4C.js`，SHA-256 `1e5aa92a999a7ff4752d3b069b63c23d85fde4fe69e8b7650b28f2a035405b4a`。專用 harness 也對版本與此 hash 設 gate。Node 為 `v24.22.1`。
- `node node_modules/tsx/dist/cli.mjs tools/check-content.ts`：rulesCatalog 與 worldCatalog 跨表檢查通過。
- fixture `artifacts/ruins-d/fixtures/boss-retry-ready.json`：SHA-256 `dcfd40ac7b555a3d0e1bd0887656ca1d41ee9bea968a168843f5784cc8cc504a`，與 fixture index 相符；以當前 rules/world catalog 呼叫 `validateSave` 通過，format 4。
- fixture 狀態：Lv30 劍士，日井誓刃／鐵環甲／鐵盔；STR 128、DEX 33、AP 0、SP 0；重斬10、橫掃10、生命鍛鍊1；HP 712、MP 98。只導入自有隔離 origin。

## 操作及計時定義

- 自有 Playwright CLI session：`morning-boss-timing`。Harness 使用兩個 ephemeral `127.0.0.1` origins（56905／56906），iframe 具 `allow-scripts allow-same-origin allow-pointer-lock` 與 `allow="fullscreen; autoplay; gamepad"`。等待本機 SDK standalone fallback 8 秒以上。
- 遊戲以可見 UI 的「繼續冒險」載入 fixture。正式 T0 是入口處第一個 `ArrowRight` 接近按鍵，包含接敵步行；因此此值不是從精確命中影格量到勝利。T1 定義為在 UI 首次觀察到勝利／重試按鈕；80 秒時沒有該結果。
- 連續 run-code 內執行普通輸入：右移接近；每輪 Ctrl 按住550ms一次；MP足夠才點按1並等650ms、點按2並等850ms；HP≤500時用Q，MP≤20時用W；每兩輪點按一次Alt跳躍。輸入段間釋放按鍵，沒有修改遊戲 runtime、HP、敵人或時鐘。

## 唯一正式樣本

- 時間（香港）：2026-10-26 06:36:29.368 至 06:37:49.373；遊戲內連續計時 `80,005 ms`。CLI 外層回傳等待超過100秒，**不作遊戲時長**。
- T0 UI：HP 712/712、MP 98/98，Q×10、W×5。接近後的第一筆 HUD 觀察在 `6,597 ms`，HP 655/712、MP 98/98；首次有效命中的確切影格未隔離。
- 結果：上限到達時 HUD 為 HP 236/712、MP 2/98、Q/W皆為0；沒有可見勝利／重試結果。共38輪；Ctrl 39次、1 21次、2 17次、Alt 19次、Q 10次、W 5次。樣本在80.005秒右截斷，不可稱為完成戰鬥或命中45–80秒驗收。
- 不宣稱階段切換、聲音或靜音清理已驗；瀏覽器為 headless。本次不重試、不擴成首領矩陣、不改平衡值。

## 排除的準備片段

- 4.655秒短熟悉片段：移動2.3秒，再各一次Ctrl／1／2；未接觸到首領，MP由98降至82。之後重載同一合法 fixture。
- 另一次5.421秒接近只作定位；當時畫面顯示首領滿綠條、角色712 HP。隨後跨工具檢視期間角色死亡；這段因有未量測 idle 而排除。重新導入 fixture 後才執行上述唯一正式樣本，沒有把 idle 誤算作瞬殺或連續戰鬥。

## 證據與清理

- 原始 CLI 輸出：`artifacts/overnight-20261026/boss-timing/evidence/formal-run-cli.log`，SHA-256 `E749972D912E63EF553EDDF38E4076136D534D29A52B5D1585DE764FF23C2C9F`。
- 結構化計時結果：`artifacts/overnight-20261026/boss-timing/evidence/formal-timing.json`，SHA-256 `34181AEE667F05DA06F13562AE1AF85CAF6CAB4D2227B373075BC1689853372F`。
- 80秒終點畫面：`artifacts/overnight-20261026/boss-timing/evidence/sample-timeout-80s-no-visible-victory.jpg`，SHA-256 `3FC359F975A11507DA9913B42AB3347F08BB2638E5E9F5237291B8B85F6FC33F`。起點、接近、30秒、60秒畫面也保存在同一 evidence 目錄；沒有輸出圖片資料 URI。
- run-code 回報 `cleanupKeysReleased=true`、`escapeSent=true`。關閉自有 CLI session；停止 harness PID `35488`。PID 已不存在，兩個記錄 port 56905／56906 均拒絕連線；結果見 `artifacts/overnight-20261026/boss-timing/browser/cleanup-record.json`。
- 沒有改遊戲 source、數值或存檔格式；沒有 build、測試套件、pack 或發布。實際修改僅新增本任務的 harness、驗證腳本、raw／截圖與本報告。

