# W04・沙海有限瀏覽器補證（b6）

日期：2026-10-27（香港時間）  
狀態：**PARTIAL／未到達沙海 q22 路線；本地候選未驗發布**

## 依據、範圍與適用要求

本輪讀取根目錄 `AGENTS.md`、Plan16 W04、[region-content](world-completion-region-content.md)、[candidate](world-completion-candidate.md)、[ui-browser-b4](world-completion-ui-browser-b4.md) 中環境／隔離段，以及 Playwright skill、CLI reference 和必要的 `run-code` CLI reference。開工前透過網路工具完整讀取 Playroom `game-agent-template.md` 與其中七份 main 規格；本輪適用要求沿用原遊戲 ID、Lv30、desktop、既有 canonical namespace、相對資源與真跨來源 sandbox iframe；不讀寫真實玩家資料、不發布；synthetic fixture 不得表述為連續通關。W04 驗收重點為 q22 接取後 basin reach＋兩隻甲蟲擊殺及手動領獎、q22 不鎖 q14/q15，以及必要時最多一次有界的日井首領／警示補證。

唯讀使用凍結候選 `artifacts/world-completion-beta19/dist/`，bundle `assets/index-DJXQwIzk.js`，SHA-256 `7756f44c6e5c2861bb752f4051ce2335f78eac8f7b9b82a2f1760aff5ef7bd56`。自有 Playwright session/profile 為 `sand-beta19-b6` 與 `output/playwright/world-completion-sand-b6/profile/`；以本機兩個隨機 port 形成 `localhost` host → `127.0.0.1` game 的跨來源 iframe，sandbox 為 `allow-scripts allow-same-origin allow-pointer-lock`。候選 dist 僅供 server 讀取。

## Fixture 與起始驗證

在新空 game origin 只種入一次自有 format5 fixture；**沒有覆寫既有 q08raw 或其他 profile**。fixture 明確設定 q01–q13 `claimed`、q14 `active` 且計數為 0、q15/q20/q21/q22 省略；位置為 `sand-glass-shore/left`，已訪地圖包含 town 與沙岸、不含盆地。角色為合法 Lv30 劍士（heavy-strike 10／vitality 5／rest-recovery 6、冰潮長鋒／鐵環甲、HP 760／MP 98、大紅×3／大藍×2）。

使用 repo 現有 TSX loader 產生並驗證 fixture：`prepareSave` 通過；`createPersistence.initialize` 回 `ready`；validation 期間 0 次 storage write；寫出後 strict read-back 與 reload 後 canonical raw 均逐字一致，SHA-256 `0a46bb2a45937ca385f67c3ac7f78729df9964ec31cd93dce9e313ef8debf765`。完整 fixture 與驗證摘要見 `output/playwright/world-completion-sand-b6/fixtures/`。

## 實際操作與結果

- 以真實跨來源 iframe 的「繼續冒險」正常載入 fixture；HUD 顯示角色 Lv30、沙岸位置及預期藥水。由 `sand-glass-shore/left` 直接按 Space 時，角色在西側出口轉到雪痕海岸；當時位於 x=100 的西門，並未到琉砂互動距離。這是本輪實際操作結果，並非 q22 接取或 Frost 驗收。
- 隨後一次 Space 從雪痕海岸右側入口轉入霜松隘道，再由西側出口正常回到雪痕海岸；未接 Frost 任務、未打 Frost 怪。所有後續有限控制均按實際 HUD 暫停，使用 `try/finally` 釋放鍵，snapshot 確認「怪物與時間都已停止」。跨區時 HP 由 760 降至 660，MP 保持 98；沒有戰鬥勝利或任務進度。
- Sol reviewer 審閱自有 `screenshots/frost-shore-return-paused-960x540.jpg` 後指出暫停面板遮住角色與門；再依其要求只做一次 Escape 原地取圖並立即 HUD pause，審閱 `screenshots/frost-shore-visible-960x540.jpg`。Sol 回報畫面沒有可辨 portal／目的地標籤，HUD 狀態為「附近沒有可以互動的對象或出入口」，不能由圖像判定到沙門的距離。沒有自行判定視覺 PASS，也沒有再截同類圖。
- 依 root 指示做一次 3.2 秒有界東側探索並跳躍，完成後立即 HUD pause。snapshot 仍顯示雪痕海岸、HP 660／760、無「前往琥珀砂岸」或 Pine 標籤，且沒有可互動出口提示。依停止條件未再盲走、未再按 Space，也未嘗試日井首領。
- 因未抵達琥珀砂岸，本輪未接 q22、未抵達日井盆地、未擊退兩隻甲蟲、未手動領 q22 獎勵；q14 首領預警／勝利／離場／q14 領刃／q15 交接全部未驗。這些均不作 PASS 或完成宣稱。

## 檢查點與交接

- `fixtures/sand-q22-start-format5.json`、`fixtures/fixture-manifest.json`：source strict validation 與原始 fixture SHA。
- `fixtures/canonical-seed-readback.json`、`fixtures/canonical-after-origin-reload.json`：一次種入後 read-back／reload raw SHA。
- `checkpoints/01-unexpected-west-portal.json`、`02-return-transit-frost-pine.json`、`03-frost-shore-return-position.json`、`04-east-scan-no-portal.json`：各實際里程碑的 full canonical raw。最後 checkpoint SHA-256 `aa32efbc5ae0b20f01bd3216056e97f91d2a82df51a0796d0ef8a0798f984051`；format5、SaveData location `frost-shore/right`、HP 660、MP 98、q14 active、q22 省略。中途位置不由 `spawnId` 推斷。
- 自有 browser profile、fixture、checkpoint、log 及 JPEG 均保存在 `output/playwright/world-completion-sand-b6/`。本輪只有指定 fixture `prepareSave`／`createPersistence.initialize` 驗證與有限真瀏覽器操作；未執行套件測試、build、pack、ZIP validate、雲端、正式 preview、commit、tag、Release 或平台操作。

## 下一步

目前 profile 的 canonical SaveData 已是雪痕海岸檢查點，不可當作最初沙岸 fixture 或連續通關證據；原始 format5 fixture 及 SHA 仍保存在自有目錄。若要繼續 q22，應由 root 決定是否在新的獨立空 origin/profile 使用該原始 fixture，先從 left spawn 向琉砂接近後再互動；不要在此 profile 直接重種。此輪停在可恢復的 paused browser state，root 可依本報告與最後 raw checkpoint 收束本機驗收。
