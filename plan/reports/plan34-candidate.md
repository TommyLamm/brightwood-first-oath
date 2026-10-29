# Plan34 beta41 候選包報告

日期：2026-10-29（Asia/Hong_Kong）  
候選：brightwood-first-oath 1.0.0-beta.41

## 規格與範圍

已讀 AGENTS.md、plan/34-shop-bag-capacity.md，並沿用本批已完整讀取的 Playroom 規格：game-agent template、game-development、command-contracts、Schema、release workflow、SDK、sdk-versioning、save-compatibility。保留既有遊戲識別與存檔相容性；本候選使用固定 Playroom tools 1.2.0。本報告驗收 build、pack、完整 ZIP validation、metadata 一致及有限 ZIP 文字掃描；不驗證 UI 操作。

候選版本在 package、lock、public manifest 更新為 beta41。新產物位於 C:/Users/Tommy/Desktop/brightwood-first-oath/artifacts/plan34-1.0.0-beta.41/；audit 副本與日誌位於 .playroom/tmp/plan34-candidate-beta41/。原 Plan33 audit 與舊候選未修改。

## 執行記錄

Node 執行檔：C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe，版本 v24.22.1；每個 Node 命令執行前將其 bin 目錄放在 PATH 首位。Python audit 使用 Python 3.11。四項正式檢查各執行一次：

- Build: C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules/vite/bin/vite.js build --outDir artifacts/plan34-1.0.0-beta.41/dist — exit 0.
- Pack: C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe tools/playroom/pack.mjs artifacts/plan34-1.0.0-beta.41/dist artifacts/plan34-1.0.0-beta.41/game.zip — exit 0.
- ZIP validate: C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe tools/playroom/validate.mjs artifacts/plan34-1.0.0-beta.41/game.zip — exit 0.
- Audit: C:\Users\Tommy\AppData\Local\Programs\Python\Python311\python.exe .playroom/tmp/plan34-candidate-beta41/audit_candidate.py — exit 0.

命令輸出與 exit code 存於 .playroom/tmp/plan34-candidate-beta41/ 的對應 .log、.exit 檔。

## 產物與雜湊

- ZIP：C:/Users/Tommy/Desktop/brightwood-first-oath/artifacts/plan34-1.0.0-beta.41/game.zip，131,527,318 bytes；SHA-256 8f546bdc3b34b51d9f063e1a026874850c642197bf71d2f6a3cfcdc7cfae17ad。
- ZIP entries：274 個；未壓縮 135,749,455 bytes，壓縮 131,479,494 bytes。根項目：assets, cover.png, favicon.png, game.json, index.html, vendor。
- Source manifest：C:/Users/Tommy/Desktop/brightwood-first-oath/artifacts/plan34-1.0.0-beta.41/source-files.sha256，427 個檔案、135,755,487 bytes；manifest SHA-256 64bbf8f7038de8cfaaa6ed97f9926116186105a4bc86cf0e0d79a39d099c0071。
- Dist manifest：C:/Users/Tommy/Desktop/brightwood-first-oath/artifacts/plan34-1.0.0-beta.41/dist-files.sha256，274 個檔案、135,749,455 bytes；manifest SHA-256 9ee306cd6c0df013a65715e2c63af6722754d294cfb9f1cb81d2335b40486a5b。

## Metadata 一致性

六個版本欄位均為 1.0.0-beta.41：

- package.json: 1.0.0-beta.41
- package-lock version: 1.0.0-beta.41
- package-lock root: 1.0.0-beta.41
- public/game.json: 1.0.0-beta.41
- dist/game.json: 1.0.0-beta.41
- ZIP game.json: 1.0.0-beta.41

Source、dist、ZIP 的其餘欄位一致：

- author: TommyLamm in source, dist, ZIP.
- id: brightwood-first-oath in source, dist, ZIP.
- devices: ["desktop"] in source, dist, ZIP.
- cloudSave: readableFormats=[1,2,3,4,5], writeFormat=5 in source, dist, ZIP.

Audit 的 manifestConsistent 為 true。

## 有限文字掃描

ZIP 內掃描 14 個符合文字副檔名的項目，共 1,767,118 bytes；8 個固定模式均為 0 命中：

- PEM private key header
- AWS access key ID
- Google API key
- GitHub token
- Slack token
- Stripe secret/restricted key
- quoted credential assignment
- JWT-like value with encoded JSON header

另有 260 個 binary 項目、133,982,337 bytes 未掃描；超過 16 MiB 的文字項目為 0 個、0 bytes。掃描只涵蓋列出的副檔名與模式，不構成完整秘密資訊或安全審查。

## 準備階段記錄與驗收界線

準備階段出現四個輔助命令錯誤，均在任何檔案寫入前中止，沒有改動候選或既有檔案，也不計為正式檢查：一次 PowerShell ConvertFrom-Json 未使用 -AsHashtable，無法讀取 lockfile 的空字串根鍵；一次 PowerShell prep wrapper 有 $Old: 插值解析錯誤；一次 audit 複製檢查把記憶體中剛替換出的 beta41 視為舊檔已有候選版本；一次 audit 原始版本替換次數預期少算，因兩處 artifact path 也含版本字串。改用位元組等長替換並核對各字串次數後完成 prep。這些是準備工具問題，非 build、pack、validate 或 audit 結果。

未執行 tests、tsc、browser/server 或 UI 操作；沒有驗證實際購買、背包刷新或版面行為。因此此候選通過的是本節所列 build、pack、ZIP validation、metadata 與有限文字掃描，不代表 UI 驗收。
