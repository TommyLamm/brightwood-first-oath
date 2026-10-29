# 2026-10-29・beta57 收尾與 GitHub Release

**GITHUB_PRERELEASED／BROWSER_UNVERIFIED**。使用者要求完成 Plan49 後收尾、簡單驗證並建立 Release，再追加先修剛發現的霜潮洞窟誤標。已停止新增 Plan／排程。

## 修正及候選

[Plan49](../49-journal-contact-map.md)的手帳接取／回報 NPC 地圖入口完成；[收尾修補](plan49-frost-return-fix.md)已將霜潮洞窟地圖返回標籤改為雪痕海岸，補齊戰鬥中不能返回提示，不改實際旅行政策。root 審閱兩個實作包及原 tsc log，兩包各一次指定 Node24.22.1 tsc exit0。

補丁前 [beta56](plan49-candidate.md)保留，發布使用 [beta57 候選](plan49-release-candidate.md)。新候選 build（82 modules）／固定 tools1.2.0 pack／完整 ZIP validate／Python311 有限 audit 各一次成功，沒有重跑已過步驟。

- 遊戲 ID brightwood-first-oath，作者 TommyLamm，desktop，存檔讀1–5寫5。
- [本地 game.zip](../../artifacts/plan49-1.0.0-beta.57/game.zip)：274 entries／131,528,778 bytes；SHA-256 `6d5afe2557db1a1119ffb55e087772b358d79f9d31a81a8c969c832c2d6d9ddc`。
- source435 files／135,791,604 bytes；清單 SHA `6e9b12ae41db36b51ce0ceb77f58f9305adceacba9b1a0b64f5df47ee54a5a42`。
- dist274 files／135,755,101 bytes；清單 SHA `0eae50ef85417a6f15a03a75bbd1882f22da032655abcd24d74856fcf4214b0c`。
- 六處版本一致。14 text entries／1,772,764 bytes／8 類 pattern 為 0 findings；260 binary entries 未掃，非完整機密／binary 檢查。

## 發布準備

修補與發布開始前完整網讀 Playroom 八份規格（refs199–202，含尾段）。已確認 [TommyLamm/brightwood-first-oath](https://github.com/TommyLamm/brightwood-first-oath)為公開 repository；既有 release.yml workflow active，遠端 beta57 tag 不存在。受限 gh 的兩個 read 請求最初連線失敗，標準網路提權後成功，未輸出憑證。

依既有工作區提交偏好，程式／測試／版本與 Plan／交接／Release notes 分開提交；只推送新 immutable `v1.0.0-beta.57` 標籤，由既有 workflow 建置／固定工具驗證後建立附唯一 game.zip 的 prerelease。遠端 main 不改、不強推、不覆寫歷史 Release。發布完成後補實際 commit／run／Release／asset 結果。

[Release notes](../../.github/release-notes/v1.0.0-beta.57.md)列明改動及限制。未啟動 browser／server、未重跑完整回歸，真 click／focus／跨區選圖／讀屏／layout／iframe／雲端／音效／全螢幕仍未驗；GitHub Release 不代表平台已預覽確認或上架。既有 profiles／真資料／全部候選保留。02:40／07:50 一次性排程均已觸發刪除。

發布前額外只讀檢查：文件引用 10／112／6、failures []，git diff --check exit0；將發布的新增／修改 repository 文字 192 檔／1057284 bytes、相同8類pattern掃描0findings，無binary新增／修改檔。紀錄 .playroom/tmp/release-beta57/repository-text-scan.json。此為有限pattern檢查，非完整機密保證。

程式／測試／metadata 提交：bcc3abe（37 files，含最後 Frost 修補）；文件及 Release notes 另提交後凍結 tag。

## 實際發布結果・本次完成

程式／測試／metadata commit bcc3abe；Plan／交接／Release notes commit 7f99f66。immutable tag v1.0.0-beta.57 指向 7f99f6683fc6c74cbbf848566cd53b23f5e16da8，已成功推送；未推送或改寫 main／其他 branch，未強推。

[GitHub Release](https://github.com/TommyLamm/brightwood-first-oath/releases/tag/v1.0.0-beta.57)已發布，draft=false、prerelease=true，時間2026-10-29 HKT08:48:56。[workflow40796409735](https://github.com/TommyLamm/brightwood-first-oath/actions/runs/40796409735)completed／success，headSHA與tag一致；固定工具驗證、完整ZIP及Publish release asset全部成功。完整watch log在.playroom/tmp/release-beta57/workflow-watch.log；有checkout/setup-node舊action runtime及ubuntu-latest遷移提示，但未失敗，未擴大修改workflow。

Release僅一個uploaded game.zip，131,528,745bytes，SHA-256 da32d0cfdf606c86d954466a54dabc0f765edf6ba1ff116635180f703c20589f。這是CI重建的實際發布檔，與Windows候選雜湊分開記錄。已下載至.playroom/tmp/release-beta57/published/game.zip，完整SHA與GitHub digest相等；274entries、manifest與source完全相等，版本／作者TommyLamm／ID／存檔讀1–5寫5正確。14text entries／1,771,526bytes／8類pattern為0findings；260binary entries內容與本地候選相等（未做binary機密掃描），JS／CSS及檔名完全相同。

不同4個共同entries只為3份JSON格式／HTML換行與空行；JSON parse相等、HTML移除空白行後其餘各行完全相等。第一次只規一CRLF的嚴格斷言失敗，局部diff確認入口HTML少一空白行，補空行比較後通過；未修改任何成品或重跑build／ZIPvalidator。此附加核對針對CI新附件，摘要.playroom/tmp/release-beta57/published-audit.json。環境工具更新後下載session ID消失，無法讀回原shell exit；以完整GitHub digest及實檔大小確認下載完成，未重複下載。

最終發布結果另以純文件commit保存於本地工作分支；不移動已發布tag或重跑workflow。本次已收尾，停止新增Plan，等待新指令。平台匯入／確認／上架未操作；真browser／iframe／完整回歸仍未驗，未標CANDIDATE_READY或平台通過。
