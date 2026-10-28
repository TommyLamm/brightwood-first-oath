# Plan17 修復：存檔高優先卡保護失焦恢復

日期：2026-10-28（香港時間）  
狀態：**SOURCE_FIX_VERIFIED；已封裝至 beta22**

## 開工依據

- 已讀根目錄 `AGENTS.md`、Plan17 §3.1／§6，以及 [Plan17 B01 焦點報告](base-experience-focus.md)、[B04 UI 整合報告](base-experience-ui-integration.md) 和 [beta21 候選報告](base-experience-candidate.md)。CodeGraph 目錄不存在。
- 開工前透過 Web 完整讀取 `game-agent-template.md`；另按 Plan17 B05 範圍讀取 `game-development.md` 建置／交付、`game.schema.json`、`game-release.yml` 及 `sdk-versioning.md` 工具／Node 原文，時間為 2026-10-28 HKT。
- 本次契約要求 `togglePause` 在存檔衝突或格式升級卡存在時不可清除恢復閘門，限制要在 app command 層套用於所有來源。驗收為重綁 Escape 的 `KeyP` 命令無法繞過 conflict／upgrade；一般 resume／manual pause 與既有 panel 先關行為保留。

## 根因與修正

`src/ui/index.ts` 的既有 Escape capture 檢查實體 `event.code === 'Escape'`。`KeyboardInputState` 允許將 `escape` action 重綁為 `KeyP`，並會為無 panel 狀態產生 `togglePause`。`src/app/state.ts` 的 `appCommand` 原先只檢查 window focus 與 screen，因此重綁鍵或直接命令可以在 conflict／upgrade 卡出現時清除 `focusResumeRequired`。

在 `appCommand` 的 `togglePause` 路徑增加核心守門：window 未聚焦、screen 不在 playing／paused、`saveStatus === 'conflict'` 或 `saveUpgrade` 非 null／undefined 時均回傳 `handled: true` 及同一個 state 物件。這保留 loading 等畫面限制，沒有加入 save loading／error 等狀態。`saveUpgrade` 判斷接受舊 fixture 省略欄位的 undefined 情況。UI capture、keyboard、queue、panel 命令及 `createUiSnapshot` 均未修改。

## 聚焦驗收

在既有 `startedApp` 實際 GameAppState fixture 上新增一個 integration case：

- `KeyboardInputState.rebind('escape', 'KeyP')` 後，`keyDown('KeyP')` 產生 `togglePause`。
- gate=true 時涵蓋 playing／paused × save conflict／save upgrade 四種組合，確認 command handled、state／panel／gameplay 參照與 blocker 值不變。
- 無 blocker 時，playing 與 paused 的同一命令仍清 gate 並回到 playing；一般 manual pause／resume 繼續切換。
- `saveUpgrade` 欄位缺席的舊 fixture 仍可安全恢復。

執行一次指定 focused 檔：

```powershell
& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules/vitest/vitest.mjs run tests/integration/app-focus-resume.test.ts --exclude '**/.worktrees/**'
```

結果：1 個檔案、**6/6 tests 通過**。其後執行一次 bundled Node TypeScript 檢查：

```powershell
& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules/typescript/bin/tsc --noEmit
```

結果：exit code 0。沒有重跑其他 focused 檔、內容檢查或 full suite；沒有瀏覽器／視覺／真實存檔驗收。

## 範圍與後續

程式修正限 `src/app/state.ts` 的 `appCommand` guard 和 `tests/integration/app-focus-resume.test.ts` 新 case。候選另同步三個版本欄位並位於 [beta22 候選](../../artifacts/base-experience-1.0.0-beta.22/)；封裝細節及 hashes 見 [候選修正版報告](base-experience-candidate-fix.md)。

Terra 的 browser route 仍使用 beta21。beta21 對未變 UI 的證據可沿用；beta22 的新 guard 未由完整 browser route 實測。沒有建立 tag／Release、push 或平台上架。
