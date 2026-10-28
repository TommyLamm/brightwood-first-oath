# Plan16 W03-05／W07-03：q09／q10 正常閉環

**狀態：PARTIAL／RESOURCES_CLOSED**（2026-10-27 香港時間）。本輪只補正常 q08→霜雪的 q09／q10 接縫；q21、q11 及 Guardian 戰已有閉環，沿用不重做。q11 可見即停，不前往沙海。本次 b18 在根指示下於已開始的短段完成後停止，q09／q10 正常閉環尚未完成。

## 規格與邊界

已完整讀取 Playroom `game-agent-template.md` 及其列出的七份 main 文件：`game-development.md`、`command-contracts.md`、`game.schema.json`、`game-release.yml`、starter `playroom-sdk.js`、`sdk-versioning.md`、`save-compatibility.md`。另讀 Plan16 roadmap 的 W03-05／W07-03、Frost 彙整與 baseline Frost 段、beta20 候選記錄，以及 live-handoff 頂部當前摘要。Playwright skill 與 CLI `running-code.md` 亦已讀。

適用範圍是以新空 profile 正常續作原 q08 format4 副本，透過遊戲 UI 明確備份升級至 format5，再按「繼續冒險」。只驗 q09／q10 正常接取、擊殺／採集及雪芽手動領獎；不改候選 source／version／dist／ZIP、不 build／tests／pack／發布。

## 起點、格式升級與首次霜雪入口

- 原始檔 `output/playwright/resume-1515/q08-claimed-format4.json` 僅讀，1492 bytes，SHA-256 `d257d1382d915523918b93a411a2f04490e48aabb3c166403cf32088aec490ed`；逐字副本為 `output/playwright/world-frost-q09q10-b15/q08-seed-format4.raw.json`，雜湊相同。新 profile 的 canonical key `brightwood-first-oath:save:v1` seed 前讀為 null；詳 `seed-proof.json`。
- Title 正常顯示「本機存檔升級確認」，並說明先備份 format4、升至 format5、確認前不改原件。按「備份 format4 並升級繼續」後，format4 備份 raw 與原 seed 逐字相同（1492 bytes，同 SHA）。format5 起點 raw SHA-256 `49c027e32d506db0061bf6ece1368cbda409c1a6ae5fca9ad002ee78dd520b3d`；player state 未變，q08 claimed，q09／q10 尚無狀態。隨後以 title「繼續冒險」正常載入。
- HUD 起點為赤岩山徑、晨行者 Lv30、HP712、MP86、5056 金、紅／藍藥各9；任務手帳目標為雪痕海岸雪芽。沿東門正常通過赤岩山徑→古礦入口→守衛祭壇→雪痕海岸，Guardian 未重打。首次 Frostshore entry raw 為 1508 bytes、SHA-256 `7c4e2a6095df028de4b4ada0c68809c23372b2d75e19e0b07f29ce130b73dfb2`：format5、`frost-shore/left`、q08 claimed、q09／q10 未領、Lv30、HP493／MP86、5056 金、紅／藍藥各9；raw 已保存在自有證據目錄。

凍結候選使用 `artifacts/world-completion-beta20/dist/`，tree SHA-256 `82f1135c23e4cad62c3c89335e7647de49c543a3960a9f2eeb1c575a81a0bcc0`。自有 server 將其掛於 `/preview/beta20/`，parent/game 為 4177／4176 兩個不同 origin，iframe 設定 `sandbox="allow-scripts allow-same-origin allow-pointer-lock"`、`allow="fullscreen; autoplay; gamepad"`。profile、session、PID 與 ports 記於 [owner.json](../../output/playwright/world-frost-q09q10-b15/owner.json)。

## 最後實際進度與安全交接（2026-10-27 23:48 HKT）

已依根的收束指示完成當前短段後停止額外等待／攻擊與 q10 重演。開始段落時正常按「繼續遊戲」，確認暫停標題消失，以一般點擊聚焦 iframe canvas，公開 DOM 顯示 `activeElementTag=CANVAS`、`document.hasFocus=true`；先作4秒無輸入等待，再 Left 探路1000ms、全放開、純重擊2次（各完整等1000ms）、Z拾取4次（間隔250ms）。攻擊／拾取後HP679/712、MP8/98，MP低於18後正常按W；最後全放鍵並HUD暫停，標題計數為1。操作摘要與結果保存在 `output/playwright/world-frost-finish-b18/40-q09-left-probe-heavy-pickup-result.json`。

最新 HUD 為雪痕海岸、q09 active、`持有 霜牙 3/6`、金幣5,206、HP679/712、暫停；背包與當前存檔確認霜牙3枚、冰殼0枚、q10缺省。存檔為format5、`frost-shore`、HP679、MP98（W後）、金幣5206；從遊戲 iframe 對 canonical localStorage raw 連讀兩次完全一致，證據 `output/playwright/world-frost-finish-b18/42-final-live-save.raw.json`，1621 bytes，SHA-256 `8226fe89e8a85dc5493046e5882bc8fcbd357628666a378a0e8674a092b9136a`。同段 HUD 摘要見 `output/playwright/world-frost-finish-b18/43-final-live-summary.json` 及 `41-q09-after-left-probe.snapshot.json`。

q09 尚未 ready／claimed，缺3枚霜牙；q10 尚未接取／驗收，q11 未到達。因此本報告不宣稱完整Frost正常鏈PASS。若由根另行恢復，剩餘既定範圍仍為正常取得6枚霜牙並向雪芽手動領q09、正常接q10／擊敗6隻冰甲蟹並持有4枚冰殼／手動領q10，q11可見即止；本次已按根明確指示停止，沒有自行繼續。

清理前已核實 PID32480 執行 b15 `serve-candidate.mjs 4176 4177` 並獨佔兩個port；Playwright `close` 回報 session `world-frost-q09q10-b15` closed，之後只停止核實的 PID32480。4176／4177現無listener，daemon35192及使用b15 `profile-chrome` 的Chrome程序均已退出；profile與全部原始證據保留。未修改玩家原q08檔、遊戲source、版本、dist或ZIP；本輪沒有新增或重跑tests／build／pack／publish。
