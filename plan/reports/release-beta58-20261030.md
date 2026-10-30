# beta58 GitHub Release

2026-10-30 Asia/Hong_Kong。使用者明確要求「建立release」，目標為公開 TommyLamm/brightwood-first-oath，標籤 v1.0.0-beta.58；依既有流程建立 prerelease，不操作平台匯入／上架。

## 發布前完成

- 已重新網讀 Playroom game-agent-template 及七份線上規格（main）。沿用 schema2、讀格式1–5寫5、desktop、固定工具1.2.0；未更動workflow或SDK。
- 沿用本對話剛完成的 Node24.22.1 typecheck／production build，以及 Terra Max 的隔離UI視審，不重跑完整測試或browser。詳 Plan50 handoff。
- 295個public檔案與現有dist逐位元相等；版本1.0.0-beta.58，ID brightwood-first-oath。
- 固定工具pack及完整ZIPvalidate各一次exit0，工具封包與metadata校驗由既有tool-runner執行。
- 本機候選 artifacts/plan50-1.0.0-beta.58/game.zip：132108640 bytes、300entries、136341790 expanded bytes，SHA-256 `33d31d2f6d85945323cfaf13c906bbf79642adbdccbdd443b97e6ff822a67cdd`。
- 有限6類credential pattern檢查：ZIP14個文字entry及repository53個文字檔，0 findings；binary內容未掃，非完整機密保證。細節 .playroom/tmp/release-beta58/local-audit.json。
- GitHub公開repository、Release workflow active、遠端tag與Release均未存在；一般sandbox gh連線失敗，正常網路提權後成功，無輸出憑證。

## 提交與發布方式

程式／素材／版本與文件／Release notes分開提交；僅推送新的immutable版本標籤，由既有workflow完成CI建置、固定工具驗證、封包及Release。保留原有beta57兩份未追蹤報告與status原修改，不stage；不推main或強推、不移動既有標籤。

發布結果將於成功後補記。完整玩法、音訊聽感、全螢幕、正式平台／雲端未重驗；隔離合成UI結果不當成通關／真保存證據。
