# Overlay 直接鄰居局部視審

本配方只供有明確理由的下一次局部視審使用，不是每次 CSS 變更的硬門檻，也不新增 viewport 矩陣。背景、beta24 歷史數值與未驗界線見 [Plan18 overlay contract](../../plan/reports/plan18-overlay-contract.md)。

## 啟動條件

只在以下情況啟動 browser 與圖審：

- 使用者明確要求這組浮層的局部視審；或
- 修改了這組浮層的定位、換行或顯示狀態，且主代理具體指出可能遮擋的原因與範圍。

沒有相關修改或新證據時，沿用 beta24 指定 640×360 portal 畫面的歷史所見結果；不可把它說成新候選或其他尺寸的 PASS。僅因 CSS breakpoint 命中、歷史間距約 2px，或一般更新需要「看一下」，都不構成啟動理由。

任何實際 browser／圖審由本次唯一指定的 Terra owner 操作與記錄。開始前先核對 [W01 browser lifecycle runbook](browser-lifecycle.md) 與 [W03 fixture provenance](fixtures/README.md)，並從 [plan/status.md#current-state](../../plan/status.md#current-state) 取得當前候選及範圍。W01/W03 文件尚未整合時，依主代理提供的當前交接，不自行建副本或推定候選。

## 觀察範圍與紀錄

同一畫面觀察以下直接鄰居：

- `.ms-profile`
- `.ms-interaction-hint`
- `.ms-toast`
- `.ms-action-bar` 及當時可見的 Z、Space 操作按鈕
- `.ms-quickbar`
- `.ms-footer`

一張同時涵蓋相關元件的畫面加一組 rect 通常足夠；不要為每個節點各截一張。先記候選 ID／版本與路徑、實際 iframe viewport 和遊戲 UI container 尺寸、device scale factor、browser zoom、作業系統／瀏覽器與字型環境。另記：

- hint target key；沒有 hint 時記「無」及原因。
- 完整 hint 與 toast 文案，不用省略號代替；元件沒有顯示時記「無」及原因。
- panel 是否開啟及 panel 名稱。
- fixture／合成前置的來源、版本或識別資料，以及哪些狀態由 fixture 提供。
- fixture 之後實際正常操作了甚麼、停在哪裡；清楚標出未做的行走、任務或傳送。

合成資料只能在本輪隔離 QA origin 作前置；不得載入或改寫玩家存檔。前置完成後用正常輸入觀察該段，不注入 CSS、不直接改 DOM 或遊戲 state，也不把合成前置說成正常遊戲流程已完成。

## 判定與停止

以實際畫面為主：完整文案可讀，沒有裁切、隱藏尾字或省略；可見文字沒有與 profile、Z／Space 操作按鈕、快捷列、footer 或目前開啟的 panel 控制相交。依當次實際可見狀態記錄，不因元件未顯示就推定已驗。

可附一組相關元素的 `getBoundingClientRect()`；scroll/client 尺寸及 rect 只作定位、診斷線索。DOM 數值不能單獨證明畫面可讀或宣稱實畫 PASS。只有保存的畫面確實涵蓋本次範圍，才把觀察結果標為該候選、尺寸、fixture 和操作短段的視覺結果；資料不足就標未驗。即使相鄰元素有約 2px 正間距，也不單憑間距判失敗。

先靜態檢查本次差異有沒有觸及 `.ms-toast--top`、無 hint 或一般尺寸分支。未觸及就不加 browser case；只在該分支被修改時追加一個直接 case。設計列出的 960×540／640×360 是本計畫的尺寸參考，beta24 portal 結果只限其實測 640×360。`min-width:320px`、460 container rule 或 renderer helper 能計算正尺寸，不代表更小 UI 已承諾支援；C01 啟動條件見 contract。不得自動加入更小 viewport 或字型／縮放矩陣。

一次畫面與一組 rect 足以判斷時即停止，不重拍未受影響表面、不做全回歸。完整截圖、raw 與長日誌留在工作區並於 run record 記路徑。供 AI 審圖時每次只載入必要 1–2 張，長邊不超過 1280px，JPEG 品質 60–75；透明圖先合成背景，只有縮圖無法判讀時才提供必要局部裁圖。

若見疑似缺陷，先交主代理分類為遊戲 source、QA harness、執行環境、尺寸契約或錯誤前置。QA 啟動／seed／DOM 觀察錯誤不能直接派遊戲修復；未驗不當失敗。真正的下一次 run 由 Terra 依 W01/W03 建立自己的 run record 與原件，必要時使用 C02 指定的 `plan/reports/plan18-<run-id>-review.md`，不覆寫 beta24 歷史證據。
