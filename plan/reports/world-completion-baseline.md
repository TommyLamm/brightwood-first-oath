# Plan16 世界完成基線（W00）

日期：2026-10-27（香港時間）。狀態：**W00 靜態基線完成；未開始程式實作**。本報告只記錄讀到的來源、沿用證據、已知真缺口與下一包；不把「尚未觀察」寫成程式缺陷。

## 規格、範圍及讀取來源

本包讀取根目錄 [AGENTS.md](../../AGENTS.md)、[Plan16 路線圖](../16-world-completion-roadmap.md)、[狀態板](../status.md)，以及路線圖列出的世界擴充、正常角色、Plan15、遺跡視覺／重試、首領時長與 beta.18 封包報告。主代理已確認完整讀取本專案 Playroom 範本及七份 main 規格：game-development、command-contracts、game.schema.json、game-release.yml、starter `playroom-sdk.js`、sdk-versioning、save-compatibility。

本期保留遊戲 ID `brightwood-first-oath`、桌面單人劍士、Lv1–30、SDK 1.1.0／protocol 1／schema 2／tools 1.2.0、Node 24.22.1、讀存檔格式 1–4／寫格式 4、原 canonical save namespace、跨來源 sandbox iframe 與相對資源路徑。保存失敗不得當空存檔，不得覆寫原件；新增任務只能初始化缺省，不能自動領獎；沒有發布授權不推送、不建 tag／Release、不上架。新增任務存檔相容性在 W01-03 判定前不得寫入玩家存檔。

## W00-01 工作區與候選快照

以下 Git 快照是在新增本報告及 W01 設計報告之前讀取：

| 項目 | 快照 |
| --- | --- |
| branch／HEAD | `fix/background-jitter`／`d410f674a7e69ba0ec3704b4764549bb5041323a` |
| dirty 狀態 | 353 個 status 項目：54 個 tracked modified、299 個 untracked；其中 8 個 `.worktrees/` 路徑。這是原有工作區，不屬於 W00，也不得 reset、清理、stage 或覆寫。 |
| 最新凍結候選 | `1.0.0-beta.18`；`artifacts/overnight-20261026/portal-labels/dist/`。ZIP `artifacts/overnight-20261026/beta18-package/game-beta18.zip`，131,514,190 bytes，SHA-256 `779361b5dedbf1a39465d5775a82ec08da920d1c77bb3afa01b26c6e72896f87`。沿用 [封包報告](overnight-beta18-package-20261026.md)，本包沒有重驗。 |
| 固定工具／平台欄位 | Node 24.22.1；Playroom tools 1.2.0；SDK 1.1.0／protocol 1；Manifest schema 2；desktop；存檔讀 1–4、寫 4。 |
| 服務 | 本包沒有啟動、停止或連接服務。唯讀查詢 5173 listener 時 Windows CIM 拒絕存取，故本包不能確認目前服務或其 owner；不可拿 2026-10-24 的舊 listener 記錄當目前狀態。 |

當前工作樹與 beta.18 凍結候選不是同一份已驗來源。現有 `src/app/gameplay.ts`、`src/domain/actors/index.ts`、`src/content/rules/skills.ts`、UI、manifest 等 dirty 變更一律保留；這些改動未由本包重新 build、測試或瀏覽器驗證。beta.18 的舊證據只代表各報告所指凍結成品／來源。

## W00-02 四區 18 圖缺口表

標記定義：`IMPLEMENTED` 是現行 catalog／MapDef 有實際內容；`EVIDENCED` 是指出既有報告中的操作或檢查，並不等同完整實機通關；`GAP` 是已定位的程式問題或仍欠的特定驗收操作；`DESIGN_CHANGE` 是本計畫尚未實作的內容提案。單純缺少一張截圖不構成玩法缺陷。18 個 MapDef 與順序可對照 [world maps](../../src/content/world/maps.ts) 及 [map order](../../src/content/world/index.ts)，現有任務 q01–q20 可對照 [quests](../../src/content/world/quests.ts)。

