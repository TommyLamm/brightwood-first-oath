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

## 實際發布結果

**GITHUB_PRERELEASED／ZIP_VALIDATED**。程式／素材commit `67ab58d`；文件／Release notes commit `7602bc2`；immutable tag `v1.0.0-beta.58` 指向 `7602bc2951ecb378fe103834506cd24bdab6ad6b`。只推送該新標籤，未推送main／其他branch，未強推或覆寫舊Release。

[GitHub Release](https://github.com/TommyLamm/brightwood-first-oath/releases/tag/v1.0.0-beta.58) 於2026-10-30 11:48:30 HKT發布，draft=false、prerelease=true。[workflow40999336557](https://github.com/TommyLamm/brightwood-first-oath/actions/runs/40999336557) completed／success、headSHA與tag相等，固定工具校驗、完整ZIP驗證及Publish release asset均成功。

Release只有一個uploaded `game.zip`：132108586 bytes。GitHub回報digest `sha256:bea011ed36513ab1a50d943ef63e692580035374498f2975f6bc8ca9052d99c7`。此為Linux CI重建的發布附件，與上方Windows本機候選分別記錄；本輪未下載附件重驗，不宣稱兩包逐位元相等。API紀錄 .playroom/tmp/release-beta58/release.json；watch log位於同目錄 workflow-watch.log。

workflow有checkout/setup-node舊action runtime與ubuntu-latest遷移提示，但不影響成功；未擴大修改workflow。最後結果只另作本機文件提交，不移動已發布tag。

完整玩法、音訊聽感、全螢幕、正式平台／雲端未重驗，未重跑完整tests或browser；隔離合成UI結果不當成通關／真保存證據。平台匯入／確認／上架未操作。
