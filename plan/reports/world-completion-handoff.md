# Plan16 當前交付與驗收邊界

## 本輪收束（2026-10-27夜間，優先於下方階段紀錄）

**beta20 SOURCE_DELIVERED／ZIP_VALIDATED／LOCAL_ACCEPTANCE_PARTIAL。** 本期四區18圖的內容、導航、q21／q22、格式5明確備份升級、任務手帳／世界回顧與航標辨識已交付；沒有發布。航標新位置正常爬梯／調查與同Sol本1280構圖已通過。Sand原同attempt日井守衛勝利、正常西返手動領q22／q14、接q15並由南梯實際進潮痕營站已全閉環；金14820、紅5藍13、誓刃1、q14／q22claimed、q15active/reach1。詳[Sand closure](world-completion-sand-closure.md)。

Frost真q08原件副本正常升級／出航，最後q09active、霜牙3/6、HP679／MP98／金5206，q09未ready/claimed、q10未接。最終raw SHA `8226fe89e8a85dc5493046e5882bc8fcbd357628666a378a0e8674a092b9136a`，詳[最小驗證收束](world-completion-frost-finish.md)。q09／q10本期核心未改且已有focused證據，撤回完整舊鏈重刷擴張；未重演不改PASS，也不重開profile繼續刷來填勾。原始玩家q08檔再次核SHA仍為 `d257d1382d915523918b93a411a2f04490e48aabb3c166403cf32088aec490ed`。

Sand／Frost兩named session、相應QA Chrome與核實自有server31500／32480已關，64669／64670／4176／4177均無listener；profile/raw/原件/dirty全保留。沿用未改且已過的5相關案例、typecheck/content、beta20一次build及固定tools1.2.0 pack/fullvalidate，不重跑全回歸或未改候選。預警範圍一幀可見，但精確900ms、無傷躲避／可聽音訊／正式平台雲端／原生與沉浸模式及另一舊profile灰畫面原因等仍按報告保留未驗，不宣稱整體CANDIDATE_READY、從零通關或全程時長。

**新排程04-05：2026-10-28香港04:05一次性續作已建立更新。下一份基礎體驗改進計畫必須派全新GPT-6.1 Sol Extra High（gpt-6.1-sol／xhigh／fork none），寫入repo的下一個未使用plan編號並更新索引，寫好即停止，不實作、不增加新遊玩內容。** 不再建立無限計畫／排程或自行發布；舊06:30限制已由此新授權取代。新計畫以真實產品問題為依據，不直接把CLI wrapper／計時或焦點操作錯誤當遊戲bug。當前實際狀態見[即時交接](world-completion-live-handoff.md)。

## 先前階段紀錄（保留來源，當前以上方收束為準）

2026-10-27使用者再次明確恢復，只收尾既有Plan16。**beta20 SOURCE_DELIVERED／ZIP_VALIDATED；航標正常調查與同Sol單點視覺PASS，整體LOCAL_ACCEPTANCE仍PARTIAL。** q12／q13已正常手動claimed，fresh b12在原profile續q22＋q14；fresh b15從正常q08原件副本補出航與q09／q10缺步，q21／q11不重做。詳[沙海彙整](world-completion-sand.md)、[霜雪彙整](world-completion-frost.md)及[當前操作權](world-completion-live-handoff.md)。**下方06:30及暫停段均為歷史快照，以上方摘要與即時交接為準。** 不新增plan／排程或發布。

最新候選已凍結為 **beta.20／BUILD_PACK_VALIDATE_PASS**，入口 `artifacts/world-completion-beta20/dist/index.html`，ZIP `artifacts/world-completion-beta20/game-beta20.zip`，131520177B／274entries，SHA `154cfc4e24c20c067a0849ce7a96aeea3e9e114d9db79c8dbbdab13127bda8bf`；source指紋 `ba7ab266f6520cd450bf9971f48fe51f9a0101a0e280917bbef31137c5d8063b`，dist／ZIP-entry指紋 `82f1135c23e4cad62c3c89335e7647de49c543a3960a9f2eeb1c575a81a0bcc0`。詳[新候選報告](world-completion-candidate-beta20.md)。beta19保留，沙海仍在其原profile／原凍結成品正常續作；beta20只修航標位置／精確validator及版本，不把beta19的實測冒稱beta20重新全流程通關。