| 地圖 | 基線狀態、沿用證據與真正待補項 |
| --- | --- |
| camp／晨光營地 | `IMPLEMENTED` q01 教學入口；`EVIDENCED` beta.17 正常 first-run q01–q03 與 beta.16 對話／點按說明。沿用 [夜間交接](overnight-optimization-handoff-20261026.md)。不重走 q01，也不延長刷怪教學。 |
| town／木葉鎮 | `IMPLEMENTED` 商人、治療、任務與傳點樞紐；`EVIDENCED` q19 正常手動領獎及 beta.18 傳點文字視檢（[q19 報告](ruins-d-browser-retry.md)、[beta.18 封包交接](overnight-beta18-package-20261026.md)）。`DESIGN_CHANGE` W06 q19 後世界收束／自由探索指引；不重設 `chapterComplete`。 |
| forest-edge／嫩芽林道 | `IMPLEMENTED` q03／q05 路線；`EVIDENCED` 正常 q03 與 q05 首次接取操作。沿用 first-run 交接。未見獨立缺陷；沒有理由重跑未改路線。 |
| mushroom-wood／菌傘深林 | `IMPLEMENTED` q04 菌菇及平台地形；`EVIDENCED` q04 六菇與樣本的正常領獎流程。現有摘要沒有列出平台碰撞缺陷；只在 W02 或素材改動碰撞／路線時定點確認主路與可選平台。 |
| red-ridge／赤岩山徑 | `IMPLEMENTED` q05–q08；`EVIDENCED` 正常角色 q07／q08 手動領獎、Guardian 勝利及第一章結算，原始檔 [q08 raw](../../output/playwright/resume-1515/q08-claimed-format4.json)，摘要 [交接](resume-1515-handoff-20261026.md)。W02 對齊 q07／q08 回報與章節文字，不重跑八任務。 |
| mine-gate／古礦入口 | `IMPLEMENTED` 普通怪／Guardian 前準備。`GAP` 標題「上次進度」把所有 `boss: true` 地圖都寫成古礦入口；實際 `restoreGame` 只把 Guardian 送回此處，其餘首領仍保留真實位置。依 [Plan15 審查](plan15-remaining-review-20261026.md) 修正顯示判斷，不能改成假位置。 |
| guardian-arena／守衛祭壇 | `IMPLEMENTED` Guardian、核心、q08 與霜雪門檻；`EVIDENCED` 正常角色戰勝 Guardian、向守望者手動領 q08。`GAP` W02 清楚區分「打倒守衛」「交核心並領 q08」「前往霜雪」三步。 |
| frost-shore／雪痕海岸 | `IMPLEMENTED` 雪狼、雪芽、q09／q11 及跨區連線；`EVIDENCED` 區域圖／場景／雪狼短觀察與 q09–q11 focused route tests，沿用 [霜雪交接](world-expansion-20261024.md)。`DESIGN_CHANGE` q21 起訖與 q11 後沙海導航；安全互動帶只在實際入口衝突時改。 |
| frost-pine-pass／霜松隘道 | `IMPLEMENTED` q10 冰甲蟹、高低路線與回程；`EVIDENCED` q10／門檻 focused tests。`DESIGN_CHANGE` 在既有高台放 q21 航標調查點；使用新 ID，不把回聲碑 NPC ID 借給新任務。 |
| frost-tide-cavern／冰潮洞窟 | `IMPLEMENTED` 霜潮首領及 q11；`EVIDENCED` 首領外觀／預警曾在 beta.6 顯示，q11 手動獎勵由 focused tests 覆蓋。`GAP` 尚缺一次相稱的正常勝利→重試或離場→雪芽手動領 q11 閉環；舊瀏覽器角色死亡不等於此閉環，也不代表程式故障。 |
| sand-glass-shore／琥珀砂岸 | `IMPLEMENTED` 沙蠍、琉砂、q12／q14／q15 及三方向航路；`EVIDENCED` q12／q14 的 focused routes 與日井守衛外觀。沿用 [沙海／日井報告](world-expansion-20261024.md)。`DESIGN_CHANGE` q22 起訖與東門／南航標辨識；`GAP` q14 的正常首領戰至手動領獎尚無完整瀏覽器閉環。 |
| sand-dune-pass／砂丘關道 | `IMPLEMENTED` q13、沙蠍／甲蟲與可回砂岸平台路線；`EVIDENCED` q13 catalog／MapDef focused case。`DESIGN_CHANGE` 用現有平台與預警引導低掃／可繞行路線，不能靠增加擊殺數充當探索；只有本包承諾的集中路線操作待 W04，沒有已證實的地形 bug。 |
| sand-sunwell-basin／日井盆地 | `IMPLEMENTED` 四個普通怪、日井地景、東祭壇與無鎖西返；`EVIDENCED` q13 tests、beta.8 預先完成 q13 後的短返程與地景視檢。`DESIGN_CHANGE` q22 以到達盆地＋任務期間擊退甲蟲給獨立探索用途；保留安全回程。 |
| sand-sunwell-altar／日井祭壇 | `IMPLEMENTED` 日井守衛／q14；`EVIDENCED` q14 真實 catalog/spawn focused case及 beta.9 首領外觀。`GAP` 完整操作預警→躲避／命中→勝利→回琉砂手動領 q14；先前警示截圖未觸發有效近距離預警，因此是未驗，不是 defect。 |
| ruins-tide-camp／潮痕營站 | `IMPLEMENTED` 芷衡／青禾、q15／q16／q18、雙向交通；`EVIDENCED` q15–q19 分段領獎與 q19 回 Town。`DESIGN_CHANGE` 將補給／直航提示與 q19 世界結尾收束清楚呈現；依 [主線交接](overnight-optimization-handoff-20261026.md) 沿用完成段。 |
| ruins-root-causeway／盤根石道 | `IMPLEMENTED` q16 與盤根梯路；`EVIDENCED` focused tests、一次限定 3.5 秒路線觀察（[遺跡視覺交接](ruins-visual-handoff-20261026.md)）。無已知具體碰撞缺陷；不因未有全圖影片而重跑。 |
| ruins-echo-gallery／回聲長廊 | `IMPLEMENTED` q17 雙碑／木偶、獨立 q20 石獸支線；`EVIDENCED` q17 inspect 契約與兩碑流程、q20 3/3 UI，沿用 [遺跡 B 報告](ruins-b-app-ui-render.md)、[枝線報告](ruins-d-browser-branches-retry.md)。沒有已定位漏碑／漏回報；按分段 raw 逐項比對後只補明確跳過的操作。 |
| ruins-bell-sanctum／誓鐘內殿 | `IMPLEMENTED` 司鐘者雙招／半血轉場、q18 與正常再戰；`EVIDENCED` 兩種可見預警、半血轉場、勝利後正常 retry／滿血重生（[首領量測](resume-boss-measure-20261026.md)、[retry 報告](ruins-retry-2020-20261026.md)）。`GAP` boss 音樂／轉場／復原音效沒有實際聽音確認；18 秒高輸出樣本低於舊 45–80 秒參考，這是 W01 設計決策，不是新增阻斷缺陷。 |

