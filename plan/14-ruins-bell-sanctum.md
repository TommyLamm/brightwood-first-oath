# 遠古遺跡包 C：誓鐘內殿實作計畫

日期：2026-10-25（香港時間）。狀態：**規劃完成，尚未實作或驗收**。本輪先將既有成果提交為 `17a4c37`，並成功推送至 `origin/fix/background-jitter`，再由主代理獨立規劃 C。沒有合併 main、建立 PR／tag／Release，沒有派實作代理、生成素材、改遊戲版本／程式／存檔或執行遊戲檢查。

基線：[已推送的來源](https://github.com/TommyLamm/brightwood-first-oath/tree/17a4c37166d3373a03b5082bc6720b29be0dd3fc)、[12 章節設計](12-next-chapter-ancient-ruins.md)、[B 整合交接](reports/ruins-b-handoff.md)。實作前仍須核對最新工作區。B 為 beta.13、讀1／2／3寫3；A／B候選成品在本機 artifacts，依既有 ignore 不隨來源 push。B未做的瀏覽器、正式雲端、ZIP與發布驗收不因此轉為通過。

## 1. 本批範圍與停止點

新增誓鐘內殿、失序司鐘者、q18／q19、守誓旅冠及首領音樂／復原短音。主線在木葉鎮向岩嶺教官手動領取 q19 後收尾；不新增下一區可玩節點，不改 q01–q17／q20 的獎勵或成長上限。

玩家路線：q17 claimed → 向行舟接 q18 → 進內殿擊敗司鐘者 → 結果頁返回潮痕營站 → 向芷衡手動交 q18、接 q19 → 直航或既有回城到木葉鎮 → 向教官手動交 q19。q20仍可獨立選做，不是入口、首領或結局門檻。

實作另立高於B的候選，預計 `1.0.0-beta.14`，開工時檢查占用；本輪不升版。穩定後一次 build 至 `artifacts/ruins-c/dist/`，保留 A／B產物。D的正式瀏覽器／SDK／ZIP／發布流程另行追蹤，不能由C的fixture或build代替。

## 2. 實際接線缺口

`.codegraph/` 不存在，本輪用rg定位與定點讀取。目前程式需接以下缺口，不能只增加catalog：

- `domain/actors` 只讓Guardian更新phase；選招與冷卻沒有C的循環／延後切階段。`pendingSkillId`兼作上招記錄，不能拿它單獨表示三招循環。
- `MonsterMode`無轉場狀態；`MonsterState`已有phase與攻擊快照，新增循環資料應為本場runtime，不能寫進SaveData。
- `isBossMonster`、`applyDeathEvent`、`buildCombatActors`、app的`BOSS_MONSTER_IDS`、renderer的首領血條／預警都有既有三首領清單。漏接會失去抗擊退、結果頁或首領視覺。
- `gameplay.returnTown`、`state.createUiSnapshot.canReturnTown`與UI結果頁各有地圖特判，須一致接入內殿；Guardian的兩個flags只由原流程修改。
- `bossEnraged`目前在HP≤50%就讓音樂升階，不能直接用於C的延後轉場。
- `selectMonsterAnimation`只回單一attack；renderer用`:attack`尾碼判斷出招。C的第二套攻擊動畫必須連selector、clock與動畫契約一起接。
- world validator精確核准17圖／12 NPC／18任務，q20已明確例外前置q16；保留此例外和既有inspect可達性限制。
- persistence讀1／2／3寫3，本機只備份格式1／2；C新增ID不能沿用3假稱B可回退讀取。

## 3. 內殿、交通與任務

| 對象 | 凍結配置 |
| --- | --- |
| 長廊東門 | `(2500,600)` → `ruins-bell-sanctum:entry`，需q17 **claimed**，ready不開 |
| 內殿 | `ruins-bell-sanctum`，1800×720，地面y600，theme `ruins-sanctum`，music `boss-ruins`，safe=false、boss=true |
| 出生點 | 保留必要left／right；另加entry `(160,600)`，重試也用entry |
| 西返 | `(100,600)` → 長廊right，無任務鎖，戰鬥中仍可步行退出 |
| 首領 | 初始 `(1200,600)`，roam `[700,1560]`，無普通怪、平台或空中出生 |
| 世界圖 | 沿A底圖，新增第四個真節點 `(86,22)`，ruins探索總數4；不加第五節點 |

西側x≤240為安全進退帶。首領最西出招原點≥700、最長reach360，判定最西端≥340；核對既有boss engage margin300，不能把追擊範圍等同可越過roam的移動範圍。長廊石獸最東攻擊端2330，東門互動圈最西2436，保持間隔。portal中心距離依64px半徑規則驗證；新門不與東碑互動圈重疊。

結果頁的返回命令固定送到 `ruins-tide-camp:left`，按鈕寫「返回潮痕營站」；C結果的可用性由本場bossResult決定，不誤沿用一般回木葉鎮所需的town已訪門檻。戰鬥中「返回城鎮」仍停用，步行西門不鎖；重試文字指司鐘者，不顯示Guardian核心或其他首領文案。

| 任務 | 前置；發起／交付 | 目標與手動獎勵 |
| --- | --- | --- |
| q18 讓誓鐘歇息 | q17 claimed；行舟→芷衡 | 接取後殺 `ruins-bell-keeper` 1；EXP0、金幣1600、守誓旅冠1 |
| q19 帶回歸途 | q18 claimed；芷衡→mentor | reach town；EXP0、金幣300，教官對話收尾 |

入口只鎖q17，不偷加q18／q20或武器要求。未接q18可挑戰，但不保存隱藏擊殺；之後接任務須重打。行舟的任務文案說明先接委託再出發，不增加確認彈窗。q18記錄只從本場有效死亡事件進入既有active-only／clamp流程。重試不重發旅冠／金幣。

q19沿既有「已訪即滿足」reach語義，可能接取即ready；仍須向教官手動領獎。領q18、接q19可在芷衡同一面板完成，保留多任務卡。旅冠不必持有／裝備即可做q19；賣掉、脫下或背包滿不應改寫已完成主線。q18背包滿則原子性領獎失敗，coins／quest status不先提交，整理後可重試。

精確核准清單擴充為：18張圖、12 NPC、20任務（q01–q20）；34物品、20技能、17怪物、14敵方技能。保留舊ID及限制，不以任意數量放行。

## 4. 司鐘者的規則與時間契約

`ruins-bell-keeper`：Lv30、HP8000、ATK60、DEF28、speed38、body88×76、aggroRange460、attackRange360、EXP0、coins0、drops[]、respawn0。原地鎖向、不擊退、不移動彈體、不召小怪。MonsterDef保留attackWindup900，attackCooldown0；此首領的實際間隔由下列循環控制，不走普通怪cooldown分支。

| 技能 | 判定／倍率 | windup／active／recovery | 四格時間 |
| --- | --- | --- | --- |
| `ruins-bell-slam` 垂鐘重擊 | 前方180×120；1.25 | 900／100／1000ms | `[450,450,100,1000]` |
| `ruins-bell-sweep` 低鳴橫掃 | 前方360×30；1.05 | 1200／100／1000ms | `[600,600,100,1000]` |

兩個SkillDef.cooldownMs均0，由首領runtime的nextAttackAtMs防止重疊。range判斷不得把低掃誤限為重擊180；完整矩形預警與傷害共用原點／方向快照。一個attack ID只命中一次，第三格才是active。

### runtime接口先交付，再派依賴工作

- `MonsterMode`新增 `'phase-transition'`，僅C首領使用。
- `MonsterState`新增可選 `bellCycle`：`sequenceIndex: 0|1|2`、`nextAttackAtMs: number`、`transitionStartedAtMs: number|null`、`transitionEndsAtMs: number|null`、`transitionUsed: boolean`。只在C首領建立；clone時保全獨立副本，舊怪不得共享／被改寫。
- `phase`仍為既有1／2。`bellCycle`、phase轉場與bossResult都不持久化，不增加SaveData flags。

階段1為重擊→橫掃循環，每招完整recovery後再空600ms；首次進攻不額外等600。HP≤50%時只排定轉場，先完成當前windup／active／recovery；若已在空檔則立即開始一次1200ms轉場。轉場中首領不移動、不出傷害、不產生攻擊預警，**仍可受玩家傷害**，不加無敵。死亡優先於轉場，不在已死實體上升階或發聲。

轉場結束才設phase2、重設sequenceIndex=0，從橫掃→重擊→橫掃三招循環開始；第一招不再多等300ms，此後每招recovery後空300ms。三招循環邊界可出現連續兩次橫掃，這是指定次序，不誤改成兩招交替。預警與recovery不縮短，不改全體舊首領節奏。

玩家死亡、首領死亡、切圖、重試均取消C剩餘attack／telegraph／待發階段提示。新進內殿或重試／重載建立新實體、滿血phase1；q18有效擊殺進度不倒退。退出西門不鎖戰鬥；結果頁返回營站，死亡仍沿既有免費回城。q18／q19不設定或覆寫 `bossDefeated`／`chapterComplete`。

## 5. 兩種攻擊的圖集決策

為讓重擊與低掃有不同可讀姿勢，本批將12中通用單套attack細化為**22個有效姿勢**，仍維持一張1152×960 RGBA、6欄×5列、單格192、display192×192、pivot(.5,1)。不新增第二張角色圖，不放寬所有怪物契約。

| 動畫key（前綴 `ruins-bell-keeper:`） | cells | frameMs／loop |
| --- | --- | --- |
| idle | 0,1 | 200,200／true |
| attack-sweep | 2,3,4,5 | 600,600,100,1000／false |
| walk | 6–11 | 120×6／true |
| attack（重擊） | 12–15 | 450,450,100,1000／false |
| hurt | 18,19 | 100,100／false |
| dead | 24–27 | 100×4／false |

未用16／17複製15、20–23複製19、28／29複製27；2–5已是有效低掃格，不能再用idle複製覆蓋。六組animation只對此imageKey核准。renderer的attacking辨識同時接受此首領的attack／attack-sweep；依pendingSkillId選對key及clock，不把低掃退回idle，不均分總時長。轉場用idle與小範圍穩定光效，不增加第七套姿勢或危險閃爍。

先審idle-0、重擊active、低掃active三張單姿勢；合格稿直接重用。剩餘motion7張、重擊／受傷5張、低掃／倒下7張分批。全朝右、完整四足機關／青銅支架／白石面具／懸鐘，不再做直立巨拳砂岩像；每格中心x96、最下alpha>0為y188、四邊至少3px透明。可記錄確定性縮放／清除淡alpha尾點／微移，但不得裁斷肢體或把同圖位移當新動作。逐格來源、SHA、unused與22姿勢差異由最後組裝owner核對。

## 6. 旅冠、音訊與環境

`oathfarer-circlet` 守誓旅冠：hat、Lv30、DEF10、HP+20、ATK0、buy0、sell600、stackLimit1、iconKey `item:oathfarer-circlet`、visualKey `equip:oathfarer-circlet`。icon128×128 RGBA、runtime32；overlay128×128 RGBA、display48×32、pivot(.5,1)，沿既有hero head anchors／左右鏡像，不生成新角色body或重填96個anchors。HP變更沿既有equip／unequip規則，不額外送治療、AP或技能。

內殿三層為sky960×540／far1440×540／mid1920×540；後兩層真RGBA，mid y≥180全透明。構圖為閉合白石鐘室與破石環，與長廊不同，不只換色；不烘焙首領、預警或可走平台，沿sky0／far.2／mid.5，無Sunwell的Y1.6。區域底圖與theme-ruins沿用。

新增 `boss-ruins` base／phase2，離線原創、128 BPM／4拍／32小節約60秒、48kHz stereo，兩層同樣本數且可循環；Ogg q5與AAC-LC M4A160k沿既有生成器。只生成新曲，不重生舊音樂。app對C以**實際phase===2**選phase2，不用半血捷徑；轉場起點可播一次既有boss-phase短音，音樂升階在1200ms結束時。

新 `oath-bell-restored`：48kHz mono PCM16 WAV、約0.8–1.2秒，C真實bossResult false→true時一次，取代此場通用boss-win，避免兩個勝利stinger疊播。重試新勝利可再播；重載、重開結果、q18領獎不補播。靜音或音效不可用不阻擋進度。現有AudioController沒有單次stopSfx，故不預排延遲聲音；取消時禁止未發出的提示，不宣稱已播短音可由現有介面立即中斷。

預計11個新runtime檔：boss1、環境3、icon／overlay2、音樂4、WAV1。**C目標≤9 MiB**；A+B實際14,308,281 bytes，距24 MiB尚有10,857,543 bytes（10.35 MiB），保留約1.35 MiB作最終調整。先優化PNG及只保留正式稿入public，不降尺寸、少動作或把AAC降碼率充數。

原稿、完整prompt、工具來源、callId／savedPath／revisedPrompt、raw SHA、採拒原因與格位放 `art-source/ruins-c/`。工具未回revisedPrompt如實註記；wrapper回image_url／output_hint時立即保存result及來源，不只印keys後丟棄。缺路徑只定位自己batch的session metadata／rollout恢復，不猜全域最新圖。主對話只收文字／路徑；自審1–2張≤1280px、JPEG q60–75中性底縮圖。額度中斷先恢復既有原稿再續作。

## 7. C讀1／2／3／4、寫4

C新增map／monster／skill／item／quest ID，B的完整catalog驗證器不認識，因此不能繼續用3宣稱B可回退。C候選讀取器驗證完整當前catalog後接受1／2／3／4，所有新寫入4；同步SAVE_FORMAT_VERSION、READABLE_SAVE_FORMATS、CloudSaveInput、SaveEnvelope與schema2 manifest。這是實作決策，本輪沒有執行遷移或改manifest。

SaveData頂層與兩flags不變。舊檔完全缺q18／q19合法；單碑／q17／q20進度保持；q18 claimed須kill司鐘者=1，q19 claimed須合法reach紀錄／town已訪。未知ID、不合法counter或不支援格式不能刪除／搬回城假稱相容。Boss phase／循環不保存，不承諾跨重載保留首領HP。

首次將1／2／3封套轉寫4前，各保全同key的`:format1-backup`／`:format2-backup`／**`:format3-backup`**，保留原始字串並回讀確認；不同既存內容、備份失敗或未知格式停止寫入，不清掉舊備份。B應拒絕4而保留原件。正式雲端寫4仍須目前公開版本真正理解C IDs並可讀4；不能只改readableFormats或自動部署橋接版，C只用隔離fixture／本機候選，正式驗收留D。

## 8. ownership與全新Luna Max批次

開始實作才派工，每批全新GPT-6 Luna、max reasoning，最多3名；不沿用完成／額度中斷的owner，不fork圖片歷史，不為湊人數同改manifest。

1. 先並行「runtime契約／rules／AI」、「world／q18-q19／atlas節點」與「首領三張參考」。契約owner先交第4節接口，並統一交付SaveEnvelope／CloudSaveInput寫4型別，後續persistence owner不再同改types／ports。World依新ID落地再驗證，不放假物件通過。
2. 依賴／名額釋出後，以新owner接「persistence與格式4備份」、「app／UI／renderer／audio事件」及「環境／旅冠／首領配樂／SFX」。Boss lists、結果返回及phase音樂由app owner整體接線，勿分給互相覆寫app.ts的兩人。
3. 首領其餘姿勢分成motion7、重擊／受傷5、低掃／倒下7三小批，各只寫自己的art-source子目錄。共同參考3張直接重用。
4. 配套素材owner獨占public manifests，完成環境／overlay／audio後明確釋出actors manifest；全22姿勢及metadata齊備，再派全新assembly owner寫boss圖集與六animations。
5. 全新integration owner統一候選版本／必要檢查／獨立build，主代理審查交接維護狀態。只做C，完成即停；沒有新的發布授權不推發布tag／Release或平台API。

world檔由world owner，rules／actors由AI owner，persistence由save owner，render／animation契約／app／UI由app owner。所有report放 `plan/reports/ruins-c-*.md`，至少記來源、改檔、已完成／未完成、實際檢查、接口與下游可用路徑。任一共享檔交接後原owner停止寫入。

## 9. 最小驗收與時機

| 核心行為 | 聚焦檢查 |
| --- | --- |
| 交通／主線 | q17 ready不開、claimed開；q20缺省仍可完整q18→q19；西退自由、結果返營站、死亡回城、重試新實體 |
| 時序／切階段 | 兩招完整矩形／鎖向／一次命中；低掃地面命中跳起可躲；半血不截斷當招；一次1200ms轉場、可受傷、死亡優先；phase2確為三招循環與300ms空檔 |
| 任務／裝備 | 接取前擊殺不記；q18滿包原子失敗可重試、獎勵一次；q19已訪可即ready但仍手動領；帽子屬性／卸下HP clamp及左右head overlay |
| 存檔 | 1／2／3缺新任務可讀，首次寫4原封套保全；已有單碑／q17／q20不倒退；q18假claimed拒絕；不同format3備份／未知格式停止覆寫 |
| 聲畫 | 兩套attack第三格對active，轉場無假預警；phase2音樂等狀態切換，復原stinger一次且不疊boss-win；靜音可完成 |
| 候選 | 精確catalog、六動畫／22格來源、全loader相對URL、第四節點、格式版本、11新增檔與預算；單次獨立build |

少量有行為價值的focused tests可用 `ruins-bell-boss.test.ts`、`ruins-c-quests.test.ts`、`ruins-c-save.test.ts`；音效／animation與UI目的地沿直接受影響檔補核心用例。時間推進用遊戲時鐘，不實際sleep。所有Vitest命令加 `--exclude '**/.worktrees/**'`，不選入舊副本，不清理其資料來轉綠。

與新格式直接相關的舊測試只改寫入預期3→4；保留format3舊讀取fixture，未知格式樣本改真正不支援的7。受影響的catalog／map數與B-save寫入斷言精確更新，不把所有舊任務測試重跑。程式穩定後typecheck／content／相關focused tests各一次；素材齊備後loader／引用與一次 `artifacts/ruins-c/dist/` build。只文案不加測試，不跑全回歸、不反覆截所有地圖。

未進真實瀏覽器就把手感、兩招辨識、覆蓋畫面、配樂接縫、旅冠各姿勢穿戴與45–80秒戰鬥目標列為未驗證。紙上估算／mock不能宣稱時長或正式SDK保存通過；D的有範圍iframe／正式存檔／完整ZIP與發布仍獨立。

## 10. 本輪文件來源與交付檢查

本輪重新完整網路讀取main：[模板](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md)、[開發標準](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/game-development.md)、[操作契約](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/command-contracts.md)、[Manifest Schema](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game.schema.json)、[Release workflow](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-release.yml)、[SDK](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/examples/starter/playroom-sdk.js)、[版本指引](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/sdk-versioning.md)、[存檔相容性](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/save-compatibility.md)。規格不下載成runtime副本，遠端內容只用於本專案規範。

本輪適用：保留舊進度與真實格式相容性、失敗不覆寫、相對資源、候選與正式驗收分開、push來源不等於發布。只做Git提交／push確認、現有接線與計畫一致性／本地連結檢查；沒有重新跑已通過的B遊戲測試、typecheck、build、瀏覽器或ZIP。遊戲仍為beta.13，下一步等使用者指示實作本計畫。
