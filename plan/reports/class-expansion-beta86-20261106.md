# Plan53 弓箭手一期候選交接

2026-11-06，Asia/Hong_Kong。53-01至53-10按順序完成；程式與本機候選完成，驗收為 **LOCAL_ACCEPTANCE_PARTIAL**。法師／盜賊53-11／12保留後續。沒有commit、push、tag、GitHub release或平台發布。

## 已完成

- 職業共同規則與原劍士相容；建角先選劍／弓訓練，弓角Lv1起步，青翎q02三靶正式轉職。
- 四個獨立角色、共享設定、格式6 profile；舊1–5需保全原件並明確確認升級，ID穩定。保存與切換沿既有序列、revision及requestId，失敗／衝突不假顯保存成功。四角高進度樣本40,053bytes，64KiB上限不截短角色。
- 水平實體箭、掃描碰撞／牆前排序／有限目標及32箭預算；二連射、穿透、後撤、弓術精通、穩定瞄準；切角／換圖／死亡等清理與時間凍結。
- 六弓與q02／q05／守衛掉落／q11／q14職業獎勵、q06裝備條件；舊劍不轉換。
- 三服裝射擊四幀、雙手／箭點 additive anchors、武器與圖示、肖像、青翎／靶／箭、五個原創合成音效；職業HUD、操作與能力／裝備／學技預覽、相容商店。

## 素材與規格來源

Imagegen skill使用**內建工具**。原稿與最終提示詞集合：[素材來源與匯出說明](../../art-source/archer-20261106/README.md)。六個`.prompt.txt`及六個`*-source.png`在`art-source/archer-20261106/`；正式26個PNG在`public/assets/actors/`與`public/assets/interface/`，精確檔名／SHA256見同目錄`export-report.json`。原始素材是本專案主角參考的原創生成，未引入外部第三方素材。既有劍士圖不覆寫。音效配方在`tools/audio/scores/sfx.mjs`，正式檔`public/assets/audio/bow-*.wav`。正式ZIP排除art-source、output、tests與tools。

本輪開發開始已用網路完整閱讀專案要求的game-agent-template、game-development、command-contracts、game.schema、game-release、starter SDK、sdk-versioning、save-compatibility；來源與要求沿[母Plan第2節](../53-class-expansion-roadmap.md)。沒有改遊戲ID、desktop裝置、SDK1.1.0／protocol1或固定tools1.2.0。

## 實際檢查

各小Plan列出分批直接相關的focused案例，未將重疊案例加總成單一數字，未跑完整回歸。涵蓋舊職業結果、AP／SP、技能、箭碰撞、任務交易、格式／備份保全、四角容量／競爭、角色切換、預覽及音效排程。最新整合修復的projectiles／rules18案例、弓術6案例、typecheck與check:content通過。音效管線生成並驗證49 entries；未宣稱主觀聆聽通過。

有限平衡比較以同AP80/20、同SP及武器階級的Lv10／20／30計算。只集中調整二連射為每箭`0.75 + 0.035×(rank−1)`，兩箭180／300ms，MP6／CD850ms。弓單體技能DPS為同階劍士約83–91%，三目標約94–100%，HP約71–73%，有射程與MP優勢。方法不含飛行、站位、中斷或補藥時間，不能當實戰DPS保證；數據在`output/archer-20261106/balance.json`。

正常瀏覽器流程從canonical-null建立弓角，q01三蝸牛、q02三靶、轉職／一次SP／弓獎勵、學二連射、保存重載及正常劍／弓切換通過。補齊蝸牛42px可見殼的獨立箭受擊高度與遠臺梯子後實際續測。1280×720能力頁、960×540技能／列表、三服裝必要縮圖已觀察。四區使用明確fixture，只記短段已見範圍；本機跨來源iframe的子目錄／射擊／Esc通過。

完整[run record](../../output/playwright/archer-beta86-20261106-01/run-record.md)含來源、正常raw／fixture、截圖、資源觀察、owner及收束。console觀測Errors0；四區HTTP>=400摘要空。browser與專屬server正常關閉，profile Chrome及43886／43887 listening觀測均0。沒有背景排程／派工或其他本輪活動資源。

## 本機候選

- ID `brightwood-first-oath`，版本`1.0.0-beta.86`，讀格式1–6／寫6。
- [game.zip](../../artifacts/class-expansion-beta86/game.zip)：155,973,875bytes，405files。
- SHA256 `0329f8222966340ae12ac09850a0ec84977a5efb3cd63051b4c68f96b75f974c`；另附`candidate.json`與`SHA256SUMS.txt`。
- 固定tools1.2.0的pack及**完整validate均exit0**；ZIP內Manifest／三套弓術引用及排除製作資料已核對。最終bundle `assets/index-gfwrQh51.js`。建置只因整合實際修正而更新，最終驗證不沿用舊bundle。

## 未驗與下一步

正常q01–q19完整通關、四首領全場／全部階段／再挑戰、正式平台登入／跨帳號／雲端衝突／人工預覽與全螢幕仍 **UNVERIFIED**。四區fixture已有claimed任務，UI的「世界旅程完成」不是正常通關證據；木葉首領短段只確認入場／施放，未取得完整命中／階段證據。

已發布beta.85不能讀格式6，不能直接回退；需另備能讀6的相容修正版。發布前先取得正式平台多角色保存及相容性證據，再按明確發布要求執行。此階段停在可審閱的本機候選，不自動啟動法師／盜賊或發布。