### 確認為真缺口的項目

1. **P0 W02**：標題繼續冒險地名顯示有明確 boss-map 判斷缺陷；第一章結果、q08 手動回報及霜雪出航提示要分清楚。來源 [Plan15 remaining review](plan15-remaining-review-20261026.md)。
2. **P0 W03／W04**：霜潮與日井的「正常首領→結果／重試或離場→回任務 NPC 領獎」瀏覽器閉環各欠實際操作；對應 focused tests 不冒充瀏覽器操作。已有警示未觸發或角色死亡的舊片段不重算成功。
3. **P0 W01-03／W07**：相容 owner 已交 [q21／q22 存檔可行性方案](world-completion-save-design.md)：format4 可表達狀態，但 beta.18 catalog 會拒絕未知任務；候選建議 format5。Plan16 隔離候選可進入實作／驗收；真實 format4 原件只在遊戲 UI 明確備份／升級確認後才遷移。正式雲端寫入仍未授權，不能由本機候選或 Manifest 宣告推定。
4. **P1 W03／W04／W06**：q21 航標與 q22 盆地支線、雪岸→沙海導航、低掃探索教學、q19 後的世界結尾均是 `DESIGN_CHANGE`，不是現存功能故障。
5. **P1 W05**：可聽音訊未驗；先沿用既有可見戰鬥／重試證據，只做一次實際聽音及任何受改動影響的步驟。

### 基線後續更新

主代理的 [live handoff](world-completion-live-handoff.md) 更新指出，W02 已由 `/root/world_navigation_b1` 完成：修正 Guardian 限定恢復地名、補 q08 後續導航與 README；9 個 world-map focused cases 及 typecheck 通過，沒有 build／browser／pack。`mine-gate` row 的地名 `GAP` 因此已關閉，沿用 [W02 報告](world-completion-navigation.md)，不要重跑未受影響的案例。W00 基線表保留的是本包開始時的快照。

## 共用檔案責任與下一個工作包

主代理 `/root` 為協調者。依最新 [live handoff](world-completion-live-handoff.md) 記錄：

- `/root/world_region_content_b2`：`src/content/world/*`、`src/app/gameplay.ts`、霜雪／沙海 focused tests；負責 q21／q22 與 inspect allowlist；不改 persistence、contracts、UI、metadata、素材。
- `/root/world_save_impl_b2`：persistence、contracts types/ports/commands、`src/app/app.ts`／`state.ts`／`root-ui.ts` 及直接相關 tests；負責 format5 隔離候選與本機明確備份升級 UI；不改 `src/ui/index.ts`、world content／`gameplay.ts`、metadata。
- 已完成 `/root/world_navigation_b1`：`src/ui/index.ts`、`world-map.ts`、`world-map-model.ts`、README 與直接相關 tests；依上述 W02 報告釋出所有權。
- `src/domain/actors/index.ts`、`src/content/rules/{skills,monsters}.ts`、`public/assets/*/manifest.json`：W05／素材整合 owner 尚待指派；目前路徑已有 dirty 變更，先保留，不覆寫。
- `public/assets/*/manifest.json`：由一名資產整合 owner 寫 manifest；素材代理只交原稿與候選，不直接覆蓋共用 manifest。

本包完成 W00 靜態基線。W01 數值設計見[設計報告](world-completion-design.md)，存檔相容靜態方案見[save-design](world-completion-save-design.md)。隔離 format5 候選可以依 Plan16 實作與檢查；真實 format4 原件只在遊戲 UI 明確備份／升級確認後才遷移。沒有開瀏覽器、啟動或停止服務、build、測試、重驗 ZIP、commit 或發布。
