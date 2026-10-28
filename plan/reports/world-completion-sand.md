# Plan16 W04・黃金沙海收尾彙整

2026-10-27。**SOURCE_READY／FOCUSED_PASS／Q12＋Q13＋Q22＋Q14正常閉環完成**。已正常南航入遺跡；精確預警時長／無傷躲避仍未驗。本檔不將合成前置、舊外觀圖或按鍵次數當成從零連續通關證據。

| 地圖 | 已交付內容／實際結果 | 尚待本輪完成 |
| --- | --- | --- |
| 琥珀砂岸 | q12／q13已正常領1400／900金；q22／q14也正常手動claimed，分別＋600金紅4藍2／＋1800金誓刃1；q15正常接取並由南梯出航 | 不重做已通過的出售／滿袋矩陣 |
| 砂丘關道 | q13真正2/2並正常claimed；q22接取後另兩次新擊殺2/2，正常東進盆地與西返岸上 | 舊1/2文字已以actual raw校正，不重打已完成目標 |
| 日井盆地 | 已正常抵達reach1/1，與active後kill2/2組成q22；首領勝利後正常由此西返關道，最後琉砂手動claimed | 盆地支線仍不鎖主線／南航 |
| 日井祭壇 | 原同attempt正常勝利counter1、返回盆地／西返手動領q14，誓刃僅1把；原Sol確認一幀黃框粉紫預警可見 | source900ms非逐幀實測，未宣稱無傷躲避／全程時長 |

來源及核心案例見[region-content](world-completion-region-content.md)：q22 reach沿用已到訪語義、kill只在active時累加，不限制必須在盆地擊殺；同種甲蟲在砂丘關道正常擊殺也有效。已過Frost／sidequests／Sunwell相關案例，沒有為本輪玩法重跑未改邏輯。q22獎勵為600金／大紅4／大藍2，與q14／q15前置獨立。

當前可續作證據見[b10正常路線](world-completion-sand-resume.md)：q12 claimed raw SHA `4ed5eddacded2579e8a68513fdd48af505c82d2ab945c468a1011906c5fe67c1`，q13第一隻擊殺 raw SHA `b30744e15bd1520874020ef14f8dadb543b0ce02356f00990aae4c817f0205e3`。b10因用量限制中斷，全新Luna Max b12接原profile／origin，結果記[後續操作](world-completion-sand-finish.md)，不能提前將其未執行項目標PASS。

b12接手時先核原session暫停及server所有權，兩次讀回canonical raw一致：`b12-current-before-actions.raw.json` 1633B、SHA `6802145ccb0ffc461c66c8047cd7a54396fecb43208a4ca7492ddddb5f926220`。q13在現存進度已是2/2，HP490／MP8／金11520；所以只續正常返程領獎，不重打第二隻或用舊1/2資料覆寫。此為現存raw核對，沒有假稱b12親自補打或補造中斷時的戰鬥時間。

q13已正常向琉砂手動交付：`sandshore-after-q13-claim-click.raw.json` exact readback，q13claimed／beetle2，金11520→12420（＋900），HP414／MP8，紅17／藍19。q22／q14此時仍未接；下一步分別正常接取兩者，一趟關道新擊殺／盆地reach／祭壇attempt，最後各自手動回報，不增加重複往返。

q22／q14其後均已正常active0；接取後Dune第一隻新甲蟲已實際擊敗，`dune-q22-kill1-paused.raw.json` SHA `10e2caca7f64fa53fa3120ee1be2caab2a68673e502831470829819827fadd87`，q22kill1/2、HP513／MP74。原Sol審唯一必要定位圖確認甲蟲在hero右約210–220px、綠條約剩左半；不採用Luna先前「看似滿血」的圖像判斷。該圖後b12已正常移動／擊殺，後到的位移建議不重複執行；新操作以當前paused raw為準。

