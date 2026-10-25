# 遠古遺跡包 B：世界內容交接

日期：2026-10-25（香港時間）。World owner 範圍：計畫第 3、5、9 節及世界地圖模型。狀態：**已完成，可供 app／存檔整合使用**。

## 來源與適用要求

- 已讀 `AGENTS.md`、`plan/13-ruins-echo-exploration.md`、`plan/reports/ruins-b-dispatch.md`、`plan/reports/ruins-b-monster-rules.md`、`plan/reports/ruins-b-contracts-saves.md`、`plan/reports/ruins-a-handoff.md` 與 `plan/reports/ruins-a-world.md`。
- 透過網路完整讀取 Playroom `templates/game-agent-template.md`；B 派工紀錄及先行交接確認主代理於 2026-10-25 已完整讀取其列出的七份 main 規格。
- 適用要求：保留 A 與使用者改動；只擴充核准 ID 清單，不補 q18／q19；q20 明確以前置 q16 解鎖、不得變成主線或入口門檻；B 新區域可往返且不建立未實作內殿；inspect 目標須白名單、實際放置並在任務階段可達。

## 完成內容

- 新增 `ruins-echo-gallery`（2600×720，地面 y=600，`ruins-gallery`／`theme-ruins`），接在 `ruins-root-causeway` 東側。入口要求 q16 **claimed**；西返不設鎖。石道原有西返與營站／木葉鎮航線保留。
- 長廊配置兩個碑台 `(820–1020, 420)`、`(1900–2120, 360)`，梯路各自連回地面；行舟位於 `(300,600)`，西／東碑位於 `(900,420)`、`(2000,360)`。兩碑共用 `actor:ruins-stele` 素材 key，離地高度使地面互動距離不足以直接觸發。
- 加入斷弦木偶兩個 spawn、巡鈴石獸兩個 spawn，依計畫使用 `(x, roamLeft, roamRight)`：木偶 `(780,720,850)`／`(1570,1510,1630)`，石獸 `(1170,1100,1240)`／`(2000,1940,2070)`。
- 新增 q17「兩段回聲」及 q20「留給旅人的鈴聲」。兩者都只前置 q16；q17 調律兩碑並擊退兩隻木偶，文案明確表示三個目標次序不限；q20 擊退三隻石獸並交付三片普通材料失聲鈴片。
- World validator 固定核准 **17 張地圖、12 位 NPC、18 件任務**，保留其他舊限制；q20 是唯一非連號前置例外 `['q16']`。inspect 限兩個 keeper 碑 NPC、各 count 1、精確長廊位置／foothold，且須在當前任務階段可達。也驗證碑台梯路、入口／無鎖西返、怪物配置與互動範圍。
- 世界地圖加入真實長廊節點 `(67,39)`；遠古遺跡探索數現在為 3，不建立內殿 placeholder。

## 改動檔案

- `src/content/world/maps.ts`
- `src/content/world/npcs.ts`
- `src/content/world/dialogues.ts`
- `src/content/world/quests.ts`
- `src/content/world/validate.ts`
- `src/content/world/index.ts`
- `src/ui/world-map-model.ts`
- `tests/ruins-gallery-world.test.ts`
- 更新 `tests/world-map.test.ts`、`tests/ruins-entry.test.ts` 與 `tests/integration/app-foundation.test.ts` 的直接受影響地圖／內容數斷言。

碑面初始對話維持中性，不透露未調律的歷史。已將片段交 app/UI owner：西碑「守護的是歸途，」，東碑「不是封鎖所有來路。」；q17 claimed 後行舟可確認兩段回聲並引向更深鐘聲，不添加傳送門。

## 檢查

執行：

```text
npx vitest run tests/ruins-gallery-world.test.ts tests/world-map.test.ts tests/ruins-entry.test.ts --exclude '**/.worktrees/**'
```

結果：3 個測試檔、13 個測試通過。更新 `app-foundation` 中既有的 item 數 30 舊斷言為 33，並補上 17 maps／12 NPC／18 quests 斷言。

另一次包含 `tests/integration/app-foundation.test.ts` 的四檔聚焦執行中，world／entry 三檔仍通過；app-foundation 有 3 個測試因共享工作區的 assets loader 已要求尚未提供的 `env:ruins-gallery:{sky,far,mid}`、`actor:ruins-pathfinder`、`actor:ruins-stele`、`actor:ruins-string-puppet`、`actor:ruins-bell-prowler` 而失敗。未修改素材 manifest／loader，留給素材與整合 owner。

未執行 typecheck、`check:content`、build、全套測試、瀏覽器／平台驗收；依派工安排留給整合階段。沒有執行存檔遷移或發布。

## 未完成與下游

- App／UI owner：接入 inspect 命令權威重驗、石碑按鈕、碑文完成狀態及 q17 claimed 行舟文案；中性 dialogue ID 與片段已確認。
- 素材／整合 owner：為 `ruins-gallery` 補齊對應環境、NPC／石碑與渲染引用；同步檢查 manifest、候選版本與存檔宣告。
- 整合 owner：待其他 owner 完成後統一執行 typecheck、content check、相關測試及 build；瀏覽器、正式雲端與發布仍未驗證。