b12接手先核現存q13實際2/2，沒有依舊1/2交接重打；正常回琉砂領900金，coins11520→12420，q13claimed。q22＋q14現已各自正常active0；合法W補給MP8→98、藍19→18，沿既有路線續行。新航標由b14正常走梯／調查，原Sol確認1280構圖全名避開手帳、石碑／平台／梯頂關係合理，毋須新素材；b14服務已清。b15只補上述正常q08副本的霜雪缺步，不重做已完成部分或全回歸。

歷史日期：2026-10-27，香港時間06:30最後一輪，曾依使用者「完成現在的步驟後先暫停」收束為 **PAUSED_BY_USER／SOURCE_READY／ZIP_VALIDATED／LOCAL_BROWSER_PARTIAL**。此後使用者已明確恢復，歷史暫停不再作停工指示。本機程式與候選已交付；仍須逐項依證據判定 `WORLD_CONTENT_COMPLETE` 與整體 `CANDIDATE_READY`，更不代表已發布／上架。

## 交付內容

遊戲 `brightwood-first-oath`，版本 `1.0.0-beta.20`，desktop、單人劍士、Lv1–30。四區18圖、19條主線及q20／q21／q22三支線。新增霜雪航標調查、日井盆地探索、四區主支線手帳、q19領獎後可重開的世界回顧；修正首領存檔地名及第一章後續引導。沒有開第五區。

本期沒有增加等級上限、追發歷史獎勵或為延長戰鬥而增加司鐘者HP；保留8000HP／28DEF及節拍。原高輸出約18秒樣本低於歷史45–80秒參考，仍明列未達該參考，不能改稱全配置平衡已通過。數值、補給與取捨見[設計報告](world-completion-design.md)。

q21：q09 claimed後向雪芽接取，爬既有霜松高台調查航標，再回雪芽手動領500金、大紅3／大藍2。q22：q13 claimed後向琉砂接取，到日井盆地並在任務期間擊退兩隻甲蟲，再手動領600金、大紅4／大藍2。兩支線EXP0、只領一次、不鎖主線與跨區入口。相關計數、滿袋及主線獨立性由focused cases覆蓋；實際遊玩證據另外列出。

## 18圖交付表

下表的「沿用」指[基線逐圖來源](world-completion-baseline.md)中對應報告，不把舊版本的局部證據擴稱beta19全流程通過。未改地圖不為補截圖而重玩。

