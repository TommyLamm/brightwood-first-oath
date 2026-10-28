# Plan17 實作派工

**最終：所有工作包已釋放所有權，本輪停止。** beta22 source／ZIP交付，27 focused／tsc／官方ZIP驗證通過；B06只beta21局部NPC／同頁焦點觀察，其餘未驗，依最小驗證收束；自有QA資源已清。完整結果見[最終交接](base-experience-handoff.md)。以下為派工／階段記錄，不再觸發新工作。

2026-10-28 香港時間，04:05一次性排程已觸發刪除。主代理重新完整網路讀取Playroom範本與七份main規格（截斷段補讀），接受Sol規劃檔與靜態證據，開始本份有界計畫。主代理只作分析／派工／文件整合，不直接修改遊戲程式。

基線版本beta.20；保留所有dirty、原玩家存檔與profiles、beta19／20候選。不改內容表、存檔格式、互動距離、戰鬥數值；沒有發布授權。沒有.codegraph。使用者允許實作代理按包選讀規格，A批只接適用摘要；不要求每人重讀八份。

唯讀Git摘要：branch `fix/background-jitter`，HEAD `d410f67`，當時57個tracked dirty檔（包含既有工作及本輪文件，不是本輪變更數）。不reset／clean／切分支。

## A批：主代理＋三名全新Luna Max

全為 `gpt-6-luna`／`max`／`fork none`，沒有browser或視覺任務。

| 代理 | 包與唯一可寫範圍 | 狀態 |
| --- | --- | --- |
| `/root/base_focus_b1` | B01 app.ts、state上半部（不改snapshot）、keyboard、queue、新focus focused及focus report | 已完成；最終1檔5 tests通過，主代理靜態接受，所有權釋放 |
| `/root/base_interaction_b1` | B02新interaction-target、gameplay指定互動函式／imports、interaction focused及report | 已完成；1檔13 tests通過，主代理靜態接受，所有權釋放 |
| `/root/base_combat_ui_b1` | B03新combat-ui-state、focused及report | 已完成；1檔5 tests通過，主代理靜態接受，所有權釋放 |

每份派工已包含證據、玩家行為、精確契約、禁止範圍、依賴、直接相關測試及回報。A批不改UI／ports／版本；state snapshot等B01釋放後才給B04。新helper型別由實際MapDef索引導出，不假設不存在的export。

## B批與候選前置

A批最終3檔23 tests通過，主代理已讀helper／接線／focus報告並接受，不重跑。

- `/root/base_ui_b2`：全新Luna Max，B04已final，snapshot 1檔3 tests通過、最後UI／Escape改後typecheck exit0。主代理靜態接受，所有權釋放。
- `/root/base_candidate_b3`：全新Luna Max，B05 preflight無阻礙；**現已通知SOURCE READY**，開始三處版本／獨立build／固定完整ZIP驗證。A–B最終4檔26 tests及typecheck沿用不重跑。
- `/root/base_browser_b4`：唯一Terra6.1 Max，目前只讀B06技能／harness準備，不啟browser或service；候選ready後才實測。尚無候選或browser結果。

**增量：B05 beta21已一次build／pack／完整validate通過並確認dist／ZIP凍結；主代理已放行同Terra B06開始。** dist `artifacts/base-experience-1.0.0-beta.21/dist/`，ZIP上層`game.zip`。B05餘下只寫指紋／有限掃描／報告，無source mutation。Terra尚未回實測結果。

各包只跑自己的新focused檔，使用既有bundled Node24.22.1、Vitest入口，排除`.worktrees`；不跑無關歷史catalog計數、不全suite、不加DOM依賴、不build／pack。B04統一snapshot接線／UI／一次typecheck，B05新版本獨立候選一次build／固定完整ZIP驗證，B06唯一Terra Max集中短段browser及視覺。候選凍結前不啟QA。

B04中發現存檔conflict／upgrade高優先卡可能由canvas Escape清恢復gate，主代理分析事件路徑後交同B04 owner以window capture、限定本app非文字輸入處理；最後typecheck通過。該支路browser未驗，Terra有簡便隔離diagnostic才測，否則明列限制，不新增複雜mock平台。

## 待主代理決策／下一步

### 最終靜態覆核確認的核心修復（進行中）

B04 window capture只檢實體Escape，但KeyboardInputState可把escape action重綁成KeyP等；B01 appCommand未檢saveStatus conflict／saveUpgrade。因此高優先存檔卡仍可能被重綁togglePause清gate。主代理按事件／命令路徑確認後，派全新Luna Max `/root/base_resume_guard_b5` 在state.appCommand統一拒絕這兩種狀態的togglePause，補focus focused直接case＋必要typecheck，其他未變tests不重跑；接著另立預期beta22新候選一次build／pack／完整validate。只擁有state guard／focus test／版本／新候選／兩專項report，不碰UI或Terra。beta21不覆寫。

Terra可完成beta21未受影響的新UI短段，證據標真實版本；新guard由focused驗證，若無簡便真帳號衝突route則browser該分支未驗，不搭複雜mock平台。來源更動後不宣稱beta22全route實測。

1. 收A三包報告與精簡diff，分析未解契約／缺陷；未改已過不重跑。
2. 派全新Luna B04，獨占ports／state snapshot／UI／CSS，接恢復卡、同源互動提示、戰鬥狀態及圖示identity。
3. 無未解P0才派全新Luna B05出候選；Terra Max單owner依Plan17 B06短段驗收，不長刷舊任務。
4. 若有缺陷，主代理分析後另派全新Luna精確修；Terra只補失效短段。總槽含主代理限4，Terra活動時最多2Luna。

本文件建立時，遊戲實作已開始但尚無A批測試結果，不宣稱已通過。實際結果依各包報告與最終交接更新。
