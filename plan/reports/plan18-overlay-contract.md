# Plan18 W02：overlay 直接鄰居驗收契約

2026-10-28（Asia/Hong_Kong）。

**狀態：`PROCESS_DOCS_DELIVERED`。** 本包只交付後續必要 QA 使用的局部視審配方；本輪沒有改 CSS／source、啟動 browser、重拍畫面、測試、build、pack 或發布。操作步驟見 [overlay-review.md](../../tools/qa/overlay-review.md)。

## 契約

啟動條件限定為使用者明確要求局部視審，或修改了相關浮層的定位、換行、顯示狀態且主代理具體判定遮擋風險。沒有相關變更就沿用 beta24 的指定 640×360 portal 所見結果；不把歷史結果改寫為新候選驗收，也不因約 2px 間距、規則命中或未驗尺寸判 bug。

同一局部範圍是 `.ms-profile`、`.ms-interaction-hint`、`.ms-toast`、`.ms-action-bar`／當時可見的 Z、Space 操作按鈕、`.ms-quickbar`、`.ms-footer`。主判是實際畫面中的全文可讀、無裁切／省略、文字與可見操作控制不相交。若一張同畫面和一組 rect 已足夠，即停止；不逐節點拍圖。DOM scroll/client／rect 只輔助定位，不能單獨宣稱實畫 PASS。

每筆必要視審記錄 candidate、實際 iframe viewport 與遊戲 UI container 尺寸、device scale／browser zoom／字型環境、hint target key、完整 hint/toast 文案、panel 狀態、fixture／合成前置與其後正常操作的界線。合成狀態不代表正常玩法已完成；QA 使用隔離 origin，不觸碰玩家資料。

`.ms-toast--top`、無 hint、一般尺寸先靜態確認是否受變更影響，無影響不增加 browser case，變更到相關分支才追加一個直接 case。設計列明 960×540／640×360；本計畫不新增尺寸矩陣。320px body min-width、460px container rule 與任意正尺寸 renderer helper 都不是更小 UI 支援承諾。C01 仍延後，須有明確指定尺寸、適用的最小 iframe 尺寸／平台實際 viewport，或可重現且屬既有 desktop 支援環境的裁切證據，才由指定 Terra 觀察一個最小新增 case；640 PASS 不重跑。

新缺陷先由主代理判定 source、QA harness、執行環境、尺寸契約或前置錯誤。只有確認 source 缺陷後才依授權另行處理；QA error 不直接派遊戲修復。

## beta24 歷史基準與界線

2026-10-28 的 [beta24 browser recovery report](base-experience-browser-recovery.md) 記錄：指定候選 `1.0.0-beta.24`、隔離新 origin、validator 接受的 format 5 `camp/right` 合成 fixture、640×360 viewport；正常 Continue 後看見 portal hint，再正常按一次 Space 顯示門檻 toast。hint target key 為 `portal:camp:east`。當時畫面中的完整文字為：

- hint：`Space 前往：木葉鎮｜向森芽接取並完成「第一次出發」後才能前往木葉鎮。`
- toast：`向森芽接取並完成「第一次出發」後才能前往木葉鎮。`

報告所記 rect（x、y、寬、高）如下：

| 元件 | beta24 640×360 rect |
| --- | --- |
| profile | `(12, 12, 285, 151)` |
| portal hint | `(438, 111.78, 158, 58.17)` |
| toast | `(12, 172, 616, 26)` |
| Z／Space action bar | `(12, 200.5, 131.34, 30)` |
| quickbar | `(12, 238.5, 298, 77)` |
| footer | `(12, 325.5, 616, 22.5)` |

該次 hint→toast 約 2.05px、toast→actions 約 2.5px 的正間距，是**有日期及特定前置的歷史參考**，不是通用 golden、最低間距或本期調整理由。該 PASS 只涵蓋該 beta24 候選、viewport、fixture 與實際觀察短段；不代表正常 NPC／portal 行走、任務完成、傳送、其他尺寸／字型／縮放、全回歸或發布驗收。Plan17 尺寸表以 960×540 為主並列 640×360 的一次視審參考，不能將它轉述為 beta24 portal 同 case 的 960×540 PASS。

## Source 與決策依據

- [Plan18 §1／W02／C01／§8](../18-development-feedback-improvements.md)：固定遊戲 ID `brightwood-first-oath`、desktop、Lv30、讀格式 1–5／寫 5 與既有玩家資料；保留 dirty、QA 原件及凍結候選。未驗不得稱 PASS，不改裝置宣告或發布。
- [Plan18 F04/F05 feedback](plan18-agent-feedback.md)：F04 要求把直接鄰居與完整操作一同觀察；F05 表明 640 是目前實畫範圍，更窄尺寸／字型／縮放沒有失敗證據。
- [Planning evidence](plan18-planning-evidence.md)：尺寸契約與 2026-10-28 selector／state 快照。`journal.css` 的 720×520 聯合 rule 在有 hint 時定位非 top toast；`index.ts` 由 `updateInteractionHint` 更新 hint visibility、文案及 `data-target-key`，由 `renderFooter` 更新 toast 文字／hidden／top branch。
- [Plan17](../17-base-game-experience.md)：其尺寸驗收段落以 960×540 為主、640×360 同進度看新卡片／小行／快捷欄，且不壓操作及保存 footer。
- [Plan18 status](../status.md#current-state)：本包接到 W00 建立的全局當前入口 `#current-state`。

## 跨包接線與收束

配方連到 W01 的 `tools/qa/browser-lifecycle.md`、W03 的 `tools/qa/fixtures/README.md` 及 W00 的 `plan/status.md#current-state`。交付檢查時 W01/W03 文件路徑均可解析，分別由其 owner 維護；W00 current-state anchor 亦已建立。W02 不新增 QA README 或全局 latest 入口。只有 C02 真正觸發時才由單一 Terra owner 使用該 run 的 profile／session／server、`run-record.md`、before/after raw、必要圖像及新 `plan/reports/plan18-<run-id>-review.md`。

本包執行的最小核對是靜態確認上述 selector／DOM state／CSS rule、歷史報告與尺寸來源，並確認僅新增兩個授權路徑。沒有執行 tests、tsc、browser、build、pack、validate，也沒有重拍已過畫面。未驗項、C01 尺寸觀察與任何新修復仍延後；W02 文件交付即停止。
