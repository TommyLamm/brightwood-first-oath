# Plan16・beta.20 候選封裝紀錄

日期：2026-10-27（香港時間）  
Playroom 規格讀取：2026-10-27 17:33 HKT  
狀態：**BUILD_PACK_VALIDATE_PASS／MARKER_TARGETED_BROWSER＋SOL_PASS；尚非整體 CANDIDATE_READY／未發布**。

封裝後追加：全新b14以獨立空profile／跨來源預覽子目錄正常Continue、走梯／調查一次，q21counter0→1。原Sol確認唯一1280構圖名稱完整可讀且避開右手帳，石碑接平台／梯頂關係合理。詳[取證與清理](world-completion-marker-visual-beta20.md)。封裝指紋與來源未變；以下「等待新位置」為封裝時記錄，由此追加結果更新，不代表其他未驗範圍通過。

## 來源、規格與版本

- 開工前讀取：根目錄 `AGENTS.md`、Plan16 W07／W08、`world-completion-candidate.md`、`world-completion-marker-readability.md`、`world-completion-live-handoff.md` 最新段，以及 Playroom `game-agent-template.md` 和其列出的七份 `main` 規格：`game-development.md`、`command-contracts.md`、`game.schema.json`、`game-release.yml`、`playroom-sdk.js`、`sdk-versioning.md`、`save-compatibility.md`。線上文件由 Web 工具完整讀取，時間如上。
- 本次適用要求：保留遊戲 ID `brightwood-first-oath`、desktop、schema 2、Lv30 與 canonical namespace；保留雲端格式讀 1–5／寫 5；相對資源和 iframe 約束不變。只將 `package.json`、`package-lock.json`、`public/game.json` 版本同步為 `1.0.0-beta.20`，不改玩法來源或真實存檔。
- 驗收項目：確認版本同步；使用 bundled Node 24.22.1 執行一次 Vite build；固定 Playroom tools 1.2.0 執行一次 pack 與一次完整 ZIP validate；記錄 source／dist／ZIP 逐檔指紋與整體 SHA／大小／entries；有限文字機密掃描。沿用來源未變部分已通過的 focused checks，不重跑。
- beta.19 程式來源已凍結；本次沒有改動遊戲程式碼。其前置 b11 修改已包含：航標由 `(1910, 430)` 移至 `(1770, 430)`、validator 兩個精確座標契約同步、q21 兩案例改讀實際 NPC 座標。其 focused 2 檔 5 案例、content check、typecheck 已通過，依要求不重跑。
- 本機 tags 最高為 `v1.0.0-beta.10`；root 此前核對的公開 Releases 清單亦最高列到 beta.10。`artifacts/world-completion-beta20/` 開始前不存在。此工作沒有建立 tag、Release 或平台版本。

## 成品與指紋

- 獨立 build 目錄：[dist](../../artifacts/world-completion-beta20/dist/)。beta.19 成品未改。
- ZIP：[game-beta20.zip](../../artifacts/world-completion-beta20/game-beta20.zip)，131,520,177 bytes、274 entries；SHA-256 `154cfc4e24c20c067a0849ce7a96aeea3e9e114d9db79c8dbbdab13127bda8bf`。
- Source：346 個檔案；指紋 `ba7ab266f6520cd450bf9971f48fe51f9a0101a0e280917bbef31137c5d8063b`。逐檔相對路徑與 SHA-256 清單為 [source-files.sha256](../../artifacts/world-completion-beta20/source-files.sha256)。
- Dist：274 個檔案；指紋 `82f1135c23e4cad62c3c89335e7647de49c543a3960a9f2eeb1c575a81a0bcc0`。逐檔清單為 [dist-files.sha256](../../artifacts/world-completion-beta20/dist-files.sha256)。
- ZIP entries：274 個；逐 entry SHA-256 清單為 [zip-entries.sha256](../../artifacts/world-completion-beta20/zip-entries.sha256)。entry tree 指紋同 dist：`82f1135c23e4cad62c3c89335e7647de49c543a3960a9f2eeb1c575a81a0bcc0`。
- 三份清單使用 UTF-8、LF、排序後的 `SHA-256␠␠相對路徑` 每檔一行，tree SHA-256 為該清單位元組的 SHA-256。摘要及清單路徑另記於 [fingerprints.json](../../artifacts/world-completion-beta20/fingerprints.json)。
- Manifest 讀回確認：ID `brightwood-first-oath`、version `1.0.0-beta.20`、schema 2、devices `desktop`、cloudSave readable `[1,2,3,4,5]`／write `5`。

## 實際檢查

- Bundled Node `C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe` 回報 `v24.22.1`。
- Vite build 執行一次：`node_modules/vite/bin/vite.js build --outDir artifacts/world-completion-beta20/dist`；66 modules transformed，成功。
- 固定工具 ZIP `.playroom/tools/playroom-game-tools-1.2.0.zip` 與 lock SHA-256 相符：`24a2fd36b405ae9f1ce1303e53ac6b0a0d0a2798c04e796f5790a2663d46f022`；metadata toolsVersion 為 1.2.0，5 個 metadata 檔案 hash 均符合。
- Pack 執行一次成功；完整 ZIP validate 執行一次，結果：`Valid: brightwood-first-oath v1.0.0-beta.20 (tools 1.2.0)`。
- 有限 secret audit 掃描 ZIP 中 14 個 `.js/.mjs/.html/.css/.json/.txt/.xml/.svg/.map` 文字 entries，檢查 AWS access ID、GitHub token、Google API key、Stripe live secret 與 PEM private-key header 樣式；0 potential matches。未掃描圖片／音訊等二進位檔，不將此檢查擴稱為完整機密稽核。
- 未重跑：b11 的 5 個 focused cases、content check、typecheck，以及與來源無關的其他測試。

## 尚未驗收

此封裝包確認 build、固定工具 pack 與 ZIP validate 通過；後續b14已補beta20跨來源預覽子目錄的正常Continue／爬梯／inspect，原Sol確認新座標 `(1770,430)` 在唯一1280構圖名稱避手帳、接平台與梯頂合理。其他集中路線／W08-04與05結果由總交付按版本沿用或補證，本包不宣稱整體 `CANDIDATE_READY`。正式雲端格式5、Playroom preview、原生／沉浸全螢幕、音訊實聽、GitHub Release及平台匯入／確認／上架仍未驗或未授權；沒有發布。
