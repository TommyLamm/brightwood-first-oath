# Plan53・小Plan執行索引

2026-11-07更新，Asia/Hong_Kong。使用者已要求「拆成小plan，然後一個一個去做」，弓箭手一期（53-01至53-10）完成後，依「開始法師實作」完成53-11的五個小Plan。依「開始實作盜賊計劃」完成53-12。母計畫：[詳細設計](../53-class-expansion-roadmap.md)。

**目前狀態：盜賊本機候選beta.88完成／LOCAL_ACCEPTANCE_PARTIAL。** 53-01至53-12已完成本機實作並收尾；讀1–8／寫8，beta.87及更舊不能讀8。未發布，沒有排程或背景派工。

## 已採用決策

- 保留brightwood-first-oath、desktop、Lv1–30及現有四區；不發布。
- 四角色欄位，資料上限以實測為準；建角選訓練路線，q02正式轉職。
- 弓系普攻零消耗箭；三主動兩被動，候選數值沿母計畫。
- 法師加入INT的歷史候選為格式7；盜賊現行候選格式8，讀1–8／寫8，舊1–7原件保全、明確備份升級。beta.87及更舊不能讀8，回退採相容修正版。弓箭手一期歷史候選為格式6。
- 每個小Plan完成即記錄實際結果與最小驗證，然後進下一個；不反覆全測／截圖。

## 順序

| 小Plan | 狀態 | 對應 |
| --- | --- | --- |
| [53-01 職業共同規則與劍士相容](01-job-foundation.md) | DONE | W00／W01 |
| [53-02 多角色資料、容量與遷移](02-character-profile.md) | DONE | W02 |
| [53-03 選角、建角及安全切換](03-character-selection.md) | DONE | W02／W07 |
| [53-04 水平箭矢與地形命中](04-projectiles.md) | DONE | W03 |
| [53-05 弓箭手三主動與兩被動](05-archer-skills.md) | DONE | W04 |
| [53-06 弓術轉職、六弓及四區獎勵](06-archer-progression.md) | DONE | W05 |
| [53-07 弓術動作、雙手錨點與聲畫](07-archer-art.md) | DONE | W06 |
| [53-08 職業HUD、能力與裝備介面](08-class-interface.md) | DONE | W07 |
| [53-09 四區短段與有限平衡](09-focused-acceptance.md) | DONE／PARTIAL驗收 | W08 |
| [53-10 候選打包與開發交接](10-local-candidate.md) | DONE | W09 |
| [53-11 法師實作](11-mage-followup.md) | DONE／PARTIAL驗收 | 五個小Plan完成／beta.87 |
| [53-12 盜賊實作](12-rogue-followup.md) | DONE／PARTIAL驗收 | beta.88／讀1–8寫8 |

## 目前交接

盜賊53-12完成，beta.88讀1–8寫8；短刃三主動兩被動、夜嵐／高臺／三階段試煉、六階武器及聲畫接入。正常q01–q02、轉職學技、保存重載、合成Lv14及iframe短段已驗，完整主線／首領全場及正式雲端未驗。[目前交接](../reports/rogue-beta88-20261107.md)含集中檢查、156,824,250bytes候選ZIP、格式8相容邊界與清理。未發布，完成後停止。

以下法師與弓箭手為歷史交接。

法師53-11五項完成，beta.87讀1–7寫7；固定tools1.2.0完整ZIP驗證通過。[最新交接](../reports/mage-beta87-20261106.md)列出能力／法術／六杖／素材、focused檢查、正常q01／q02轉職、保存切角、合成Lv14及iframe證據。完整q01–q19、四首領整場／階段、正式平台雲端及全螢幕仍未驗。beta.85／86不能讀7。browser／專屬server已正常收束，既有變更保留；未發布，完成後停下。

歷史：53-01至53-10的beta.86讀1–6寫6，[弓箭手交接](../reports/class-expansion-beta86-20261106.md)保留當時四區fixture、素材及未驗邊界，不把它當作法師全區通關證據。
