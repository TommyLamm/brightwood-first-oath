# Plan22 任務領獎前回饋・實作交接

2026-10-28（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。依使用者持續規劃並實作、直到要求停止的指令，於 [Plan21完成交接](plan21-handoff.md)後完成 [Plan22](../22-quest-claim-feedback.md)。唯一現況見 [status](../status.md#current-state)。

## 基線與規範

HEAD a20f4ac、Plan19–21未提交增量保留，最近已驗候選beta28不覆寫。本批重新完整網讀Playroom範本及七份main規格（截斷尾段均補讀），沒有讀取失敗；適用固定ID／相對資源／desktop iframe／相容存檔／固定工具與新版本候選。根無.codegraph，目標式定位。作者TommyLamm、讀1–5寫5、SDK1.1.0／protocol1／schema2／tools1.2.0不改。

本批UI／app原始基線保存在 `.playroom/tmp/plan22-integration-review/`，供主代理局部diff審閱；不是新遊戲候選。不還原共享dirty、玩家存檔／QA profiles或歷史成品。

## 所有權與進度

| 包 | Owner | 實際狀態 |
| --- | --- | --- |
| W01 共用計算與app | 全新Luna Max `/root/plan22_claim_model_app`，[報告](plan22-quest-claim.md) | 完成；7個不同新focused及精選3個app案例過，主代理已讀helper／新tests與app局部diff。 |
| W02 NPC UI | 全新Luna Max `/root/plan22_claim_ui`，[報告](plan22-ui-integration.md) | 完成；tsc一次exit0，主代理已讀三處局部diff，CSS未改。 |
| W03 新候選 | 全新Luna Max `/root/plan22_candidate`，[報告](plan22-candidate.md) | 完成；beta29 build／固定pack／完整ZIP validate各一次exit0。 |
| W04 Browser | 條件未成立 | 未啟動，不例行重試既有0x6D。 |

## 驗收界線與下一步

W01已只提取原planQuestClaim→removeItems→minLevel→job→gainReward鏈，app保留NPC距離、q08結算／旗標、特效、toast及interaction refresh；主代理對照基線確認副作用位置及原計算順序維持。UI已接同一helper，預覽成功值丟棄，不能當真領獎或保存結果。滿包但交付騰位／可合併仍允許，無法領取顯示原拒絕原因並停用；點擊再讀最新currentView重判，成功才派原命令。原focus key與獎勵文字保留。

W01新helper首輪6／7過，一例漏計新角色原有藥水數量；修assertion後全檔7過，另精選該例1過／6略過；合計7個不同新案例。既有app三個精選案例過、23個其他案例略過。全檔修整重跑及單例確認均照實記錄，不加算成新案例，後續不再重跑。UI一次typecheck及候選一次build／pack／完整ZIP驗證過；前批6／11／35／327項或全content不重跑。主代理確認UI diff只有import／claim click／ready卡片三處，不改交易／focus／其他panel；這不是DOM或browser驗收。真正click／focus／對話換行、runtime距離／queue、雲端／平台仍未驗。

沒有本批browser／server或新QA資源；不使用舊PID清理，不清玩家資料。未commit／push／tag／Release／平台發布或建立排程。本Plan完成必要檢查、候選與交接後，再依持續指令規劃並實作下一批。

## 已凍結候選

[dist](../../artifacts/plan22-1.0.0-beta.29/dist/)／[game.zip](../../artifacts/plan22-1.0.0-beta.29/game.zip)：`brightwood-first-oath`／`1.0.0-beta.29`，author TommyLamm。source／dist／ZIP metadata一致，ZIP 131,525,359 bytes／274 entries，SHA-256 `7280d3190fb71d01c960a31f35dc998e3b5df511587e82633979afa19bbcc217`。source419檔與dist274檔清單、logs見候選報告。

8類有限文字掃描14 entries／1,760,478 bytes零命中，260個其他entries未掃，不冒稱binary或完整機密稽核。原beta28與更早成品保留。三個實作工作包均完成，沒有本批持續操作或QA資源，接續下一批。

本批一次文件檢查：8份文件／當前入口、66個本地連結、7個Markdown錨點均可解析，未掃全歷史。候選報告未驗敘述的「商店」已改為本批「NPC領獎」；純文字修整無新引用，不重跑檢查。
