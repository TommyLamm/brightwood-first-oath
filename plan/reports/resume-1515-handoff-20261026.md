# 2026-10-26 q07／q08 續作完成交接

後續（同日17:38）：使用者明確同意額外遺跡視覺驗收後，隔離fixture設定已成功並完成三圖限定片段／首領兩招及可見半血轉場。本次首領戰以死亡結束，勝利後retry仍未補驗，所有自有服務已停；最新見 [額外驗收交接](ruins-visual-handoff-20261026.md)。下方seed受拒是前輪歷史，本檔的正常角色最終raw仍保留不變。

**q07、q08 均正常手動領獎，第一章「守衛的誓約」結算完成。** root 最終獨立核對完整 raw。本輪沒有改遊戲程式，Plan15 整體仍為 SOURCE_READY／ZIP_VALIDATED／LOCAL_BROWSER_PARTIAL。

## 最新恢復起點

[q08-claimed-format4.json](../../output/playwright/resume-1515/q08-claimed-format4.json)：**1492B**，SHA-256 **d257d1382d915523918b93a411a2f04490e48aabb3c166403cf32088aec490ed**。完整未改值的 format4 封套，取代前輪q07 2/6與本輪ready／claimed檔作後續起點。

- q01–q08 全部claimed；q07 golem6／sentinel6，q08 guardian1。
- bossDefeated=true、chapterComplete=true。核心已交Keeper，袋中沒有核心是預期；Guardian Sword 1把仍在背包。
- 晨行者Lv30、EXP0、STR157／DEX4、AP0／SP0、HP712/712、MP86/98、coins5056。
- 重斬10、守護5、休息恢復4、橫掃1、生命鍛鍊1；steel-sword／iron-mail／iron-helm裝備中，大紅／大藍各9。
- location red-ridge／left。這是原始正常角色的分段續作，跨beta17／beta18及存檔交接，不稱beta18從零無縫通關或45–60分鐘樣本。

root已獨立核bytes／SHA／format4／全部8筆claimed／counter／flags／角色與裝備。正常UI過程、三個有效checkpoint及勝利／第一章畫面路徑見 [主線驗收報告](resume-q07-q08-1515-20261026.md)。未重跑q01–q06、未回滾補血、未改raw數值或私有runtime傳送。

## 實際完成與操作修正

從前輪q07-active 1303B／SHA 8cae43f3050b228a55182c4c6cf55710edda5566e54628bda942caefeb2acf98接續，正常擊殺剩餘四魔像／六哨兵，在Keeper手動領q07。正常取得4000EXP、900coins、鐵盔及大藥各10，配點／裝備後同NPC接受q08。正常穿過赤岩東／古礦東進祭壇，擊敗Guardian、核心自動入袋；結果返回Town後經正常傳點回Keeper，手動領q08。最後正常分配升級餘下AP／SP，才輸出最終raw。過程沒有死亡。

較早的 [q07-claimed-format4.json](../../output/playwright/resume-1515/q07-claimed-format4.json) 為1440B／SHA 0183d00aeef494a2e3d945d04cb3647cbe03349c720c82c4c8830ef0d1ef47fc，已接q08但尚未打Guardian；不應再用它覆蓋最新完成檔。

互動失敗曾是hero仍離Keeper約240CSSpx；root審圖確認距離，不認定對話bug。重斬腳本曾按鍵後150ms就取圖／暫停，早於220ms前搖；改為等700–750ms完整動作後確認有效命中，不靠改傷害通過。初次匯出helper解析錯層輸出過0B，已修正並以有效完整檔取代，加入origin／非空payload／bytes／format4/data guards後才寫檔；不是browser存檔消失。root只載入四張必要小型JPEG，其餘圖與長log留工作區。

## 候選、來源與清理

ID brightwood-first-oath，**1.0.0-beta.18**，schema2／SDK1.1.0／protocol1／tools1.2.0、desktop、存檔讀1–4寫4。SUT仍為 artifacts/overnight-20261026/portal-labels/dist；bundle assets/index-BPLc23-E.js SHA 1c26346100c38d09beee5b7cc331210e29274ba1dc757c67021d9b3c302e6cab。原已驗ZIP artifacts/overnight-20261026/beta18-package/game-beta18.zip，SHA 779361b5dedbf1a39465d5775a82ec08da920d1c77bb3afa01b26c6e72896f87，保留不變。

root於香港15:13–15:15完整網路讀模板及七份規格並轉述，來源／分工見 [本輪派工](resume-1515-dispatch-20261026.md)。全新GPT-6 Luna max、無歷史fork，最多三名並行，context／origin／服務與報告分離。無source／metadata／dist／ZIP變更，未重跑無關已過build／tests／pack，未commit／push／tag／Release／平台匯入上架。使用者白天新授權與已結束09:00排程分開，未新增排程／goal、未兌換重置信用。

主線session resume-q07-q08-1515已關；核完整cmdline和listener ownership後停止PID29748／54964、54965，stopped record確認process不存在且listeners空。紀錄在output/playwright/resume-1515/service-started.json與service-stopped.json。CLI user-data-dir是 **<in-memory>**，沒有可重開的持續profile；保留config／logs及完整raw，不承諾關閉session後還能直接按繼續。

額外boss PID21988／59909、59910及maps PID368／65490、65491均已各自核所有權後清理，start／stopped分開保留。沒有本輪仍在運作的子代理或未交接服務。

## 未驗與下一步

額外遺跡boss owner的隔離fixture seed在執行前遭自動審查拒絕，理由為「僅允許正常UI匯入、不得直接讀寫localStorage」。這是審查回覆的限制，不是使用者新增要求或遊戲缺陷。未重試、未繞過或交其他owner代種；標題無檔案匯入入口，因此未進該boss，無新增phase／預警／清理PASS。[拒絕及清理](resume-boss-visual-1515-20261026.md)。地圖owner尚未開browser／seed，root同步停止新同類載入；它未自己收到拒絕，三圖無新增觀察。[地圖界線](resume-maps-visual-1515-20261026.md)。

下一輪讀本檔與 [剩餘驗收矩陣](plan15-remaining-review-20261026.md)，不重跑q01–q08或未受影響的namespace／viewport／preview／分支矩陣。若恢復角色，保留最新完整raw，先解決可獲批准的隔離載入方式；沒有持續profile，不宣稱可直接續玩，不繞過seed拒絕。

遺跡boss熟悉後高輸出樣本約18秒已量得，45–80秒目標未達；不改凍結平衡、不重測同樣sample湊PASS，也不能用同一筆判首次觀察60–120秒目標未達。平衡另列設計決策。可聽音訊、未捕捉的phase瞬時聲畫、完整四圖／實機效能、正式平台／雲端／原生全螢幕仍未驗；不以第一章結算或ZIP有效冒充全面驗收。

