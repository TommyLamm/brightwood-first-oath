# Plan 15 首領有效命中→勝利有界樣本

**判定：量測完成但目標未達（較快）。** 單一正常 UI 樣本看到有效命中並進入勝利結果；命中至首次觀察勝利的區間約 17.968–18.684 秒，T1另有約200ms輪詢觀察延遲，並非逐影格實際勝利時刻。結果仍明顯短於 Plan 15 的 45–80 秒參考範圍。這是指定高輸出 Lv.30 fixture 的一次結果，不推論一般角色的戰鬥平衡。

## Frozen build 與 fixture gate

- 成品為 `artifacts/overnight-20261026/portal-labels/dist`：`brightwood-first-oath`、schema 2、`1.0.0-beta.18`、desktop、save read 1–4/write 4。bundle `assets/index-BPLc23-E.js` SHA-256：`1c26346100c38d09beee5b7cc331210e29274ba1dc757c67021d9b3c302e6cab`。
- Fixture `artifacts/ruins-d/fixtures/boss-retry-ready.json` SHA-256：`dcfd40ac7b555a3d0e1bd0887656ca1d41ee9bea968a168843f5784cc8cc504a`，與 fixture index 相同；以封套的 `.data` 作為 SaveData，用當前 content catalog 呼叫 `validateSave` 一次，結果 valid。
- 只對本次引用的 7 個檔案比對 beta18 source fingerprint，皆相符：`src/app/gameplay.ts`、`src/domain/actors/index.ts`、`src/domain/combat/index.ts`、`src/content/rules/skills.ts`、`src/content/world/maps.ts`、`src/content/rules/monsters.ts`、`src/content/rules/progression.ts`。
- 配點／裝備保留 fixture 原值：Lv.30 劍士，STR 128、DEX 33、AP/SP 0；日井誓刃、鐵環甲、鐵盔；重斬 10、橫掃 10、生命鍛鍊 1；起始 HUD 712/712 HP、98/98 MP，Q×10、W×5。正式樣本前將此原始 fixture 回載到自有 canonical key，reload 後逐字相同。

## 熟悉校準

第一次 4.237 秒右移後，畫面仍顯示與首領有距離。再接近後的一次重斬沒有首領受擊證據；畫面上的 62 是玩家受傷，首領綠條未縮短。追加約 211 ms 的向右短步修正後點按橫掃，畫面在首領身上顯示 457 傷害且綠條縮短（`calibration-sweep-hit.jpg`）。因此正式策略以短步接近、朝右橫掃為基礎；校準影格及輸入／時間記錄都在 `artifacts/resume-20261026-1154/boss-measure/evidence/`。

## 唯一正式樣本

使用隔離雙 origin 的可見 Playwright CLI UI；iframe 保留 sandbox。起點圖為 `formal-start.jpg`，首次命中候選圖為 `formal-first-attack-01.jpg`，勝利終點圖為 `formal-end.jpg`（JPEG quality 70）。

- **T0**：2026-10-26 12:18:10.480 HKT，第一次 `ArrowRight` 輸入。T0→勝利結果首次可見 **25.073 秒**，其中接敵／移動約 6.389 秒。
- **首次攻擊輸入**：12:18:16.869 HKT，為第一次正常 `2` 橫掃；攻擊輸入→勝利結果首次可見 **18.684 秒**。
- **最早有效命中影格界線**：首張攻擊候選影格在 12:18:17.585 HKT（T0+7.105 秒，攻擊輸入後約 716 ms）可見首領身上的 **452** 傷害數字及已縮短的綠色血條。沒有逐影格量測實際扣血時刻；故 T_hit 位於第一次攻擊輸入 12:18:16.869 至該畫面取樣 12:18:17.585 之間。相應的 hit→win 區間為 **17.968–18.684 秒**，不宣稱精確命中影格。
- **T1**：12:18:35.553 HKT，UI 首次觀察到「誓鐘已恢復寧靜」與司鐘者倒下的勝利結果。終點截圖在其後約 72 ms 保存。UI 勝負文字以 200 ms 間隔輪詢，時間是首次觀察邊界。
- 實際輸入：初段右移 4.222 秒，再做 9 次約 200 ms 右向短步；正式樣本共點按 `2` 橫掃 17 次，未輸入重斬或普攻。每次可見 HP 下降後以約 150–168 ms 右向短步修正，共 7 次；依可見 HUD 用 Q 2 次、W 2 次。終點 HUD 為 507/712 HP、8/98 MP、Q×8、W×3。每次均是正常 UI 鍵盤輸入；策略、逐項輸入、5 秒 HUD 摘錄與清理狀態見 `browser/formal-run.js`、`evidence/formal-run-data.json`、`evidence/formal-run-summary.json`。

## 清理與檢查範圍

自有 CLI session `resume-boss-measure` 已關閉。只停止 ownership 記錄中的 harness PID 27340；停止前兩個 loopback port 51081/51082 都可連線，停止後該 PID 不存在且兩 port 都拒絕連線。啟動 ownership 與另存的 stopped record 均保留於 `browser/`。

沒有改遊戲 source、metadata、fixture 數值或 HP；沒有 build、測試套件、pack 或 release。沒有測音訊或首領 phase 聲畫；本報告只涵蓋這一次有界 UI 樣本。
