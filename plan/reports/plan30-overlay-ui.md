# Plan30 W01・遮罩與面板名稱

日期：2026-10-28（Asia/Hong_Kong）
狀態：W01 source 修改完成，待主代理審閱。

## 來源與適用要求

- 已讀 `AGENTS.md` 與 `plan/30-overlay-control-context.md` 全文，並核對 `.playroom/tmp/plan30-integration-review/ui-before.ts`。
- 依主代理本批交接，主代理已完整閱讀 Playroom 遊戲範本及其中列出的 `game-development`、`command-contracts`、Manifest Schema、release workflow、SDK、`sdk-versioning`、`save-compatibility` 七份線上規格。
- 遵守本工作包：只為三個既有 UI 元素補明確名稱；保留可見文字、既有屬性與 append 順序；不改其他互動、焦點或 modal 行為。

## 實際差異

只修改 `src/ui/index.ts` 的三處：

1. `makeScreenCard` 在既有 `role="dialog"` 與 `aria-modal="true"` 後新增 `card.setAttribute('aria-label', title)`，沿用原標題參數。
2. `renderPanel` 的既有 `closeButton` 新增 `closeButton.setAttribute('aria-label', '關閉' + PANEL_LABELS[panel])`，沿用目前 panel 標籤。
3. `renderKeyGuide` 將既有「✕ 收起」按鈕提取為局部 `closeButton`，新增 `aria-label="✕ 收起：操作按鍵提示"`，並在原 header append 次序中仍排於標題之後。

與指定 baseline 比對，diff 僅包含上述三處；沒有其他屬性、元素、helper、CSS、handler、focus 或 append 順序政策變更。

## 驗證與限制

- 唯一執行的程式檢查：
  `C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules/typescript/bin/tsc --noEmit`
  結果：exit code `0`。
- `git diff --no-index -- .playroom/tmp/plan30-integration-review/ui-before.ts src/ui/index.ts` 顯示限定的三處差異；exit code `1` 是因兩檔存在預期差異。
- 未執行 tests、DOM/browser、讀屏、click、keyboard、focus、layout、截圖、build、pack、server、git write、發布或排程；因此這些行為尚未驗證。

## 下一步

請主代理審閱三處 source diff。W01 審閱完成後，再由指定的新 Luna 執行 W02 新候選工作包。
