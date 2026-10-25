# 遠古遺跡包 B：整合交接

日期：2026-10-25（香港時間）。遊戲 ID：`brightwood-first-oath`。候選：`1.0.0-beta.13`。狀態：**B 程式與素材完成，獨立候選建置完成；實際遊玩、正式存檔、ZIP 與發布驗收未執行**。本批依計畫完成即停，C／D 尚未完成。

依 [13 回聲探索計畫](../13-ruins-echo-exploration.md)，主代理統籌，全新 GPT-6 Luna、max reasoning 分批實作，同時最多三名。額度中斷後依使用者指示續作，以新代理恢復既有原稿與指定 session 來源，不重生可恢復成果。主對話沒有載入生成圖片；未 commit、推送、建立 tag／Release 或呼叫平台發布 API。

## 已接合的行為

- 石道東門需 q16 **claimed** 才進入長廊，ready 不開門；長廊西返無任務鎖，原營站／鎮內航路維持。
- 長廊西側行舟、兩座高台回聲碑與直達梯路、兩木偶及兩石獸生成點；兩碑互動距離不與地面重疊。世界圖第三個真節點 `(67,39)`，探索總數3。
- q17 為兩碑調律＋接取後擊退木偶2，任意次序，回行舟手動領800金幣／大紅4／大藍2；q20 另接、另交石獸3與鈴片3，領600金幣／大紅4，不鎖主線。
- inspect 命令重新檢查存活、無待切圖、長廊、兩碑白名單及 placement、64px距離、當前互動與 q17 active。每碑最多1，不自動領獎，成功後才顯示歷史；q17交付後行舟確認兩段回聲。
- UI同時列q17／q20，調律目標從NPC catalog取名。石碑常亮從questViews推導，不存新flags；音效只從同角色／同圖／playing的有效counter 0→1觸發，重按／重開／重載不播。
- 木偶原地前拍1000／100／900ms，石獸低掃1100／100／900ms，鎖向矩形預警、單次命中與取消沿既有核心。普通材料必掉，可出售再取得；EXP0、9秒重生。
- 不實作內殿、司鐘者、q18／q19、旅冠或新音樂；不建立假節點／portal。

## 存檔與部署邊界

本機與雲端讀1／2／3，僅寫3。SaveData頂層與角色／Guardian flags保持。舊檔完全缺q17／q20合法；inspect只收對應碑的0／1整數，q17 claimed須有兩碑與木偶完整紀錄，q20 claimed不要求仍持有已交材料。

首次將格式1／2本機封套轉寫3前，保全原始字串到同key的 `:format1-backup`／`:format2-backup` 並回讀核對；不同既存備份、備份失敗、未知或不合法格式停止覆寫。沒有操作玩家正式存檔。

Manifest為schema2、readableFormats `[1,2,3]`、writeFormat `3`。A不理解B新ID／inspect，不能宣稱可降版讀取格式3。正式雲端寫3仍須目前公開版本實際理解B catalog且可讀3；沒有部署橋接版或正式帳號遷移證據，fixture／預覽不能替代正式保存。

## 已完成素材與來源

Scene八檔共2,130,659 bytes：三層gallery背景、行舟兩格idle、共用靜態碑、兩item icons及0.55秒／48kHz mono PCM16 `stele-tune`。從舊owner精確session恢復8張原稿，沒有補生成；尺寸／透明邊界／音訊及新manifest引用由素材owner核對。A區域底圖、theme-ruins base／combat沿用。

兩怪各有2張共同參考、7張motion與9張action（各18個有效姿勢），原稿／prompt／來源／SHA／normalized保存在 `art-source/ruins-b/`；全部已接受並組成正式576×480 RGBA圖集。actor manifest追加兩image及十animation，既有37個image／106個animation保持原序與JSON值。

組裝以alpha>0核對邊距與腳底，25幀在獨立adjusted副本作1px對齊或移除alpha≤8且超出y92的淡尾點；沒有縮放、肢體裁切或改動原稿／原normalized。逐格像素、unused複製、18姿勢差異及五動畫契約均核對，兩張圖集合計337,173 bytes。

本批新增runtime共10檔、**2,467,832 bytes（2.35 MiB）**；A+B共**14,308,281 bytes（13.65 MiB）**，低於B的4 MiB與全章24 MiB預算。候選入口為 `artifacts/ruins-b/dist/index.html`，A的beta.12成品保持。

## 已執行檢查與限制

- contracts／domain／save：2檔15測通過。
- 新怪戰鬥：1檔6測通過。
- world／atlas／entry：3檔13測通過。
- app／audio／animation：3檔10測通過。
- 直接受影響legacy persistence／platform／ruins-save／rules：4檔36項最終通過；首次35／36，補入rules敵技集合漏列兩招後單檔10／10通過。沒有重跑未改動的B tests。
- typecheck、check:content：整合owner各一次通過。
- world owner較早的app-foundation執行有3項因B素材尚未交付而失敗；素材齊備後針對此檔執行一次，**12／12通過**，此依賴缺口已解除。
- `node --import tsx artifacts/ruins-b/check-assets.mjs`：4包loader／207引用／PNG尺寸格線／兩怪五動畫／靜態碑契約／第三地標／版本格式與runtime預算均通過。證據：`artifacts/ruins-b/asset-reference-check.json`。
- `npm.cmd run build -- --outDir artifacts/ruins-b/dist`：一次執行、exit0，Vite65 modules；核對beta.13 manifest、入口及10個新增資產。證據：`artifacts/ruins-b/build-summary.json`。
- 整合owner限定tracked檔案的 `git diff --check` 通過；只有Git LF／CRLF提示。此檢查不包含所有新檔或完整工作區。

各組聚焦測試共14個不同測試檔、92項最終通過，分批執行；不是單一全回歸命令，也沒有重跑未改動且已通過的B tests。完整實際命令、首輪失敗與修正見整合及各owner報告。

未執行真實瀏覽器／跨來源iframe、實際音訊播放／操作手感／難度時長、fullscreen、正式SDK與多設備存檔、完整ZIP pack／validate、Release或平台上架；不能由fixture、型別或build推定通過。

## 交接入口

來源、owner與實際指令見 [派工紀錄](ruins-b-dispatch.md)、[契約／存檔](ruins-b-contracts-saves.md)、[戰鬥](ruins-b-monster-rules.md)、[世界](ruins-b-world.md)、[app／UI／renderer](ruins-b-app-ui-render.md)、[共同參考](ruins-b-monster-profiles.md)、[配套素材](ruins-b-scene-npc-assets.md)、[木偶motion](ruins-b-puppet-motion.md)、[石獸motion](ruins-b-prowler-motion.md)、[木偶action](ruins-b-puppet-actions.md)、[石獸action](ruins-b-prowler-actions.md)、[正式圖集](ruins-b-atlas-assembly.md)、[最終整合與檢查](ruins-b-integration.md)。主代理本日已網路完整讀取Playroom模板及七份main規格，來源連結與適用驗收列於派工紀錄。B實作到此停止；後續C或D須依使用者下一次指示，不自動發布。
