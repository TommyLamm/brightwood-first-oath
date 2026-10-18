# GitHub 公開倉庫與預發布（2026-10-18 香港時間）

使用者已明確授權清理工作樹、只保留 main、將全部有用內容推送至 Public `brightwood-first-oath`，並建立 Release。本次由主代理執行，未啟用子代理。

## 來源與內容

- Repository：https://github.com/TommyLamm/brightwood-first-oath
- 分支：main；遊戲 ID：`brightwood-first-oath`；名稱：Brightwood: First Oath。
- 版本／目標 tag：`1.0.0-beta.1`／`v1.0.0-beta.1`，使用預發布標記。
- 原 main：`4847028`。已核對三個工作樹無未提交內容，所有 patch 均等效在 main；以 `65ce50b` 保留全部工作分支提交歷史後，刪除三個 linked worktree 及臨時分支。目前只留 main。
- 已補提交 AGENTS、完整計畫規格、素材原稿／預覽、README 及版本化打包證據。工具解壓快取、工作快取、node_modules、dist 與 artifacts 不納入 Git；成品由 Release 的唯一 `game.zip` 提供。
- Runtime 仍與已驗候選 `56ec0fe` 相同；本次沒有修改遊戲程式或正式資產，沒有重跑本機型別／建置／遊戲測試。已檢查暫存檔案範圍、diff whitespace、目標機密模式與可疑檔名，未發現目標命中。

## 規格與驗證

本次重新完整讀取當時 main 的 game-agent-template、game-development、command-contracts、game.schema.json、game-release.yml、starter/playroom-sdk.js、sdk-versioning、save-compatibility。來源根網址：https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/。

既有本機候選的 typecheck／build／check:content 與固定工具 pack／validate 均通過；證據見 [T15-package-evidence.json](T15-package-evidence.json)。本機 ZIP SHA-256：`13920DD169E1852DF200DFA8416A85D6268A179342ECB45C9C6CAEE3D68CE875`。

本次 tag 推送後由既有 GitHub Actions workflow 重新建置、核對固定工具 checksum／metadata，完整 pack／validate 後建立預發布 Release。版本化 release notes 明示驗收限制。

## 發布結果

main 已推送；tag／workflow／Release 尚待本次發布流程完成，完成後補實際結果。

首次 tag workflow 在排程前被 GitHub 拒絕：範本於 job-level env 使用 `runner.temp`，該位置不支援 runner context。已在 main 改為執行 step 時以 `RUNNER_TEMP` 寫入 `GITHUB_ENV`，保留既有完整驗證；並加入指定既有 tag 的手動 dispatch，從固定 tag checkout 發布。不移動、刪除或覆寫 `v1.0.0-beta.1`；其 runtime 與內容版本不變。

## 驗收限制

正常實玩僅 q01 擊殺 2/3。完整 q01–q08、死亡／首領重試、45–60 分鐘節奏、可聽音訊、全螢幕、完整 browser console、正式雲端與 FPS 尚未驗證。GitHub 預發布不代表 Playroom 人工確認或上架，本次沒有操作平台發布 API。
