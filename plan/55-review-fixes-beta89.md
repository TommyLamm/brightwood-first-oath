# Plan55・beta.89 審查修復計畫

**狀態：PLAN_READY／尚未實作。** 2026-11-07，Asia/Hong_Kong。使用者要求先驗證審查計畫，驗證後寫入此檔並開分支，壓縮上下文後才開始。

- 基準：`brightwood-first-oath / 1.0.0-beta.89`，commit `1e518f8`。下文行號都以此 commit 為準，實作時先重新定位。
- 分支：`fix/beta89-review-fixes`，從 `1e518f8` 開出。`origin/fix/background-jitter` 也在此 commit；本機 `main` 落後 32 個 commit，不含多職業內容，所以不從 `main` 開。
- 工作區：`AGENTS.md` 有使用者本人未提交的改動，不要還原，也不要混進修復 commit。一律用 `git add <檔案>`，不用 `git add -A`。
- 範圍：存檔格式維持 9（讀 1–9／寫 9）。不發布、不改版本號、不推送、不開 PR，除非使用者另外要求。commit 同樣等使用者同意；同意後每項各自一個 commit。

## 開始前

依 `AGENTS.md`，開工前要完整讀完以下文件，再簡列已讀文件、適用要求與驗收項目，然後直接繼續。上一輪驗證只下載並查了相關段落，**不算完整閱讀**。

1. [開發範本](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md)
2. [開發與發布標準](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/game-development.md)
3. [操作與錯誤契約](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/command-contracts.md)
4. [Manifest schema](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game.schema.json)
5. [發布 workflow 範本](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-release.yml)
6. [SDK](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/examples/starter/playroom-sdk.js)（內容與 [`public/vendor/playroom-sdk.js`](../public/vendor/playroom-sdk.js) 相同）
7. [SDK 版本規格](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/sdk-versioning.md)
8. [存檔相容規格](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/save-compatibility.md)

`WebFetch` 只回摘要，要全文請用 `curl` 下載到暫存目錄再讀。專案沒有 `.codegraph/`，用 `rg`。

## 已驗證的事實

| # | 問題 | 重現結果（`1e518f8`） | 原型修正後 |
|---|---|---|---|
| 2 | 舊分頁覆寫新進度 | B 存 `Newer` 和倉庫 1 格後，A 寫回 `Stale` 和倉庫 0 格，`flush` 回傳 `true` | A 的 `flush` 回傳 `false`，保留 `Newer` |
| 1 | 清理壞檔移除有效主檔 | 兩頁都在壞檔畫面，B 清理並建立 `NewHero`，A 再確認：主檔消失，`NewHero` 移入備份，原損毀備份被覆蓋 | A 清理回傳 `false`，主檔和備份都不變 |
| 3 | SDK 失敗後無法重試 | 兩次 `ready()` 都失敗，載入器只跑 1 次 | 第二次成功，載入器跑 2 次 |
| 4 | 預覽保存 | 第二次保存（排隊或之後）：排隊的被丟棄；之後的送 revision 0，得到 `SAVE_REVISION_CONFLICT` | 依序送 revision 0、1，都成功 |
| 5 | 訓練靶特效無上限 | 90 次命中保留 90 筆 | 保留 80 筆 |
| 6 | 舊 UI 無呼叫端 | 只有定義、再匯出和歷史文件 | `root-ui.ts` 437 → 61 行，型別檢查通過 |
| 7 | 每步重建 UI 資料 | 每步 2.00 次通知；單角色劍士佔一幀約 0.2%；弓手任務視圖 0.147 ms／次（劍士 0.009 ms），約佔一幀 1.8% | 未做原型 |
| 8 | 規則來源分散 | 訊息寫 34 件／20 技能，實際 52／46（[`validate.ts:62`](../src/content/rules/validate.ts:62)–63）；32 格和金幣上限目前各處一致 | 未做原型 |

第 1–6 項的邏輯原型（不含 UI）下，既有 616 個測試全過，型別檢查和 `vite build` 也通過。原型已刪除，只是可行性證據，而且它的清理邏輯是**有缺陷的原始寫法**，不要照抄，以本文的設計為準。

已否定的疑慮：瀏覽器不會快取失敗的 `import()`。Chrome 156 無頭實測，503 和斷線後重試都會重新抓取，第 3 項不需要加查詢字串。

## 批次一：本機存檔（先第 2 項，再第 1 項）

### 第 2 項：舊分頁不可覆寫新進度

修改 [`src/persistence/index.ts`](../src/persistence/index.ts)：

- `Runtime` 新增 `knownRaw: string | null`，記錄本頁最後一次讀到或寫入的原始字串。
- 更新時機：`localOutcome` 讀取後（:293 之後）、舊版匯入寫入後（:569）、`writeLocal` 成功後（:658）、`upgradeLocal` 成功後（:731）、清理移除後（:1024，設為 `null`）。
- `writeLocal` 的檢查放在現有驗證鏈（:612–649）**之後**、組 envelope 之前，這樣既有 `incompatible` 訊息的測試不受影響：

