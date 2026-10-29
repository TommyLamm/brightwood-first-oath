# Plan 42 候選成品：1.0.0-beta.49

- 候選：`brightwood-first-oath`；作者 `TommyLamm`；Playroom tools `1.2.0`。
- 狀態：SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED；未發布。
- 成品目錄：`artifacts/plan42-1.0.0-beta.49/`。
- 本次只將 `package.json`、`package-lock.json` 頂層與 `packages[""]`、`public/game.json` 的版本精確更新為 `1.0.0-beta.49`，替換數為 1／2／1；保留其他既有 dirty work。

## 執行步驟

| 步驟 | 結果 | 完整命令、輸出與 exit code |
|---|---:|---|
| Metadata 更新、audit 副本與 AST／Path 元件路徑解析 | exit 0 | `.playroom/tmp/plan42-candidate-beta49/prepare.log` |
| 指定 Node 24.22.1 路徑的 Vite build（80 modules） | exit 0 | `.playroom/tmp/plan42-candidate-beta49/build.log` |
| Playroom pack | exit 0 | `.playroom/tmp/plan42-candidate-beta49/pack.log` |
| 完整 ZIP validate | exit 0 | `.playroom/tmp/plan42-candidate-beta49/validate.log` |
| 指定 Python 3.11 audit | exit 0 | `.playroom/tmp/plan42-candidate-beta49/audit.log` |

Audit 由唯讀 `.playroom/tmp/plan41-candidate-beta48/audit_candidate.py` 複製並更新候選路徑與版本。以 AST 解析 Path 元件並解析後，`artifact`、`dist`、`zip_path`、`tmp` 分別指向 `artifacts/plan42-1.0.0-beta.49`、其 `dist`、`game.zip` 與 `.playroom/tmp/plan42-candidate-beta49`。

## 成品與 metadata

| 項目 | 檔案數／ZIP entries | 檔案總 bytes／ZIP bytes | SHA-256 |
|---|---:|---:|---|
| Source manifest（`source-files.sha256`） | 431 source files | 135,776,052 source bytes | `4b2ff94dc5d65a3d6ea13f1f2faefe3fbf08a0842da5aec1808110768080de4f` |
| Dist manifest（`dist-files.sha256`） | 274 dist files | 135,751,865 dist bytes | `77d132ad94e6178de74e09f7da93fb049e09c521df268d25e71bf580cde72ae5` |
| ZIP（`game.zip`） | 274 entries | 131,528,011 ZIP bytes | `710914ed8e2ff69bfb32c854723968e682026578ddb36eb8607a67c968bd0300` |

ZIP entries 解壓後共 135,751,865 bytes，壓縮 entries 合計 131,480,187 bytes。以下六處版本一致為 `1.0.0-beta.49`：`package.json`、`package-lock.json` 頂層、`package-lock.json` 的 `packages[""]`、source `public/game.json`、dist `game.json`、ZIP 內 `game.json`。Source、dist、ZIP metadata 一致：作者 `TommyLamm`、ID `brightwood-first-oath`、裝置 `desktop`、存檔讀取格式 1–5／寫入格式 5。

## 有限文字掃描與限制

Audit 對 14 個文字 entries、1,769,528 bytes 執行 8 類 pattern 掃描，findings 為 0；類別為 PEM 私鑰標頭、AWS access key、Google API key、GitHub token、Slack token、Stripe secret/restricted key、引號包住的 credential assignment、JWT-like 值。260 個 binary entries、133,982,337 bytes 未掃描；超過 16 MiB 的文字 entries 為 0。這不是完整 binary 檢查。

本次未執行 tests、tsc、browser 或 server。Plan 42 W01 的指定 tsc 已由 root 審閱接受，這裡沒有重跑。遊戲內 click、focus、reader 與 layout 未由 browser 驗證；本候選未發布。

補充：四項正式檢查後，一次額外唯讀PowerShell metadata摘要因ConvertFrom-Json預設不支援lockfile空字串key而未輸出版本清單；前述Python audit已驗六metadata成功，未重跑正式檢查。後續metadata讀取採Python或-AsHashtable。
