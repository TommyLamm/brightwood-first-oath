# beta.24 瀏覽器恢復與 portal 局部視審

2026-10-28（Asia/Hong_Kong）。結果：**指定 640×360 portal 畫面 PASS（所見範圍）**；這不是完整遊戲回歸、正常行走或傳送測試，也不是發布驗收。本輪沒有修改 source、候選 dist 或 ZIP，沒有重新執行 build、pack 或完整驗證。

## 啟動失敗對照

- 先前 `base-experience-visual-beta22-b8` 在受限環境以 Chrome 啟動時，crashpad 報告 `TransactNamedPipe` pipe ended `0x6D`、`crash server failed to launch` 並自行退出；原紀錄 `output/playwright/base-experience-visual-beta22/beta23-portal-fresh-b8-open.log`。
- 確認 `npx` 可用；本輪直接用已快取的 `@playwright/cli` 0.1.22 和 bundled Node `v24.22.1`，不下載或更新依賴。相同 CLI、Node、Chrome channel、headed／persistent 參數、640×360 config 和 `about:blank`，分別使用兩個新獨立 profile：一般桌面權限的 `profile-b10` 成功開啟；`use_default` 受限環境的 `profile-control` 重現 `0x6D`、crash server failed to launch，Chrome 自行退出。完整紀錄分別為 `output/playwright/base-experience-visual-beta24/blank-open.log`、`control-open.log`。
- 此受控對照支持故障與執行環境差異相關，且 Node 版本不是此兩次對照的單一變因；**未證明**具體是哪項沙箱權限或 IPC 機制造成失敗，也沒有修改 Chrome 安全設定、全域政策或真實使用者 profile。沒有重裝瀏覽器或擴大系統排障。

恢復時使用一般桌面權限執行以下命令；`profile-b10` 是本次獨立 QA profile，後續測試使用新空 profile／來源以免覆寫存檔：

```powershell
& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'C:\Users\Tommy\AppData\Local\npm-cache\_npx\31e32ef8478fbf80\node_modules\@playwright\cli\playwright-cli.js' -s=base-experience-visual-beta24-b10 open about:blank --browser chrome --headed --persistent --profile 'C:\Users\Tommy\Desktop\brightwood-first-oath\output\playwright\base-experience-visual-beta24\profile-b10' --config 'C:\Users\Tommy\Desktop\brightwood-first-oath\output\playwright\base-experience-visual-beta24\playwright-cli.json'
& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'output/playwright/base-experience-visual-beta24/serve-beta24-portal.mjs' 26450 26451
```

## 測試方法與實測

- 候選為 `artifacts/base-experience-1.0.0-beta.24/dist/`；在真正 game iframe 內讀取相對 `game.json`，確認 ID `brightwood-first-oath`、版本 `1.0.0-beta.24`（`seed.log`）。主代理先前提供已驗證的候選 ZIP SHA-256 `6bd31bb852cd0290b73a82b47081d42df4398ef2d7fcf0c02439903a76fb7a97`，本輪未重算。
- 新 host `127.0.0.1:26451` 與 game `127.0.0.1:26450/preview/base-experience-visual-beta24/` 為跨來源子目錄 iframe；sandbox 為 `allow-scripts allow-same-origin allow-pointer-lock`，allow 為 `fullscreen; autoplay; gamepad`。啟動前在一般桌面環境確認兩個 loopback 埠可綁定。Harness 為 `output/playwright/base-experience-visual-beta24/serve-beta24-portal.mjs`。
- 新 game origin 的 canonical 存檔起初為 null；一次載入先前已由 `createPersistence.initialize()` 接受的 format 5 合成 camp/right fixture，SHA-256 `4e55c8c1a8ef4c1078c46be6de7ff28b19cb10b132278761dfe3fe82e7c6fb00`。在標題畫面正常點「繼續冒險」，確認 portal hint 後正常按一次 Space 顯示原有門檻訊息；沒有注入 CSS 或直接改變 UI／遊戲狀態。前後 raw 保留在本輪目錄的 `beta24-portal-before.raw.json`、`beta24-portal-after.raw.json`。
- 實際 viewport 為 640×360，hint key 為 `portal:camp:east`。畫面中完整顯示「Space 前往：木葉鎮｜向森芽接取並完成「第一次出發」後才能前往木葉鎮。」及 toast「向森芽接取並完成「第一次出發」後才能前往木葉鎮。」；兩者文字可讀，未與 profile、操作按鈕、快捷列或 footer 互遮。完整截圖 `portal-toast-640.png`、全畫面審圖 `portal-toast-640-review.jpg`（640×360，JPEG 70）及局部審圖 `portal-overlap-crop-review.jpg`（1280×260，JPEG 70）均位於 `output/playwright/base-experience-visual-beta24/`；DOM 原始記錄 `visual.log`。

| 元件 | x | y | 寬 | 高 |
| --- | ---: | ---: | ---: | ---: |
| profile | 12 | 12 | 285 | 151 |
| portal hint | 438 | 111.78 | 158 | 58.17 |
| toast | 12 | 172 | 616 | 26 |
| Z／Space action bar | 12 | 200.5 | 131.34 | 30 |
| quickbar | 12 | 238.5 | 298 | 77 |
| footer | 12 | 325.5 | 616 | 22.5 |

hint 底部與 toast 頂部相距約 2.05px，toast 底部與操作按鈕頂部相距 2.5px；toast 的 scroll/client 寬高相等。兩個可見按鈕的 rect 分別為 Z `(12, 200.5, 51.375, 30)`、Space `(69.375, 200.5, 73.96875, 30)`。結果僅適用此 viewport、fixture 與實際觀察的短段；其他場景、尺寸、正常移動／傳送和 beta.23 已驗過的項目沒有重測。

## 收束

已正常放開測試按鍵、以遊戲暫停鈕停在「冒險已暫停」並保存 after raw（`pause-export.log`）。清理前以完整命令列確認 Playwright daemon PID 19856 使用 `base-experience-visual-beta24-b10`／`profile-b10`，Chrome 主程序 PID 4876 為其子程序；server PID 32692 命令列為本輪 harness，並確認監聽本輪 26450／26451。完整命令列留於 `ownership-before.json`、`chrome-ownership-before.json`。CLI 只對該 session 執行 `close`；server 以本次專屬 exec session 23183 的 Ctrl+C 正常結束，沒有用舊 PID 或批次關閉瀏覽器。清理後查無本輪匹配程序、兩埠均不再 LISTENING，兩個本輪 session 均不再列出（`cleanup.log`、`sessions-after-close.log`）。兩個新 profile、raw、腳本、日誌及圖片保留；沒有發布、commit 或 push。