| 區域／地圖 | 實際用途與本期處理 | 路線／驗收依據及限制 |
| --- | --- | --- |
| 木葉・camp 晨光營地 | q01移動／攻擊／拾取教學，保留 | 沿用正常first-run q01–03；無本期碰撞／素材變更 |
| 木葉・town 木葉鎮 | 職業、補給、手動回報；新增q19世界回顧與自由探索指引 | 沿用q19正常領獎；beta19獨立fixture實測回顧重開／reload，非四區連續通關 |
| 木葉・forest-edge 嫩芽林道 | q03／q05路線與普通怪，保留 | 沿用正常角色分段操作與地圖資料 |
| 木葉・mushroom-wood 菌傘深林 | q04／菌菇與平台，保留 | 沿用q04正常擊殺／領獎；本期未改碰撞 |
| 木葉・red-ridge 赤岩山徑 | q07／q08守望者回報 | 正常q08原始raw保留；新增領獎後出航引導 |
| 木葉・mine-gate 古礦入口 | Guardian戰前準備／特定恢復點 | 修正只有Guardian存檔才顯示此地；focused覆蓋四名首領 |
| 木葉・guardian-arena 守衛祭壇 | Guardian、核心、第一章與霜雪門 | 沿用正常勝利／q08claimed；UI明確區分打倒、手動回報、出航 |
| 霜雪・frost-shore 雪痕海岸 | 雪芽、狼、q09／q11；新增q21起訖與沙海提示 | q21／q11正常手動領獎與入Sand已補；真q08副本正常出航與q09拾3/6，舊q09滿數交付未重演，核心focused沿用 |
| 霜雪・frost-pine-pass 霜松隘道 | q10／蟹狼及上下路；新增高台航標 | beta20移至1770／430後正常爬梯／inspect，counter1；同Sol確認本1280構圖全名避手帳、石碑／梯頂關係合理。q10缺步由b15補 |
| 霜雪・frost-tide-cavern 冰潮洞窟 | 霜潮首領／q11與西返，保留 | 正常唯一attempt擊敗→正常西返雪芽→手動領q11已補，coins＋2000／冰潮長鋒1；Sand接縫仍按最後報告 |
| 沙海・sand-glass-shore 琥珀砂岸 | 琉砂、q12／q14／q15與多向航路；新增q22起訖 | q12／q13／q22／q14均正常manualclaimed，q22＋600金紅4藍2／q14＋1800金誓刃1；q15正常接取並南航 |
| 沙海・sand-dune-pass 砂丘關道 | q13、蠍／甲蟲、上下路與返程，保留 | q13正常領獎已補；q22接取後兩次新擊殺2/2已補，不重用q13計數；沒有增加門檻或任意傳送 |
| 沙海・sand-sunwell-basin 日井盆地 | 既有探索圖與祭壇前路；新增q22 reach＋甲蟲用途 | 已正常reach1並與active後kill2組成q22、最後manualclaimed；首領勝利後正常從本圖西返關道 |
| 沙海・sand-sunwell-altar 日井祭壇 | 日井守衛／q14，保留 | 原同attempt正常勝利counter1、返回盆地／西返領獎已閉環；原Sol確認一幀預警範圍可見，900ms實際時序／無傷躲避未量 |
| 遺跡・ruins-tide-camp 潮痕營站 | 芷衡／青禾、補給與q15／16／18 | b17由Sand正常南航首次入圖、q15active/reach1已補；未重做舊遺跡主線，沿用分段／旅冠滿袋與返鄉證據 |
| 遺跡・ruins-root-causeway 盤根石道 | q16、苔陶蟲及盤根梯路，保留 | 沿用分段任務與限定短段觀察；本期未改地形 |
| 遺跡・ruins-echo-gallery 回聲長廊 | q17雙碑／木偶、獨立q20，保留 | 唯一被重建checkpoint跳過的兩木偶已在beta19正常0→1→2補證；兩碑／回報沿用真操作 |
| 遺跡・ruins-bell-sanctum 誓鐘內殿 | 司鐘者雙招／一次半血轉場、q18／再戰，保留 | 沿用兩預警／轉場／勝利後正常再戰；可聽探索／phase2／復原音仍UNVERIFIED |

完整地圖用途、起訖與未改範圍見[Plan16](../16-world-completion-roadmap.md)及基線；內容來源見[region-content](world-completion-region-content.md)、[navigation](world-completion-navigation.md)、[UI journal](world-completion-ui-journal.md)。

## 存檔相容與玩家資料

讀格式1–5、寫5。beta18會拒絕新增任務，不能保證向下讀格式5。舊格式在第一次寫5前須明確確認；本機先保存並讀回逐字相同的原始備份，失敗停止寫入。暫不升級可memory-only暫玩，不寫本機／雲端。未知任務、counter、未來格式仍拒絕，沒有放寬validator來丟棄進度。正式雲端另受已公開Manifest格式檢查，遇不相容須停寫，不能降回格式4繞過。

[保存實作](world-completion-save-implementation.md)的31個focused cases及[真browser升級／暫玩](world-completion-ui-browser-b4.md)已完成：format4原raw確認前不變、exact備份、format5 payload保全、reload不重問；暫玩原raw逐字不變且未生backup／format5。正式雲端保存未驗，本機harness沒有帳號bridge，不宣稱saved:true。

正常玩家原檔 `output/playwright/resume-1515/q08-claimed-format4.json`（1492 bytes，SHA `d257d1382d915523918b93a411a2f04490e48aabb3c166403cf32088aec490ed`）保留，06:30輪重新讀取SHA仍一致；合成fixture及其實際演進另存在各自output/profile，不互相覆蓋、不當連續通關證據。

## 候選與實際檢查（beta19歷史；最新beta20見頂部）