```ts
if (previousRaw !== runtime.knownRaw) {
  runtime.mode = 'memory';
  runtime.initialized = false;
  stopWrites();
  setStatus('localConflict', '另一個分頁已更新本機進度；這裡未保存的變更不會寫入，請重新載入。');
  return;
}
```

**新增狀態 `localConflict`。** 不能沿用現有狀態：`incompatible` 只在[標題畫面](../src/ui/index.ts:1283)有提示，[遊玩中頁尾也不顯示](../src/ui/index.ts:1463)；`conflict` 的文案和按鈕都指向雲端。

| 位置 | 改動 |
|---|---|
| [`contracts/ports.ts:73`](../src/contracts/ports.ts:73) | `SaveStatus` 加 `localConflict` |
| [`persistence/index.ts`](../src/persistence/index.ts) :240、:773、:945 | `settleFlush` 視為失敗、`pump` 停止、拒絕確認升級 |
| [`app/app.ts:877`](../src/app/app.ts:877) | `retryPersistence` 改走 `reloadPersistence` |
| [`app/app.ts:617`](../src/app/app.ts:617) | `returnTitle` 比照 `conflict`，提示先重新載入 |
| [`app/state.ts:92`](../src/app/state.ts:92) | 暫停鍵比照 `conflict` |
| [`ui/index.ts`](../src/ui/index.ts) :347 | `statusLabel` 新文字 |
| [`ui/index.ts`](../src/ui/index.ts) :1171 | 全畫面卡片：標題「本機進度已在其他分頁更新」，說明本頁未保存的變更會放棄，按鈕「重新載入本機進度」用既有 `retry-save` |
| [`ui/index.ts`](../src/ui/index.ts) :1463、:1478 | 頁尾顯示和按鈕 |
| [`ui/index.ts`](../src/ui/index.ts) :2253、:2422 | 焦點與鍵盤鎖比照 `conflict` |
| [`ui/roster-manager.ts:11`](../src/ui/roster-manager.ts:11) | 角色管理比照 `conflict` 停用 |

同時核對 `returnToCharacterList` 和切換角色流程，在 `flush()` 回傳 `false` 時不會卡在 `characterBusy`。不自動合併角色，也不導向「載入雲端版本」。`localStorage` 沒有跨分頁原子交易，不要宣稱解決了所有同時寫入。

### 第 1 項：清理綁定玩家確認時的內容

- `Runtime` 新增 `unreadableRaw`，在 :345 記錄，在 `unreadableLocal` 歸零處一併清除。
- `discardUnreadableLocalSave`（:1018）：目前內容與 `unreadableRaw` 不同就回傳 `false`，主檔不動。
- **備份不可因鍵被佔用而拒絕清理**，否則曾清理過的玩家下次存檔再壞就永遠清不掉（已實測：重試都是 `loadError`，清理都回傳 `false`）。規則：
  1. 第一份用現有的 `${key}:unreadable-backup`，保持既有測試（`tests/persistence.test.ts:65`）成立。
  2. 內容相同就沿用；內容不同就依序用 `:unreadable-backup:2`、`:3`…直到空位或內容相同。
  3. 寫入後讀回核對，成功才移除主檔。寫入拋錯（如配額不足）或讀回不符時回傳 `false`，主檔不動。
- 移除主檔後 `knownRaw = null`。

### 批次一驗收

新增於 `tests/persistence.test.ts`，兩個實例共用記憶體儲存：

- 舊頁後寫被拒，角色和倉庫都保留；重新載入後讀到最新內容，可繼續保存。
- 單頁連續保存、格式升級後首存、舊版匯入後首存、首次建檔都不受影響。
- 兩個頁面都從無存檔開始時，後寫者被拒。
- 第 1 項：兩頁路徑、主檔被外部修復、已有不同備份（清理成功且兩份都在）、相同內容備份、寫入拋錯、讀回不符。
- 既有格式 1–9 載入與明確升級的行為不變。

`createUi` 目前沒有 DOM 測試環境（vitest 跑在 node，也沒有測試匯入它），所以卡片要另外驗：

- 用 `GameApp` 整合測試驗證 `localConflict` 下的狀態、暫停、返回標題和重新載入。
- 批次結束時做一次無頭瀏覽器實測（`headless: true`）：同一 context 開兩頁，舊頁操作後要看到卡片，按重新載入後讀到新進度，並留一張截圖。

## 批次二：平台

### 第 3 項：SDK 重試

[`src/platform/playroom-port.ts:46`](../src/platform/playroom-port.ts:46)：成功和進行中的載入繼續共用，失敗才釋放。

```ts
const sdk = (): Promise<PlayroomProgressSdk> => {
  if (!sdkPromise) {
    const attempt: Promise<PlayroomProgressSdk> = loadSdk().catch((error: unknown) => {
      if (sdkPromise === attempt) sdkPromise = null;
      throw error;
    });
    sdkPromise = attempt;
  }
  return sdkPromise;
};
```

驗收（`src/platform/playroom-port.test.ts`）：首次失敗後第二次成功；並行呼叫共用一次載入；成功後不重複載入（既有 :25 測試維持）。

### 第 4 項：預覽保存

