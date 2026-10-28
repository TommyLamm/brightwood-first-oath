# 給下一位主 Agent 的完整交接

**本輪本機交付已收束，先讀[狀態板](status.md)與[集中交付](reports/world-completion-handoff.md)。** Sand兩獎／q15入圖已閉環；Frost舊鏈最後q09 3/6未領、q10未重演，不得假稱完整通關，也不再自動重啟舊刷怪作未改核心的重複驗證。QA profiles／原件／dirty保留，自有服務已清。2026-10-28香港04:05一次性續作的新計畫分支必須派全新gpt-6.1-sol／xhigh／fork none，僅寫基礎體驗計畫入repo，完成即停、不實作或加新遊玩內容；舊06:30限制已由此新授權取代。

**2026-10-27使用者再次明確恢復，僅收尾既有Plan16。** beta20已封裝，航標正常調查及同Sol1280構圖視覺PASS，原件與beta19保留。fresh b12已正常領q12／q13、接q22＋q14；fresh b15從正常q08存檔副本補出航／q09q10缺步，q21／q11不重做。先讀[唯一當前摘要](status.md)與[最新交接](reports/world-completion-live-handoff.md)，下方早上暫停等為歷史；不新增plan／排程或發布。

## 歷史入口（2026-10-27 06:30最後一輪）

使用者目標是完成世界圖四大區域。先讀 [Plan16集中交付](reports/world-completion-handoff.md)、[status](status.md) 及[即時交接](reports/world-completion-live-handoff.md)，再讀 [16・全區域計畫](16-world-completion-roadmap.md) 的實際未完成項。當前路徑 `C:\Users\Tommy\Desktop\brightwood-first-oath`；beta.19 SOURCE_READY／ZIP_VALIDATED／LOCAL_BROWSER_PARTIAL，四區18圖、19主線／3支線、format5。W00／W01、q21／q22、導航、手帳／世界回顧及明確備份升級均已交付，不重做已完成來源或未變的通過檢查。

01:25／06:30一次性排程均已觸發刪除，06:30為最後一輪；收尾後不再新增plan或排程。停止自主執行不代表全區驗收通過。未獲發布授權，不推tag／建Release／做平台人工確認。下方F槽路徑、七圖首版、q01未完成、舊提交規則等為歷史來源，不能覆蓋最新使用者指示或據此回退成果。

## 可直接貼給下一位 Agent 的指令

> 請在 F:\Desktop\MapleStory 按 plan/README.md 繼續實作經典劍士單機遊戲。明確並行派出多個子代理，按 plan/09-parallel-dispatch.md 及 plan/tasks 依賴派工。T00 共用骨架與契約已落地並開放 G0，不要重做；只派尚未完成或有明確缺口的工作。主 Agent 的唯一實作任務是派工與協調，不直接改程式碼；子代理使用 GPT-6 Luna Max，且只能改其所有權路徑，必須知道其他代理同時工作、不可還原他人變更。可能衝突時分開 worktree，完成後合併 main；每個小階段分開 commit，提交前核對暫存檔案清單。
>
> 已定案：台港大改版前風格、一轉劍士、單角色、桌面、45–60 分鐘主線、自行生成素材、加速成長及跑圖，七地圖／六普通怪／一首領／五 NPC／八任務／24 物品。以 01、07、08、10 為準，不要再問已定方向，不要擴充四職業、手機或真正多人。圖片依 imagegen 技能使用內建工具，明確指定本地參考，最終檔案複製進專案。
>
> 每次新開發任務依根目錄 AGENTS 完整讀最新 Playroom 指定文件，簡述適用要求後開工。子代理只做本包核心檢查，主 Agent 集中執行型別、建置與必要整合，不反覆跑全套。不聲稱未執行項目通過。
>
> 持續完成可玩的靜態候選成品及打包流程。外部限制不妨礙完成其他本機工作。推 tag、建立 Release、人工確認與 Playroom 上架只按實際明確授權及指定來源執行；僅有目標描述時先交候選成品。最後提供入口、成品、實際檢查與未驗證限制。

## 現況與目前阻塞（2026-10-18）

程式、依賴與Git repository已建立。T00 G0與T00-09已完成；2026-10-18使用者曾授權確定性裁切／重排／最近鄰縮放／清邊alpha，T10–T12素材現已完整：actors 22 images／64 animations＋96 hero anchors、environment 20/20、interface 47 images／5 VFX animations；audio manifest 有16 entries。原ImageGen稿、prompt、匯出腳本與檢查證據保留於art-source；詳[本次素材交付](reports/asset-recovery-20261018.md)。

目前已有本機 production `dist/`、真實遊戲畫面封面與官方通過的候選 ZIP：`artifacts/game.zip`（`brightwood-first-oath` v`1.0.0-beta.1`）。T07/T08 與 T14 app source 已整合；T16 有限瀏覽器證據到 q01 2/3，另驗 read-load、Esc、正式 UI icons、跨 origin `/dist/` sandbox iframe 與 960/640 尺寸。完整 q01–q08／45–60 分鐘、q01 回報獎勵、瀏覽器 console／真實音訊、fullscreen、cloud、FPS 與 Playroom 帳號發布仍未驗證。請先看[狀態板](status.md)、[T16 報告](reports/T16.md)及[T15封裝證據](../artifacts/T15-package-evidence.json)；不要因舊 source-only 紀錄重做已入庫素材。原八題及追加題已回答，見[06](06-decisions-and-risks.md)。

1. 新開發包開始前讀根 AGENTS，完整讀取最新 Playroom 指定文件，簡述適用要求後開工。
2. 先讀 [狀態板](status.md)、本包 report 與 task，核對實際工作樹；不要重做已完成包，也不能把未驗證狀態標成通過。
3. 依 [09](09-parallel-dispatch.md) 派尚未完成工作，最多同時三個子代理；每包寫明依賴、所有權路徑、禁止項目、核心檢查及交付格式。
4. 圖片用 imagegen 技能的內建工具，先檢視並明確指定本地參考；最終素材複製進專案。格線／透明／視覺不合格時只保存 source-only，不造 manifest 占位項。
5. 每個小階段分開提交；共用工作目錄需串行使用 Git index，若使用 worktree 則由主 Agent 核對並合併 main。
6. 按 11 做有限整合與交付；Build/ZIP/瀏覽器/Playroom 驗收要分開記錄。沒有明確授權不推 tag、不建 Release、不做人工確認或上架。

## 外部事項不阻塞實作

尚未指定公開 GitHub repository、正式作者名及平台管理連線。先做本機候選；到真正發布時再清楚列缺項，不假填帳號或代做人工確認。規格／工具無法讀取時報實際 URL、原因，繼續不依賴缺失內容的工作。

## 恢復與紀錄

主 Agent 更新 plan/status.md；子代理各寫 plan/reports/Txx.md，列實際檔案、匯出、檢查、未完成與接線點。報告不能取代可用程式。中斷後先讀狀態及報告，再查相關程式；不無條件重做資產或重跑通過檢查。

本輪僅製作交接文件。下一輪若已收到實作指示，任務是實作，不是再寫另一份計劃。

