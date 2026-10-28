# 遠古遺跡包 C：App／Renderer／UI／Audio 接線交接

日期：2026-10-25。依 `plan/14-ruins-bell-sanctum.md`，承接 `plan/reports/ruins-c-dispatch.md`、`ruins-c-runtime.md`、`ruins-c-world.md`。本批只處理 app、renderer、UI、音訊事件及其聚焦測試。

## 規格與範圍

- 已讀 `AGENTS.md`、plan14 全文及三份 C 交接。主代理本輪紀錄確認已完整網路閱讀 Playroom 模板及其列出的七份規格，沿用該紀錄，未重複下載。
- `.codegraph/` 不存在，依專案要求直接查看來源。
- 適用要求：使用實際的相對資產 key；phase2 音樂依 runtime `phase`，不依半血；勝利短音只由本場結果轉換觸發；結果可返回潮痕營站且不要求先訪問木葉鎮；重試從 `entry` 建立新首領；玩家同 tick 死亡時清除 C 首領的攻擊、預警與未發轉場提示。

## 已完成

- App／gameplay：擴充 C 首領免擊退與 boss death/result 分流；C 結果頁的 `returnTown` 目的地為 `ruins-tide-camp:left`，戰中仍拒絕該指令。`retryBoss` 使用現有 `entry` 出生點流程並重建實體，不改 q18 counter 或 Guardian flags。`cloneGameplay` 為 `bellCycle` 建立獨立副本。玩家同 tick 死亡時，清除司鐘者的 combat attacks、telegraphs、pending skill 與階段轉場 timestamp，避免 dead screen 停止 step 後殘留。
- UI：C 結果頁顯示「返回潮痕營站」及「再次挑戰司鐘者」；atlas 和 app status view 的返程標籤也指向營站。`createUiSnapshot` 允許 C 結果頁在尚未訪問木葉鎮時返回，戰中仍不可用。
- Renderer：把司鐘者加入命名 boss 血條與 boss 預警清單。選擇器依 `pendingSkillId` 使用 `attack`／`attack-sweep`；兩套 clock 保留 `[450,450,100,1000]` 與 `[600,600,100,1000]` 原始格時長。`phase-transition` 使用 idle 並畫固定淡色光圈，不繪製額外預警。load-map animation 檢查只對司鐘者額外要求 `attack-sweep`。
- App audio：司鐘者僅在 `phase === 2` 升至 phase2 intensity；`transitionStartedAtMs` 變化時播放一次 `boss-phase`。C 的 `bossResult` false→true 只播放 `oath-bell-restored`，不播放 `boss-win`；重開／重畫結果不重播。音效沿既有 `playSfx`，沒有安排延遲音效或新增 stop 能力。
- `src/app/assets.ts` 已列出 renderer/app 所需 actor、circlet、sanctum 環境、`boss-ruins`／phase2 及 `oath-bell-restored` keys，供素材 owner 更新 public manifests。

## 改動檔案

- App：`src/app/app.ts`、`src/app/assets.ts`、`src/app/gameplay.ts`、`src/app/state.ts`、`src/app/root-ui.ts`
- Renderer：`src/render/index.ts`、`src/render/animation.ts`、`src/render/animation-contract.ts`
- UI：`src/ui/index.ts`、`src/ui/world-map.ts`
- 聚焦測試：`src/render/animation.test.ts`、`src/render/animation-contract.test.ts`、`tests/integration/app-audio.test.ts`、`tests/integration/ruins-c-app.test.ts`

未改 public manifests、content catalog、persistence、contracts/types、contracts/ports、版本或 `src/ui/world-map-model.ts`。

## 驗證

執行：

```text
npx vitest run src/render/animation.test.ts src/render/animation-contract.test.ts tests/integration/ruins-c-app.test.ts tests/integration/app-audio.test.ts --exclude '**/.worktrees/**'
```

結果：4 個測試檔、20 個測試通過。`git diff --check` 通過；Git 顯示部分工作檔會在下次觸碰時轉為 CRLF 的提示，沒有 whitespace error。未執行 typecheck、content check、build、全套測試或瀏覽器。

## 下游依賴與未完成

- 素材 owner 仍需提供並登錄實際新資產：司鐘者六套動畫 metadata、守誓旅冠 icon／overlay、內殿三層環境、`boss-ruins` 兩音樂層與 `oath-bell-restored`。本批只新增 required keys，沒有改 public manifest 或偽造 runtime 資產；素材到齊前不能宣稱實際資源載入或畫面通過。
- Integration owner 仍負責統一的最終檢查與獨立候選 build；這些不在本批執行。
