# Plan16 W04・Sand 正常路線續作 b10

日期：2026-10-27（香港時間）  
狀態：**進行中；原 profile 已恢復。q12 已完成並手動領獎；q13 首隻甲蟲已擊敗（1/2），正暫停等待第二隻定位審核。**

## 範圍與規格

只續作既有 Plan16 W04 的正常沙海路線：q12／q13 必要前置、q22 盆地支線，再至最多一次 q14 首領及手動領獎、確認 q15 可見。不建立 plan／排程、不發布，不改遊戲程式、beta19 成品或 ZIP，不重種、不讀寫遊戲 runtime 私有狀態，不重做已完成的 q11／q21。

本次完整讀取 `AGENTS.md`、Plan16 即時交接最新暫停段、Frost final、Sand live final、region-content 與 candidate 報告、live ownership JSON；Playroom 範本與其列出的 game-development、command-contracts、schema、release workflow、starter SDK、SDK versioning、save-compatibility 七份線上規格；以及 Playwright CLI skill、CLI reference 與 workflows。適用要求包括固定遊戲 ID／桌面 Lv30／原存檔、相對資源及跨來源 sandbox iframe、保存格式 1–5／寫 5、明確正常 UI 操作、只把實際 UI／raw 證據列為完成，以及保留原始存檔／最小必要驗收。本任務不涉及雲端 saved:true 或發布。

驗收目標：q12 三蠍與三枚琥珀鱗片、琉砂手動領獎；q13 兩隻日井甲蟲、琉砂手動領獎；q22 接取後擊敗兩隻日井甲蟲、正常進盆地並返回琉砂手動領獎；最多一次連續有界日井守衛作戰、q14 手動領取日井誓刃並確認 q15 可見。尚未實際完成的項目不會標 PASS。

## 恢復起點與所有權

從原 persistent Chrome profile `output/playwright/world-frost-beta19-b6/profile`，以新的 headless Playwright session `sand-resume-b10` 開啟凍結 beta19 dist。只在新目錄 `output/playwright/world-sand-resume-b10/` 複製並調整本地 harness／config；遊戲 origin 為 `127.0.0.1:64669`，host 為 `localhost:64670`。iframe sandbox 保留 `allow-scripts allow-same-origin allow-pointer-lock`，並補上 `allow="fullscreen; autoplay; gamepad"`。沒有改 dist 或來源。

開啟前以 host 權限核對原 profile 沒有 Chrome owner，且 64669／64670 無 listener。專屬 server PID 31500 由 bundled Node v24.22.1 啟動，兩個 listener 均屬此 PID；以 host GET 確認原 host wrapper 與 iframe 欄位。既有 repository dirty 保持原樣，本輪沒有修改其中任何遊戲來源。

## 起點保存與初始觀察

使用原頁正常按「繼續冒險」。標題頁顯示存檔可保存、角色 Frost QA B6 Lv30 劍士、上次進度為琥珀砂岸。HUD 在 Continue 後顯示琥珀砂岸、HP 653/712、MP 26/98、金幣 9,850、大紅藥水 18、大藍藥水 20；立即按 HUD「暫停遊戲」。Console 只有 Phaser 版本資訊，0 error、0 warning。

起點 raw 由 `http://127.0.0.1:64669` 的 `brightwood-first-oath:save:v1` 直接讀取。CLI 外層 JSON 字串只解碼一次後，將原文寫入本目錄並回讀比對：`resume-initial.raw.json`，1,466 bytes，SHA-256 `E311D8FE7A47C4C42902F09DDA43110BD87F4F80ED168753ACA40B9C181A7063`；與既有 q11／q21 claimed Sand seam 起點相同。保存格式 5、map `sand-glass-shore`、q11／q21 claimed、q12／q13／q22／q14／q15 均不存在（null）。HUD 手帳預設顯示 q12 標題只代表 tracker，不代表 q12 已 active；下一步必須由正常琉砂對話接取。

已按既定流程短暫解除 pause 160ms 擷取一張 JPEG，`sand-resume-unmasked-160ms-1280x720.jpg`（1280×720、q70、154,397 bytes，SHA-256 `6439D49C7526BFE222F6D173ACA0798703DF7DDB7575115F0310B1C373E0223C`），並於 finally 以 HUD 按鈕暫停；暫停對話回讀確認成功。原 Sol 通過此圖的場景／定位：英雄約畫面 x135、琉砂約 x330 且同地面，名稱標籤完整，HUD 指示「與琉砂交談」。

### q12 完成

琉砂正常對話明確接取 q12。對話顯示擊敗琥珀蠍 0/3、持有琥珀甲片 0/3；HUD「本機已保存」且 q12 raw 狀態 active。`q12-accepted.raw.json` 1,523 bytes，SHA-256 `888299AA61A7AADD7DCF4CE6933A092E548899C2B31EFEC1081246EE0F72BA19`，exact localStorage readback。

MP 26 時正常使用一次 W，大藍藥水 20→19、MP 26→98。首個重斬在 Sol 確認的距離外消耗 6 MP，未確認命中；之後按其校準建議再向右約 900ms。bounded 重斬至 q12 第 1 個擊殺，金幣 9,850→9,940（+90），HP 653→618、MP 92→74。首次 Z 先拾到地面金幣；按平台程式中最近物品、90 world px 範圍、每次單件的 pickupNearest 行為，正常再向右 400ms 後再按 Z，取得琥珀甲片 ×1。raw `q12-kill1.raw.json` SHA-256 `AA081E4C1BF7EFF3E7EE9ECD3AAB1E05A46EC146BDC9638159526A1F92A7761E`；拾物後 `q12-kill1-scale1.raw.json` SHA-256 `B54106793E88EBDB302C5684D3E9FFBADBA554A338AC2B0D6884F5CC0CCF1EA8`。兩者均為 exact localStorage readback。

