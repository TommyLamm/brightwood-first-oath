# beta.85 GitHub Release

2026-11-06 Asia/Hong_Kong。使用者要求「建立release」，目標為公開 `TommyLamm/brightwood-first-oath` 的 `v1.0.0-beta.85` prerelease，沿用既有 tag／Actions 發布流程。

## 發布前完成

- 本次經網路完整取得並閱讀 Playroom 範本及七份 main 規格。保留穩定 ID、desktop、schema 2、讀格式 1–5／寫 5、SDK 1.1.0／protocol 1 及固定工具 1.2.0，不改平台或正式玩家存檔。
- 沿用夜間各小項直接相關的測試／型別／內容檢查與最終 beta.85 build，不重跑通過範圍；[最終交接](night-final-20261106.md)列出實際檢查及未驗界線。此次只做發布文件，沒有新遊戲程式改動。
- package、lock（含根 package）、public／dist manifest 皆為 beta.85；369 個 public 檔案與 dist 逐位元一致。
- 固定工具 pack 及完整 ZIP validate 各一次 exit 0；tool-runner 先驗證 ZIP SHA-256 與 metadata 中每個工具檔案。固定工具 SHA-256 為 `24a2fd36b405ae9f1ce1303e53ac6b0a0d0a2798c04e796f5790a2663d46f022`。
- 本機候選 `artifacts/release-1.0.0-beta.85/game.zip`：155,498,610 bytes、374 entries、解壓 160,004,484 bytes；SHA-256 `1a4e349688e7f67d111cbd28ca8f4157117cb885e9fef0859ce32c6b481d61e5`。
- 有限 6 類 credential pattern 文字掃描：ZIP 15 個文字 entry、source 298 個文字檔，0 findings；binary 圖片／音訊未掃，不能當作全面機密保證。證據在 `.playroom/tmp/release-beta85/`。
- 遠端最新 Release 為 beta.58，beta.85 tag／Release 未存在；公開 repository 可寫、未封存。fetch 後遠端工作分支是本機 HEAD 的祖先（0 behind／12 ahead），不需要合併或強推。

## 提交與發布範圍

只提交 beta.59–85 遊戲來源、runtime 素材、原稿與可重現匯出資料、直接相關測試／計畫／交接及 beta.85 Release notes。保留本機 AGENTS.md 修改、既有 beta.57 未追蹤報告及 output 證據，不 stage；不把 logs、profile、node_modules、dist 或 artifacts 提交到 repository。

只推送新的不可變 `v1.0.0-beta.85` tag，沿用現有 workflow 在 CI 建置、驗證固定工具及完整 ZIP 後建立唯一 `game.zip`。不推 main／其他分支、不移動既有 tag 或覆寫 Release；平台匯入／預覽確認／上架不在此次範圍。

## 發布結果

尚待推送新 tag 與 workflow 結果；完成後補記實際 commit、Release、CI 與附件 digest。此段不代表已發布。