[平台預覽端](https://github.com/TommyLamm/playroom-platform/blob/main/client/game-bridge/preview.ts)會檢查 revision 並在每次保存加 1，但 [SDK](../public/vendor/playroom-sdk.js) 在預覽模式把回傳值換成 `null`，遊戲拿不到新值。所以**每次收到 `null` 都要重讀**，不是「需要時才重讀」。

[`src/persistence/index.ts:864`](../src/persistence/index.ts:864) 的 `saved === null` 分支，`preview` 模式改為：

- 清 `retryAttempt`，**保留 `pending`**，維持 `busy = true`。
- 呼叫 `options.cloud.loadProgress()`；revision 有效就更新 `runtime.revision`。
- 成功後 `busy = false`，設 `previewOnly`，再 `pump()`。
- 失敗走 `handleCloudFailure`，同樣檢查 `generation`。

非預覽的 `null` 分支不變；沒有 `saved:true` 仍不可顯示已保存。

驗收（`tests/persistence.test.ts`）：**模擬必須照平台邏輯檢查 revision**，只回 `null` 的模擬測不到這個問題。

- 之後的第二筆、排隊的第二筆都成功送出最新資料，revision 依序遞增。
- 狀態不出現 `saved` 或 `conflict`；重讀失敗有明確狀態；`flush` 等到最新一筆才完成。

真實平台預覽需要管理員操作，本機無法驗證，要在交接標明。

## 批次三：兩個獨立小改動

### 第 5 項：特效上限（建議嚴重度：低）

下一個一般特效本來就會[裁回 80 筆](../src/app/gameplay.ts:1427)，只有持續只射靶時才增長。

- [`gameplay.ts`](../src/app/gameplay.ts) 抽出有上限的共用加入函式，用於 :416、:420、:1418；常數取代魔術數字 80。
- 訓練靶的 `projectile`、`magic` 在加入前就設好。核對 :421、:469–470 用「最後一筆」設標記的寫法仍然正確。
- [`render/index.ts:1294`](../src/render/index.ts:1294) 處理完後，移除不在目前快照內的已播放 ID。邏輯抽成 [`render/animation.ts`](../src/render/animation.ts) 的純函式，在 `animation.test.ts` 測試。

驗收：連射超過 80 次只保留最近 80 筆，標記與位置保留，同一命中不重播。

### 第 6 項：刪除舊 UI

- 刪除 [`createAppUi`](../src/app/root-ui.ts:51) 和專屬 helpers，只留 `RootStatusView` 和 `createRootStatusView`，並更新已過時的註解（:384）。
- [`app/index.ts`](../src/app/index.ts) 移除 `createAppUi`、`AppUiController` 的再匯出。
- 歷史報告中的提及保留不改。

驗收：型別檢查（`noUnusedLocals` 已開）、全套測試、`npm run build`。

## 批次四：收斂與量測

### 第 8 項：統一上限

動手前重新搜尋，上一輪的搜尋結果有截斷。

- 背包 32：[`progression:17`](../src/domain/progression/index.ts:17)、[`validate:18`](../src/persistence/validate.ts:18)、[`profile-actions:67`](../src/persistence/profile-actions.ts:67)、[`roster-manager:35`](../src/ui/roster-manager.ts:35)、[`ui/index.ts`](../src/ui/index.ts) :2214、:2215、:2795、:2829–2831、:3147、:3285–3286。
- 金幣 9,999,999：`progression:18`、`validate:19`。
- 常數放在 domain 和 persistence 都已依賴的 `src/contracts`，數值不變。
- [`validate.ts`](../src/content/rules/validate.ts) :61–64 的數字改由 `approved*` 清單長度產生。保留獨立的核准清單，才能偵測漏項。

### 第 7 項：先量測，再決定是否修改

這是**決策關卡**。目前量到的成本不高，但未含 DOM、真實 renderer、滿檔角色與手機。

1. 用無頭瀏覽器跑固定移動場景，記錄通知次數、快照耗時和 `ui.render` 耗時，分別用單角色劍士和滿檔弓手。
2. 佔比明顯才繼續，否則記錄數據後結案。
3. 若要改：同一步的時間和玩法合併成一次通知，`stateValue` 仍先更新時間。保持 [`app.ts:293`–315](../src/app/app.ts:293) 的輸入順序、跳躍音效與存檔檢查點語意，並核對 [`setState`](../src/app/app.ts:981) 內的 `synchronizeAudio`。另外可避免 [`getQuestView`](../src/domain/quests/index.ts:79) 對已解析的任務再解析一次。

不拆 `GameApp`、`createUi` 或 renderer，不引入事件匯流排或新框架。

## 驗證與收尾

- 每項先跑直接相關的測試，每批結束跑一次 `npm run typecheck` 和 `npm test`。
- 全部完成後再跑 `npm run check:content` 和 `npm run build`。目前基準：91 檔、616 個案例全過。
- 收尾時更新 [`status.md`](status.md) 和 [`README.md`](README.md) 的入口，並寫清楚實際做過與略過的檢查。
- 仍未驗證、要在交接標明的項目：真實平台預覽、Firefox／Safari 的 `import()` 重試。
