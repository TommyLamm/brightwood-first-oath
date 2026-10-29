# Plan28 W01・名稱回饋 UI 交接

日期：2026-10-28（Asia/Hong_Kong）  
狀態：實作完成，待主代理審閱。

## 已完成

- 在 `src/ui/index.ts` 共用 `validatePlayerName`，建立角色卡在名稱輸入框後方加入唯一的 `brightwood-first-oath-character-name-feedback` 段落。有效名稱顯示正規化後名稱，無效名稱顯示 validator 原訊息；動態文字使用 `textContent`。
- 保留輸入框既有值、`maxLength`、placeholder、autocomplete、focus key 與標籤，新增 `aria-describedby` 和 `aria-invalid`。
- 兩階段畫面都顯示回饋。第一階段取代確認按鈕與分支維持原流程；最終確認依 validator 結果更新 disabled 和錯誤 title。
- 名稱輸入事件就地更新回饋段落、ARIA 狀態與最終確認按鈕，沒有呼叫 `renderScreen`、改寫輸入值或主動移動焦點。最終送出再次驗證；無效時保留建立狀態與草稿且不派送、不移焦，成功派送 `checkedName.value`。
- 保留取消分支與其他 handlers。指定基線 `.playroom/tmp/plan28-integration-review/ui-before.ts` 對照後，差異只涵蓋上述名稱 UI 變更。

## 來源

- `AGENTS.md`
- `plan/28-character-name-feedback.md`
- 主代理本批已完整讀取的 Playroom 範本與七份線上規格
- `.playroom/tmp/plan28-integration-review/ui-before.ts`
- `src/domain/progression/index.ts` 的既有 `validatePlayerName`

## 驗證

- `& 'C:/Users/Tommy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' node_modules/vitest/vitest.mjs run tests/progression.test.ts -t 'validates plain player names and creates the specified starting character'`：exit 0；1 passed、7 skipped（同檔共 8 個案例）。
- `node node_modules/typescript/bin/tsc --noEmit`：exit 0。
- 未新增或執行其他測試、DOM/browser、build 或 package 驗證。

## 尚未實際驗證與下一步

未以真實輸入法確認 composition，亦未實測 caret/selection、按鈕 click/派送、讀屏宣讀、title tooltip 或不同 viewport 的版面。指定 domain 案例與 TypeScript 檢查不涵蓋這些 UI 行為。

下一步由主代理審閱本批局部 diff，確認雙重確認、取消與無效送出 guard 後，再進行 W02 新候選工作。
