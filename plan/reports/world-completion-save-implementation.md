# Plan16・存檔格式5實作交接

日期：2026-10-27（香港時間）  
狀態：**候選來源已實作／未發布**。本包只處理來源程式與合成資料；沒有讀取或改寫真實瀏覽器、本機或雲端存檔。

## 已實作

- 格式5讀取格式1–5、寫入格式5。`SaveData` 六欄形狀不變；既有角色數值、技能、裝備、背包、地圖、旗標、任務狀態與 counters 經既有嚴格 validator 驗證，不補 q21/q22 狀態、不重算 claimed 獎勵，也不放寬未知 quest、counter 或未來格式。
- 對本機格式1–4存檔，載入後回報 `upgradeRequired` 與 `saveUpgrade: { formatVersion, source: 'local' }`。首次格式5寫入前，玩家須送出 `confirmSaveUpgrade`；程式先將 exact raw envelope 複製到 `:formatN-backup` 並讀回逐字核對，再寫入格式5並讀回核對。來源已變更、備份內容衝突或確認失敗時停止寫入、保留原件。格式5不再出現確認。
- 對雲端格式1–4存檔也先顯示升級 gate。明確確認後只送出格式5；若 SDK 回覆 `SAVE_FORMAT_INCOMPATIBLE`，狀態保持不相容並停止寫入，沒有格式4降寫路徑，也沒有宣稱已備份或已發布相容版本。格式成功只由正式 `saved:true` 解鎖；preview 的 `previewOnly` 不視為正式保存。
- `playTemporary` 是「暫不升級」路徑：保留已驗證角色到記憶體遊玩，invalidate persistence，不寫本機 key 或雲端。回標題時會重新載入原存檔並再次顯示 gate。
- 舊版進度匯入仍保留原來源並先複製 exact envelope；若匯入的是格式1–4，載入結果仍帶升級 gate，不會靜默寫格式5。
- 新空白角色可直接建立格式5；現有 format5 存檔不提示遷移。

## Public handshake

- `SaveStatus`: 新增 `upgradeRequired`。
- `LoadOutcome.saveUpgrade`、`GameAppState.saveUpgrade`、`UiSnapshot.saveUpgrade`: `SaveUpgradeRequired | null`，其中 `SaveUpgradeRequired = { formatVersion: number; source: 'local' | 'cloud' | 'preview' }`。
- `CommandDraft`: 新增 `confirmSaveUpgrade`（無 payload）；沿用 `playTemporary` 表示暫不升級。
- `Persistence.confirmSaveUpgrade()` 執行明確確認後的來源專屬升級流程。

## 來源與檢查

遵循 `plan/16-world-completion-roadmap.md` 第7、8節、`plan/reports/world-completion-save-design.md` 及 Playroom 主代理已讀取的八份 main 規格要求：保留遊戲 ID／玩家資料、讀取失敗不覆寫、格式變更需明確玩家選擇、正式雲端保存以 `saved:true` 為準；本包未變更公開 manifest 或發布設定。

- 使用指定 bundled Node runtime 執行 focused Vitest：`tests/persistence.test.ts`、`tests/integration/app-persistence.test.ts`，並排除 `.worktrees/**`。結果：2 個測試檔、31 個案例通過。涵蓋格式1–4 gate、備份衝突／讀回失敗、舊 payload 保留、雲端格式拒絕不降寫、暫時遊玩不寫資料、未知格式／quest／counter 嚴格拒絕及舊版匯入後仍有 gate。
- 初次 Vitest pattern 未排除 `.worktrees/**`，額外選到多份 worktree 副本並報錯；未修改或計入那些副本結果，後續依專案指令排除後得到上述 focused 結果。
- TypeScript 檢查尚待 UI 代理完成 `src/ui/index.ts` 的無用 import 清理；本包第一次檢查時該檔有 `objectivePlaces` 及一組 import 未使用。`src/app/root-ui.ts` 的 `upgradeRequired` 狀態標籤已補上。TypeScript 不含 `tests/` 目錄。
- 未 build、未開 browser、未 pack、未操作正式平台；未改 `public/game.json`、SDK／protocol／tools 版本、素材或發行成品。

## 後續整合

1. UI 代理接上上述 `saveUpgrade` 欄位、`confirmSaveUpgrade` 命令及既有 `playTemporary`；文字需說明格式4雲端寫入可能被平台拒絕，且暫時遊玩不保存。
2. 最終整合代理同步公開 manifest 的 readable/write format 宣告；這不代表目前正式平台已支援格式5。只在玩家確認後交由 SDK／平台格式相容機制檢查，不在客戶端硬編已發布判斷。
3. 僅對後續實際修改受影響檔案後的必要 checks 重跑；正式存檔遷移及發布不在本包執行。