- [靜態成品](../../artifacts/world-completion-beta19/dist/)；[ZIP](../../artifacts/world-completion-beta19/game-beta19.zip)，131,520,178 bytes／274 entries。
- ZIP SHA `68644dc701fb51fa8f11d69a0698819b4cb01203c8a258d9085c37c5aca6b53b`；dist tree SHA `5110333affb98209126ce849ee144838bb5a374ab8b533bd0f6b68e04a03ed4c`。
- Node24.22.1、tools1.2.0、SDK1.1.0／protocol1／schema2；一次build、pack、完整validate已過，14個文字entries有限token／PEM pattern掃描0命中，不能擴稱二進位或完整機密audit。詳[候選報告](world-completion-candidate.md)。
- 已執行的相關核心檢查：W02 world-map9；region Frost3＋sidequests2＋Sunwell2；persistence31；最終UI world-progress／world-map14；content與最終typecheck。兩輪world-map重疊，不把它們加總成不同案例數。來源未改就不重跑。
- 真browser跨來源子目錄iframe、format4確認／暫玩、q19回顧開關／reload、960→640即時尺寸與Esc/J已做；Sol確認gate640與正確boss地名960畫面，journal640只看見總覽，完整下方回顧視覺仍PARTIAL。
- 遺跡q17兩木偶新補證raw SHA `1dcf7c801c8dcd9fcea024ef2f0fe7e0dd00939bfe8d2d2848adfd84ee1995eb`，兩碑1/1、kill2/2、未再領獎。詳[補證報告](world-completion-ruins-puppets.md)；Sol只確認可見完成／接地，未擴稱聲音或全程。

沒有跑全回歸、從零重玩四區或重建／重打包未變候選；不以單張圖判整條路線。最後一輪只核文件及補缺實際操作，檢查通過與略過均按實際記錄。

W06-04沿用核心與靜態對照收尾：`interactNearest`對portal只有原等級／主線claimed檢查，沒有q19關門或支線／18圖門檻；world-progress既有案例確認q19可完成而q20／q21／q22仍未完成，world-map案例確認各原門檻。q19回顧是派生UI，不改quests／visitedMaps；正常遺跡勝利再戰沿用既有結果。沒有為本期未改的通行邏輯另跑四區結局後整圈，亦不宣稱該整圈已實機重演；這項對照沒有新增測試或修改code。

## 停止規則與未驗項

06:30為使用者指定最後一輪，兩個一次性排程觸發後均已刪除。本輪不建立Plan17、不開新素材／解析度scope，也不另排續作。Plan16的P0實機驗收尚未全清前，不標WORLD_CONTENT_COMPLETE；停止自主工作不等於所有驗收通過。

可聽音訊、正式Playroom preview／兩帳號或兩裝置保存／衝突／格式發布次序、原生全螢幕／沉浸模式與效能均未完整驗證。現有工具無真正音訊輸出聆聽證據，不把decode或play promise當聽過。未獲發布授權，沒有commit、push、tag、Release、人工確認或上架。

每批實作均全新GPT-6 Luna Max；圖像只復用同一GPT-6.1 Sol High，未得到接近300K的證據，也沒有精確上下文計量。原用量中斷、控制誤走及partial case保留，不補造結果。所有未提交使用者內容與原存檔保留。

## 最後操作與清理

Frost q21已完成真實手動領獎：`output/playwright/world-frost-beta19-b6/q21-claimed.raw.json` SHA `e4795b90242741619f941b81b8cd17bec585a43220d10c9d9b2ef8e5c38c1fbb`，format5、q21claimed／marker1，q11仍active／warden0；HP536／MP98不變、金5750→6250、大紅24→27、大藍18→20，保留領獎前raw。這是原profile沿b6正常調查後的手動回報，沒有重種。UI僅顯示本機保存，不能冒稱正式雲端saved:true。最後Luna接一次有界q11樣本後收束，詳 `world-completion-frost-final.md`；未確認的browser／server不得先寫已關閉。

同一q11 attempt已正常擊敗守望獸，存檔 `q11-won-before-exit.raw.json`（1404B）SHA `f048b1e063517acb7889ba9a48bc8c14a768c81aada09e7dce6a6daf30ee5f7c`，q11warden1、q21claimed、HP652／MP26、gold7850、紅20藍20。Sol確認首領身份、可見攻擊範圍及首擊綠條縮短／白630，沒有把按鍵數當命中或把pause算戰鬥時長。此時仍須正常西返雪芽手動領q11，才能記該閉環通過。

