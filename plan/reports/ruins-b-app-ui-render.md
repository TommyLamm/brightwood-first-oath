# 遠古遺跡 B 包：App／UI／Renderer 交接

日期：2026-10-25（香港時間）。狀態：**owner 範圍完成，可供整合**。

## 已讀來源與適用規則

先讀 repository `AGENTS.md`、`plan/13-ruins-echo-exploration.md`、`plan/reports/ruins-b-dispatch.md`、`plan/reports/ruins-b-contracts-saves.md`、`plan/reports/ruins-b-monster-rules.md`。確認 `.codegraph/` 不存在。Playroom `game-agent-template.md` 及其列出的七份 main 規格由主代理於 2026-10-25 完整網路閱讀，本 owner 依主代理交接繼續，沒有重複下載。

本批只接 app／UI／renderer 契約：命令端重驗當前狀態；碑名與任務摘要讀取 catalog／questViews；音效只對有效 0→1 調律轉移播放；石碑亮度不增加存檔旗標；靜態石碑 animation 例外與普通 NPC 契約分開；新怪物 attack 使用 authored frame timing。不修改 contracts、domain、persistence、world、rules、manifest、遊戲版本或發布設定。

## 完成項目

- `src/app/gameplay.ts` 新增 inspect 命令處理。每次確認都檢查角色存活、無切圖待辦、目前在回聲長廊、target 僅西／東碑且實際放置、距離不超過 64px、當前互動對象吻合、q17 已 active 且未 claimed，並確認該 inspect objective 存在。成功後只記錄 `inspected` event、刷新開啟中的碑文並顯示成功訊息；重按已調律的碑不增加計數也不給獎。
- 石碑在 q17 counter 成功記錄前保留 catalog 中性碑文；西碑 counter=1 才加入「守護的是歸途，」，東碑 counter=1 才加入「不是封鎖所有來路。」。行舟交付 q17 後顯示兩段回聲合讀收尾，未建立內殿傳送門。
- `npcDialogue` 改為整理所有相關任務摘要，讓行舟同時接取／追蹤 q17、q20 時保留兩條摘要。
- `src/ui/index.ts` 在沒有相關 quest card 時仍提供石碑專屬「調律石碑」按鈕；任務 HUD／對話卡 objective 顯示「調律」及 NPC catalog 碑名。`src/ui/illustrated-panels.ts` 的任務日誌改用 NPC 圖像／名稱，並顯示碑文所在地圖。
- `src/app/app.ts` 只在前後皆 playing、同一 playerEntityId、同在回聲長廊、無 pendingTransition、q17 前後皆 active、當前互動相符且該碑 counter 0→1 時播放 `stele-tune`。音效事件 ID 依角色實體及石碑去重；沒有使用 VisualEvent。
- `src/render/index.ts` 依 `WorldSnapshot.questViews` 畫固定小光暈，active counter=1 或 claimed 時亮起，不保存額外 flags。木偶與石獸 attack 沿 `[500,500,100,900]`／`[550,550,100,900]` authored frame times 播放；苔陶蟲原有節拍保留。
- `src/render/animation-contract.ts` 僅對 `actor:ruins-stele` 的西／東碑 idle 接受 `[0,0]`、兩格 350ms loop；其他 NPC 仍要求兩格 350ms idle。兩種新怪物 attack timing 納入契約。
- `src/app/assets.ts` 的必要 key 清單增加行舟、共用石碑、兩種新怪、`ruins-gallery` 三層環境、兩種材料圖示及 `stele-tune` 音效。實際素材與 public manifest 由素材 owner 後續交付；本批不修改共享 manifest。

## 驗證

執行：

```text
npx vitest run tests/ruins-inspect-command.test.ts tests/integration/app-audio.test.ts src/render/animation-contract.test.ts --exclude '**/.worktrees/**'
```

結果：3 個測試檔、10 個測試通過。測試涵蓋接取前碑文中性、有效／無效 inspect 狀態、計數一次性與歷史揭露、行舟多任務摘要與 q17 收尾、調律音效只播一次，以及靜態碑和兩種 attack timing 契約。

未執行 typecheck、content check、完整測試、build、browser 或真實素材 manifest loader；按 owner 派工要求只跑 focused tests，且實際 B 素材仍待交付。未宣稱視覺手感或素材載入驗收通過。

## 整合下一步

素材 owner 完成後，由整合 owner 將對應實際 actor／environment／item／SFX key 與動畫 metadata 放入 public manifests，再做一次 loader／引用核對及必要整合檢查。主代理另行整合候選版本／存檔 manifest。本 owner 未 commit。
