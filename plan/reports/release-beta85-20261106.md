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

**GITHUB_PRERELEASED／ZIP_VALIDATED**。程式、素材與發布文件 commit `5f64ac89dd1b1595de7a1e27725c6049c7fa2665`；不可變 annotated tag `v1.0.0-beta.85`（tag object `6e9f4fff8b872e14539323d57cd3051dcf7fff4c`）解析到同一 commit。只推送此新標籤，沒有推送分支、強推或覆寫既有版本。

[GitHub Release](https://github.com/TommyLamm/brightwood-first-oath/releases/tag/v1.0.0-beta.85) 於 **2026-11-06 07:33:56 HKT** 發布，draft=false、prerelease=true。[Actions 42130180267](https://github.com/TommyLamm/brightwood-first-oath/actions/runs/42130180267) completed／success，head SHA 與 tag 相等；建置、版本核對、固定工具校驗、完整 ZIP 驗證及上傳均成功。

唯一附件 `game.zip`：155,498,528 bytes、374 entries、解壓 159,999,100 bytes。GitHub 回報 SHA-256 `cab0af585e366ad3ee60ce952ca694e47dd3cd5ff46446f057740b226b23c5d4`。已下載到 `artifacts/release-1.0.0-beta.85/published/game.zip`，實際 SHA-256 與 GitHub digest 一致，manifest 與 source 解析結果完全相同。此為 Linux CI 重建附件，與 Windows 本機候選分別記錄，不宣稱兩包逐位元相等。

已發布附件另做 14 個文字 entry／6 類 credential pattern 有限掃描，0 findings；沒有重複執行 CI 已通過的同一附件完整 validator。發布前實際暫存的 216 個文字檔另掃同 6 類 pattern，0 findings。這些仍不涵蓋 binary 或所有機密型態。公開 API、tag、workflow 及下載核對結果保存在 `.playroom/tmp/release-beta85/`。

workflow 有 checkout／setup-node 的舊 action runtime 及 ubuntu-latest 遷移提示，結果仍 success；未因此擴大修改流程。正式平台／帳號雲端、全螢幕、音訊及完整遊玩驗收沿用原未驗界線，未新開 browser 或全回歸。

發布後只補交接文件並另作本機 docs commit，不移動已發布 tag。AGENTS.md 的本機修改、舊 beta.57 報告與 output 證據保留；平台匯入／人工確認／上架尚未操作。
