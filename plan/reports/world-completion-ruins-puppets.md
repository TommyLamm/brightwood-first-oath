# W05：回聲長廊兩隻斷弦木偶補證

日期：2026-10-27（HKT）  
範圍：僅補 q17 兩隻 `ruins-string-puppet` 的正常 UI 擊殺，不重做碑文、交任務或其後任務。

## 結果

在凍結的 beta.19 build（`artifacts/world-completion-beta19/dist`，bundle `index-DJXQwIzk.js`）中，以 Playwright CLI 操作正常遊戲 UI。暫停前後的任務手帳由 **擊敗斷弦木偶 0/2 → 1/2 → 2/2**；最後畫面顯示「任務完成，向行舟回報」。兩座回聲碑維持 1/1。q17 留在可回報狀態，沒有領獎；q18、q19、背包、旅冠及再戰內容均不在本次範圍。

這是獨立驗收片段，不代表從新遊戲開始的連續通關：只讀目前規則建立一次 formatVersion 5 合法檢查點，q01–q16 標為已領、q17 active，兩碑為 1/1、木偶為 0/2，角色 Lv.30，位置為回聲長廊左側。初始原始存檔經 strict validator 驗證，載入重整後 SHA 相同，再透過正常 Continue 進場。沒有載入或改動真實玩家 profile，也沒有在執行時改 HP、任務、位置或敵人狀態。

操作使用普通 UI：以 Q 使用現有紅藥水、有限度向右移動、面向木偶用快捷鍵 1「重斬」，每段釋放按鍵並用遊戲 HUD 暫停。第一隻死亡後已保存 1/2 checkpoint；第二隻進場時的重斬未立即增加任務數，依序再作有限靠近與正常重斬，最後一次操作後計數到 2/2。只以 HUD 任務計數與敵人消失判定完成，不以傷害數字或畫面像素推斷碰撞距離。操作中沒有刻意攻擊巡鈴石獸。

## 存檔證據

所有原始字串均從瀏覽器儲存狀態擷取，並以目前 `validateSave` strict validator 驗證、確認 canonical value 未變後保存。每個檔案是該步唯一擷取的 raw save。

| 階段 | q17 木偶計數 | SHA-256（raw JSON） | 檔案 |
|---|---:|---|---|
| 操作前 | 0/2 | `3bebdbeaa8145078f92d1d1a46a92112707cc0916bf82a2e3625edfd9ce03516` | `output/playwright/world-ruins-puppets-beta19/q17-start-raw.json` |
| 第一隻後 | 1/2 | `5205f8181125286ab052dfd7d07aa7e3cf7711978e36ca0534e6991bcee3caa1` | `output/playwright/world-ruins-puppets-beta19/q17-after-first-puppet-raw.json` |
| 第二隻後 | 2/2 | `1dcf7c801c8dcd9fcea024ef2f0fe7e0dd00939bfe8d2d2848adfd84ee1995eb` | `output/playwright/world-ruins-puppets-beta19/q17-after-second-puppet-raw.json` |

最終存檔 strict 驗證摘要：formatVersion 5；q17 `active`、兩碑各 1、木偶 2；q18/q19 缺席、q20 不存在；HP 606/712、MP 56/98；位置仍為 `ruins-echo-gallery/left`。最終 raw 1,936 bytes。

## 畫面與執行紀錄

- 結束畫面：`output/playwright/world-ruins-puppets-beta19/04-q17-puppets-complete-review.jpg`（1280×720、JPEG q70、109,076 bytes）；原截圖：`output/playwright/world-ruins-puppets-beta19/.playwright-cli/page-2026-10-26T18-15-00-578Z.png`。
- 第一隻擊殺暫停畫面：`output/playwright/world-ruins-puppets-beta19/.playwright-cli/page-2026-10-26T18-04-45-626Z.png`；可見 1/2、敵人倒地及掉落金幣。掉落未拾取。
- 第二隻接近縮圖：`output/playwright/world-ruins-puppets-beta19/03-q17-second-puppet-approach-review.jpg`。視覺審查回報角色面向右；第二隻在右側；先前重斬後其血條可見段顯著縮短，但左端被暫停面板遮住，不能量剩餘血量或從像素推出碰撞距離。畫面中的巡鈴石獸為非目標。
- 瀏覽器 console：0 errors、1 warning。唯一 warning 是父層 harness `http://127.0.0.1:57441/` 的 iframe `allow` 屬性會優先於 `allowfullscreen`；未見遊戲端 console error。
- 音訊未實際聆聽，故不作通過判定；此 headless 瀏覽器為靜音設定。

## 清理與限制

本次沒有修改 `src`、測試、build、pack、metadata 或真實存檔；沒有執行自動化測試、build 或發布。既有其他驗收結果未在此重做。

已關閉本次 Playwright session `world-ruins-puppets-b5`；專用 Node harness PID 23272 已在核對命令列及兩個 listener 後停止，127.0.0.1 的 57440/57441 listener 均已消失，記錄在 `output/playwright/world-ruins-puppets-beta19/cleanup.json`。CLI session list 中其他 Sand/Frost session 保持原狀。

一次誤將 `.js` 直接交給 Windows 檔案關聯，啟動了 Cursor PID 30864，命令列指向本次 Playwright CLI 及 session。已核對 PID、命令列及起始時間，僅呼叫一次 `CloseMainWindow`；程序回報沒有主視窗且未關閉。沒有強制終止、操作其 UI 或處理任何提示，依範圍記錄為仍存在的操作殘留。
