# 遠古遺跡包 D：beta.15 封包與交接

日期：2026-10-25（香港時間）。狀態：**ZIP_VALIDATED；LOCAL_BROWSER_UNVERIFIED**。本報告只記封包、固定工具驗證與有限文字／路徑掃描；沒有執行外部發布。

## 凍結來源與封包前核對

依據 `plan/15-ruins-acceptance-and-package.md` §7／§10、D environment／integration／browser 報告及主代理提供的已讀線上 Playroom 規格轉述。`.codegraph/` 不存在。整合候選 `1.0.0-beta.15` 由 integration owner 凍結；封包前以安全 Node v24.22.1 重新計算來源與 dist 指紋，結果均與 integration build summary 相同：

- Source：341 files，SHA-256 `8c9388902ffee77d3081e56bbf6caa80388902e8c1ef8beb162a4d2ab6401407`，基礎 HEAD `d410f674a7e69ba0ec3704b4764549bb5041323a`，包含未提交工作區內容。
- Dist：274 files、135,702,472 bytes，tree SHA-256 `8789d7abde697223beb41fcc2cd4fe5077869848d579b52691035fd8311f715a`。
- 目標 `artifacts/ruins-d/game-beta15.zip` 封包前不存在；沒有重建 dist。整合報告所列 typecheck、219 runtime 引用核對、build 及 verify-build 結果沒有在此重跑。

## 固定工具與執行結果

- Node：`C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`，v24.22.1。
- Playroom tools 1.2.0，lock archive SHA-256 `24a2fd36b405ae9f1ce1303e53ac6b0a0d0a2798c04e796f5790a2663d46f022`；metadata：SDK 1.1.0、protocol 1、manifest schemas 1/2。固定 runner 在每次執行時檢查 archive lock SHA 及 metadata 列出的 extracted file hashes，再呼叫 pinned CLI。
- Pack 命令：`& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tools/playroom/pack.mjs artifacts/ruins-d/dist artifacts/ruins-d/game-beta15.zip`，exit 0；建立遊戲 ID `brightwood-first-oath`、版本 `1.0.0-beta.15` 的 ZIP。
- Full validate 命令：`& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tools/playroom/validate.mjs artifacts/ruins-d/game-beta15.zip`，exit 0；工具回報 `Valid: brightwood-first-oath v1.0.0-beta.15 (tools 1.2.0)`。

## ZIP 與 limited scan

| 證據 | 結果 |
| --- | --- |
| ZIP SHA-256 | `1d7de2c3d38f19ff03bbc279daaea5b724c354183545ed66758d63dbb376e7dc` |
| ZIP 大小 | 131,513,398 bytes |
| 檔案 entries／解壓大小 | 274／135,702,472 bytes |
| 封面 | `cover.png`，133,001 bytes |
| 根項目 | `assets/`、`cover.png`、`favicon.png`、`game.json`、`index.html`、`vendor/` |
| ZIP 與 dist | 274 個 file path 完全相符；無缺漏、多餘、重複或不安全相對路徑 |
| 無關／憑證路徑 | 未找到 fixtures、logs、node_modules、tools、`.playroom`、tests、`.env`、credential/private-key 類路徑 |
| Runtime text secret-pattern scan | 14 個 text entries；8 類 high-confidence pattern 無命中；沒有 >16 MiB 未掃描項目 |

文字掃描只處理 `.html`、`.js`、`.mjs`、`.cjs`、`.css`、`.json`、`.svg`、`.xml`、`.txt`、`.webmanifest`，偵測 PEM 私鑰標記、AWS/GitHub/Slack/Stripe/Google credential token、JWT-like token 與長 credential assignment（欄位涵蓋 `api_key`、`access_token`、`auth_token`、`client_secret`、`password`、`private_key`、`secret`、`token`）。掃描只保留 entry path、規則 ID、計數；本次無命中，未輸出任何可能的命中值。這是有範圍的 pattern scan，不取代通用二進位／語義式 secret audit。細項與原始命令輸出摘要見 `artifacts/ruins-d/logs/package-scan-20261025.json` 及 pack／validate logs。

完整結構化結果：`artifacts/ruins-d/zip-validation-summary.json`。玩家可用摘要：`artifacts/ruins-d/acceptance-summary.md`。

## Browser、測試與外部狀態

Browser owner 報告 `plan/reports/ruins-d-browser.md` 標示 **LOCAL_BROWSER_UNVERIFIED**。Playwright wrapper 無法啟動、短 npx 探測無輸出、CUA IAB unavailable；Firefox Private Browsing 的唯一啟動呼叫掛起 452.6 秒後被主代理中斷。沒有 D iframe、browser game evidence 或遊戲日誌；自有 harness service 已停止。R1–R4、兩個子路徑、首領、resize／Esc、旅冠、分支計時及 namespace 行為皆未作瀏覽器驗收。11 個 synthetic fixture 的 validators 通過只驗 catalog/save 結構，不代表遊戲行為通過。Browser report 亦指出 PID 21308 ownership JSON 原始檔曾在 Ctrl+C 時成為 0 bytes，停止記錄由 browser owner 依原始輸出重建並註記 recovery metadata；不是未受損的原始停止證據。

D0 專項測試記錄共 27 個不同 cases（namespace 21、app persistence 6）；早前 23-case 結果與 namespace 後續 21-case 存在重疊，不能相加為 44。封包 owner 沒有重跑測試或 build。

| 狀態 | 結果 |
| --- | --- |
| `SOURCE_READY` | integration report 記錄完成；封包前 fingerprints 相符 |
| `LOCAL_BROWSER_VERIFIED` | **未驗證**；實際狀態 `LOCAL_BROWSER_UNVERIFIED` |
| `ZIP_VALIDATED` | 已驗證，official pinned validator exit 0 |
| `PLATFORM_PREVIEW_VERIFIED` | 未驗證 |
| `FORMAL_CLOUD_VERIFIED` | 未驗證 |
| `GITHUB_RELEASED` | 未發布 |
| `PLATFORM_PUBLISHED` | 未發布 |

沒有 commit、push、tag、GitHub Release、平台匯入／preview／上架或正式雲端驗收。若繼續，先解決可用的受控 browser context 後完成真實 iframe 驗收；若要進外部平台，另行依具體範圍和授權執行。此 ZIP 是未提交工作區內容的本機候選封包，不代表已公開版本。
