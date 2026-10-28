# 遠古遺跡包 C：誓鐘內殿交接

日期：2026-10-25（香港時間）。遊戲 ID：`brightwood-first-oath`。候選版本：`1.0.0-beta.14`。狀態：**C 程式、素材及獨立候選建置完成；真實瀏覽器、正式雲端、完整 ZIP 與發布驗收未執行**。依 [plan14](../14-ruins-bell-sanctum.md) 完成 C 即停，D 留待後續指示。

主代理統籌及審查，全新 GPT-6 Luna、max reasoning 分批實作，同時最多三名，均以全新上下文接手。用量中斷後改派新 owner，從指定 session 恢復原稿；主對話沒有載入生成圖片。沒有 commit、push、PR、tag／Release 或平台發布操作。初始 `.claude/`、`.worktrees/` 未清理或加入提交。

## 已完成的遊戲流程

- 回聲長廊東門僅需 q17 **claimed**；ready 不開，q18／q20 不額外鎖門。新增1800×720誓鐘內殿、entry `(160,600)`、自由西返與第四個真實遺跡地標，沒有第五節點。
- 失序司鐘者有垂鐘重擊及低鳴橫掃，鎖定原點／方向、矩形預警及單次命中。空檔追近玩家但嚴守 roam；半血完成當招 recovery 後進一次1200ms轉場，仍可受傷，結束才切 phase2。第二階段為橫掃→重擊→橫掃循環，死亡／切圖／重試清理剩餘攻擊與提示。
- 結果頁「返回潮痕營站」固定前往 `ruins-tide-camp:left`，不受 town 已訪條件限制；戰中返回命令停用，西門仍可步行退出。重試重建滿血 phase1 首領並保留有效任務進度。
- q18 向行舟手動接取，接取後擊敗司鐘者，再向芷衡手動領1600金幣及守誓旅冠；背包滿時原子失敗，可整理後重試。q19 由芷衡接取、回岩嶺教官手動領300金幣收尾，沿用已訪 town 即滿足 reach 的語義。q20獨立，Guardian兩個flags及成長上限不變。
- 旅冠沿既有裝備／head anchors 規則；雙攻擊各有獨立四格時間契約。轉場起點播一次既有短音，phase2音樂等實際 phase2；C勝利只播 `oath-bell-restored`，不疊 `boss-win`，重開結果不補播。

## 存檔與相容性

本機與雲端讀1／2／3／4、只寫4，schema2 manifest同步宣告。SaveData頂層與既有兩flags不變，首領循環／轉場／HP不持久化。舊檔缺q18／q19合法；保留單碑、q17與q20紀錄，拒絕未知地圖及不合法任務紀錄。

本機首次將格式1／2／3轉寫4前，分別保全同key的 `:format1-backup`、`:format2-backup`、`:format3-backup` 原始字串並回讀確認；不同既存備份、備份失敗及未知格式停止覆寫。沒有搬移或操作玩家正式存檔。不承諾 B 可回退讀取格式4；正式雲端寫4須由真正理解C IDs且可讀4的公開版本支援，fixture及metadata不代替正式相容驗收，也未自動部署橋接版。

## 素材與來源

C 新增 **11個 runtime 檔、7,559,589 bytes（7.21 MiB）**，低於9 MiB；A+B+C共 **21,867,870 bytes（20.85 MiB）**，低於24 MiB。

- 司鐘者單圖集 `public/assets/actors/monster-ruins-bell-keeper-v1.png`：1152×960 RGBA、6×5個192格，914,509 bytes；22有效姿勢、6動畫，unused格依指定來源逐像素複製。來源SHA、alpha>0邊界、格位及不同姿勢已核對。walk3只在assembly adjusted副本右移1px，原normalized保留。
- 內殿sky／far／mid三層、旅冠icon／overlay；兩層同長度 `boss-ruins` 原創配樂各有Ogg與AAC-LC，另有1.05秒PCM16復原短音。舊manifest項目與順序保留。
- 原稿、完整prompt、工具來源、採拒原因、SHA、正規化與組裝腳本均在 `art-source/ruins-c/`。中斷成果按精確session恢復，沒有猜測全域最新圖；工具未回欄位或中斷缺失皆記於metadata。所有縮圖審查由素材owner完成，主對話未插圖。

來源詳見 [profiles](ruins-c-profiles.md)、[motion](ruins-c-motion.md)、[重擊／受傷](ruins-c-slam-hurt.md)、[低掃／倒下](ruins-c-sweep-dead.md)、[配套素材](ruins-c-scene-audio.md) 與 [正式組裝](ruins-c-atlas-assembly.md)。

## 實際檢查與產物

17個不同聚焦測試檔、127項最終通過，依修改批次執行，未跑全套回歸，未重跑未再修改的通過項目：

| 批次 | 實際結果 |
| --- | --- |
| runtime／actors | 2檔18項 |
| world／quests／rules／world map | 4檔22項 |
| persistence／platform port | 5檔49項 |
| app／audio／animation | 4檔20項 |
| 最後兩個受影響legacy檔 | 2檔18項 |

型別檢查、內容跨表檢查均通過；四包production loader核對218個資源引用、相對URL、PNG尺寸與格線、六動畫、22姿勢來源、第四地標、版本格式及預算。檢查腳本初次因宣告順序失敗，修正後通過，詳見 [整合報告](ruins-c-integration.md)。素材／音訊各自的檢查、初次未齊WAV後成功驗證的紀錄見相應owner報告。

`npm.cmd run build -- --outDir artifacts/ruins-c/dist` 一次完成；入口、beta.14 manifest及11個新runtime檔已核對。沒有重建或覆蓋 A／B 候選。

- 候選入口：`artifacts/ruins-c/dist/index.html`。
- 資產證據：`artifacts/ruins-c/asset-reference-check.json`。
- 建置摘要：`artifacts/ruins-c/build-summary.json`。
- artifacts依既有ignore留在本機；來源push不會自動包含這些成品。

所有命令及未驗證項目詳見 [runtime](ruins-c-runtime.md)、[world](ruins-c-world.md)、[存檔](ruins-c-saves.md)、[app／render](ruins-c-app-render.md)、[整合](ruins-c-integration.md)。

## 規格與下一步

本輪開工約2026-10-25 15:27（香港時間）已透過網路完整讀取Playroom main模板及七份線上規格，連結與適用要求見 [派工紀錄](ruins-c-dispatch.md)。規格只作本專案開發資料；相對資源、失敗不覆寫與候選／正式驗收分離均依此處理。

**尚未驗證**：真實子目錄／跨來源sandbox iframe遊玩、45–80秒戰鬥目標、兩招辨識與操作手感、旅冠每個姿勢穿戴、聆聽配樂接縫、正式SDK／兩個獨立登入瀏覽器存檔與衝突、完整ZIP及發布流程。沒有GitHub Release或平台上架結果。程式／fixture與build不能代替這些證據。

下一步為D的有範圍瀏覽器、正式存檔、ZIP及發布驗收；需依後續授權繼續，不由本輪自行發布。
