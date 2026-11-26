# Brightwood 程式碼審查

2026-11-20 · `brightwood-first-oath` · `1.0.0-beta.89` · `main@6d9021b`

優先修正雲端舊檔升級重試、衝突畫面仍推進遊戲時間，以及發布流程未執行既有內容檢查。三項都有現成的處理函式或指令可沿用，修正範圍可獨立控制。

## 審查範圍

從 `index.html → main.ts → GameApp / Phaser scenes` 盤點 107 個非測試 TypeScript 模組及 93 個測試檔的位置。沿正式呼叫路徑檢視輸入與固定步進、戰鬥與成長、任務及世界資料、角色管理、介面、繪圖與音效、存檔及 SDK、內容工具與 Release workflow。針對各疑點閱讀最接近的測試。相依套件僅核對專案實際使用的 Phaser 3.90.0 相機方法。

已讀 Playroom 開發範本及其指定的開發標準、操作契約、Manifest、Release workflow、SDK、版本指引與存檔相容性文件。本版宣告桌面操作、讀格式 1–9、寫格式 9。與本次發現直接相關的要求包括同一快照沿用 requestId、衝突後重新讀取，以及將預覽結果與正式保存分開顯示。[開發標準](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/game-development.md) · [SDK 版本與重試契約](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/sdk-versioning.md)

## 排序

維護成本指保留現況後，每次改動需同步核對的範圍。修正風險指採用下方最小改法時，影響既有玩法或資料的可能性。

| 順序 | 問題 | 嚴重度 | 維護成本 | 修正風險 |
|---|---|---|---|---|
| 1 | 雲端升級逾時後，主按鈕建立額外待寫快照 | 高 | 中 | 低 |
| 2 | 雲端衝突視窗顯示時，戰鬥仍在推進 | 高 | 中 | 低 |
| 3 | 發布流程可跳過遊戲啟動必須通過的內容檢查 | 中 | 中 | 低 |
| 4 | 相機每幀兩次開始追蹤並改寫捲動位置 | 中 | 中 | 中 |
| 5 | 戰鬥中序列化完整角色列表，兩處重建全任務視圖 | 中 | 高 | 低至中 |
| 6 | 預覽舊檔模擬升級完成後，畫面仍要求升級 | 中 | 中 | 低 |
| 7 | 首領及可學技能名單有多個維護位置 | 中 | 高 | 低 |
| 8 | 舊角色長名稱無法在管理畫面輸入完整確認 | 中，限特定存檔 | 低 | 低 |
| 9 | 過期的背景音樂下載仍能留在解碼快取 | 中，限切換時序 | 低 | 低 |
| 10 | 已無讀取方的狀態與重複賦值 | 低 | 低 | 低 |

## 發現與最小修正

### 1. 雲端升級重試會多送一筆寫入