兩新擊殺後已正常通過Dune東門進日井盆地：`basin-q22-ready.raw.json` SHA `094126d8730948ee00f19865007c1f84db9e74d1f902af819c3839c7f9a40bde`，q22仍active、reach1／kill2均完成，尚未領獎；q14active0。HP676／MP38、紅14／藍18，HUDpause確認。b12精簡續報與owner已寫入，再正常補MP往祭壇；不先將active ready寫成claimed。

已正常入祭壇，q14同一attempt進行中。首兩張身份／接近圖未捕到warning，原Sol不以檔名或source900ms當實拍證據。後因大量攻擊輸入與補給消耗但尚未勝利，root要求停止盲耗，只補一張當前圖 `altar-sentinel-current-paused-1280x720.jpg`；Sol確認boss綠條剩左半多（確有受傷，但不把約48次keydown當48命中），hero在左約270畫面px、被拉開，同地面無障礙，且首次清楚可見黃框粉紫矩形約x645–900／y400–560、hero在左外。**本幀預警範圍可見性PASS，900ms時序及無傷躲避仍未量／未證。** root只讀source核boss7200HP／30DEF／attackRange190、heavy前向reach85、boss免擊退而player會被擊退；未改數值或renderer。依同Sol改正常跳避／短步跟進及1–2擊短串，仍為同attempt、不重開，不再逐擊補圖。當前raw結果見b12續報；勝利／q14claim未確認前不預寫PASS。

22:34續作後fresh b17從原paused session接手，無reload／重開／seed；改純重斬每次完整等待1000ms，配合短步跟進，正常贏得同attempt。victory raw `output/playwright/world-sand-closure-b17/altar-q14-victory.raw.json` 1786B，SHA `40595b79b4b6ad514891bc9b8a4ffe7a423c50bffc9599b73118d88b745fc2e7`，q14active／sentinel1、q22ready、HP378／MP74、金12420、紅2藍11。UI明示守衛已被擊敗；b17停止攻擊，現在正常返盆地／關道／琉砂。此刻還未領q14／q22，不提前計金幣或誓刃，完整閉環待手動claim與q15接縫。

其後b17已完成整條正常返程與交付，詳[閉環報告](world-completion-sand-closure.md)：q22 claimed raw SHA `835f3edcfc4839e0c903345f791eca0d4e7da0cf215c570c4dee79cbfdaf964f`，金12420→13020、紅1→5、藍11→13；q14 claimed raw SHA `bd5c5405883dd174660f6a453f2cbeb8a474eaea42c73e6862ab228b0987ed97`，金13020→14820、日井誓刃1。q15正常接取後由岸上梯160爬至南航平台、Space實際進 `ruins-tide-camp`，entry raw SHA `c19213aaa86ff76aacfbb67b92e3c2876d7e720f46387b427bf3395ecc5ca89c`，q14／q22claimed，q15active／營站reach1，HP252／MP74／金14820／紅5藍13。未進一步遊玩遺跡，來源／成品未改，服務清理以b17報告最終段為準。

早先固定時長位移、暫停遮圖、普通攻擊混入動作鎖，以及另一包CLI wrapper／exec等待問題均不直接當成遊戲缺陷。公開focus probe確證trusted方向鍵可達CANVAS，後續Sol新圖也確證角色已移至門另一側；正常短移與等載入完成即成功過門。沒有據這些操作失敗盲改portal範圍、移速、首領HP、renderer或存檔。

同一Sol已確認此原Frost profile的Sand場景可見，並校準必要的蠍／甲蟲距離與朝向。另一個舊Sand profile的均一灰畫面個案仍保留[最終報告](world-completion-sand-final.md)及[靜態稽核](world-completion-canvas-audit.md)：原因未知，不因本輪可見而撤回，也沒有猜改renderer。沒有重種原續作profile或重載補血。

本期不重做完整拾取／出售矩陣，不用舊資料直接將q22設claimed，不量含pause的首領時長；Lv30經驗回饋顯示MAX，沒有假稱繼續升級。服務、存檔與當前操作所有權見[即時交接](world-completion-live-handoff.md)。
