# Plan17 B04：基礎體驗 UI 整合

日期：2026-10-28（Asia/Hong_Kong）  
負責：Luna-D  
狀態：source ready；browser 視覺與焦點短段交 Terra

## 讀取依據與適用要求

- 已讀 `AGENTS.md`、`plan/17-base-game-experience.md` §3、B04、§6，以及 `plan/reports/base-experience-focus.md`、`base-experience-interaction.md`、`base-experience-combat-ui.md`。
- 按 Plan17 §6，主代理已完整閱讀 Playroom 模板及七份 main 規格，並下發本包摘要；本局部 UI／效能包不要求子代理重讀八份。沿用既有玩法、canonical ID、desktop 操作、相對資源與 iframe 契約，保持 format 5／保存提示語意，不把本機或預覽狀態說成雲端已保存；不發布。
- 驗收聚焦 snapshot 三欄位、焦點閘門明確恢復與 panel 焦點回復、同 helper 的範圍提示、戰鬥狀態順序，以及六格 quickbar 圖示身份與藥水切換。

## 實作

- `src/contracts/ports.ts` 的 `UiSnapshot` 新增選填 `focusResumeRequired`、`interactionHint`、`combatUi`；`windowFocused` 註解改為說明返回後可能仍需明確恢復。三欄位只存在 UI snapshot，不加入 `SaveData`。
- `src/app/state.ts` 的 `createUiSnapshot` 明確填入三欄位。互動目標用 `gameplay.movement.position` 呼叫 B02 `resolveInteractionTarget`；NPC key/name 為 `npc:<npcId>`／catalog 名稱，portal key/name 為 `portal:<portalId>`／目的地名稱，門檻文案沿用 `portalBlockMessage`。非 playing、有遮擋 panel、恢復閘門、無目標或無 gameplay 時 hint 為 `null`。combat 摘要只對 playing／paused gameplay 推導，其他場景回 `{ actionLockUntilMs: 0, bufferedSkillId: null }`。
- `src/ui/index.ts` 為 paused 與 `playing && focusResumeRequired` 顯示「畫面已安全暫停」恢復卡，Continue 走既有 `togglePause`；save conflict、loading、upgrade、dead、chapter、result 等既有卡片仍優先。卡片不再說點畫布即可恢復。window capture Escape handler 只在事件來自本遊戲 UI／game root 且非文字輸入時阻止 save conflict／upgrade 卡繞過；一般 Escape／對話面板流程保留。
- canvas／panel 焦點只在已 render 的 snapshot 顯示 gate 清除或 paused→playing 後回復。gate 出現或進入 paused 時記住 top panel 的 `data-focus`、文字值與選取範圍、range 值、scrollTop；恢復時先找原有效控制，失效則找該 panel 第一個可用控制／關閉鈕；無 panel 才回 canvas。panel 關閉仍在 gate 時不提前聚焦 canvas。保留既有重綁與對話 key-repeat 防護。
- 互動小行是獨立 `.ms-interaction-hint`，只在 playing、無恢復閘門、無 panel、有目標時顯示；按鍵讀 `DEFAULT_KEY_BINDINGS.interact` 加 save override，NPC 顯示「互動：名稱」、portal 顯示「前往：目的地」，原 blocked message 附在同一行並同步至互動鈕 `title`。它不使用 `aria-live`、不碰 toast，也不聲稱石碑／航標已被 Space 調查。小行置於右側 HUD region，960×540 與窄尺寸皆可換行，footer 保存操作保持可用。
- quickbar 狀態依序呈現不可操作／學習、MP 或技能自身冷卻、有效排隊、玩家動作中、原 rank／MP；有效 buff 剩餘維持優先顯示。新時間向上取至 0.1 秒，paused 使用凍結 game time。action lock／queued 不新增 disabled 條件。gate 期間快捷、拾取、互動、回城按鈕 disabled，Continue 和 save footer 操作保留。
- quickbar 六格使用 `createUi` closure 內的 icon cache；descriptor 包含 asset key、解析後 URL、尺寸、label、class、missing 狀態。相同 descriptor 沿用子節點；manifest URL／尺寸變更、fallback 變更或小藥切到大藥會更新。錯誤 fallback 同 descriptor 穩定保留，不逐 tick 重試；dispose 清 cache。藥水先計算 active item，再一次建立正確圖示，並同步名稱、數量、`data-item-id`、title。

## Terra 使用的穩定 selector 與預期

- 恢復卡：`.ms-screen-card--focus-resume`；繼續鈕：`.ms-screen-card--focus-resume [data-ui-action="toggle-pause"][data-focus="focus-resume"]`。gate true 時看見卡片且世界凍結；明確按鈕後等下一個已 commit snapshot，無 panel 回 canvas，有 panel 回原控制或 panel fallback。
- 互動提示：`.ms-interaction-hint[data-target-key="npc:guide"]` 或 `[data-target-key="portal:camp:east"]`。文字應包含目前互動綁定與目標名；portal 須含原 blocker。離開 64px 範圍、開 panel 或進入 gate 後該行隱藏；互動鈕 title 應一致。
- 快捷格固定定位：`[data-quick-slot="basic"]`、`[data-quick-slot="heavy-strike"]`、`[data-quick-slot="small-red"]` 等六格；圖示節點 `.ms-quick-slot__icon > img, .ms-quick-slot__icon > .ms-interface-icon-fallback`，狀態 `.ms-quick-slot__state`。自然多次 UI tick 應保持相同素材節點身份；小藥用完應檢查同一 `[data-quick-slot="small-red"]` 下圖、label、count、`data-item-id`、title 同步為大藥。
- 另請在 save conflict／upgrade 畫面從 `#game-root canvas` 按一次 Escape，確認不能清恢復 gate／穿透高優先卡；普通 dialogue Escape 仍沿用先關 panel。

## 檢查

Focused snapshot 命令：

```powershell
& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules/vitest/vitest.mjs run tests/base-experience-ui-snapshot.test.ts --exclude '**/.worktrees/**'
```

結果：1 個測試檔、3 個測試通過。涵蓋實際 runtime 位置選 NPC、portal 原門檻、combat action／buffer 摘要、runtime 欄位不進 save，以及無 gameplay／gate 安全預設。其後只改 UI／CSS，沒有改 snapshot 實作或測試，因此未重跑。

整合後 TypeScript 命令：

```powershell
& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules/typescript/bin/tsc --noEmit
```

結果：exit code 0。最初一次 typecheck 指出恢復 fallback 的 `HTMLElement | null`／`undefined` 型別不合；已修正後再執行一次通過。最終 typecheck 在最後 UI／Escape 變更後執行。

未執行 browser、visual、service、build、pack、full test suite、jsdom／happy-dom 或完整假 DOM；這些由 Terra／後續包處理。尚未實際觀察 iframe 下文字選取、range 值、panel scroll 回復、圖示節點身份／error fallback、640×360 佈局及 Escape target 路徑；不得視為 browser 已通過。

## 保留與交接

- 只增改 B04 擁有檔案與本報告；未改 app／keyboard／queue／gameplay／combat／persistence／content／renderer、SaveData、玩法數值、素材、版本、候選包或原玩家資料。沒有 reset dirty、commit、push 或發布。
- Terra 完成上述單次集中短段後回報實際 DOM、畫面、焦點與 Escape 結果；若發現 source 缺陷，先交主代理分析，再由 source owner 限定修復。
