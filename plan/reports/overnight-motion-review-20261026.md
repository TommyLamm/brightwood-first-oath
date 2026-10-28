# Beta.17 遺跡鏡頭／背景動態短觀察

日期：2026-10-26（香港時間）。狀態：**限定觀察完成；未發現足以派發實作的具體缺陷**。

## 規格與範圍

- 依使用者提供的 `AGENTS.md`，只做與本次風險直接相關的 browser 觀察，不跑全回歸；不改 source、dist、package 或 ZIP。
- 閱讀 `plan/15-ruins-acceptance-and-package.md` §§5–6：browser 使用隔離的父頁／遊戲雙 origin、preview 子路徑；先用 1280×720，再在同一進度看 960×640；地面、視差與 resize 只做有範圍觀察。§6 明確說既有 beta.11 背景抖動仍未驗，因此本報告不把單圖結果擴大為四圖全通過。
- 閱讀 `plan/reports/ruins-b-handoff.md`、`plan/reports/ruins-b-dispatch.md` 的背景修正交接摘要，以及 `src/render/index.ts`／`src/render/parallax.ts` 的相機／視差相關片段。交接記錄指出背景調整曾推至 `fix/background-jitter`（`17a4c37`），但遊戲組合畫面當時仍列未驗；計畫中未找到獨立的完整背景抖動 browser 報告。
- 閱讀 beta.17 封包摘要及既有匯入 browser 摘要，只用來確認凍結產物路徑與版本界線。本次只載入 `artifacts/ruins-d/fixtures/q17-q20-ready.json`：fixture index 記錄它已通過當前 rules/world catalog 驗證。

## 產物與隔離

- SUT：`artifacts/overnight-20261026/import-feedback/dist`；dist SHA-256 `0256fc3faea34ab5c8c2bccf9f7434565797ecdb2dad69cd9cfd1a064bd95be4`。實際 HTTP gate 回報 `brightwood-first-oath`、`1.0.0-beta.17`、`index-C1-e-S4C.js`，入口 SHA-256 `1E5AA92A999A7FF4752D3B069B63C23D85FDE4FE69E8B7650B28F2A035405B4A`。
- Fixture SHA-256 `394C34BE8B36B0A1EFB34C4042545E334B032F264CEC0D219DA936DC9F61D9C4`。僅種在新建的 127.0.0.1 遊戲 origin；父頁 `65472`、遊戲 origin `65473`，遊戲入口走 `/preview/beta17/index.html`。服務只讀上述凍結 dist。PID、origin、fixture、指紋及停止時間見 [service-ownership.json](../../artifacts/overnight-20261026/motion-review/service-ownership.json)。
- Playwright CLI session 為 `morning-motion-review-20261026`，使用獨立 headed Chromium context。完成後只關閉此 session；僅在核對 PID 命令列和兩個 listener 都屬本任務後停止 PID 31256。結束時 65472／65473 無 listener；既有 `morning-first-run`、`brightwood-beta15-retry-20261025` session 及共用 5173 未動。

## 觀察結果

- 1280×720：canvas backing 為 960×540，顯示範圍填滿 1280×720。以已聚焦的 canvas 正常按住 ArrowRight 180 個 rAF callback（約 3.3 秒）後放開；角色從左側往右移，鏡頭開始跟隨，背景層相對地面作視差位移。起始與移動後 JPEG 中，角色腳底仍貼著同一地面頂線；兩張畫面未見背景空洞、接縫撕裂或移動後的明顯跳位。移動後畫面約在放鍵 250ms 後截取，屬視覺抽樣，未做逐像素 temporal diff。
- 限時 frame-pacing 觀察收集 180 個 rAF 時戳、179 個間隔：p50 18.6ms、p95 19.6ms、max 20.5ms；超過 25ms／33ms 的間隔均為 0。這只描述此單一本機 browser sample，不代表實機 FPS、其他場景或其他設備。
- 角色仍在右移後的位置時先以遊戲內暫停，再將同一 browser 進度改為 960×640。canvas 維持 960×540，置中於 y=50，畫面上下各有 50px 空白；暫停視窗、快捷列及底部面板皆可見，未見控制項裁切或 resize 後的場景跳位。暫停狀態中截圖，因此此張只用於版面／地面／層次的可見檢查。
- 移動後保存仍為 Lv.30、EXP 0、HP 712；q17／q20 仍 active、counter 與 fixture 一致，`savedAt` 仍為 `2026-10-25T00:00:00.000Z`，未有 clock 欄位。HUD 顯示 HP `712 / 712`。沒有修改敵人、存檔欄位、任務、HP、EXP 或遊戲時鐘。
- Browser console 只有 Phaser 3.90 啟動橫幅，0 errors、0 warnings。

### First-run 縮圖交叉判讀

只讀了 first-run owner 已存的 [active-scene-1280-q70.jpg](../../artifacts/overnight-20261026/first-run/evidence/active-scene-1280-q70.jpg)，沒有接觸其 browser/origin。該單張畫面看不到玩家，但 Lv.1／HP 80、活動蝸牛及掉落可見，單張本身不能分辨視口外或瞬時閃爍。first-run owner 隨後在自己的 context 做了一次左移 650ms 對照，既有 [visibility-left-1280-q70.jpg](../../artifacts/overnight-20261026/first-run/evidence/visibility-left-1280-q70.jpg) 中玩家重新可見，HP 80、q01 counter 1/3。owner 表示前張是在一次受擊／移動後的 pause 時序，未能直接觀察到閃爍計時；短移後未復現持續消失，暫判 transient blink／截圖幀，不認定產品缺陷。此交叉判讀來自 owner 文字回覆及既有單張，不是本 owner 的 browser 驗證。

## 界線與結論

這次只看 beta.17 的回聲長廊左側起點、一段短右移、放鍵後畫面與一次暫停 resize。這個樣本沒有顯示需要修正的相機／背景抖動、地面接觸或 frame-pacing 缺陷；沒有驗另外三圖、完整地圖、其他 viewport／設備或實機平台。**beta.11 背景抖動的全範圍狀態仍未驗**，不得以本報告統稱四圖視差已通過。

未執行 build、tests、package、全地圖巡查或 boss case。工作樹 `src/render/index.ts` 在本次範圍內首次狀態檢查時已顯示 modified；本 owner 沒有修改 source，也沒有修改凍結 dist。

## 證據檔

- 起始 1280×720：[gallery-1280-q70.jpg](../../artifacts/overnight-20261026/motion-review/gallery-1280-q70.jpg)
- 跟隨移動後 1280×720：[gallery-follow-1280-q70.jpg](../../artifacts/overnight-20261026/motion-review/gallery-follow-1280-q70.jpg)
- 暫停後 960×640：[gallery-resize-960-q70.jpg](../../artifacts/overnight-20261026/motion-review/gallery-resize-960-q70.jpg)
- 唯一 browser harness、server logs 與 ownership record 均在 `artifacts/overnight-20261026/motion-review/`。
