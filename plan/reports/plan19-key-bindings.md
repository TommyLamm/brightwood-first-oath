# Plan19 W01・鍵位映射與衝突 helper

狀態：**完成**。本包只改鍵位 helper 與其 focused 測試，未改 UI、存檔、設定 schema 或預設鍵。

## 實作

- `resolveEffectiveBindings(overrides?: KeyBindings): EffectiveKeyBindings` 集中套用預設值、合法 `KeyboardEvent.code` 篩選與既有逐 action exact duplicate 優先序。`KeyboardInputState.setBindings` 現在使用此 helper。
- `getEffectiveKeyCodes(action, effective)` 回傳 action 在 runtime 使用的 code：一般 action 依實際解析結果（含單向 alias）過濾，四種 movement action 則回傳 `isHeld` 直接讀取的綁定碼。預設普攻回傳 `ControlLeft`、`ControlRight`，預設跳躍回傳 `AltLeft`、`AltRight`；只綁右側時只回傳右側。被 alias 遮蔽的 command action 不會誤報為實際接收該鍵。
- `findKeyBindingConflict(effective, action, candidateCode)` 回傳 `KeyBindingConflict | null`；衝突包含被候選 action 的 alias 佔用之其他 action，並檢查其他 action 的直接鍵位，即使舊 alias 當前遮住該鍵也不會允許奪用。相同 action 不與自己衝突。回傳 `{ action, code }`，`action` 供 UI 對應中文名稱；多個衝突時依預設 action 順序回傳第一個。
- `EffectiveKeyBindings` 是 `resolveEffectiveBindings` 的輸出型別；W04 應先從目前 saved overrides 呼叫 resolver，再把同一份有效映射傳給兩個讀取 helper。Esc 的 UI 禁止規則仍留在既有 UI。

保留 attack `ControlLeft → ControlRight`、jump `AltLeft → AltRight` 的單向 alias；右側單鍵不新增左側。resolver 沒有寫回存檔，也不作自動修復。

## 驗收

測試涵蓋原 defaults、無效 override、精確重複的舊解析優先序、普攻／跳躍 alias code、alias 衝突正反向、右側鍵位釋放後可用、同 action 使用右側 alias、右側單鍵不增加左側，以及 `KeyboardInputState` 對新鍵的普攻／移動／跳躍實際輸入、原方向鍵與文字輸入行為。

執行：

```text
& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules/vitest/vitest.mjs run tests/key-bindings.test.ts tests/integration/app-foundation.test.ts --maxWorkers=2
```

原 W01 實作結果：**2 個測試檔、17 項測試通過**。未執行全套測試、typecheck、browser 或 UI 整合；W04 接線與 Esc 提示仍待後續工作包驗收。

## 主代理審查修正（2026-10-28）

審查發現舊 override `moveLeft: ControlRight` 仍會被 runtime 保留為移動綁定：`keyDown` 會先把 code 加入 `heldCodes`，普攻 alias 同時派送 attack；`consumeMovementFrame` 則透過 `isHeld('moveLeft')` 直接讀該 code。因此 helper 若以 `actionForCode` 過濾 movement code，回傳空集合會錯誤地描述舊設定實際行為。

`getEffectiveKeyCodes` 現對 `moveLeft`、`moveRight`、`climbUp`、`climbDown` 回傳各自直接讀取的 binding code；其餘 action 仍依 `actionForCode` 與既有 alias 優先序過濾。未改 runtime、設定遷移或 API。測試現在核對此 legacy mapping 回傳 `ControlRight`，並用實際 `KeyboardInputState` 證明同一次 `keyDown('ControlRight')` 仍派送普攻且 movement frame 為 `moveX: -1`。

本次只執行指定 focused 檔：

```text
& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules/vitest/vitest.mjs run tests/key-bindings.test.ts --maxWorkers=2
```

結果：**1 個測試檔、5 項測試通過**。未重跑 foundation 測試（本次未改 runtime）及其他檢查。