升級請求逾時後，存檔層保留原快照與 requestId。升級卡的主按鈕再次派送 `confirmSaveUpgrade`，這條路徑另建 `pending` 並清除重試旗標。記憶體重現中，第二次按確認仍停在 `saveError`，只有第一次請求。接著呼叫畫面底部所用的 `retry()`，總計送出三次，前兩次沿用同一 ID，第三次用新 ID 再寫相同資料。平台可因此多增加一次 revision。[升級卡主按鈕](../../src/ui/index.ts#L1234) · [建立待寫資料](../../src/persistence/index.ts#L1006) · [重試原請求](../../src/persistence/index.ts#L1035)

在已有升級嘗試且狀態為 `saveError` 時，把確認動作交給既有 `retry()`。驗收應模擬伺服器已保存而回應遺失，核對兩次送出的資料、revision、requestId 完全一致，成功後佇列為空。

### 2. 雲端衝突視窗未暫停世界

角色在戰鬥中遇到 revision 衝突時，UI 會蓋上只能載入雲端版本的視窗。固定步進的凍結判斷只包含 `localConflict`。同一份 `playing` 狀態代入 `worldIsFrozen`，本機衝突回傳 true，雲端衝突回傳 false。等待選擇期間，怪物和傷害判定仍可繼續執行。既有整合案例在收到衝突後直接重新載入，跳過了等待期間。[衝突畫面](../../src/ui/index.ts#L1173) · [凍結判斷](../../src/app/state.ts#L113) · [既有案例](../../tests/integration/app-persistence.test.ts#L170)

將兩種衝突納入同一個凍結條件。驗收時在衝突後推進一個非零時間步，確認遊戲時間和角色 HP 維持原值，並確認「載入雲端版本」仍可操作。

### 3. Release 沒有執行啟動時的內容驗證

發布工作只執行 `npm ci`、Vite build 和平台打包／ZIP 驗證。遊戲啟動時才調用 `validateRules`、`validateWorld`。例如任務引用不存在的物品，仍能成為合法的 TypeScript 字串和可打包的靜態檔案，直到開啟遊戲才被拒絕。專案已有對應 CLI。[發布步驟](../../.github/workflows/release.yml#L35) · [啟動驗證](../../src/app/catalog.ts#L7) · [內容檢查指令](../../package.json#L12)

在現有 workflow 的 build 前執行 `npm run typecheck` 和 `npm run check:content`。沿用既有非零退出碼即可中止發布。

### 4. 鏡頭追蹤每幀重新開始

一次 `drawSnapshot` 先以預設插值呼叫 `startFollow`，結尾又以 0.12 呼叫一次，並重設 200 × 120 的追蹤死區。鎖定版本的 Phaser 每次 `startFollow` 都直接重設 `midPoint`、`scrollX`、`scrollY`。因此即使只保留第二個逐幀呼叫，設定好的平滑跟隨仍會每幀被重新定位。場景還會每幀執行 `resize`，即使畫布尺寸相同。[第一次追蹤](../../src/render/index.ts#L1155) · [第二次追蹤](../../src/render/index.ts#L1499) · [逐幀 resize](../../src/app/scenes.ts#L152) · [Phaser 3.90.0 實作](https://github.com/phaserjs/phaser/blob/v3.90.0/src/cameras/2d/Camera.js#L682-L718)

在更換地圖或追蹤目標時設定 bounds、死區和跟隨；尺寸改變時才更新 viewport。保留轉圖後首次定位與視差更新。這項會改變鏡頭手感，修正時值得實際檢查地圖兩端、跳躍和轉圖首幀。

### 5. 每次模擬更新都處理與當下畫面無關的資料

`renderScreen` 在判斷畫面是否需要重建前，先把包含整個 `profile` 的物件做 `JSON.stringify`。一般遊玩每個固定步進都會走到此處，包含未出場角色、倉庫與已刪角色備份。另一方面，DOM 介面的 `createUiSnapshot` 和 Phaser 的 `makeWorldSnapshot` 都會遍歷全部任務，呼叫同一個 `getQuestView`。這些路徑即使玩家原地待機也會執行。[UI 通知入口](../../src/main.ts#L33) · [整份角色資料序列化](../../src/ui/index.ts#L1140) · [UI 任務視圖](../../src/app/state.ts#L124) · [世界任務視圖](../../src/app/gameplay.ts#L591)

先讓只有標題／角色管理畫面需要的 profile 比對只在相應畫面執行，保留衝突、載圖、升級等覆蓋層的狀態更新。若仍需改善幀耗，再共用同一份遊戲狀態衍生的任務視圖。本輪確認重複運算的路徑；實際幀耗與效益尚未量測。

### 6. 預覽模擬升級沒有完成畫面流程

若診斷預覽讀到舊格式，確認升級後 SDK 會回傳 null。遊戲重新讀取 revision 並發出 `previewOnly`，但持久層及 App 都只在正式雲端或本機成功時清除各自的 `saveUpgrade`。畫面優先顯示升級卡，選角也會拒絕有 `saveUpgrade` 的狀態。記憶體預覽連線已回讀格式 9、狀態已達 `previewOnly`；卡片仍受到上述條件限制。一般從空白開始的預覽不會進入這條路徑。[預覽回讀](../../src/persistence/index.ts#L862) · [App 完成條件](../../src/app/app.ts#L458) · [升級卡條件](../../src/ui/index.ts#L1221)

回讀時確認確實拿到預期格式及有效 revision，再通知 App 模擬升級完成並解除卡片。畫面應繼續顯示「預覽暫存」。

### 7. 新首領與新技能需要同步修改多份名單

同一組四個首領 ID 在玩法、聲音、渲染各有一個 Set，世界驗證器再用連串比較列一次。如果新增首領時只改玩法，它會有首領獎勵與抗控效果，血條及戰鬥音樂卻仍按普通怪物處理。職業的 `learnableSkills` 也另抄成 `playerLearnableIds`；成長與存檔驗證使用後者，技能面板則從技能表依職業篩選。新增或改名時，可能產生介面可見、學習或讀檔卻被拒絕的技能。[玩法](../../src/app/gameplay.ts#L38) · [聲音](../../src/app/app.ts#L71) · [渲染](../../src/render/index.ts#L143) · [世界驗證](../../src/content/world/validate.ts#L273) · [職業定義](../../src/content/rules/jobs.ts#L15) · [技能名單](../../src/content/rules/skills.ts#L210) · [學習檢查](../../src/domain/progression/index.ts#L517)

這兩項可各自提交。首領先共用現有四個 ID 與判斷函式；可學技能從現有職業定義衍生，保留現有匯出及每職業五個技能的內容驗收。

### 8. 舊角色的完整名稱可能超出確認欄上限

存檔讀取接受超過 16 字元的既有名稱，專案的有效存檔 fixture 實際使用 24 字元。角色管理把「新名稱」及「刪除／永久清除確認」輸入欄共用同一個 16 字元上限，而刪除指令要求確認值與保存名稱完全相同。玩家無法直接輸入所需值；現役角色須先改名才能刪除。[現有 fixture](../../tests/fixtures/full-character-profile.ts#L23) · [讀檔條件](../../src/persistence/validate.ts#L163) · [輸入欄](../../src/ui/roster-manager.ts#L18) · [完整名稱比對](../../src/persistence/profile-actions.ts#L30)

保留新名稱的 16 字元上限，讓確認欄可輸入既有名稱的完整長度，繼續要求精確相符。

### 9. 已切走的音樂仍可留在解碼快取

切換曲目時，先前的非同步解碼仍會把成功結果放進 `decoded`。若新曲目已經開始並完成快取清理，舊曲目才解碼完成，`startDesiredMusic` 會因目標已變而直接返回。舊圖層的 PCM 因此可能保留至下一次音樂清理。這個時序影響記憶體；未量測實機峰值。[寫入快取](../../src/audio/audio-controller.ts#L194) · [過期曲目判斷](../../src/audio/audio-controller.ts#L270) · [既有清理函式](../../src/audio/audio-controller.ts#L215)

在辨認出過期下載後，沿用 `evictMusic()` 釋放既非播放中、也非目前目標的圖層。驗收用兩首曲目的解碼以相反順序完成，並保留淡出中的曲目。

### 10. 可順手移除的冗餘

`lastUnavailableCommand` 僅有型別宣告與初始 null，正式入口、測試及工具均無讀寫者。`completeMapTransition` 已在建立物件時設 `bossResult: false`，且整個成功分支的 screen 都是 `playing`，末尾仍依重試／復活條件重設同一值。可隨相關改動清掉這些欄位和分支。[未使用狀態](../../src/app/state.ts#L43) · [轉圖成功回傳](../../src/app/gameplay.ts#L1131)

## 本輪驗證

- TypeScript 在專案現有 strict 與 unused 設定下無診斷。使用的本機 Node 為 24.19.0，低於專案發布要求的 24.22.1。
- 以記憶體 CloudPort 驗證格式 8 升級的逾時、再次確認、一般重試及預覽回讀，並比對本機／雲端衝突的凍結判斷。未連接正式帳號。
- 以既有高進度 fixture 擴為六個角色及一份刪除備份。使用 fixture 的最長按鍵設定時為 51,336 UTF-8 bytes，使用預設綁定時為 26,633 bytes。此樣本未超出 64 KiB。
- 本輪為審查，僅新增這份報告。未執行全套測試、瀏覽器實玩、幀率或記憶體量測、正式 build、打包及發布驗收。
