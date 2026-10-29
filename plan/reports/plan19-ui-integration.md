# Plan19 W04・單一 UI 整合

狀態：**UI 接線完成；typecheck 通過；尚未做瀏覽器操作驗收。**

## 讀取與適用要求

- 已讀取 `AGENTS.md`、`plan/19-base-experience-next-batch.md` §3／W04，以及 `plan/reports/plan19-key-bindings.md`、`plan/reports/plan19-trade-preview.md`、`plan/reports/plan19-bag-state.md`。
- 本輪 Playroom template 與其中「開始前讀取線上規格」列出的七份規格，已由主代理在同一任務完成網路讀取。
- 遵循 W04 限定範圍：只接 UI 三 helper、不改舊設定遷移或 gameplay；購買預覽不回寫玩家；背包結構按有序 itemId／長度處理；只局部保護 bag-index 焦點與數量值。

## 實作

### 按鍵

- `getKeyBadgeText` 與共用 `effectiveKeyText` 先呼叫 `resolveEffectiveBindings`，再以 `getEffectiveKeyCodes` 顯示 runtime 真正接收的 code。設定鍵列、技能快捷說明、快捷列、拾取／互動按鈕、低 HP 提示與互動提示共用這個格式；預設攻擊／跳躍顯示「左／右 Ctrl／Alt」，單獨右側鍵只顯示右側鍵。技能說明從 skill1–3 的有效 code 產生。
- `onKeyDown` 將有效映射交給 `findKeyBindingConflict`；衝突提示用 helper 回傳的 action 對應中文名稱。舊存檔只讀取其有效映射，不寫回或遷移。Esc 拒絕、預設重設、pending binding 清理及 focus-resume／save blocker 沿用原有路徑。

### 商店

- `buildShopPanel` 以每張商品卡的有效數量呼叫 `previewBuy`，總價、disabled、title 與可見原因都來自同一份結果；裝備數量為 1，堆疊品維持 1–99。
- `handleAction` 點購買時從當下 `view` 重新 clamp 數量並呼叫同一 helper；只有可購買時才 dispatch 原 buy command，數量使用 `preview.quantity`。完全丟棄預覽的 domain value，不將 preview player 寫回。
- 保留既有數量欄 `input`／`change` 處理，未重構會影響單擊的 panel／blur 生命週期。

### 背包狀態與焦點

- `renderPanel` 在無面板分支及 panel signature 前都先呼叫 `reconcileBagViewState`，以保存的 bag snapshot 與新 bag 對照；snapshot 複製 stack，結構依 helper 的有序 itemId／長度判定。數量變動保留有效選取並夾限出售數量；結構改變清空選取與數量 map，且只有原先有受影響狀態時才顯示「請重新選取物品」。提示放在背包／商店面板內，沿用既有 note 樣式。
- 結構改變時局部清除 `lastPanelFocus`、`panelFocusBeforeResume` 中的 bag-index key／value／selection。若 inventory/shop 的 bag 控制仍聚焦，該次只跳過此面板的 `preserveFocus`，重建後聚焦面板標題（`tabindex=-1`）；若正在 focus-resume gate，則延至既有 `restoreCommittedFocus` 路徑聚焦標題。其他面板及 dialogue 焦點流程不變。
- 同槽物品數量下降時，helper 先夾限 map；若目前出售輸入或焦點快照的數值超過新上限，清除快照中的舊值，並在面板重建前將仍聚焦的輸入值改為夾限值，避免 `preserveFocus` 倒灌超量字串。未受上限影響的輸入草稿照常保留。
- `new-role`、`create-confirm`、`continue`、`return-title`、`use-cloud-version`、進入 loading screen／save status，以及 `dispose` 清除 bag／shop 暫存及 pending binding。一般 render、pause、resume 不清這些狀態；結構／數量仍按 helper 契約 reconciliation。

## 驗證與限制

- 使用 `C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules/typescript/bin/tsc --noEmit`；初次遇到一個 `TS2322` 型別錯誤，修正後重跑，最終結果 **exit code 0**。沒有在通過後再重跑。
- 未重跑三份 helper focused tests；主代理回報其 35 項 focused 測試已通過，且 W01 後續 helper 修正的 5 項也已重跑通過。
- 未執行 browser／DOM focus 與單擊 route、build 或全套 tests；這些互動行為尚未驗收，不宣稱通過。新增理由／提示沿用既有樣式，因此未修改 `src/ui/journal.css`。

## 下一步

由主代理依 Plan19 安排後續 route 驗收；需要確認的互動是重綁衝突中文提示、商店輸入後單擊購買，以及背包槽位結構變更／出售數量下降時的焦點與可見提示。
