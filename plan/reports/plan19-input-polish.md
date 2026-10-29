# Plan19 輸入事件修整

日期：2026-10-28（Asia/Hong_Kong）

## 來源與適用要求

- 已讀取 `AGENTS.md`、`plan/reports/plan19-handoff.md`、`plan/reports/plan19-ui-integration.md`、`plan/reports/plan19-trade-preview.md`、`plan/reports/plan19-key-bindings.md`，以及 `src/ui/index.ts` 的 `onInput`、`onChange`、`onKeyDown`、`clampInteger` 與 `preserveFocus` 路徑。
- 主代理已在本輪完整讀取 Playroom template 與其列出的七份主規格：game-development、command-contracts、game.schema、game-release workflow、playroom-sdk、sdk-versioning、save-compatibility。沿用既有 SDK 1.1.0／protocol 1／schema 2 要求。
- 依 W04 現有 UI 契約，只把有效交易數量寫入 UI 草稿 map，使用相同的 clamp 規則供總價、預覽與後續 change／click 使用；不改交易 domain 或命令。重綁按鍵仍沿用原 Esc、有效鍵、衝突及成功派送流程。

## 修正

- 交易數量 `onInput` 移除「非整數或小於 1 就略過」分支。商店仍 clamp 到 1–99，出售仍 clamp 到當前堆疊數量；共用 `clampInteger` 將空白、0、負值、非有限值收斂到下限，小數向下取整，超上限收斂到上限。
- 每次數量輸入仍更新對應 map 並呼叫原 `renderPanel(currentView)`。既有 `preserveFocus` 保留當前輸入草稿及游標；後續 `change` 算得同值時只正規化 `target.value`，不替換 DOM。因此空白等舊路徑曾略過的輸入，不再讓 blur 分支因 map 不同而重建面板、吞掉緊接的購買／出售點擊。
- pending binding 的 `onKeyDown` 在原 `preventDefault`／`stopPropagation` 後忽略 `event.repeat`。首次按鍵仍走原有處理，Esc 規則和成功派送不變；長按不重複更新提示或重繪面板。

## 驗收與限制

- 靜態核對 `clampInteger`：有限值先夾在上下限，再 `Math.floor`；非有限值回到下限。核對 `onInput` 交易分支現在對有效、空白、0／負數、小數、非有限值及超上限均更新同一 map，出售上限取當前堆疊數量；`onChange` 未改，map 同值分支仍只更新輸入值。
- 靜態核對數量輸入沿用 `preserveFocus` 的值／焦點回復及 `onInput` 原 render 路徑；未在此聲稱已實際測過瀏覽器 click 時序。
- 靜態核對重綁鍵盤事件在重複事件 guard 前已取消預設行為並停止傳播，repeat 分支在設定 `code`、產生提示或派送之前返回。Esc 與非 repeat 成功路徑未改。
- 執行一次 bundled Node TypeScript `tsc --noEmit`，exit code 0。未執行測試、build 或 browser／DOM 操作驗收。
