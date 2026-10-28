# Plan17 beta.24 640×360 toast 避讓候選修復

日期：2026-10-28（Asia/Hong_Kong）  
最新狀態：SOURCE_BUILT_PACKED_VALIDATED／TARGETED_VISUAL_PASS（所見）；未發布。使用者後續授權診斷並恢復環境，Terra已在真正beta24的640×360同case確認完整toast、hint、操作鈕及直接周邊無互遮，實測toast(12,172,616,26)。詳[啟動恢復與視審報告](base-experience-browser-recovery.md)。本候選未重建或改碼，下方VISUAL_UNVERIFIED為封包交付當時記錄。

## 問題與修正

beta.23 的 640×360 portal 畫面已避開長提示，但左移後的 toast 底部落在操作按鈕上，遮住「Z 拾取」與「Space 互動」按鈕上方約 17.5px。原始實測幾何如下；這些數值來自 beta.23，非 beta.24 實畫：

| 元件 | x | y | 寬 | 高 | 底部 |
| --- | ---: | ---: | ---: | ---: | ---: |
| profile | 12 | 12 | 285 | 151 | 163 |
| portal hint | 438 | 111.78 | 158 | 58.17 | 169.95 |
| toast | 14 | 160.31 | 320 | 57.69 | 218 |
| action buttons | 12 | 200.5 | 131.34 | 30 | 230.5 |
| footer | 12 | 325.5 | 616 | 22.5 | 348 |

本次只改 `src/ui/journal.css` 中 `@container (max-width: 720px) and (max-height: 520px)` 的 `.maple-ui.has-interaction-hint .ms-toast:not(.ms-toast--top)`：水平左右各留 12px、取消 320px 寬度上限、底部設 162px、字級 12px／行高 18px、padding `2px 8px`、移除陰影。保留既有 2px 邊框、toast z-index 與完整原文：「向森芽接取並完成「第一次出發」後才能前往木葉鎮。」；沒有加省略或裁切文字。

按 640×360 的既有容器幾何推算，新 toast 會是 x=12、寬=616、高約 26、y=172–198；預計與 hint 底端約差 2px，與 action 按鈕頂端約差 2.5px，且在 footer 上方。這只是 geometry 推導，沒有在 beta.24 瀏覽器中確認實際換行、字型寬度或間距。規則仍只套用窄且短、互動 hint 可見、非 panel-top 的 toast；一般尺寸、沒有 hint 與 `.ms-toast--top` 不受影響。

## beta.24 候選封裝

- 將 `package.json`、`package-lock.json` 根套件兩個版本欄位、`public/game.json` 更新為 `1.0.0-beta.24`。Manifest 保留 ID `brightwood-first-oath`、schema 2、`desktop`、cloudSave readable `[1,2,3,4,5]`／write `5`。
- Node `v24.22.1`、Vite `8.3.4` build 一次成功（68 modules）。建置後 source 與 dist 凍結；未重建。
- 固定 Playroom tools `1.2.0` archive SHA-256：`24a2fd36b405ae9f1ce1303e53ac6b0a0d0a2798c04e796f5790a2663d46f022`。Pack 一次成功，完整 ZIP validate 一次成功：`Valid: brightwood-first-oath v1.0.0-beta.24 (tools 1.2.0)`。
- Dist：274 files、135,735,153 bytes；tree SHA-256 `3c4a6cca6e5f9f62d063db7b1d4e68a6798cf9c9fdf7044199760f0d9d4815e8`。
- ZIP：[game.zip](../../artifacts/base-experience-1.0.0-beta.24/game.zip)：274 entries、131,523,016 bytes；SHA-256 `6bd31bb852cd0290b73a82b47081d42df4398ef2d7fcf0c02439903a76fb7a97`。ZIP entry tree SHA-256 與 dist tree 相同。
- Source 清單：[source-files.sha256](../../artifacts/base-experience-1.0.0-beta.24/source-files.sha256)：351 files、135,075,662 bytes；tree SHA-256 `7ad131b7f508f52e82d33bdb06920bd7c4e44dc898f94716b0a9af294d1f7ba8`。有限掃描摘要在 [fingerprints.json](../../artifacts/base-experience-1.0.0-beta.24/fingerprints.json)，腳本在 [fingerprint.ps1](../../artifacts/base-experience-1.0.0-beta.24/fingerprint.ps1)。

## 驗證與界線

- 版本與 manifest 欄位符合本候選約定；build、pack、完整 ZIP validate 均成功。ZIP/directory 逐檔 SHA-256 清單完全相符。
- 沿用前候選腳本掃描 14 個文字 entries，五類 token／私鑰樣式 potential matches 為 0；binary files 未掃描，這不是完整機密稽核。
- beta.24 **視覺未驗證**。beta.23 臨時 CSS 診斷的兩次隔離 Chrome 啟動均因 crashpad 錯誤退出；依交接指示沒有再排查環境或啟動瀏覽器，因此未拍攝 beta.24 畫面。實際視覺驗收仍待環境可用後確認。
- CSS-only 修改未新增或重跑 tests、typecheck、content check、全回歸或 browser。beta.23 已通過的 quickbar 排隊狀態／冷卻視審繼續保留；beta.23 portal 遮擋是本候選修復對象，beta.24 尚未宣稱通過。beta.21／22／23 候選未改；沒有 commit、push、tag、Release 或平台發布。
