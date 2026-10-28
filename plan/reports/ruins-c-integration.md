# 遠古遺跡 C：候選整合與驗收

日期：2026-10-25（香港時間）。依 `plan/14-ruins-bell-sanctum.md`、`plan/reports/ruins-c-dispatch.md` 與所有 C owner 報告完成候選整合。沒有 commit、push、tag、Release、平台 API、正式帳號或雲端存檔操作。

## 規格與範圍

- 已讀 `AGENTS.md`、plan14 全文、C 派工與 runtime、world、saves、app/render、scene/audio、profiles、motion、slam/hurt、sweep/dead 及 atlas assembly 交接報告。
- Playroom main 遊戲模板及模板列出的七份規格由主代理本輪透過網路完整讀取，見 `ruins-c-dispatch.md`。規格僅用於本專案；維持現有遊戲 ID、相對資源路徑、存檔讀1／2／3／4寫4及失敗不覆寫。C 候選版與正式發布驗收分開。
- `.codegraph/` 不存在，依專案規範直接檢視檔案。

## 整合變更

- 將 `package.json`、`package-lock.json` 與 `public/game.json` 一致升至 `1.0.0-beta.14`；ID 維持 `brightwood-first-oath`，schema維持2。描述增加誓鐘內殿；`cloudSave` 設為 `readableFormats: [1, 2, 3, 4]`、`writeFormat: 4`。SDK 未變。
- 新增 `artifacts/ruins-c/check-assets.mjs`。它以 production loader 載入四個實際 manifests，驗證相對 URL 和檔案、內殿與配件 PNG 尺寸／色彩格式、司鐘者 6×5 圖集及六套動畫、組裝 metadata 中22個 canonical來源格及SHA、unused格複製關係、第四地圖節點與 A+B+C 預算。成功執行後寫入 `artifacts/ruins-c/asset-reference-check.json`。
- 新增 `artifacts/ruins-c/verify-build.mjs`，確認獨立輸出的 `index.html`、beta.14 manifest、actors manifest及11個新 runtime 檔都存在且大小相符；成功後寫入 `artifacts/ruins-c/build-summary.json`。

## 實際檢查

| 命令 | 結果 |
| --- | --- |
| `npm.cmd run typecheck` | 通過；在 atlas 釋出前執行，之後未改 production code。 |
| `npm.cmd run check:content` | 通過；rules 與 world 跨表驗證通過。 |
| `npx.cmd vitest run tests/integration/app-foundation.test.ts tests/ruins-gallery-combat.test.ts --exclude '**/.worktrees/**'` | 2個檔案、18個測試通過。 |
| `node --import tsx artifacts/ruins-c/check-assets.mjs` | 通過：4個manifest packs、218個引用，C新增11檔共7,559,589 bytes；A+B為14,308,281 bytes，A+B+C為21,867,870 bytes（20.85 MiB）。核對22個來源姿勢、unused格、相對路徑、PNG尺寸／格線、六組動畫及第四節點。 |
| `npm.cmd run build -- --outDir artifacts/ruins-c/dist` | Vite build通過。 |
| `node artifacts/ruins-c/verify-build.mjs` | 通過：入口與beta.14 game manifest存在；actors manifest為41 images／122 animations；11個新增 runtime檔、7,559,589 bytes已複製。 |
| `git diff --check` | 通過；Git僅提示多個工作檔下次觸碰時會轉為CRLF，沒有 whitespace error。 |

資產檢查第一次執行因檢查腳本先使用、後宣告 atlas metadata 而失敗；調整宣告順序後重跑通過。沒有其他整合檢查失敗。Scene/audio owner 曾在新 WAV 尚未生成前執行一次不完整的 `--only boss-ruins` 生成；其報告記錄後續生成 WAV 後完整驗證成功。本整合未重跑音訊 encoder 或音訊全包檢查。

## 尚未驗證

未做真實瀏覽器／實際遊戲流程、配樂聆聽、正式 Playroom SDK／雲端存檔、ZIP、發布或手感驗收；這些仍屬 D 與正式發佈階段。Build 是本機 beta.14 候選，不能代表正式發布或雲端相容驗收通過。
