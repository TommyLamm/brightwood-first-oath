# beta.17 本機封包交接

日期：2026-10-26（香港時間）  
狀態：**ZIP_VALIDATED；未發布**

## 封包結果

只封裝 frozen beta.17 dist，沒有更動 source、dist、package metadata 或既有 β15/β16 產物。封包前 source 指紋 341 files／134,993,285 bytes／SHA-256 `ce445b12cfdd654133c851565ed87355f17782697dd11e7f166c6f131c5129c6`，dist 指紋 274 files／135,704,908 bytes／SHA-256 `0256fc3faea34ab5c8c2bccf9f7434565797ecdb2dad69cd9cfd1a064bd95be4`，均與交接 manifests 相符。目標目錄與 zip 起初不存在，未覆寫既有封包。

使用 Node v24.22.1 和鎖定 Playroom tools 1.2.0（archive SHA-256 `24a2fd36b405ae9f1ce1303e53ac6b0a0d0a2798c04e796f5790a2663d46f022`）：

- `tools/playroom/pack.mjs artifacts/overnight-20261026/import-feedback/dist artifacts/overnight-20261026/beta17-package/game-beta17.zip`：exit 0。
- `tools/playroom/validate.mjs artifacts/overnight-20261026/beta17-package/game-beta17.zip`：exit 0；official validator 判定 `brightwood-first-oath v1.0.0-beta.17` valid。
- ZIP SHA-256：`e92f3b663993b19be6ed32a6d613644e4d87db1271c40736e974414573c94620`。
- 大小：131,514,096 bytes；274 file entries；解壓大小 135,704,908 bytes。
- 封面 `cover.png`：133,001 bytes。根項目：`assets/`、`cover.png`、`favicon.png`、`game.json`、`index.html`、`vendor/`。
- 遊戲 ID/version：`brightwood-first-oath`／`1.0.0-beta.17`。

完整欄位見 [zip-validation-summary.json](../../artifacts/overnight-20261026/beta17-package/zip-validation-summary.json)；掃描程式見 [audit-package.ps1](../../artifacts/overnight-20261026/beta17-package/audit-package.ps1)。

## 路徑與文字 scan

274 個 ZIP paths 與 frozen dist 完全相符；無 missing/extra/duplicate/unsafe path，無 fixtures、logs、node_modules、tools、`.playroom`、tests、`.env`、credential/private-key 類路徑。掃描 14 個限定文字 entry，共 1,722,571 bytes；每 entry 上限 16 MiB，無略過的大型文字項目。八類 pattern（PEM private key、AWS、GitHub、Slack、Stripe live、Google API、JWT-like、credential assignment）零命中；結果只記 path、rule ID 和 count，不記命中值；raw art 未掃描。這是限定 pattern scan，不代表通用 binary 或語義式 secret audit。

## 行為驗收證據

β17 本機 browser 證據只限來源報告記載的匯入流程 target-race、source-change、corrupted-canonical 三個分支，分別確認取消文案與原始資料保留；詳見 [browser results](../../artifacts/overnight-20261026/import-feedback/browser/browser-results.md) 和 [overnight import feedback report](overnight-import-feedback-20261026.md)。這次封包工作未重新開 browser。

NPC dialogue focus 與重複 Enter guard 僅引用 β16 報告的既有 browser evidence（對話打開焦點到第一個可用 action；領取 Q17 後的 repeat Enter 不接取 Q18，下一個獨立 Enter 才執行）；詳見 [dialogue focus report](overnight-dialogue-focus-20261026.md)。沒有把 β15 的 world/boss 分段驗收引用為 β17 通關證據。

## 未驗證或未發布

- 完整遊戲流程和 β17 全面 browser acceptance 未驗證。
- 正式平台 preview、正式雲端、聆聽/音訊、phase 瞬時清理未驗證。
- 沒有平台匯入、release、commit、push 或 tag。
- 本次沒有重跑 source report 中的 test、typecheck、build 或 browser 檢查；封包只依 frozen source/dist 指紋並執行官方 pack/validate。

玩家可用摘要：[acceptance-summary.md](../../artifacts/overnight-20261026/beta17-package/acceptance-summary.md)。本地封包：[game-beta17.zip](../../artifacts/overnight-20261026/beta17-package/game-beta17.zip)。
