# Plan 33 候選包報告

日期：2026-10-29（Asia/Hong_Kong）  
候選：`brightwood-first-oath` `1.0.0-beta.40`

## 輸出與雜湊

- ZIP：`artifacts/plan33-1.0.0-beta.40/game.zip` — 131,527,191 bytes；SHA-256 `d984d71866abe0896bcc5807cb4a52687a8dcb6745b6dcf9a7bdfe0014f96c3c`。
- Source manifest：`artifacts/plan33-1.0.0-beta.40/source-files.sha256` — 427 個檔案，總計 135,755,034 bytes；manifest SHA-256 `4a099ec70ec8c0ce8252ee23eab18b307e9cc0ae519644f559792e08da561b88`。
- Dist manifest：`artifacts/plan33-1.0.0-beta.40/dist-files.sha256` — 274 個檔案，總計 135,749,168 bytes；manifest SHA-256 `8639b0d1ffd29154cea11a992a66fa2fef1decda15f609591997c2208cd54e69`。
- ZIP 共有 274 個檔案；未壓縮 135,749,168 bytes，壓縮 131,479,367 bytes。

## 執行記錄

Node 使用 `C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`（v24.22.1）；執行時已將其 `bin` 目錄置於 PATH 首位。每步完整命令、輸出及 exit code 保存在 `.playroom/tmp/plan33-candidate-beta40/` 對應日誌。

| 步驟 | 命令 | Exit |
| --- | --- | ---: |
| Build | `C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules/vite/bin/vite.js build --outDir artifacts/plan33-1.0.0-beta.40/dist` | 0 |
| Pack | `C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe tools/playroom/pack.mjs artifacts/plan33-1.0.0-beta.40/dist artifacts/plan33-1.0.0-beta.40/game.zip` | 0 |
| Validate | `C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe tools/playroom/validate.mjs artifacts/plan33-1.0.0-beta.40/game.zip` | 0 |
| Audit | `C:\Users\Tommy\AppData\Local\Programs\Python\Python311\python.exe .playroom/tmp/plan33-candidate-beta40/audit_candidate.py` | 0 |

Pack 與 ZIP validator 回報候選識別、版本及 tools `1.2.0` 正確。Audit 的 6 個版本欄位（package、lock 頂層、lock root、source manifest、dist manifest、ZIP manifest）全為 `1.0.0-beta.40`；author、id、devices、cloudSave 在 source、dist、ZIP 三者一致。版本一致檢查通過。

## 有限文字掃描與限制

8 個固定文字樣式規則掃描 ZIP 內 14 個符合副檔名的文字項目，共 1,766,831 bytes，未發現命中。規則涵蓋 PEM 私鑰標頭、AWS/Google/GitHub/Slack/Stripe 常見 token、引號包住的 credential assignment，以及 JWT-like 值。ZIP 內另外 260 個 binary 項目、共 133,982,337 bytes 未掃描；本次沒有超過 16 MiB 而略過的文字項目。這是限於 ZIP 文字檔與上述 8 種模式的掃描，不能視為完整秘密資訊或安全審查。

## 準備記錄與驗收界線

候選目錄建立後，準備工作曾有兩次 PowerShell 精確替換輔助失敗（exit 1）：首次參數陣列繫結造成預期匹配數錯誤；第二次因複製的 audit 腳本有兩處 artifact 路徑而只預期一處。首次只建立本批空目錄並複製 audit 腳本；第二次只完成三個允許的 metadata 版本更新後停止。調整匹配數後，已確認複製腳本的 artifact/tmp 路徑均指向 Plan 33 beta40，且 VERSION 為 beta40，才執行上述四個步驟。未改 runtime source。

本報告只確認 build、pack、ZIP validation、metadata 一致及有限文字掃描結果；沒有執行 UI 操作，因此不代表最大可買量按鈕、focus、草稿行為或整體 UI 已驗收。未執行 tests、tsc、browser/server 檢查。