其後已手動領q11，`q11-claimed.raw.json`（1443B）SHA `eebdf9d652716f68bda19424749ae2cb09db117fd47d60e446c58afbca40d2db`，root只讀確認q11claimed／warden1、q21claimed／marker1、gold9850、冰潮長鋒1。霜雪勝利→正常返程→手動領獎閉環PASS；沒有直接用fixture claimed作證。初始q01–q10仍是該獨立fixture的前置，不聲稱正常角色從零通關。

Sand最後一輪已收束為 **PARTIAL**，詳[最終Sand報告](world-completion-sand-final.md)：原profile正常Continue後HP660→732、MP98、q14active／q22absent。Sol確認唯一未遮圖仍只有HUD、場景均一灰，不能定位角色／傳點；console0及request摘要沒有失敗不能證明畫面／玩法通過，也尚不足定位成遊戲bug或工具環境根因。沒有繼續盲走、按Space、重種或切換設定。保存並逐字比對1432-byte canonical raw，SHA `a93bd5834742bd6c915e89dddea00d3b5a3e238984c239daf38883be91f2192c`。自有`sand-final-b7`已關、原profile Chrome無殘留；核命令列及兩port後停止server22560，56988／56989均釋放。q22接取／盆地／兩甲蟲／手動領獎、q14勝利／領獎／q15接縫均未驗。

為區分未定位的畫面問題與確切code缺陷，全新Luna `/root/world_canvas_final_audit_b8`已在既有W08內完成一次有界靜態渲染／restore接線定位，詳[靜態稽核](world-completion-canvas-audit.md)。Continue／restore、Scene render gate、load／render／resize、pause接線不在本期dirty diff；freeze只略過simulation，仍可render。Continue的worldRevision可能觸發map reload，reload期間transition gate會暫停繪製，但靜態證據不能證明灰畫面原因，也不能證明沒有問題。結論仍PARTIAL／原因未知，未猜改來源、未重啟browser或環境、未新增測試或計畫。

原誤開Cursor PID30864在本輪以host CIM重新核對：完整命令列仍是cached Playwright CLI＋`-s=world-ruins-puppets-b5 snapshot`、啟動時間2026-10-26T18:07:07Z、主視窗handle0。只停止該已核對自有程序，之後確認PID不存在；其他Cursor未動。沒有以舊PID直接盲殺。

### 使用者暫停後的最終點

q11手動領獎後已正常進琥珀砂岸，Sol確認新live profile場景／角色／琉砂可見，與另一已清理的灰畫面profile分開；沒有藉新場景PASS撤回灰畫面原因未知的記錄。最後raw `output/playwright/world-frost-beta19-b6/q11-claimed-sand-seam.raw.json`，SHA `e311d8fe7a47c4c42902f09dda43110bd87f4f80ed168753aca40b9c181a7063`，format5、q11／q21claimed、coins9850、HP653／MP26、紅18藍20。Frost實際閉環與證據見[最後報告](world-completion-frost-final.md)。

使用者此時要求完成當前步驟後暫停。b9只以host接同一live session做snapshot／bringToFront／focus與ownership確認，沒有按鍵／對話／任務／存檔操作，**沒有開始q12／後續沙海玩法**，見[僅交接記錄](world-completion-sand-live-final.md)。q22／q14等未驗維持未驗，不再啟動下一步。

root已關閉`frost-final-b7`，現時命令列與兩port均核對屬自有server6424才停止；64669／64670 listener0、該profile Chrome0。所有profile、raw、截圖、來源與ZIP保留，沒有close-all、測試／build／pack重跑、發布或新增plan／排程。handoff JSON已改`paused_by_user_resources_closed`、保留最後b9 owner與root清理資訊。兩個一次性排程均已刪除。下一步僅待使用者明確恢復；目前不是整個Plan16完成，也不因本機保存而聲稱雲端成功。

收尾只做相關文件diff檢查及本集中報告本機連結存在性檢查（missing0），沒有再開遊戲或重跑測試套件。b7／b9已final，另中斷殘留pending／舊quota-error代理以避免續跑；原報告與上下文保留。
