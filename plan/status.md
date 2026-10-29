# 實作狀態板

<a id="current-state"></a>
## 當前狀態（唯一全局入口）

更新：2026-10-29（Asia/Hong_Kong）。[Plan49](49-journal-contact-map.md)與霜潮洞窟返回誤標修補完成，簡單驗證與GitHub Release完成，**GITHUB_PRERELEASED／BROWSER_UNVERIFIED**。版本beta57、作者TommyLamm；依使用者要求本次收尾，停止新增Plan／排程。[交接](reports/plan49-handoff.md)／[發布結果](reports/release-beta57-20261029.md)。

| 維度 | 當前結果／界線 |
| --- | --- |
| 指定續作排程 | 2026-10-29 HKT 02:40及07:50皆已觸發並成功刪除；[紀錄](reports/continuation-schedule-20261029.md)。最新停止／範圍指令優先，無額外排程授權。 |
| Plan49 | 手帳 NPC 地圖／Frost 返回修補、各一次指定 tsc0 及 root 審閱完成；beta56 保留，beta57 一次 build／pack／完整 ZIP／有限 audit 通過，GitHub prerelease完成。[計畫](49-journal-contact-map.md)及[交接](reports/plan49-handoff.md)。 |
| Plan48 | W01 三組 focused 修正測試斷言後 PASS；W02 UI／一次指定 tsc0 及 root 審閱完成；W03 全新 Luna Max 完成 beta55 一次 build／pack／完整 ZIP／有限 audit。[計畫](48-merchant-map-shortcut.md)及[交接](reports/plan48-handoff.md)。 |
| Plan47 | W01 全新 Luna Max 完成商店分類數／同分類 no-op、單次指定 tsc0 及 root 審閱；W02 全新 Luna Max 完成 beta54 一次 build／pack／完整 ZIP／有限 audit。[計畫](47-shop-category-counts.md)及[交接](reports/plan47-handoff.md)。 |
| Plan46 | W01全新Luna Max任務徽章分支、單次指定tsc0及root審閱完成；W02全新Luna Max完成beta53一次build／pack／完整ZIP／有限audit，兩次prep guard失敗已記錄。[計畫](46-ready-quest-hud.md)及[交接](reports/plan46-handoff.md)。 |
| Plan45 | W01全新Luna Max四處呈現、單次指定tsc0及root審閱完成；W02全新Luna Max完成beta52一次build／pack／完整ZIP／有限audit。[計畫](45-trade-balance-preview.md)及[交接](reports/plan45-handoff.md)。 |
| Plan44 | W01單次5focused PASS、W02指定tsc0及root審閱完成；W03全新Luna Max完成beta51一次build／pack／完整ZIP／有限audit，setup參數錯誤已記錄。[計畫](44-inventory-category-navigation.md)及[交接](reports/plan44-handoff.md)。 |
| Plan43 | W01五處成對描述／一次指定tsc0及root審閱完成；原W02 prepare/build成功後用量中斷，07:50全新Luna Max只接剩餘pack／ZIP／audit／報告，beta50完成，不重跑已過步驟。[計畫](43-action-preview-descriptions.md)及[交接](reports/plan43-handoff.md)。 |
| Plan42 | W01全新Luna Max完成、單次指定tsc0及root單一hunk審閱接受；W02全新Luna Max完成beta49一次build／pack／完整ZIP／有限audit。[計畫](42-material-sale-capacity.md)及[交接](reports/plan42-handoff.md)。 |
| Plan41 | W01單次5focused PASS、W02指定Node24.22.1單次tsc0及root審閱完成；W03全新Luna Max完成beta48一次build／pack／完整ZIP／有限audit，prep亦成功。[計畫](41-skill-learning-preview.md)及[交接](reports/plan41-handoff.md)。 |
| Plan40 | W01全新Luna Max完成，一次指定tsc0及root單一hunk審閱接受；W02全新Luna Max完成beta47一次build／pack／完整ZIP／有限audit，prep成功。[計畫](40-item-recovery-preview.md)與[交接](reports/plan40-handoff.md)。 |
| Plan39 | 全新Luna Max `/root/plan39_ap_ui`完成typed兩項迴圈與一次指定tsc0、root審閱；全新Luna Max `/root/plan39_candidate`完成beta46一次build／pack／完整ZIP／有限audit，prep亦成功。[計畫](39-all-ap-dexterity.md)及[交接](reports/plan39-handoff.md)。 |
| Plan38 | 全新Luna Max `/root/plan38_audio_ui`完成settings說明／aria-describedby與一次指定Node24.22.1 tsc0、root審閱；全新Luna Max `/root/plan38_candidate`完成beta45一次build／pack／完整ZIP／有限audit，prep亦成功。[計畫](38-audio-setting-feedback.md)及[交接](reports/plan38-handoff.md)。 |
| Plan37 | 全新Luna Max `/root/plan37_hud_ui`完成HUD inventory分支、一次指定Node24.22.1 tsc0及root審閱；全新Luna Max `/root/plan37_candidate`完成beta44一次build／pack／完整ZIP／有限audit。[計畫](37-hud-bag-capacity.md)及[交接](reports/plan37-handoff.md)。 |
| Plan36 | 全新Luna Max `/root/plan36_equipment_stats`完成純model與單次5 focused PASS，root已審；全新Luna Max `/root/plan36_equipment_ui`完成兩builder呈現與一次指定tsc0、root審閱；全新Luna Max `/root/plan36_candidate`完成beta43一次build／pack／完整ZIP／有限audit。[計畫](36-equipment-stats-preview.md)及[交接](reports/plan36-handoff.md)。 |
| Plan35 | 全新Luna Max `/root/plan35_journal_ui`完成接線、單次2 focused／1skip及一次指定Node24.22.1 tsc0，root審四處diff接受；全新Luna Max `/root/plan35_candidate`完成beta42一次build／pack／完整ZIP／有限audit；原日誌未另存，從已有tool結果補摘要，不重跑。[計畫](35-journal-selection-consistency.md)及[交接](reports/plan35-handoff.md)。 |
| Plan34 | 全新Luna Max `/root/plan34_capacity_ui`完成容量p、一次指定Node24.22.1 tsc及root diff審閱；全新Luna Max `/root/plan34_candidate`完成beta41一次build／pack／完整ZIP／有限audit。[計畫](34-shop-bag-capacity.md)與[交接](reports/plan34-handoff.md)。 |
| Plan33 | 全新Luna Max W01純預覽5 focused PASS、W02 UI一次tsc exit0及root審閱完成；W03完成beta40一次build／pack／完整ZIP／有限audit。tsc誤用PATH Node24.19.0已記錄，不重跑，build指定24.22.1。只設定數量草稿，原購買確認保留。[計畫](33-maximum-buy-quantity.md)及[交接](reports/plan33-handoff.md)。 |
| Plan32 | W01純選取5 focused、W02 UI一次tsc與主代理審閱完成；W03 beta39既有build／pack／完整ZIP／audit成功，中斷後全新Luna只補報告，未重跑。[計畫](32-shop-category-navigation.md)與[交接](reports/plan32-handoff.md)。 |
| Plan31 | 全新Luna Max `/root/plan31_shop_comparison_ui`完成W01與一次tsc；全新Luna Max `/root/plan31_candidate`完成beta38一次build／pack／完整ZIP驗證；audit副本路徑失敗一次後修正通過，未重跑其他checks。[計畫](31-shop-equipment-comparison.md)與[交接](reports/plan31-handoff.md)列契約。 |
| Plan30 | 全新Luna Max `/root/plan30_overlay_ui`完成W01三處語意屬性與一次tsc；全新Luna Max `/root/plan30_candidate`完成beta37一次build／pack／完整ZIP驗證。[計畫](30-overlay-control-context.md)與[交接](reports/plan30-handoff.md)列契約。 |
| Plan29 | 全新Luna Max `/root/plan29_action_ui`完成W01三處名稱與一次tsc；全新Luna Max `/root/plan29_candidate`完成beta36一次build／pack／完整ZIP驗證。[計畫](29-progression-action-context.md)與[交接](reports/plan29-handoff.md)列契約。 |
| Plan28 | 全新Luna Max `/root/plan28_name_ui`完成W01、精選1案例／一次tsc；全新Luna Max `/root/plan28_candidate`完成beta35一次build／pack／完整ZIP驗證。[計畫](28-character-name-feedback.md)與[交接](reports/plan28-handoff.md)列五條契約與最小驗收。 |
| Plan27 | 全新Luna Max `/root/plan27_ap_preview`完成W01純預覽與單次6 focused PASS；全新Luna Max `/root/plan27_ap_ui`完成W02與一次tsc；全新Luna Max `/root/plan27_candidate`完成beta34一次build／pack／完整ZIP驗證。[計畫](27-ap-allocation-preview.md)與[交接](reports/plan27-handoff.md)列契約。 |
| Plan26 | 全新Luna Max `/root/plan26_item_action_ui`完成W01七處呈現屬性與一次tsc；全新Luna Max `/root/plan26_candidate`完成beta33一次build／pack／完整ZIP驗證。[計畫](26-item-action-context.md)與[交接](reports/plan26-handoff.md)列範圍，不跑tests／browser。 |
| Plan25 | W01 `/root/plan25_item_use_app`及W02 `/root/plan25_inventory_ui`完成；W03用量中斷後由全新Luna Max `/root/plan25_candidate_resume`接續完成beta32。新6 focused／既有精選1例、一次tsc與候選完整ZIP驗證通過。[計畫](25-inventory-item-use-feedback.md)與[交接](reports/plan25-handoff.md)列結果；browser條件未成立。 |
| Plan24 | W01重綁控件與W02beta31均完成，兩個全新Luna Max包已回報。[計畫](24-keybinding-control-context.md)與[交接](reports/plan24-handoff.md)列範圍，本批沒有tests／browser。 |
| Plan23 | W01只改背包builder呈現及W02beta30均完成，兩個全新Luna Max包已回報。[計畫與來源證據](23-inventory-category-clarity.md)及[交接](reports/plan23-handoff.md)列界線；本批沒有tests／browser。 |
| Plan22 | W01共用領獎／app、W02 NPC UI及W03beta29完成，三個全新Luna Max工作包已回報。[計畫](22-quest-claim-feedback.md)與[交接](reports/plan22-handoff.md)列實際結果；browser條件未成立。 |
| Plan21 | W01預覽、W02商店UI及W03beta28均完成，三個全新Luna Max工作包已回報；依[計畫](21-material-sale-feedback.md)與[交接](reports/plan21-handoff.md)收束，browser條件未成立。 |
| Plan20 | 兩個獨立Luna純model、單owner UI與新候選已交付；裝卸／單筆出售按鈕和點擊同源重判，不採用preview player。作者source／dist／ZIP均為TommyLamm。[工作包](20-item-action-feedback.md#4-明確工作包與所有權)；[本批交接](reports/plan20-handoff.md)。 |
| Plan19 | 三項改善後追加交易invalid草稿／重綁repeat修整；兩名全新Luna分別完成UI與beta26封包。[修整](reports/plan19-input-polish.md)；[實作與實際檢查](reports/plan19-handoff.md)。 |
| Plan18 | **PROCESS_DOCS_DELIVERED／QA_FIXTURE_PREPARED**：主代理完成 W00 入口與整合；三名全新 `gpt-6-luna`／`max`／`fork none` 分別交付 W01 browser runbook／模板、W02 overlay 配方、W03 fixture／provenance。[QA 薄索引](../tools/qa/README.md)；[各包結果與實際檢查](reports/plan18-process-handoff.md#實際進度檢查與下一步)。 |
| GitHub Release | [v1.0.0-beta.57](https://github.com/TommyLamm/brightwood-first-oath/releases/tag/v1.0.0-beta.57)，HKT08:48:56發布；workflow success、唯一game.zip附件與GitHub digest一致，實際附件有限文字掃描0findings。詳發布結果；平台未上架。 |
| 遊戲候選 | `brightwood-first-oath`／`1.0.0-beta.57`，author `TommyLamm`，**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**，未發布。[候選報告](reports/plan49-release-candidate.md)；[game.zip](../artifacts/plan49-1.0.0-beta.57/game.zip)。所有歷史成品保留。 |
| 已驗表面／方法 | 歷史 beta24 **640×360 portal 指定畫面實畫 PASS（所見）**：新隔離 profile／空 canonical origin、validator 曾接受的合成 format5 `camp/right` fixture，正常 Continue／一次 Space；完整 hint、toast、profile、actions、quickbar、footer 無互遮。[直接方法、rect 與圖片證據](reports/base-experience-browser-recovery.md#測試方法與實測)。 |
| 其他沿用結果 | beta23 修復 actions 遮擋後，動作／排隊 960×540 與 640×360、640 冷卻與小紅切大紅限定視審已過；beta22 NPC／合成恢復卡呈現沿用。[集中交接](reports/base-experience-handoff.md#新增內容視覺補驗與最新候選)保留時間鏈與 4 檔 27 focused／相關 tsc 歷史結果；本輪不重測。 |
| 未驗／不推廣 | 合成前置不證正常 NPC→portal 行走、任務通關或完成傳送；更小尺寸、真 OS 失焦、正式平台／真帳號雲端、實際音訊、原生／沉浸 fullscreen、灰畫面根因與舊 q09／q10 未重演仍未驗。未標 CANDIDATE_READY 或平台通過。 |
| QA cleanup | 本次未啟動browser／server，無新QA資源。beta25 [歷史紀錄](reports/plan19-local-review.md)：about:blank即0x6D，無server／seed；log自報daemon／Chrome退出，CIM／事後ports受限、殘留session未知，不外推全主機乾淨。profiles／log保留。 |
| 實際檢查 | Plan49 手帳／Frost 修補各一次指定 tsc0、root 局部審閱；beta57 一次 build／pack／完整 ZIP／有限 audit 成功；既有 focused 沿用，不跑全回歸或 browser。 |
| 下一步 | 本次收尾完成，停止新增Plan／排程，等待新指令；保留真資料／全部候選，不自行操作平台匯入／確認／上架。 |

下方全部為有日期的階段歷史；其中「最新」「未驗」「停止」描述當時狀態，不覆蓋本區。證據原文保留，不逐條改寫舊 FAIL／UNVERIFIED。

## 歷史：先前階段授權與交付

**[Plan18](18-development-feedback-improvements.md) PLAN_READY（尚未實作），主代理已審閱。** B8／B9／B10回顧已收齊，見[回饋](reports/plan18-agent-feedback.md)；指定Sol6.1 xhigh已交詳細plan與[規劃證據](reports/plan18-planning-evidence.md)。W00–W03聚焦單一狀態入口、browser／QA owner指引、overlay局部驗收配方、可追溯fixture；更窄尺寸與fingerprint共用化延後，條件工作需新證據。沒有未解確定玩家bug要求立即改碼，不重做beta24已過項。本輪只做文件引用／範圍自查，未實作、tests、browser、build／pack、升版／發布或建排程；全部子代理完成，停止。下方Plan17保留完成基線。

**新增內容視覺補驗已收束：最新beta24 SOURCE_DELIVERED／ZIP_VALIDATED／LOCAL_ACCEPTANCE_PARTIAL。** NPC／合成恢復卡呈現、beta23動作中／排隊／冷卻所見通過。beta24一條CSS修正的toast遮操作鈕，亦已640實畫PASS：全文完整，hint／profile／操作鈕／快捷列／footer無互遮。使用者授權恢復測試後，相同Node／CLI／Chrome在sandbox報crashpad 0x6D、一般桌面權限成功，支持環境權限／IPC差異，未改系統設定。僅新獨立QA前置短段，非正常傳送／全回歸；候選未變、27 focused不重跑。before/after raw與profiles保留，清理見恢復報告。未發布、不新增plan／排程；真OS焦點／平台／雲端等仍未驗。詳[集中交接](reports/base-experience-handoff.md)及[啟動恢復與beta24視審](reports/base-experience-browser-recovery.md)。以下為先前階段歷史。

**最終收束：Plan17 beta22 SOURCE_DELIVERED／ZIP_VALIDATED／LOCAL_ACCEPTANCE_PARTIAL。** 失焦明確恢復、同源互動提示、戰鬥狀態及快捷圖示重用已實作，並補命令層conflict／upgrade恢復保護。最終4檔27 focused、tsc及beta22 build／固定完整ZIP驗證通過；beta21只實測NPC提示／同名對話及同頁焦點，真blur／portal／技能／圖示／640與視覺均未驗，beta22未直接browser。自有QA session／server／ports已清，profiles／證據保留；排程已觸發刪除，未發布，不新增plan／排程。詳[最終交接](reports/base-experience-handoff.md)。下方為各階段歷史。

**Plan17 beta21 SOURCE_DELIVERED／ZIP_VALIDATED；B06 browser進行中。** 四項基礎體驗已實作，4檔26 focused＋最後typecheck通過，新候選一次build／固定tools1.2.0 pack／完整validate通過。候選`artifacts/base-experience-1.0.0-beta.21/`，原beta19／20保留；唯一Terra正在新profile有界短段驗收，沒有發布，不提前稱browser通過。詳[實作交接](reports/base-experience-handoff.md)。下段為先前階段記錄。

**04:05續作：Plan17 IN_PROGRESS。** [詳細計畫](17-base-game-experience.md)及[規劃證據](reports/base-experience-plan-evidence.md)已由原Sol6.1 Extra High完成、主代理審閱接受；一次性04-05已刪除。A批三名全新Luna Max已分別開始焦點恢復、共用互動目標與combat UI純推導；共享UI後續單owner整合，再由Terra Max集中新變更短段驗收。尚無本輪實作驗證結果，未發布。所有權與後續見[派工](reports/base-experience-dispatch.md)及[本對話交接](reports/base-experience-current-handoff.md)。下段為規劃時記錄。

**PLAN_IN_PROGRESS；04:05接續並實作。** 已派全新 `gpt-6.1-sol`／`xhigh` 規劃代理 `/root/base_experience_plan` 撰寫詳細基礎體驗計畫，預期 `17-base-game-experience.md`。舊對話04-05排程已刪除，新一次性04-05已建立並核對target為本對話 `01a17e26-32af-7801-b5e2-f93311f61c5a`，香港時間2026-10-28 04:05。**新指令取代下方歷史「只寫計畫即停」：現在規劃，04:05完成plan並由主代理指揮Luna Max實作（最多3名）；視覺審核與browser測試改交Terra Max（最多1名，按總槽交錯）。** 只優化基礎體驗，不新增遊玩內容。完整所有權、繼承進度及續作入口見[本對話交接](reports/base-experience-current-handoff.md)。本輪尚未實作或跑遊戲檢查。

## 本輪已收束（2026-10-27夜間）

**beta20 SOURCE_DELIVERED／ZIP_VALIDATED／LOCAL_ACCEPTANCE_PARTIAL。** 四區18圖的本期內容、導航、q21／q22、格式5相容與世界回顧已交付；航標新位置正常調查及同Sol單點視覺通過，5相關案例／content／tsc／build／固定pack完整validate沿用已過結果。本輪Sand已正常q12／q13／q22／q14手動領獎並實際南航入Ruins；兩個QA會話及自有server31500／32480、四port皆已清理，profiles與所有證據保留。Frost從正常q08副本出航，最後q09 active3/6未領、q10未接；其未改核心沿用focused，不再擴大完整舊任務重刷，未重演不改成PASS。原q08檔SHA核對仍相同，沒有發布；不宣稱整體CANDIDATE_READY或正式平台通過。

**下一次04:05（2026-10-28香港）只做有界基礎體驗新規劃：全新GPT-6.1 Sol Extra High（gpt-6.1-sol／xhigh／fork none），寫入plan目錄與必要索引後停止，不實作、不新增遊玩內容。** 原任務若有真正未完實作先按交接處理；外部未驗／舊未重演項保持邊界，不自動變成反覆刷舊任務的開發門檻。一次性排程04-05已保存更新，觸發後刪除；詳[當前交付](reports/world-completion-handoff.md)與[最新交接](reports/world-completion-live-handoff.md)。以下為依日期保留的階段紀錄。

**04:05排程最新限制：新計畫僅由全新GPT-6.1 Sol Extra High（gpt-6.1-sol／xhigh／fork none）規劃並寫入項目；文件完成後即停，不進入實作。** 基礎遊戲體驗優化，不新增遊玩內容；排程04-05已更新，仍為2026-10-28香港04:05一次性。原Sol High只沿用審圖，不替代新規劃代理。

**新增排程授權：2026-10-28 04:05香港時間一次性續作已建立（04-05，ACTIVE）。** 未完先續Plan16；若當前任務已完成，才開一個有界基礎體驗改進計畫，禁止新遊玩內容，完成後交接清理。這條使用者新指令取代舊06:30後不新plan／排程限制；不授權發布，原兩次排程不恢復。詳[排程與當前交接](reports/world-completion-live-handoff.md)。

2026-10-27 22:34最新續作：**IN_PROGRESS／beta20 SOURCE_DELIVERED＋ZIP_VALIDATED／LOCAL_ACCEPTANCE_PARTIAL**。前批因用量中斷，fresh Luna b17已正常領q22／q14並由南梯入Ruins，QA browser／server31500已清理，fresh b18接原Frost已正常拾至q09fang2/6，續q09／q10；均先核actual raw，不seed／重開／回載補血。原Sol沿用；航標新位置正常調查／單點視覺PASS與既有source／ZIP檢查沿用，不重跑。仍不新增plan／排程／發布；[當前所有權與來源](reports/world-completion-live-handoff.md)。下方為先前階段摘要。

2026-10-27 下午階段（歷史）：**IN_PROGRESS／beta.20 SOURCE_DELIVERED＋ZIP_VALIDATED／LOCAL_ACCEPTANCE_PARTIAL**。航標1770／430修正及5相關案例／content／tsc通過，新候選正常climb／inspect、同Sol1280構圖名稱避手帳PASS；b14自有服務已清。fresh Luna Max b12在原Sand profile已手動領q12／q13，q22接取後kill2／盆地reach1已ready未claim，q14active0，現往祭壇後合併西返；[精簡進度](reports/world-completion-sand-finish.md)已存。fresh b15從保留的正常q08 raw副本正常備份升級／Continue，正補出航及q09／q10缺步，原件不改；q21／q11及其他已過checks不重做。同Sol沿用、不新增plan／排程／發布；詳[交付](reports/world-completion-handoff.md)及[當前所有權](reports/world-completion-live-handoff.md)。

## 歷史進度（不覆蓋上方當前摘要）

2026-10-27下午使用者明確「繼續」，現恢復 **IN_PROGRESS**：全新Luna Max從原profile／原origin接Sand，補既有Plan16 q22／q14等缺口；原Sol已確認可繼續沿用。不重做已完成q21／q11、不重跑未變checks，不新增plan／排程／發布。beta19來源／ZIP仍凍結，已驗與未驗分開；當前所有權與恢復點見[即時交接](reports/world-completion-live-handoff.md)。以下PAUSED與其他段為歷史。

2026-10-27 使用者明確要求完成當前步驟後暫停，現為 **PAUSED_BY_USER**。q21手動領獎、q11正常勝利→返程→手動領獎、實際進Sand及Sol可見場景已完成；b9只唯讀交接，q12／後續沙海玩法沒有開始。原profile／原始存檔／證據保留，自有browser與服務已清理；兩個一次性排程已刪除，等待使用者恢復，不自動續作。beta19 SOURCE_READY／ZIP_VALIDATED／LOCAL_ACCEPTANCE_PARTIAL，未發布；詳[最新暫停點](reports/world-completion-live-handoff.md)及[集中交付](reports/world-completion-handoff.md)。下方為本輪及先前歷史。

2026-10-27 06:30最後一輪：**beta.19 SOURCE_READY／ZIP_VALIDATED／LOCAL_BROWSER_PARTIAL**。[最終逐圖交付](reports/world-completion-handoff.md)整理四區18圖、來源、存檔相容與驗收邊界。兩個一次性排程`01-25`／`06-30`均已觸發刪除；本輪只收尾Plan16，不再新增plan或排程。q21航標已正常調查，q17兩木偶缺步已補；舊格式確認升級／暫玩保全與q19回顧已有真browser證據。最後兩名全新Luna接原Frost／Sand profile補未完成操作，同一Sol沿用。**未標WORLD_CONTENT_COMPLETE或整體CANDIDATE_READY**；霜雪／沙海實機閉環及音訊／正式平台等仍按最終報告列結果。下方01:25等為歷史快照。

2026-10-27 Plan16新候選 **beta.19 SOURCE_READY／ZIP_VALIDATED；BROWSER_IN_PROGRESS**。W02導航、q21／q22、format5明確備份升級／暫時遊玩、四區手帳／q19世界回顧已實作；相關focused與最終typecheck已過，一次build／固定tools1.2.0 pack/fullvalidate成功。ZIP `artifacts/world-completion-beta19/game-beta19.zip`（131,520,178 bytes；SHA68644dc701fb51fa8f11d69a0698819b4cb01203c8a258d9085c37c5aca6b53b）。兩名全新Luna分開做region與UI瀏覽器必要驗收，同一Sol接後續截圖；尚未宣稱玩家閉環、正式雲端／平台或音訊通過。詳[即時交接](reports/world-completion-live-handoff.md)。

2026-10-27 第一批交付：W00／W01靜態設計已完成，W02地名／第一章後續導航已實作（9 focused cases及typecheck通過）。第二批三位全新Luna並行做format5明確備份升級gate、q21／q22區域內容、W06手帳／世界回顧及航標UI；尚未整合成新候選。司鐘者本期保留8000HP／28DEF／節拍，舊約18秒樣本未達歷史時長範圍照實保留，不以加血磨時間。真實存檔未動；進度／所有權以[即時交接](reports/world-completion-live-handoff.md)為準。

2026-10-27 Plan16已獲使用者明確授權，狀態改為 **IN_PROGRESS**。第一批全新GPT-6 Luna Max三名分別處理W00／平衡設計、W01存檔相容、W02導航實作；圖片審核依指定交同一位GPT-6.1 Sol High至接近300K再換，每次最多一位。兩個一次性會話續作01:25／06:30已建立；06:30最後一輪完成當時計畫並收尾後停止，不再新增plan。以[即時交接](reports/world-completion-live-handoff.md)記錄當前所有權與恢復點；以下Plan16未授權／未啟動為前輪歷史。

2026-10-26 全區域計畫：使用者要求把當前世界地圖各區完成開發，並先製作詳細plan。[Plan16](16-world-completion-roadmap.md) **PLAN_READY；W00–W09尚未啟動**。已按四區18圖盤點，規劃霜雪／沙海探索支線、Lv30橫向進展、首領平衡、四區手帳與世界結局、存檔決策及候選／平台分階段交付。本輪只改文件並做文件檢查，無遊戲／版本／存檔／成品變更。beta.18維持SOURCE_READY／ZIP_VALIDATED／LOCAL_BROWSER_PARTIAL；正常角色q01–q08已分段claimed，最新raw及遺跡證據見Plan16來源，不重跑舊已過項目。下方為既有交接與歷史。

2026-10-26 20:20排程續作：[額外遺跡視覺驗收最新交接](reports/ruins-visual-handoff-20261026.md)。已補成真正勝利→正常再次挑戰：入口沒有舊矩形／青綠圈可見殘留，首領滿綠血條重生，戰後HP／MP及q18進度保留；[專項證據](reports/ruins-retry-2020-20261026.md)。先前三張地圖限定短段、兩種預警與可見半血轉場沿用。beta.18 source／ZIP未改，未重build/tests/pack或發布；正常角色q08claimed 1492B檢查點保留。精確瞬時／音訊／正式平台／雲端仍未驗，Plan15維持LOCAL_BROWSER_PARTIAL。下方為歷史。

2026-10-26 11:51使用者明確續作：從beta.18真實q05 partial6/8原始存檔繼續q05–q08，另做首領量測方法的精簡靜態審查；source／既有成品保留，不重跑q01–q04或未改的通過檢查。新fresh Luna Max分工／最新規格見[11:51派工](reports/resume-1154-dispatch-20261026.md)。下方08:31為上一個排程的收尾紀錄，不是本輪停止狀態。

2026-10-26 08:31已提前收尾：本5h用量98%，未持續至09:00，goal未標complete。beta.18成品／ZIP、三個改善與實際分段browser結果已交付；q05停6/8、q06–q08及其他未驗項保留。所有child已完成，存檔／報告／自有服務cleanup完成；最終來源、限制及下一步見[集中交接](reports/overnight-optimization-handoff-20261026.md)。下方08:18等段落為階段快照。

最新集中交接：[2026-10-26自主優化](reports/overnight-optimization-handoff-20261026.md)（08:18收尾）。**beta.18 SOURCE_READY／ZIP_VALIDATED；LOCAL_BROWSER_PARTIAL**：對話鍵盤／匯入回饋／傳點標示改善完成，相關focused tests、typecheck／build、必要視檢與官方pack／validate按版本各有證據。beta.15 q19手動回報／R2已補完，主線仍標分段；正常從零進度為beta.17 q01–q03、完整原始raw接beta.18 q04已手動領獎，q05實際6/8但未完成／未領。08:13用量90%後停止新scope以保護存檔／服務收尾，所有child已完成；下一次從q05 partial raw正常補血續作，不重跑q01–q04。首領80s樣本未得勝利且未確認持續命中，完整主線／聲音／正式平台／雲端仍未驗。以下為階段快照，以集中交接及專項報告為準。

2026-10-26 06:12最新：**beta.17 SOURCE_READY／ZIP_VALIDATED，local browser仍按範圍PARTIAL**。已完成beta.16對話鍵盤焦點／repeat防連鎖及點按說明，beta.17補匯入競爭取消／重新確認訊息與canonical讀取diagnostic。後者26個聚焦案例、typecheck、獨立build及三個真browser分支通過；不重跑已過且未改的檢查。固定tools1.2.0 pack／完整validate通過，ZIP `artifacts/overnight-20261026/beta17-package/game-beta17.zip`，131,514,096 bytes，SHA `e92f3b663993b19be6ed32a6d613644e4d87db1271c40736e974414573c94620`。[beta.17 source交接](reports/overnight-import-feedback-20261026.md)／[封包交接](reports/overnight-beta17-package-20261026.md)。beta.15 namespace與枝線實測已有報告；主線q19／R2收尾、beta.17空白新玩家與既有背景抖動疑慮正由三個隔離owner補必要驗收，不把舊版本或fixture測試冒充新版本全流程。

00:50與06:00一次性排程均已觸發並刪除。約01:54–06:00曾受用量限制，沒有持續執行；06:00正常用量恢復後接續09:00截止的同一授權，原goal狀態由系統留為usageLimited。[06:00接手範圍](reports/morning-0600-dispatch-20261026.md)。不使用重置信用，不發布／commit／push／tag；08:40起收束，09:00前關閉自有服務與代理。以下較早快照由本段及後續報告補充，不代表仍未開始或全面通過。

2026-10-26 夜間第一個改善完成：**beta.16對話鍵盤QA完成、未封包／發布**。Space／HUD開NPC對話後聚焦首個有效action，維持任務按鈕identity，並抑制長按Enter／Space造成跨任務的連鎖動作；新增普攻／技能點按說明。直接browser測初次Space不誤領、Enter repeat不誤接、獨立按鍵領／接、Esc回遊戲、面板快捷鍵／重綁／數量輸入保焦點均通過，最終typecheck／獨立build通過。QA成品 `artifacts/overnight-20261026/dialogue-focus/dist/`，treeSHA `44583c48e0ff832b212177e88e9c1028dc61be0d2d16d65b83abe396dc81a4ab`；[完整交接](reports/overnight-dialogue-focus-20261026.md)。beta.15原ZIP保留，其他world／boss結果不冒用成beta.16全驗。下一個owner正補本機匯入競爭被取消的可見說明，另立beta.17；主線與枝線browser仍按分工續驗。

2026-10-26 00:50夜間續作：已建立持續至09:00前的active goal，00:50一次性排程已觸發刪除，06:00排程保留。前批browser因用量中斷，現已恢復並由全新Luna Max分別接手。**beta.15瀏覽器驗收為PARTIAL**：格式1–4明確匯入／備份、取消、canonical優先與競爭資料保全、未知格式、一次寫入失敗、dev/build及兩本機路徑已有真browser log並補成[namespace報告](reports/ruins-d-browser-namespace-retry.md)；q15／q16及q17部分有實測證據，R1後半與R3/R4續驗中，不宣稱完整通關。beta.15 dist／ZIP保留不改。下一個改善是以真browser確認NPC對話的鍵盤焦點、澄清普攻／技能點按提示，再另立候選；未完成項不當作通過。[夜間派工與最新規格](reports/overnight-optimization-dispatch-20261026.md)。

2026-10-25 遺跡D：**SOURCE_READY／ZIP_VALIDATED；LOCAL_BROWSER_UNVERIFIED**。`1.0.0-beta.15` 已完成正式ID／canonical本機key接線及玩家明確匯入／暫不匯入，保全原件、舊格式備份及雲端隔離。27個聚焦案例（namespace21、app6）、Node24.22.1下typecheck、219資源引用及一次獨立build通過；固定tools1.2.0 pack／完整validate及有限機密掃描通過。候選 `artifacts/ruins-d/dist/`，ZIP `artifacts/ruins-d/game-beta15.zip`，131,513,398 bytes，SHA `1d7de2c3d38f19ff03bbc279daaea5b724c354183545ed66758d63dbb376e7dc`。Playwright／CUA不可用、Firefox啟動掛起，未載任何遊戲iframe；自有服務已停。正式平台／雲端未驗，未commit／push／發布。主代理統籌全新Luna Max最多三名，主對話未插圖。完整來源、檢查、限制及續作見 [D交接](reports/ruins-d-handoff.md)。以下D規劃／啟動及A–C段落為歷史快照。

2026-10-25 D實作啟動紀錄：依使用者「繼續plan15」授權，規範由主代理完整讀取後轉述。找到bundled Node24.22.1及核對固定tools1.2.0 SHA，無須改全域Node或重生工具；A/B/C來源與成品保留。批次與範圍見 [D派工紀錄](reports/ruins-d-dispatch.md)。

2026-10-25 D規劃：已完成 [plan15](15-ruins-acceptance-and-package.md)，狀態 **PLANNED／未實作**。重新完整讀main模板與七份規格，定點核對現有程式與交接；發現公開ID為`brightwood-first-oath`但main／app仍用`maplewood-swordsman`作本機key，以及目前Node24.19.0低於規格24.22.1。計畫先做保留舊key、玩家明確確認後才複製的namespace修正與合規Node，再以預計beta.15（仍讀1–4寫4）做隔離iframe／存檔／聲畫與完整ZIP。打包CLI實際已有來源／輸出參數，沿用即可。正式平台／雲端／發布另列條件，不自動發布。本輪未派實作代理、未改遊戲／存檔／版本、未跑遊戲測試／build／browser／pack；C仍是beta.14候選，未驗項目維持未驗。

2026-10-25 遠古遺跡包 C：**程式、素材與beta.14獨立候選完成；正式瀏覽器／雲端／ZIP／發布未驗證**。新增誓鐘內殿、失序司鐘者、q18／q19與守誓旅冠；22姿勢單圖集、6動畫、phase2配樂與復原短音，讀1–4寫4並保全格式1／2／3原封套。17個不同聚焦測試檔127項、型別／內容／4包218引用／build通過；11新runtime檔7,559,589 bytes，全章21,867,870 bytes。成品 `artifacts/ruins-c/dist/`，A／B保留。全新Luna Max最多三名並行，用量中斷後恢復指定session原稿；主對話未載圖。本次未commit／push／發布。完整結果與D待辦見 [C 整合交接](reports/ruins-c-handoff.md)。以下各輪為歷史紀錄，C最新狀態以本段為準。

2026-10-25 推送與C規劃：既有背景調整／A／B來源、正式素材及原稿以 `17a4c37` 成功推送至 `origin/fix/background-jitter`，未合併main、未建立PR／發布tag／Release。[14 誓鐘內殿實作計畫](14-ruins-bell-sanctum.md) **PLANNED／尚未實作**，由主代理獨立核對當日最新八份線上文件與現有接線後完成；包含首領循環／一次1200ms轉場、兩套攻擊22姿勢、q18／q19／旅冠、格式4保全、ownership與最小驗收。這一輪未派實作代理、生成素材或改遊戲程式／版本，未重跑遊戲測試、build或瀏覽器。下方B「未commit」為實作階段的歷史記錄，後續push狀態以本段為準。

2026-10-25 遠古遺跡包 B：**程式與素材完成，獨立候選已建置；實際遊玩／正式存檔／ZIP／發布未驗證**。候選 `1.0.0-beta.13` 位於 `artifacts/ruins-b/dist/`，依 [13 回聲探索計畫](13-ruins-echo-exploration.md) 完成即停。新增長廊、行舟／雙碑、q17／q20、inspect調律、兩種怪物與36有效姿勢；讀1／2／3、寫3，轉寫前保全舊封套。10個新增runtime檔共2.35 MiB，A+B共13.65 MiB。14個不同聚焦測試檔共92項最終通過，typecheck／content／4包207引用／build通過；沒有全回歸。主代理指揮全新Luna Max分批、最多3名，額度中斷後恢復原稿，主對話未載入生成圖。來源、檢查、正式格式3橋接限制見 [B 整合交接](reports/ruins-b-handoff.md)；A成品保留，C／D未完成，未commit／發布。

2026-10-25 遠古遺跡包 A：程式與素材完成，候選 `1.0.0-beta.12` 已建置至 `artifacts/ruins-a/dist/`，按計畫完成 A 即停。主代理指揮全新 GPT-6 Luna Max 分批實作，同時最多三名，主對話未載入生成圖片。新增營站／石道、q15／q16、苔陶蟲、兩位 NPC、航路、區域圖與音樂；15 個新 runtime 資源共 11.29 MiB。型別、內容、入口流程與 loader／引用／動畫契約及 build 已檢查；測試篩選曾選入舊工作樹，唯一舊斷言失敗如實記錄。未跑瀏覽器、正式雲端、ZIP 或發布；讀 1／2、寫 2 仍待正式橋接部署。完整來源、檢查、限制及下一步見 [A 整合交接](reports/ruins-a-handoff.md)。此為A當時紀錄；B最新結果見上，C／D尚未完成。

2026-10-25 企劃階段紀錄：[遠古遺跡・失聲的誓鐘](12-next-chapter-ancient-ruins.md)由主規劃獨立設計；當時尚未實作並保留 beta.11。後續 A 實作狀態以上方 beta.12 交接為準，先前 beta.11 遊玩驗收限制不因此視為通過。

2026-10-18 repository 更新：Public repository [TommyLamm/brightwood-first-oath](https://github.com/TommyLamm/brightwood-first-oath) 的 main 已推送，[v1.0.0-beta.1 預發布 Release](https://github.com/TommyLamm/brightwood-first-oath/releases/tag/v1.0.0-beta.1) 已建立，唯一 `game.zip` 已上傳；GitHub workflow 建置／固定工具驗證／pack／validate 全部成功。三個已完成工作樹與臨時分支已清除，原提交歷史保存在 main；尚未追蹤的計畫、來源原稿與預覽已補提交。實際結果見 [GitHub 發布報告](reports/github-release-20261018.md)。下方先前「沒有 tag／Release」是候選驗收當時的歷史狀態。Playroom 尚未上架。

由主 Agent 統一維護；經主 Agent 明確授權的實作代理可更新自己負責的工作段。建立計劃不算實作完成。狀態：NOT_STARTED → READY → IN_PROGRESS → PARTIAL／BLOCKED／REVIEW → DONE。缺驗收標 UNVERIFIED，不寫 PASS。

## 2026-10-24 霜雪群島擴充（IN_PROGRESS）

- Stage A 已實作：新增 frost-shore「雪痕海岸」，q08 領獎後可由 Guardian Arena 前往，回程不設任務鎖；補入 world map 地標與探索進度、mapOrder、地圖驗證、frost 背景主題及格式 1 存檔相容測試。
- Stage A 最小檢查 exit 0：npm.cmd run typecheck、npm.cmd run check:content、git diff --check；指定 world-map、persistence、app-foundation 測試檔後，Vitest 回報 9 files／74 tests passed。此命令輸出比預期測試檔數廣，未再重跑。
- Stage A 實作 commit：f347c76；素材接入 commit：97be61e（sky，原始 7121210）、f632528（far/mid，原始 a5d86d3）。未推送，沒有建立 tag／Release 或發布。
- Stage A 當時尚無怪物、亦未做瀏覽器驗收；此為該階段快照，已由下方 Stage B 更新。
- 後續方向：延續為 frost-shore → frost-pine-pass → frost-tide-cavern；再加入差異化短衝刺敵人、可躲預警首領與區域手動任務，維持等級上限 30、桌面單人劍士和格式 1 存檔。
- 本輪唯一追蹤報告：reports/world-expansion-20261024.md。

| 包 | 狀態 | 擁有者 | 輸出／下一步 |
| --- | --- | --- | --- |
| T00 | DONE | 本輪整合代理 | G0、共用契約與根設定完成；T00-09 已隨四包 canonical manifests／素材交付收尾。遊戲接合另由 T14/T16 驗收 |
| T01 | REVIEW | T01 package | 規則、物品、技能、怪物資料與局部測試已交付，待整合驗收 |
| T02 | REVIEW | T02 package | 移動核心及 15 項局部測試已交付，待手感／遊戲整合驗收 |
| T03 | REVIEW | T03 package | 戰鬥核心及死亡清理交接已交付，未驗收完整路線 |
| T04 | REVIEW | T04 package | 成長、背包、經濟 domain 已交付，待 app/主線整合驗收 |
| T05 | REVIEW | T05 package | 七地圖與八任務資料/核心已交付，未做全套跨表建置驗收 |
| T06 | REVIEW | T06 package | actor/boss 核心及局部測試已交付，待 T14 實際遊戲整合 |
| T07 | PARTIAL | T07 renderer | renderer／anchor／quest marker／VFX source 已合入；本輪有限瀏覽器看過角色、武器、場景與標記。完整動作、地圖／技能視覺及路線驗收仍未完成 |
| T08 | DONE | T08 UI | 桌面 UI package 已交 T14；完整 app/遊戲驗收仍由 T14/T16 負責 |
| T09 | REVIEW | T09 persistence | 存檔核心與格式驗證已交付，待整合/cloud 環境驗收 |
| T10 | DONE | T10 assets | 素材22 images／64 animations＋96 hero anchors；缺圖已由原ImageGen稿匯出補齊；遊戲接合未驗證 |
| T11 | DONE | T11 assets | 素材20/20 keys；platform／slope由原ImageGen稿確定性匯出入庫（`4765c45`）；遊戲接合未驗證 |
| T12 | DONE | T12 assets | 素材47 images／5 VFX animations；heavy-strike v9匯出入庫（`0520204`）；遊戲接合未驗證 |
| T13 | REVIEW | T13 audio | 16 個原創 WAV/controller 已交付；瀏覽器解碼、播放與生命週期未驗收 |
| T14 | PARTIAL | 本輪整合代理 | app／T07／T08 已整合；有限正常瀏覽器路線到 q01 2/3，讀檔、Esc、正式 UI icons 與 iframe input 有限驗證。真實音訊播放及完整路線仍 UNVERIFIED |
| T15 | DONE | T15 package | 正式 gameplay cover、119-entry ZIP、官方 pack/validate、hash／entry／機密掃描已完成；證據見 `artifacts/T15-package-evidence.json` |
| T16 | PARTIAL | 本輪整合代理 | typecheck/build/content、T15 archive、cross-origin `/dist/` iframe、sandbox/allow、960/640 resize 已完成；完整主線、fullscreen、雲端與 FPS 未驗證 |

## 2026-10-18 候選與驗收更新

- main runtime candidate 為 commit `56ec0fe`。`npm.cmd run typecheck`、`npm.cmd run build`、`npm.cmd run check:content` 各執行一次且 exit 0；build 另有 Vite 大 chunk 建議警告。未重跑完整測試套件。
- T15 以 `56ec0fe` 的 `dist/` 產生 `artifacts/game.zip`：`brightwood-first-oath` v`1.0.0-beta.1`、tools `1.1.0`；官方 pack/validate 通過。119 entries、36,361,975 bytes、SHA-256 `13920DD169E1852DF200DFA8416A85D6268A179342ECB45C9C6CAEE3D68CE875`；T15 機密／可疑檔名掃描無命中。完整紀錄見 `artifacts/T15-package-evidence.json`。
- 單一 Vite server `http://127.0.0.1:5173/` 與 hidden IAB：建立 `旅人`、正常接取 q01，真實擊殺計數到 2/3；reload 後「繼續冒險」恢復 EXP 20/55、角色、地圖與道具，續玩後進度到 2/3。Esc 關閉任務面板、官方 interface icons、角色武器／場景有限視檢通過。未完成 q01 第三擊、森芽回報／獎勵，也未走 q02–q08；沒有計時或宣稱 45–60 分鐘。
- 同一 server 以 `http://localhost:5173/dist/` 載入不同 origin 子目錄 iframe，`sandbox="allow-scripts allow-same-origin allow-pointer-lock"`、`allow="fullscreen; autoplay; gamepad"`。production 首屏可載入，960×540 與 640×360 顯示正常；暫時遊玩中 ArrowRight、J、Esc 與普攻可操作。CUA 沒有此頁的 browser-console logs capability；Vite server log未見錯誤，只有 production dynamic-import analysis warning。瀏覽器 console clean、可聽見 WAV／音訊 lifecycle、fullscreen／平台退出、真實 Playroom account/cloud、FPS／完整路線均維持 UNVERIFIED。
- T14-22、T14-25、T16-04/05/07/08/09 未完成。T16-06 只完成跨 origin／子目錄、sandbox/allow、尺寸及基本輸入子集；未完成 console、音訊或全套平台矩陣。沒有 tag、Release 或平台上架。

## 契約

文件契約 v1；T00 共用骨架與契約已落地並開放 G0。2026-10-18 最新素材同步：T10–T12素材檔已完整，actors22 images／64 animations＋96 anchors、environment20 images、interface47 images／5 animations；本次只完成素材，不宣稱遊戲接合通過。變更記日期、原因、受影響包及接線處置。

## 檢查與阻塞

本次只完成素材：經使用者明確授權，復原既有ImageGen原稿並保留裁切／重排／最近鄰縮放／清邊alpha腳本。新素材完成視檢，離線素材audit通過檔案存在、相對路徑、key唯一、切格、動畫引用、96個anchors、各包體積及新圖16px安全邊／binary alpha。應用程式loadRequiredAssetManifests以本地JSON檔案讀取通過四包（audio沿用既有16 entries）。詳細證據見[素材交付報告](reports/asset-recovery-20261018.md)。

（歷史紀錄）截至素材復原報告建立時，本輪 build、typecheck、瀏覽器、pack/validate 與 iframe 驗收尚未執行，當時亦沒有候選封面或 ZIP。以上結論已由本節 2026-10-18 候選與驗收更新取代；完整路線、真實音訊播放、雲端、fullscreen 與平台發布仍未驗證。

2026-10-18 主線節奏補充（package-level 靜態估算，非完整路線試玩）：T01/T03 估算 41 隻必需敵人的高輸出攻擊窗約 58.55 秒（首擊至末擊理想下界約 55.60 秒）；普攻-only 配置約 790.56 次攻擊、約 7.20 分鐘理想連續攻擊。T02 前向地圖走訪為 11,110 px／約 79 秒；T02/T05 代表任務路線約 34,340–35,140 px／約 4.1–4.2 分鐘無阻走路。估值不含完整追敵、互動、選單、失誤、操作與實際戰鬥節奏，不能相加宣稱通關時間；目前沒有證據支持 45–60 分鐘，模型顯示主線很可能偏短。各包依 08 等待整合可玩路線的代表性實測再集中調節奏；T14-25 仍未執行，主線時長未驗證。

2026-10-18 素材復原補充：T10 `actor:hero-cloth` v8（1254×1254，非 8×8 可切尺寸且有彩色柔邊）、T11 `env:tile-platform` cedar-plank one-shot（2172×724，尺寸、頂邊、gutter、接邊失敗）、T12 `vfx:heavy-strike` v7（6×1 尺寸可切但前五格透明內縮 0–3px、低 alpha 與紅邊）皆只保留 source-only。最後 T12 v8 one-shot 仍為 2172×724（3:1 而非 6:1），六格安全邊未達16px、79,683個半透明像素且有紅／粉邊；拒絕後依使用者指示停止素材重試，未加入runtime／manifest。T11 在中止前產生 stone-timber source 候選，但未完成檢視，仍未驗收且不計coverage。T07 terrain geometry focused check commit `a118ab6` 通過8項測試及 renderer-only strict tsc；素材驗收仍待完整資產。canonical coverage 仍為 actors 部分清單、environment 18/20、interface 46 images／4 animations，T14 啟動素材閘門未解除。細節見各包最新 reports 與 source logs。



2026-10-18 本次素材復原完成：下方／前段歷史紀錄中的source-only結論是指未處理原稿，已由本次使用者授權的確定性匯出解除缺圖；原稿仍保留，正式使用新版本PNG與更新manifest。素材完成不等於T14/T16遊戲驗收完成。

2026-10-18 T00-09 收尾：四包正式 manifest／素材齊全（actors 22 images／64 animations＋96 anchors、environment 20 images、interface 47 images／5 animations、audio 16 entries），asset-recovery 報告已記 `loadRequiredAssetManifests` 以本地 JSON 通過。T00 標 DONE。T14 音訊接線已在 app；仍需 T07 將正式角色／地形／VFX 呈現接到實際遊戲並檢查腳底、anchors、動作節拍，另以瀏覽器驗證 WAV 播放。T14-25 完整 45–60 分鐘路線未跑，時長仍 UNVERIFIED；T15 截圖／封面／ZIP 及 T16 驗收未完成。沒有 build、typecheck、測試、瀏覽器、pack/validate 或發布的新結果。

## 2026-10-24 Stage B／瀏覽器集中檢查更新（IN_PROGRESS）

- Stage B 已提交：9f90269 新增 Lv30 霜牙雪狼、海岸三處生成、保證掉落霜牙（可向既有商人出售，35 金幣）；未變更存檔格式。狼 atlas 接入為 61db462，來源為素材代理 commit d54fdd0，229×229 cell 的 6×5 atlas，runtime 96×96。
- 已接入素材：霜牙圖示 be6958d（原始素材 commit 1108e25，128×128 RGBA，runtime 32×32）；雪岸地區卡 87fbd08（原始素材 commit aba7c7c，960×540 opaque）。先前雪岸三層環境在 97be61e、f632528。
- Stage B 直接相關檢查均 exit 0：npm.cmd run typecheck、npm.cmd run check:content、npx.cmd vitest run tests/rules.test.ts tests/world-map.test.ts tests/integration/app-gameplay.test.ts tests/integration/app-foundation.test.ts（12 files／117 tests passed）、git diff --check。未跑全套回歸或完整 build。
- 瀏覽器檢查為 PARTIAL：使用隔離 Playwright profile 的人工 q08 claimed、Lv30 劍士 fixture；成功載入雪痕海岸、reload 後從標題續玩並恢復地點、世界圖列出已探索 8/8 與海岸詳情、顯示狼與場景素材、使用「返回城鎮」抵達木葉鎮。畫面觀察到霜狼攻擊，fixture HP 660 降至 419。自動化操作未擊殺狼、未在 browser 驗掉落；狼戰鬥／必掉霜牙／拾取／出售由上述 focused integration test 覆蓋。此 fixture 起點是人工構造的 q08 完成存檔，不代表從頭通關；未完整走祭壇傳點往返。
- 隔離存檔 key maplewood-swordsman:save:v1:dev 已刪除，Playwright session frost-shore-stage-b 已關閉。我送出 Ctrl-C 的 Vite exec session 為 33276；主代理另觀察到 PID 15908 仍服務 5173，故保留該共用／來源未確認的程序，沒有再終止。
- 本聊天 heartbeat 06-55-2 已於 2026-10-24 香港時間 06:55 執行並刪除；當時用量重設後為 1%，ordinary usage allowed。先前8%／06:51為歷史讀值。
- Stage D 候選版本 1.0.0-beta.6 已確認 beta.1–beta.5 為既有版本，於 3b327e1 更新設定；runtime 動作節拍修正在 799d08f、288693e。最終 build、固定工具 pack/validate 通過；隔離 browser 驗收 PARTIAL，未完成首領勝利/q11手動領獎。完整證據與限制見唯一續作報告的 Stage D current snapshot。

## 2026-10-24 霜雪群島 Stage D snapshot (candidate checks done; browser PARTIAL)

- Stage D 驗收時 runtime commit 為 288693e；當前 Gold Sand 進度見下節。唯一未追蹤路徑是 .worktrees/，保留全部 worktree；沒有把它加入 commit。
- Stage C1/C2 與路線內容已在 main：q09/q10 445559f；第三地圖 Cave bf7bfb5；pine/cave backgrounds df70efa / 06e884d；雪芽素材/接線 0e6a333；Warden atlas provenance/runtime 4b5d3d9 / 3134390；區域圖 UI 3ec2b8d 與 focused test 9c88e5c。以上 commit 不要重挑。
- Warden gameplay fa11987：Cave 切至 boss music/classification；霜潮守望獸 Lv30、HP 7600、碰撞 72×72、atlas 顯示 192×192；獠牙下砸（900ms 預警、190×120）與低潮湧浪（1100ms 預警、380×30，可跳躍）交替，首領免擊退，有專屬 result/retry/返回海岸路徑。新 boss death/retry 不改 bossDefeated/chapterComplete；q08 Guardian 流程維持原狀。
- q11/item 接線 87fb9a1：q10 claim 後可在雪芽處手動接取；擊敗 Warden 後回海岸手動 claim 才獲得一次冰潮長鋒。武器攻擊 +50、Lv30、不可購買、同一武器槽；比 Guardian sword +38 高 12，目標是提供封頂後可感知的進展。sprite 64×64 RGBA、icon 128×128 RGBA/runtime32 已在 7838c1d / 7137479；兩者現在註冊為 item/visual。
- SaveData format 1 未變。缺少 q11 的舊存檔仍有效，q11 開始為 locked/available 由 q10 claim 決定；Warden result/retry/claim 不動 q08／Guardian flags。
- Warden 包驗證 exit 0：npm.cmd run typecheck、npm.cmd run check:content、Vitest actors/rules/app-gameplay（3 files／38 tests；排除 .worktrees）、git diff --check。
- q11/item 包驗證 exit 0：npm.cmd run typecheck、npm.cmd run check:content、Vitest rules/app-foundation/frost-quests（3 files／17 tests；排除 .worktrees）、git diff --check。新增 integration 覆蓋老存檔缺 q11、Boss kill 使 q11 ready、返回雪岸手動 claim、獎勵單次與舊 flags 不變。
- UI agent 先前的第三節點／80%–25% landmark／q10 gate focused tests 仍有效；q11/item 沒改 world-map UI/model/styles/controller/tests，未重跑該組。
- 尚未做集中瀏覽器、build、pack/validate 或全路線遊玩。下一步依協調安排做一次集中驗收，使用隔離 profile/fixture，清楚標註起點，不稱為從頭通關。
- 本包開始前已完整重讀模板與七份規格（game-development、command-contracts、game.schema、game-release、starter playroom-sdk.js、sdk-versioning、save-compatibility），香港時間約 2026-10-24 07:23。適用要求為相對資產 URL、iframe 子目錄相容及存檔 format 1 不遷移；沒有發布／push/tag/Release 授權。
- Stage D 開始前於香港時間約 2026-10-24 07:30 再次完整讀取本地 AGENTS.md、線上模板及七份規格；對本輪適用的是保持相對資產路徑／子目錄 iframe 兼容及 format 1 存檔，完成真實 build 與固定工具 pack/validate；不建立 tag／Release、不發布。
- Historical heartbeat note: heartbeat 06-55-2 was deleted; the coordinator later confirmed the goal is active and ordinary usage is allowed. No user resume action is needed.

## 2026-10-24 黃金沙海 Stage A initial snapshot (historical; superseded below)

- 新區域已由 planned 黃金沙海轉為真實 MapDef。第一張「琥珀砂岸」sand-glass-shore 加入 mapOrder、world validator 與 sand environment theme；Frost Shore 東門要求 q11 claimed 且 Lv30，沙岸西門可無鎖返回 Frost Shore。SaveData format 1、q01–q11 與 Guardian flags/任務契約未改。
- Regional atlas 現有獨立 sand scope、全域黃金沙海入口點、Frost↔Sand 真實 portal 連線及 q11 鎖定狀態；只有 catalog 真正存在的 maps 才繪出區域節點。當前沙海僅有 1 張可玩探索圖，沒有怪物、NPC、沙海任務或首領；其餘兩個圖位是座標資料、UI 不會假繪成可玩節點。
- 素材 commit c8997ed：960×540 黃金沙海路線圖及 shore sky/far/mid 圖層，far/mid 真 alpha；保留原始 ImageGen PNG、逐項完整 prompt 與 source logs。Chart 在 320×180 可分辨海岸、沙脊、綠洲；三層合成已視檢。Runtime 約 2.5 MiB。
- 程式／區域接線 commit bf2cc2f：MapDef、portal、mapOrder、world validator、兩個資產 manifest、atlas model/UI/CSS、world-map focused test。
- 直接相關檢查 exit 0：npm.cmd run typecheck、npm.cmd run check:content、Vitest tests/world-map.test.ts --exclude '**/.worktrees/**'（1 file／7 tests）、manifest/file/dimension/alpha Python 檢查與 git diff --check。未對最新 Gold Sand commit 執行 build、pack/validate 或 browser。
- 本開發包開始前，已完整重讀本地 AGENTS.md、Playroom game-agent template 及其七份線上規格，另讀 plan/10-asset-spec.md 與 imagegen skill。適用要求是相對 asset URL、iframe 子目錄相容、format 1 存檔及來源原稿保留；本包最小驗收為新圖可由 q11＋Lv30 到達並自由回程、atlas 只顯示真實 MapDef、舊 save 無新欄位依然有效、manifest/內容/型別/focused tests 通過。未升級 SDK/schema、未發布/push/tag/Release。
- 本區域尚未完成。c498dce 加入 sand-scorpion（Lv30，攻擊碰撞 52×44）、850ms 可讀風報的 190px 低尾刺 sand-stinger，以及保證掉落、可出售 42 金幣的 amber-scale。當前只完成 rules/actor AI definition，尚未在任何 MapDef 生成；正式 actor atlas 尚未交付，不得稱為可遭遇／可拾取。
- amber-scale icon 已由 29820ce 整合為 128×128 RGBA、runtime 32×32；0e2b40b 將其加入 interface manifest 與 required keys。四張6×5 scorpion atlas與一張2×2 attack-strip候選由07382d4/fac1544 source-only保留；均有紅邊或尺寸／格線問題，無runtime atlas，ImageGen重試已停止。
- c498dce 相關檢查通過：npm.cmd run typecheck、npm.cmd run check:content、npx.cmd vitest run tests/rules.test.ts tests/actors.test.ts --exclude '**/.worktrees/**'（2 files／17 tests）；git diff --check 通過。上一輪新增斷言排序曾失敗，修正後 focused run 全通過。
- a65b1d9 修正資產契約：loader 現強制要求 sand 的 sky/far/mid 三層；foundation 測試驗證缺任何一層都會拒絕，也更新 Gold Sand item/map catalog 預期數。npm.cmd run typecheck 與 npx.cmd vitest run tests/integration/app-foundation.test.ts --exclude '**/.worktrees/**'（1 file／10 tests）通過。
- 0e2b40b 將 amber-scale icon 加入 manifest/required keys；typecheck 與更新後的 app-foundation focused test（1 file／11 tests）通過。07382d4/fac1544 僅保存不合格 scorpion 候選與 source notes，無 runtime；沒有因此新增遊戲驗收。
- 32d204a 增加 sand-stinger combat check，證明空中角色能跳過低尾刺、地面角色在相同 90ms active window 受擊；npx.cmd vitest run tests/combat.test.ts --exclude '**/.worktrees/**'（1 file／11 tests）與隨後 npm.cmd run typecheck 通過。
- 3b541f3 新增 test-only sand-scorpion spawn 的完整遊戲流程：攻擊、擊殺、保證琥珀甲片掉落、拾取、回鎮出售；`npx.cmd vitest run tests/integration/app-gameplay.test.ts --exclude '**/.worktrees/**' -t 'amber scale'`通過1項（23 skipped），`npm.cmd run typecheck` exit 0。production MapDef仍無該怪物，不能視為實際遭遇驗收。
- 上一進度快照記錄當時沒有可用沙蠍 runtime atlas；以下為使用者 2026-10-24 指定的目前範圍，取代先前擴展到 sunwell-basin、boss 或 q12–q14 的方向。

### Historical implementation snapshot (before accepted art/runtime integration; superseded below)

- Commit bb23360 adds three repeatable sand-scorpion spawns on sand-glass-shore, sands-guide and q12 (manual accept; three kills plus three amber-scale consumed at claim), and a q12-gated route to a 2,600px sand-dune-pass with five foothold levels, ladders, four repeatable scorpions and an unrestricted return portal. World catalog validation contracts and the existing Gold Sand atlas assertion were updated. git diff --check passed before commit.
- No tests, build, pack, browser run or playable acceptance has been performed for this code stage. The scorpion runtime atlas and dune runtime wiring remain pending. Do not report either phase complete yet.
- Dune art commit 1112506061ccdde51ffe82b509388135038f50c7 delivered sky, far/mid canyon layers and sands-guide. Visual review found a bright red/magenta fringe on far/mid transparent edges; those two layers are withheld pending cleanup. Sky and guide looked clean. Scorpion source commits 2a4bba3, 59bdb9b and 36ce331 contain only source art; runtime atlas remains pending.
## 2026-10-24 黃金沙海有限續作（目前權威計畫；Stage 3 完成即停止）

只完成 production sand-glass-shore 沙蠍遭遇、sand-dune-pass 第二地圖及 q12 手動解鎖任務、一次集中驗證與提交整合。保留 SDK/tools 1.1.0、SaveData format 1、既有 q01–q11/Guardian 行為和相對資源路徑。不新增第三張圖、首領、新區域或後續功能；不 push、tag、Release 或上架。

| 階段 | 負責人與依賴 | 完成條件 |
| --- | --- | --- |
| 1. 沙蠍 production encounter | 本整合代理負責 runtime、MapDef、loader/manifest、focused check 與 main 整合；/root/expansion_art 負責 scorpion 圖像。需先收到通過檢視的隔離 worktree runtime atlas；prototype/source-only 圖不可用。 | sand-glass-shore 實際生成 sand-scorpion；stinger 預警、可躲低尾刺、死亡、保證 amber-scale 掉落、拾取及商人出售都從生產遭遇觸發。Atlas 符合 renderer idle 200ms、dead 100ms 契約，frame 數依實際可用姿勢決定。加一個真實 MapDef/遭遇 focused integration check。 |
| 2. sand-dune-pass + q12 | 本整合代理負責 MapDef、探索路線、portal、quest/runtime 與 focused check；/root/sand_scene_art 負責新 ImageGen 地景和 guide/NPC 圖。接線前確定實際路徑、尺寸、alpha 和 manifest 契約。 | 建立真實第二張可玩圖，含探索迴路/平台與可自由回沙岸的出口。guide 手動接 q12；擊敗可重生沙蠍並交付 3 個 amber-scale 後手動 claim，才解鎖地圖。已售出材料可重取，不軟鎖。atlas/world catalog 只顯示真實定義。舊 format 1 存檔可缺 q12 狀態並安全使用；不改格式。 |
| 3. 集中驗證、分段提交並整合 main | 本整合代理負責；素材只 cherry-pick 通過檢視的 commit，保留 .worktrees/ 且不 stage。 | 只跑直接相關 typecheck/content/focused tests（Vitest 排除 **/.worktrees/**）、一次 build、固定 Playroom tools 1.1.0 pack/validate 和一次隔離 browser smoke，覆蓋入口、遭遇、戰利品、q12、第二圖探索與回程。所有本輪提交整合到 main；文件如實列出未驗證項目。達成後標記完成並停止。 |

基線為 main HEAD 3edb5f7。已有 sand-glass-shore、q11/Lv30 入口、琥珀甲片 icon、沙蠍 AI/低尾刺 prototype 和 test-only loot flow；尚無 production spawn/atlas、sand-dune-pass 或 q12。兩份 art worktree 分別供應沙蠍及 dune scenery/NPC，程式整合不重做圖像生成。

## Current ownership (2026-10-24 finite Gold Sand task)

| Agent | Workspace | Current responsibility |
| --- | --- | --- |
| /root | Coordinator | Owns the finite scope and final QA coordination. |
| /root/sand_integration | repository main | Runtime/content implementation and focused checks are committed on main; beta.7 candidate build/package is ready. Browser QA and fixture cleanup are complete. |
| /root/expansion_art | .worktrees/expansion-art | Art delivery complete; accepted source poses and runtime atlas are integrated on main. |
| /root/sand_scene_art | isolated worktree | Art delivery integrated on main; completed the browser route smoke and removed its disposable fixture. |

Earlier agent rows and worktree states below are historical. In particular, the completed frost interface agent's old instruction not to edit world-map files/tests does not restrict this second-map task. Preserve existing .worktrees/ contents; do not stage .worktrees/.
## 恢復方式

This finite three-stage task is complete. The implementation and focused checks are committed on main; the beta.7 build and pinned tools 1.1.0 package validation passed; the bounded browser route reached Sand Dune Pass and returned to Sand Glass Shore. Read the final evidence section for the exact fixture, route coverage, limits, package details and cleanup. Stop here: do not start a third map, boss, new region, or follow-on feature. No push, tag, Release, listing, or platform action was performed.

## 2026-10-24 黃金沙海三階段完成（final acceptance）

範圍固定為 production sand-glass-shore 沙蠍遭遇、sand-dune-pass 第二地圖與 q12 手動解鎖，Stage 3 完成後停止；不新增第三地圖、boss、新區域或後續功能。

- Stage 1 code/assets 已整合：sand-glass-shore 使用正式 sand-scorpion production spawn、真實 atlas 與 amber-scale 掉落；stinger warning、低尾刺可跳躍閃避、死亡/拾取與既有商店出售機制沿用。相關 commits：9c2cfa5、1222369、cf79fc1、2a300f7、f46dcb6。
- Stage 2 code/assets 已整合：sand-dune-pass 五層平台／梯子探索路線與自由回程；手動 q12 需三次擊殺及交付三片 amber-scale 才可 claim 並開門。dune scenery、sands-guide 與 scorpion runtime assets 均在 main。相關 commits：bb23360、4fdcd14、c6fd2d8、fe7ec30。
- Focused checks passed at runtime commit f46dcb6: npm.cmd run typecheck; npm.cmd run check:content; npm exec -- vitest run --exclude '**/.worktrees/**' tests/integration/app-foundation.test.ts tests/integration/app-gameplay.test.ts tests/persistence.test.ts tests/world-map.test.ts (4 files, 56 tests); git diff --check. The focused persistence coverage accepts a format-1 save with q12 absent. Separate app-audio/app-persistence fixture attempts failed because their pre-existing mock asset manifests omit newer Frost Tide/Amber keys; those failures are not claimed as passing or attributed to runtime code.
- Candidate metadata commit 9cf9b3d aligns package.json, package-lock.json and public/game.json at 1.0.0-beta.7; no tag was created.
- Final candidate checks passed: npm.cmd run build (Vite 8.3.4, 63 modules); node tools/playroom/pack.mjs dist artifacts/game.zip; node tools/playroom/validate.mjs artifacts/game.zip. Official pinned Playroom tools 1.1.0 reported valid. ZIP is 52,258,660 bytes, 171 entries, 55,118,120 uncompressed bytes; SHA-256 93612A00CA3CE260A5DD6BAC8F1E223F1B32B8DBDFD88263E75365B27D83D280, under 64 MiB.
- Browser smoke has completed in the isolated disposable fixture. The final q12 claim, pass entry, short movement and free return, with the exact fixture setup and limits, are recorded in the final acceptance section below; no full platform climb or from-scratch game run is claimed.
- The provisional snapshot above was at 9cf9b3d; test commit 3bdf9f0 and the final docs-only commit complete the task. The only untracked path is .worktrees/, preserved and never staged. No publish, push, tag, Release, or platform API action occurred.

## 黃金沙海三階段最終驗收與停止點（2026-10-24）

- 三階段均完成並已在 main 整合：正式沙蠍遭遇；sand-dune-pass、琉砂與手動 q12 解鎖；最小 focused checks、beta.7 build/package 驗證及一次隔離 browser smoke。實作／測試最後 commit 為 3bdf9f0；本狀態板與詳報由其後的 docs-only commit 收尾。沒有後續程式變更。
- 新增 q12 直接 gameplay 整合案例於 tests/integration/app-gameplay.test.ts：單獨執行 1 passed（24 skipped），覆蓋手動接取、三個正式 MapDef 沙蠍 spawn 的擊殺與琥珀甲片拾取、ready 狀態仍鎖門、手動 claim 消耗三片、解鎖並進入砂丘關道、由免費 west portal 返回。測試用 Lv30/q11 claimed 前置存檔及 HP=1 的目標以縮短戰鬥；瀏覽器 smoke 則另驗證真實即時遭遇。npm.cmd run typecheck 與該檔 git diff --check 通過。
- 舊 format 1 無 q12 欄位案例位於 tests/persistence.test.ts:175，並包含於原 focused run（4 files / 56 tests）；新增案例獨立執行後沒有重跑既有套件。既有 amber-scale 正式 MapDef 撿拾／出售案例也在 56 項內；出售不列為 browser 驗證。
- Browser 使用一次性、format 1、Lv30/q11 claimed、起初缺 q12 的隔離存檔，不是從頭通關或使用者存檔。為免重走舊地圖，唯一後續 fixture 改動是把 location 設為 frost-shore/left；玩家、任務、背包、HP、能力與其餘資料保留。之後實際使用霜岸傳點進入沙岸、擊敗第三隻生產沙蠍並以 Z 撿到第三片、與琉砂對話並按「領取任務獎勵」、確認自由探索／金幣 2,390→3,790、實際進入砂丘關道、短暫左右移動並使用免費西側傳點回沙岸。沒有聲稱 Town→Frost 行程、完整五層平台／攀梯通關或完整從頭通關。
- 同一 browser fixture 起初進度為 2/3，第三戰曾正常死亡；Return to Town 保留任務、背包及金幣進度。其後恢復到 Sand 的實際第三隻擊殺、撿取及 claim 均完成。最終狀態為琥珀砂岸、q12 已 claimed／自由探索、HP 71/660、金幣 3,790。Console 3 則訊息、0 errors、0 warnings（1 則 Phaser 啟動 info）。
- Browser 圖片：output/playwright/sand-beta7/sand-dune-pass-entry.png、output/playwright/sand-beta7/sand-glass-shore-return.png；早期死亡截圖 C:/Users/Tommy/AppData/Local/Temp/brightwood-sand-smoke/.playwright-cli/page-2026-10-24T02-27-58-671Z.png。
- QA 清理只移除 named sand-smoke 的 maplewood-swordsman:save:v1:dev（existed=true、removed=true）並關閉該 session。共用 localhost:5173 沒有終止；cleanup 後 HTTP HEAD 回 200。保留輸出圖片，沒有刪除其他存檔。
- beta.7 候選包仍是 C:/Users/Tommy/Desktop/brightwood-first-oath/artifacts/game.zip，52,258,660 bytes、171 entries、55,118,120 uncompressed bytes，SHA-256 93612A00CA3CE260A5DD6BAC8F1E223F1B32B8DBDFD88263E75365B27D83D280；pinned tools 1.1.0 validate 通過且低於 64 MiB。新 commit 只含測試與文件，不改 production bundle；因此沒有重建或重複 pack。
- 提交後 tracked worktree clean；唯一 untracked path 是 .worktrees/，保留且未 stage。沒有 publish、push、tag、Release 或平台 listing。此有限目標已完成；停止，不展開第三張地圖、首領、新區域或 follow-on 工作。

## 2026-10-24 日井盆地有限續作（新一包；Stage 3 完成即停止）

使用者最新指示「繼續實作下一個任務」授權一個新的有限開發包。前文 Gold Sand 三階段完成後的 STOP 是上一包的完成紀錄；此節記錄本次新授權並取代其作為目前任務範圍。這一包完成後停止，不建立下一個功能目標。

開工前已完整讀取根目錄 `AGENTS.md`、線上 `templates/game-agent-template.md`，以及其列出的七份 main 規格：`docs/game-development.md`、`docs/command-contracts.md`、`templates/game.schema.json`、`templates/game-release.yml`、`examples/starter/playroom-sdk.js`、`docs/sdk-versioning.md`、`docs/save-compatibility.md`。適用要求：素材使用相對路徑並支援版本／預覽子目錄 iframe；SaveData format 1 保持舊檔相容；既有 q01–q12 與 Guardian 流程不變；沒有發布、push、tag、Release 或上架授權。

本包只新增第三張真實黃金沙海地圖 `sand-sunwell-basin`「日井盆地」、Lv30 普通怪 `sunwell-beetle`「日井甲蟲」、可保證掉落且僅可出售的 `sunwell-shell`「日井甲殼」（售價約 55 金幣），及 q13 路線。q13 由既有琉砂在 q12 已 claim 後手動接取；玩家在砂丘關道擊敗兩隻日井甲蟲，再回琉砂手動 claim，才開通砂丘關道往日井盆地的東門。沒有材料交付要求。砂丘關道保留兩個原沙蠍生成點，另兩點改為甲蟲；新圖使用可辨識的甲蟲／沙蠍混合遭遇、約 2,800px 主地面與上層平台／梯路、中央日井遺跡，安全入口與無鎖西側回程。保留既有保留地標座標，只有加入真實 MapDef 後才由區域圖列為可玩節點。

衝鋒沿用 Frost Crab 現有 bounded dash 行為與參數（750ms 預警、250ms active、最多 220px），直接沿用既有鎖定方向、命中、牆面、地圖邊界與 spawn roam 裁切規則；預警矩形須與實際衝鋒路徑一致。這是局部既有機制擴充，不新增戰鬥框架，也不把沙蠍尾刺改成衝鋒。

| 階段 | 負責人 | 完成條件 |
| --- | --- | --- |
| 1. 本計畫與素材交付 | `/root/sunwell_integration` 負責 main 計畫和後續接線；`/root/sunwell_environment_art` 在隔離 worktree 製作 sky/far/mid；`/root/sunwell_beetle_art` 在隔離 worktree 製作甲蟲 atlas 及甲殼圖示。素材代理待本計畫 commit 後才開始生成。 | 環境層採現有相對 URL／960×540 背景契約並呈現日井遺跡；甲蟲 runtime atlas 為 384×384、4×4 個 96px 格，idle 0–1、walk 2–5、attack 6–9、hurt 10–11、dead 12–15，姿勢需對應實際動作；idle 200ms、dead 100ms。顯示 96×96、碰撞約 52×42。walk 的四格例外只限 sunwell-beetle，保留既有沙蠍及其他演員的檢查。圖示來源 128×128 RGBA、遊戲顯示 32×32。 |
| 2. 程式與內容整合 | `/root/sunwell_integration` 是主程式、manifest、文件與測試唯一擁有者；素材代理只交付隔離工作樹 commit；`/root` 協調並可另派一次簡短瀏覽器 smoke。 | 新增地圖／怪物／物品／q13 和 required assets；真實生產點包含兩隻甲蟲及剩下的兩隻沙蠍；q13 由 q12 claimed、手動接受、兩次 kill、手動領獎控制東門。甲殼保證掉落、可經既有商人出售。區域圖、mapOrder 與 validator 只把真實 catalog 地圖算作節點；format 1 舊存檔可缺 q13 狀態並安全載入。 |
| 3. 最小驗收、提交與停止 | `/root/sunwell_integration`。只 cherry-pick 通過檢視的素材 commit，保留 `.worktrees/` 且不 stage。 | 一個使用實際 world catalog／MapDef 生成點的 q13 路線案例覆蓋 q13 缺席舊檔、未手動 claim 前門鎖定、完成兩次甲蟲擊殺與手動 claim、進入新圖並無鎖返回；若新 charge 參數需要，增加一個聚焦邊界／牆面裁切／一次命中案例。只執行直接相關 typecheck、content check、focused tests（Vitest 排除 `**/.worktrees/**`）及 diff check。來源與版本穩定後 build 一次，使用固定 Playroom tools 1.1.0 pack/validate 一次；不跑完整測試套件、不發布或推送。完成後記錄真實結果並停止。 |

基線是 main `90591ca`，tracked files clean；既有未追蹤 `.worktrees/` 保留。實作完成前先提交本計畫；此後由本整合代理獨自修改主程式、manifest、status/report 與測試。

## 2026-10-24 日井盆地完成（final acceptance）

本次有限包已完成並停止：在 sand-dune-pass 加入日井甲蟲遭遇；完成 q13 手動接取／claim 與日井盆地東門；新增日井盆地地圖、混合遭遇、免費西側回程、甲蟲素材及日井甲殼商品。前一個 Gold Sand STOP 是上一包的歷史完成條件；本次授權包完成後不再展開下一項功能。

實作與整合提交包括 3752c0c、467d335、3466add、6c0917a、b569cb0、744bb0c、43683b1、2387678、49df6af、cd6bc02、cd62ac5、c28a9d4、3ee429b、1d4a9a4、b9a7c65、70cf742、37a5dc7。最後 70cf742 的純垂直平移曾造成地形下方天空縫，已由 37a5dc7 取代為只套用於 Sunwell far layer 的底部錨定縮放。root 接受最終畫面：地形延伸到地面線，日井水池與破環片段可辨；部分細節被平台遮擋屬場景層次。沒有再調整視覺。

- q13 使用既有琉砂，需 q12 已 claim 後手動接取；在砂丘關道擊敗兩隻甲蟲，再手動 claim 才開東門，沒有物品交付。正式生成點保留兩隻沙蠍並新增兩隻甲蟲。format 1 不變，缺 q13 的舊存檔仍可載入；q01–q12 及 Guardian 契約未改。
- 日井甲蟲沿用 Frost Crab bounded charge（750ms 預警、250ms active、最多 220px），沿用鎖向、預警路徑、命中一次、牆面／地圖界線及 spawn roam 限制。日井甲殼保證掉落、只能按既有商店出售，售價 55。
- 甲蟲 atlas 384×384、4×4 個 96px 格，display 96×96、collision 52×42；保留 source、prompt、hash 與 exporter provenance。環境 sky/far/mid 是 960×540。沒有新增 combat framework、boss、第四張圖或裝備系統。
- 聚焦驗證通過：q13 route case 1 passed、25 skipped，使用正式 catalog/MapDef 生成點，涵蓋缺 q13 的舊檔、手動接取、兩次擊殺、手動領獎、門鎖／開啟、進圖及免費回程；bound charge actor/combat cases 通過；app-foundation 12/12；npm.cmd run check:content 通過；npm.cmd run typecheck 在最後 renderer commit 37a5dc7 後通過。沒有跑完整測試套件。
- 一次 beta.8 瀏覽器路線 smoke 使用隔離的 format-1、Lv30/q13 已預先 claim 存檔；它驗證日井盆地顯示、短距離移動及免費西門回砂丘關道。q13 是預先建立，沒有宣稱瀏覽器從接取到 claim 的戰鬥流程通過。該次 console 為 0 errors、0 warnings、1 Phaser info。
- 37a5dc7 之後另做一張定點畫面確認底部錨定修正，只驗證水池／破環可見及無天空縫；這次沒有移動、路線或 console 檢查。兩次畫面分別保留在 .playwright-cli/page-2026-10-24T05-10-11-806Z.png、page-2026-10-24T05-13-14-795Z.png、page-2026-10-24T05-23-42-149Z.png。
- 最終來源經 npm.cmd run build、固定 Playroom tools 1.1.0 的 pack 與 validate；validate 回報 beta.8 Valid。檔案 artifacts/game-beta8.zip：53,523,653 bytes、176 entries、56,394,472 expanded bytes；SHA-256 B60943E1ABFBBDD611A7452A736634AAB525009618619F0ECC2A3290914C5537，低於 64 MiB。舊 beta.7 artifacts/game.zip 保留。
- 最後定點 smoke 的 disposable fixture 與備份標記已清除；共用 5173 未關閉。沒有 publish、push、tag、Release、listing 或平台操作。提交後 tracked files clean；既有 .worktrees/ 保留且不 stage。

日井盆地有限包已完成；在此停止。

## 2026-10-24 日井守衛終章有限續作（新授權；Stage 3 完成即停止）

本節記錄在日井盆地包完成後新授權的有限續作。上一包末尾「在此停止」是已完成工作的歷史停止點，不限制本次新包；本包完成後立即停止，不自動建立下一個目標。基線為 main `1a4647f`，開始時 tracked files clean，既有 `.worktrees/` 保留且不 stage。

已完整讀取本地 `AGENTS.md`、Playroom 線上模板及其七份 main 規格：game-development、command-contracts、game.schema.json、game-release.yml、starter `playroom-sdk.js`、sdk-versioning、save-compatibility。適用要求：所有資源使用相對 URL 並支援子目錄／跨來源 iframe；維持 SaveData format 1 及舊檔相容；focused 驗收使用固定 Playroom tools 1.1.0；不 push、tag、Release、上傳或上架。

### 範圍與固定契約

- 新增獨立小型首領地圖 `sand-sunwell-altar`「日井祭壇」，位於既有 `sand-sunwell-basin` 東側；約 1,400px、平坦安全入口、單一中東區首領，沿用已接受的 Sunwell 環境主題，不生成新環境圖。盆地繼續是普通探索地圖：`boss: false`、現有四個普通怪生成點與西側無鎖返回砂丘關道均保持不變，只增加通往祭壇的東出口。祭壇西側出口永遠可回盆地；區域圖只列出新增的真實 MapDef 節點。
- 祭壇首領為 Lv30 `sunwell-sentinel`「日井守衛」，人形砂岩石像、青綠核心與砂金紋、雙巨拳重擊；單次地面近身重擊沿用 Warden slam 參數：900ms 預警、100ms active、850ms recovery、190×120 命中範圍、1.3 倍傷害。碰撞 72×84；使用既有首領 UI／結果／重試／返回流程，不新增戰鬥框架或 Guardian 存檔旗標。
- 琉砂在 q13 已 claimed 後允許玩家手動接 q14。入口要求 q13 claimed。q14 active 時在祭壇擊敗一次日井守衛，回琉砂手動 claim 才領 1 把日井誓刃及 1,800 金幣；無物品交付。已領取的 q14 不可再次領獎；首領可重戰，但額外擊殺不重發任務獎勵。
- SaveData 維持 format 1，不新增持久化 boss flag；舊檔缺少 q14 狀態仍有效。所有 Guardian／q01–q13 契約與 Guardian flags 保持不變。
- 日井誓刃是 Lv30 weapon slot，ATK 58、不可購買，出售價依同級唯一任務武器合理設定。素材同時提供 128×128 RGBA 任務／背包 icon（runtime 32×32）和透明 64×64 已裝備武器 sprite；兩者分別註冊於介面及 actors manifest。

### 素材交付與擁有者

- `/root/sentinel_actor_art` 負責石像角色身分、idle/walk/hurt/dead poses 及最後 atlas 組裝；先把角色身分交給攻擊素材代理。最終 atlas 固定 384×384，4×4 個 96px cell，runtime display 192×192、pivot 0.5/1；索引 idle 0–1、walk 2–5、attack 6–9、hurt 10–11、dead 12–15。動畫為 idle 2×200ms loop、walk 4×120ms loop、attack 4 格 non-loop 並對應完整重擊時間、hurt 2×100ms non-loop、dead 4×100ms non-loop。只為 `actor:sunwell-sentinel` 加入四格 walk contract 例外，其他演員不放寬。
- `/root/sentinel_reward_attack_art` 負責四張連貫重擊姿勢、日井誓刃 icon 與裝備 sprite；交給角色代理組入最終 atlas。素材保留原始圖、完整 prompt、生成／匯出紀錄及 runtime 來源鏈。
- 兩個素材代理在本計畫 commit 之前不生成；只 cherry-pick 通過檢視的素材 commits，完整來源與 runtime chain 一併整合。沒有新的環境素材代理。

### 階段、最小驗收與停止條件

1. 本整合代理先提交兩份 canonical plan 文件，之後通知素材代理按上述契約開始。
2. 接入素材後由本整合代理新增首領、祭壇 MapDef／傳點、q14／獎勵、world map、assets manifest／required keys、world/content validators 與 focused coverage；每個小階段各自 commit，`.worktrees/` 永不 stage。
3. 一個 focused gameplay case 使用真實 catalog／production spawn 與縮短戰鬥的 HP=1 harness，覆蓋 format-1 舊檔缺 q14、q13 門檻與祭壇入口、q14 手動接取、一次首領擊殺後只變 ready、手動 claim 後才加入單把誓刃及 1,800 金幣、第二次 claim 不重獎、首領重戰不重獎、Guardian flags 不變、祭壇自由返回盆地。另有需要才增加首領預警／單次命中 focused case。
4. 只跑直接相關 `npm.cmd run typecheck`、`npm.cmd run check:content`、Vitest focused tests（固定 `--exclude '**/.worktrees/**'`）及 `git diff --check`。來源與 beta.9 metadata 穩定後，build 一次，使用固定 Playroom tools 1.1.0 pack/validate 一次，產物為 `artifacts/game-beta9.zip`；保留 `artifacts/game-beta8.zip`。由 root 安排一次短暫隔離 browser smoke，只看首領顯示、短預警及免費返回，不跑長戰或從頭任務。
5. 完成整合與如實記錄已驗證／未驗證項目後停止。沒有 push、tag、Release、上傳或平台發布授權。

## 2026-10-24 日井守衛終章完成（停止）

本有限續作已完成，現在停止。日井祭壇是獨立第四張真實地圖；日井盆地維持普通探索、原有四個普通怪生成點與西側回程。q14 的 format-1 相容、手動接取／claim、實際首領擊殺、結果離場與單次誓刃／金幣獎勵，在 focused gameplay case 驗收；Guardian flags 未變。素材保留原始稿、prompts、匯出器與 runtime 來源鏈。

主要 main 提交為計畫 7042e8c、內容 588d380、boss flow 5733fb7、atlas/素材整合 c461350、最後 manifest 與 beta.9 metadata 9099725。來源鏈亦包括 53333e2、9b1713c、99fd430、f53f64a、f93e4c4、dc8075c、d35f94e 與 9b17652。

- 通過：npm run typecheck；npm run check:content；npx vitest run tests/rules.test.ts tests/world-map.test.ts --exclude '**/.worktrees/**'（16/16）；npx vitest run tests/actors.test.ts tests/integration/sunwell-quests.test.ts --exclude '**/.worktrees/**'（13/13）；npx vitest run tests/integration/app-foundation.test.ts --exclude '**/.worktrees/**'（12/12）。沒有跑完整測試套件。
- 已執行 app-foundation、app-persistence、app-audio 的 focused run；foundation 為 12/12，另外 app-persistence 的 4 項與 app-audio 的 1 項在 startup 失敗。這兩個舊測試 manifest fixture 仍缺既有 required asset keys（例如 equip:frost-tide-sword、actor:frost-tide-warden）；本輪新增的日井守衛與日井誓刃 keys 已加入，沒有延伸修理無關舊 fixture。
- 唯一 browser smoke 使用一次性 format-1 fixture：Lv30、HP/MP 全滿、q01–q13 claimed、q14 active 0/1、Guardian flags true/true、祭壇 left。單次短輸入後 snapshot 確認已由西門返回日井盆地，HP 439/660 且暫停；西返已驗證。祭壇 boss 與 900ms 預警未驗證，兩張 screenshot 都是暫停中的盆地畫面；沒有擊殺或領獎。Console 3 則訊息、0 errors、0 warnings，其中 1 則 Phaser info。Named session 已關閉；原本不存在的 dev save key 仍不存在、backup marker 已移除，共用 5173 未動。
- 截圖保留於 output/playwright/sentinel-smoke-20261024-b8d2/altar-boss-view.png 和 output/playwright/sentinel-smoke-20261024-b8d2/basin-return-paused.png。互動紀錄包含一次前置 script 語法／函式形式錯誤，以及成功動作後 pause-button locator 1 秒逾時；最終 snapshot 仍確認了西返。
- beta.9 的唯一 production build 已完成。固定 Playroom tools 1.1.0 pack/validate 對 artifacts/game-beta9.zip 回報 Valid：53,742,110 bytes、179 entries、56,616,927 expanded bytes，SHA-256 101407560111F6C8982043B5B5979167F40BC75D68CB3616E11BA0BA0E182F2A。artifacts/game-beta8.zip 保留。

沒有 push、tag、Release、上傳或發布。既有 .worktrees/ 保留且不 stage；本次最後提交只更新兩份 canonical 文件。

## 2026-10-24 日井守衛瀏覽器視覺補驗（PARTIAL：外觀已驗、地面 telegraph UNVERIFIED）

本有限續作只驗收既有 artifacts/game-beta9.zip，SHA-256 101407560111F6C8982043B5B5979167F40BC75D68CB3616E11BA0BA0E182F2A。beta.9 包已完成原 build 與 pinned pack/validate；本次沒有修改 production、工作樹程式碼、版本或封包，也沒有使用共用 5173。所有 browser 結果只代表該 beta.9 ZIP，不代表含未提交 audio／SDK／beta.10 更動的目前工作樹。

有效 fixture 使用獨立 origin 與 format-1 production key maplewood-swordsman:save:v1。首次錯誤組成的 disposable fixture 在 reload 時顯示讀取失敗；只刪除本次建立的 key，再以 beta.9 public UI 建立底檔，依 9099725 歷史 makeLegacySave 欄位與 quest objective counter 建立 Lv30、初心者、AP 145、SP 0、原始技能欄位、HP 660/660、MP 98/98、q01–q13 claimed、q14 active 0/1、Guardian flags true/true、日井祭壇 left 的 fixture。重新載入成功，DOM 確認「日井祭壇」、q14 擊敗日井守衛 0/1 與暫停遊戲按鈕。這是測試起點，不代表 UI 完成前置任務。

- output/playwright/sentinel-beta9-qa-20261024/altar-boss.png：同框清楚顯示日井守衛外觀、名稱與血條；首領外觀驗收通過。
- output/playwright/sentinel-beta9-qa-20261024/altar-telegraph.png：首輪短移動後的截圖未見地面 telegraph；當時 q14 0/1、Boss 血條全滿、玩家 HP 586/660。
- output/playwright/sentinel-beta9-qa-20261024/altar-telegraph-targeted.png：4.65 秒靠近後截圖仍未見 telegraph。Root 檢視畫面確認玩家與 Boss 約相距 400px，尚未進入 190px 攻擊距離；這張沒有觸發預警，不能用來判斷預警功能。
- output/playwright/sentinel-beta9-qa-20261024/altar-telegraph-final.png：最後一次 bounded action 向右 6,000ms，同一 action finally keyup，隨即按頁面實際「暫停遊戲」按鈕並截取凍結畫面。圖中 Boss 與暫停 overlay 可見、q14 仍 0/1、玩家 HP 515/660，沒有可辨認的地面 telegraph。畫面落在一次命中之後；900ms 預警維持 UNVERIFIED，不據此推論 production defect。之後沒有 resume、移動、再取圖或擊殺／claim／回程操作。首次 screenshot path 反斜線呼叫失敗後，只對已凍結畫面以 forward-slash 路徑保存，沒有再執行遊戲動作。

清理已完成：最後 named session sentinel-beta9-final-telegraph-last-20261024 已關閉；production key 原在此新 origin 由本次 public UI 建立，結束時只移除本次底檔、fixture 與 backup markers，並確認 key 不存在。僅停止自有 server PID 1784／16136／7908，確認專用 ports 5197／5198／5199 均無 listener，移除三個獨占 temp extraction；共用 5173 與其他存檔／程序未碰。未檢查 browser console。

未跑測試、build、pack 或 validate，沒有更改 beta.9 archive。僅本節文件更新會 stage/commit；其餘 user changes 與 .worktrees 保留。無 push、tag、Release、上傳或發布。地面 telegraph 仍是唯一未驗收項目，至此停止。
## 2026-10-24 Wide environment background v2 delivery

- Material delivery is complete: 20 far/mid assets for camp, town, forest, rock, frost, frost-pine, frost-cave, sand, sand-dune, and sunwell; far 1440×540 and mid 1920×540 RGBA.
- The last three mid files were copied unchanged from root-approved layouts. The canonical environment manifest now references all 20 v2 files; v1 and sky assets remain unchanged.
- The existing wide-background helper ran once and passed all 20 references, dimensions, RGBA format, non-target manifest preservation, and the mid alpha boundary (zero nontransparent pixels at y≥180). Metrics: art-source/environment-wide/metrics/wide-environment-assets.csv.
- Root reviewed the lightweight scroll overview for camp, forest-edge, red-ridge, and Sunwell basin at start/mid/max positions. Other themes rely on their prior approvals; this is not a fresh visual audit of all 14 maps.
- The all-map offline preview models far×0.2 / mid×0.5 offsets and Sunwell far 1.6× bottom anchoring. Runtime still pins background layers; parallax integration and runtime verification remain a separate task.
- No src/ or game.json change, no build/typecheck/test rerun, no browser run, package, commit, push, tag, Release, or platform listing. The earlier typecheck pass remains prior-turn evidence, not a check from this delivery.
- Canonical handoff: art-source/environment-wide/handoff-20261024.md. Next: a separate runtime parallax integration task and focused verification.
