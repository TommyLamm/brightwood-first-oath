# Plan16・beta.19 整合候選封裝紀錄

日期：2026-10-27（香港時間）  
狀態：**BUILD_PACK_VALIDATE_PASS；候選已交集中瀏覽器／視覺驗收，尚非整體 CANDIDATE_READY／未發布**。

## 規格、來源與版本

本包沿用主代理已完整讀取的 Playroom 範本及七份 main 規格；本代理讀取根目錄 `AGENTS.md`、Plan16 W07／W08、[即時交接](world-completion-live-handoff.md)、W00／W01 baseline 與 design、W02 navigation、W03／W04 region-content、save-design／save-implementation 及 UI journal 報告。適用要求：保留 `brightwood-first-oath`、desktop、Lv30、玩家原始進度與 canonical namespace；相對資源與 sandbox iframe；舊存檔需明示備份／升級 gate；不發布、不碰真實存檔；沿用已通過且未再受來源變更影響的 focused checks。

- 封裝前 source 版本為 `1.0.0-beta.18`。本機 `git tag --list` 列至 `v1.0.0-beta.10`；[公開 GitHub Releases](https://github.com/TommyLamm/brightwood-first-oath/releases) 頁面列出 `.10`、`.5`、`.4`、`.3`、`.2`、`.1`。因此本候選用高於 beta.18 且在所查本機 tags／公開 Releases 清單未列出的 `1.0.0-beta.19`；沒有推 tag 或發布。
- `package.json`／`package-lock.json` 及 `public/game.json` 同步 `1.0.0-beta.19`。Manifest 仍為 schema 2、ID 不變、desktop；save 宣告 readable formats `[1,2,3,4,5]`、write format `5`。Description 補列霜雪航標與日井支線；現有操作說明未變。
- 固定工具 lock 為 Playroom tools 1.2.0、SDK 1.1.0、protocol 1；使用 bundled Node `v24.22.1`。本候選宣告格式5不代表正式雲端平台已支援；格式5雲端寫入、正式登入與發布仍未驗。

## 候選產物與指紋

- 獨立 build 輸出：[dist](../../artifacts/world-completion-beta19/dist/)；該目錄在本輪前不存在，未覆寫 beta.18 凍結成品。
- ZIP：[game-beta19.zip](../../artifacts/world-completion-beta19/game-beta19.zip)，131,520,178 bytes，274 entries，SHA-256 `68644dc701fb51fa8f11d69a0698819b4cb01203c8a258d9085c37c5aca6b53b`。
- Source fingerprint SHA-256 `06b69a8cbfa9011008c09cb173c21113ca311358e4cbfcce52aaa1036dde71b6`，涵蓋 `src/**`、`public/**`、`index.html`、package／TypeScript／Vite 設定、Playroom tools lock 及 pack／validate runner（346 檔；相對路徑及逐檔 SHA-256 排序後再雜湊）。
- dist fingerprint SHA-256 `5110333affb98209126ce849ee144838bb5a374ab8b533bd0f6b68e04a03ed4c`，涵蓋 dist 的274個檔案（相對路徑及逐檔 SHA-256 排序後再雜湊）。

## 本包實際檢查

- 一次 Vite build：使用 `node_modules/vite/bin/vite.js build --outDir artifacts/world-completion-beta19/dist`，bundled Node `v24.22.1`；成功，66 modules transformed。
- 一次 Playroom tools 1.2.0 pack，成功產生上述 ZIP。
- 一次完整 ZIP validate，結果 `Valid: brightwood-first-oath v1.0.0-beta.19 (tools 1.2.0)`。
- ZIP 內 manifest 讀回確認 ID、schema、版本與 save format 宣告相符。
- 有限 secret audit：掃描 ZIP 中14個文字 entries（`.js/.mjs/.html/.css/.json/.txt/.xml/.svg/.map`），檢查 AWS access ID、GitHub token、Google API key、Stripe live secret 與 PEM private-key header 模式；0 potential matches。此範圍不包含二進位圖片／音訊。
- 沿用已完成報告中的驗證，不重跑：UI journal 的14個 focused cases、最後 typecheck／diff check；region/content 的 content check 及 Frost3＋region2＋Sunwell2 focused cases；save implementation 兩個 focused suites 共31 cases；W02 的 world-map focused cases。版本與 manifest metadata 同步後沒有 TypeScript 或 world catalog 來源變更。

## 尚未驗與下一步

新候選已交 root 進行集中本機 iframe／browser QA，包括 q21 航標實際場景、升級／暫玩 UI、q19 回顧與受影響霜雪／沙海流程。該工作尚未完成前，不宣稱航標實際接地／遮擋、四區 UI 閉環或整體 `CANDIDATE_READY`。全程連續通關、全區時長、實際可聽音訊、正式 Playroom preview／雲端 save、原生全螢幕、正式發布／上架均未由本包驗證；發布未授權，也沒有推送 tag、GitHub Release 或平台操作。