等待一次正常刷新後，最多三次重斬沒有增加擊殺數、金幣或鱗片；HP 618→544、MP 74→56，q12 仍為 kill1／scale1，隨即 HUD pause。保全 raw `q12-second-spawn-three-heavy-unresolved.raw.json`，SHA-256 `CA868E45E6B979017802F2FF218F91D620168F82E0BE80EB03D2AD900B2CEDCF`。為定位這次狀態短暫未遮擷取 `q12-second-spawn-unresolved-1280x720.jpg`（1280×720、q70、156,937 bytes、SHA-256 `C6832D49B03CA5485CD8B1AEF2D691F46868D596B7772A57D6F2A99F57DDD594`），隨即 HUD pause，待同 Sol 檢視。

同 Sol 指示當前蠍略在左側、角色朝右；依其指示短按 Left 150ms 轉向，HP 544 時正常用 Q，接著左向重斬擊敗第 2 隻並拾取第 2 枚鱗片。其後等待正常刷新，依角色相對 spawn 的位置向左轉向，bounded 戰鬥後 HUD 顯示 q12 完成、kill3／scale3。raw `q12-kill2-scale2.raw.json` SHA-256 `55DFEBB2F9E6A472BFFD7AB7CA5DB90642710990B6CD3B377042884BB17D5B7F`；完成 raw `q12-ready.raw.json` SHA-256 `3E67FDC2838326C35B4225F5708B6D7E0670DD8C7F3FB44B00C97A71220E7666`，均精確回讀 localStorage。之後沿正常西返門回到琉砂，對話中手動領取，UI 顯示 +1,400 金幣、q12 claimed，coins 10,120→11,520。raw `q12-claimed.raw.json` SHA-256 `4ED5EDDACDED2579E8A68513FDD48AF505C82D2AB945C468A1011906C5FE67C1`。

### q13 目前進度

q12 領獎後在琉砂對話正常接取 q13「日井古道」；HUD 目標為擊敗日井甲蟲 0/2。raw `q13-accepted.raw.json` SHA-256 `97B612931596A542198549F649FAA7C38A15572B1068083F0CB325F3F8FEB5ED`。沿海岸正常向東至入口，HUD 確認切換至 `sand-dune-pass`；raw `q13-dune-entry.raw.json`（1,634 bytes）SHA-256 `EF2FB5FCB747EEA08212165C918A5EF658671BC186081BE3ACB2D5E6F68365D8`。

一個 bounded 位置接近及首次重斬後，當下 HUD 仍顯示 0/2，HP596/712、MP32/98，故先保留暫停畫面交同 Sol 核對；未重打或補截。圖 `q13-first-beetle-heavy-unmasked-1280x720.jpg` SHA-256 `9C4D991C3430F1EE98165D846D23C139D882B15D871224509069D3985BAD10AB`；raw `q13-after-first-heavy.raw.json` 1,634 bytes，exact localStorage readback，SHA-256 `AB43A50049D24D9C02D113B54C3183C0EE41E5FE1F036F6D5A6111E7BBE8F3D6`。同 Sol 從圖確認日井甲蟲右半血條已暗、白色 620 命中數字、角色與目標接觸；指示保持朝右打一記重斬。HUD 隨後確認 q13 kill1/2，HP596、MP32→26；raw `q13-kill1.raw.json` 1,634 bytes、SHA-256 `B30744E15BD1520874020EF14F8DADB543B0CE02356F00990AAE4C817F0205E3`，exact localStorage readback。

之後沿地面向東正常移動 4 秒到第二目標附近，HP／MP／q13 counter 不變，未攻擊。為只確認新目標的距離與方向，短暫解除 pause 160ms 擷取一張 JPEG 並立即 HUD pause：`q13-second-beetle-unmasked-1280x720.jpg`，1280×720、q70、123,567 bytes、SHA-256 `E1D01C3102E4F3C8ED3F8CD1BDDAAA49B53CB329A103183CA8E6891EB7E6088D`。圖已送同 Sol 檢視；目前暫停等待定位建議。

## 靜態路線核對

`recordQuestEvent` 只對 active quest 按 objective type／target ID 累加 kill；不按當前 map 篩選，對 q22 接取後在沙海任一正常擊殺日井甲蟲可計數。q22 reach 由 `visitedMaps` 判斷。琥珀蠍 `amber-scale` 掉落率為 1，數量 1；刷新時間 9 秒。以上為來源靜態核對，不代替實際 UI 驗收。

## 未完成與下一步

- [x] 找回原 profile／固定 origin，正常 Continue，保存起點 raw。
- [x] HUD pause；短暫未遮畫面並由同一 Sol 核准場景與琉砂位置。
- [x] 琉砂正常接取 q12；三隻擊殺、三枚鱗片、手動領獎均由 HUD／raw 確認。
- [x] q13 正常接取並由 HUD 確認進入砂丘關道。
- [x] q13 首隻甲蟲擊殺由 HUD/raw 確認。
- [ ] root／Sol 核對 q13 第二隻定位；完成擊殺與手動領獎，再正常接 q22／進盆地。
- [ ] 之後正常接 q14；最多一次有界首領 attempt；若勝利則手動領獎並確認 q15 可見。
- [ ] 保存各實際里程碑 raw、SHA 與 UI 結果；結束前確認原 profile、session、server／ports 所有權並只清理由本 agent 建立的資源。

q12 已 claimed。q13 active、kill1/2，手動領獎尚未完成；q22／q14／q15 尚未操作或驗證。q12 第二次刷新曾有三次未確認命中，已依定位回饋調整朝向後正常完成；不把先前無進展的攻擊記作擊殺，未修改或補造任務資料。
