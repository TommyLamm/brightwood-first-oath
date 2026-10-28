# 額外遺跡視覺驗收交接

## 20:20 排程續作更新

2026-10-26 香港20:20起，由全新GPT-6 Luna max接續唯一未完成的勝利後正常retry畫面驗收；root已完整重讀八份main規格並統籌審圖。[派工及適用要求](ruins-retry-2020-dispatch-20261026.md)。普通用量恢復可用，沒有兌換重置信用。

已取得真正勝利畫面「誓鐘已恢復寧靜！」，正常點「再次挑戰司鐘者」後入口無結果面板、沒有舊矩形／青綠圈可見殘留；重新正常接近可見首領滿綠血條，當時矩形是新一輪普通攻擊預警。root已審勝利、retry-entry及retry-boss-respawn原圖。HP489/712、MP18/98在retry前後維持；q18仍active、司鐘者counter1保留。**因此前輪未完成的勝利→正常retry可見清理已補驗**，不再用死亡返回替代。專項動作、證據及清理見 [20:20報告](ruins-retry-2020-20261026.md)。

本輪沒有重測已取得的三圖／phase1／半血轉場，沒有重新量測時長。初段因按鈕焦點造成的45s無輸入與其後未證實持續命中的28s截斷均不是有效時長樣本；之後修正canvas焦點與實際距離，先見敵方470傷害及血條縮短，再正常接續至勝利。沒有回載補血、私改狀態或fixture數值。

範圍仍為beta.18可見畫面抽樣，非sub-frame精度、全圖／FPS、可聽音訊、正式平台或雲端通過，Plan15仍LOCAL_BROWSER_PARTIAL。source／metadata／frozen dist／ZIP未變；不重build/tests/pack，沒有commit/push/tag／發布。正常角色q08claimed 1492B原始檢查點保留。

新增後續缺口：標題「上次進度」把所有boss地圖顯示成古礦入口（src/ui/index.ts:859–861的舊映射），但本輪Continue實際進入誓鐘內殿，fixture真location正確。這是可定位的UI地名問題，本次凍結成品驗收不順帶修改，後續可另做最小修正。

收尾：named context ruins-retry-2020-20261026已關；PID31448及54841／54842在核命令列與listener所有權後停止，stopped紀錄確認process與listeners均不存在，root已讀核。證據及run-summary在output/playwright/ruins-retry-2020/，本輪未錄影片。遊戲console error0，parent favicon404及sandbox提示另列、不隱瞞也不當遊戲缺陷。一次性排程20-20已透過工具刪除，不會再觸發。

## 17:37 前輪記錄（歷史）

使用者於2026-10-26 17:07前明確同意額外驗收；本輪受控隔離fixture載入已成功，不再沿用前輪「seed受拒所以未進場」的狀態。來源／授權範圍及root完整重讀線上八份文件見 [同意與分工](ruins-visual-approval-20261026.md)。全新GPT-6 Luna max兩名分工，root統籌審圖，最多兩名並行；沒有重跑正常角色q01–q08。

## 已有實際證據

- **三張地圖限定短段完成**：潮痕營站向右3.5s；盤根石道（ruins-root-causeway）由長廊西返後向左3.5s；誓鐘內殿入口向右2.5s，沒有boss同屏／未接敵。各留1280×720前後圖、同進度960×640暫停圖及短WebM。片段內未見明顯地面接觸破綻、背景空洞或跳位，不代表全圖／逐影格／FPS通過。[地圖報告](ruins-maps-visual-approved-20261026.md)。root已審1280×851/q70聯絡表，要求補齊鞋底與地面下方後才接受證據排版；只從既有原圖重排，沒重跑樣本。第一次朝石道東側edge的短移是無效校準，未計通過。
- **首領高擊／低掃**：各有可見警戒矩形與生效／玩家HP下降樣本；只支持可觀察畫面，不宣稱第三格生效的sub-frame精確時間。
- **半血轉場已捕捉**：root審phase-transition-01.jpg：boss血條約46%，胸前鐘處明確有淡青綠圓光／圓框，沒有矩形預警；phase-transition-07.jpg圓光消失並出現新低掃矩形。這支持轉場中→之後恢復低掃的可見過程，非精確量得1200ms起訖。不能因07出現矩形就說還在phase1；不能以boss移動後血條右端絕對座標推論回血。兩張先前progress圖的綠條填充比例都約2/3，沒有回血證據。

**本次首領戰以死亡結束**：最後有界batch第8下出現「角色倒下了／返回木葉鎮／返回標題」，沒有取得本輪勝利後retry證據。死亡終點的可見viewport未見明顯矩形／青綠圓光殘留，但不能用它替代victory後retryBoss清理驗收。已停止新scope，原始影像與報告見 [首領報告](ruins-boss-visual-approved-20261026.md)，terminal-result.jpg為敗北，不是勝利。

原圖、短片及長log只放output/playwright/ruins-boss-approved與ruins-maps-approved，不插滿主對話。本輪沒有重測約18秒樣本，沒有改首領數值或回載fixture補血；使用的藥水都是這個隔離fixture原有庫存。

## 清理與續作

maps三個named context均已關閉；PID328／65520–65523在核完整命令列與listeners所有權後停止，cleanup-record.json確認process／listeners均消失。boss錄影已保存並停止，named context已關閉；PID25376／60187、60188均確認消失，harness-ownership-25376-stopped.json保留核對結果。兩名owner的started／stopped紀錄分開保留，沒有本輪未交接服務或仍在執行的子代理。

最後檢查普通用量93%，未兌換任何重置信用。已取得的三圖／兩種預警／可見轉場不重跑；若後續另續，唯一本輪尚未補成的視覺目標是勝利後normal retry的可見清理。必須與死亡返回分開記錄。精確瞬時／音訊等界線仍如下，不能把本輪寫成全面PASS。

## 保留界線

SUT仍是brightwood-first-oath 1.0.0-beta.18、desktop、schema2、讀1–4寫4，artifacts/overnight-20261026/portal-labels/dist；bundle SHA 1c26346100c38d09beee5b7cc331210e29274ba1dc757c67021d9b3c302e6cab。沒有source／metadata／fixture數值／平衡／dist／ZIP變更；無build／測試套件／pack／commit／push／Release或平台上架。

原正常角色最終q08claimed 1492B／SHA d257d1382d915523918b93a411a2f04490e48aabb3c166403cf32088aec490ed仍保留，[第一章完成交接](resume-1515-handoff-20261026.md)。不要用本輪fixture進度覆蓋它。

約18秒遺跡首領熟悉後高輸出樣本的45–80秒目標未達仍保留；本輪不重新計時或調數值。可聽音訊、精確phase／攻擊瞬時清理、全圖／實機效能、正式平台／雲端／原生全螢幕仍未驗，Plan15整體維持LOCAL_BROWSER_PARTIAL。
