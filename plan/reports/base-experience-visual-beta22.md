# Plan17 beta.22／23 新增介面視覺檢查（已收束）

最新續驗：beta23動作／排隊／冷卻修復所見通過；後續beta24 portal toast修正亦在恢復Chrome後640實畫PASS（所見），全文及提示／操作鈕／底欄無互遮。相同Node／CLI／Chrome在sandbox仍crashpad退出、一般桌面權限成功，支持環境權限／IPC差異；詳[恢復與beta24視審](base-experience-browser-recovery.md)。沒有全回歸或重測已過項，下方各階段原始證據與當時限制保留。

2026-10-28（Asia/Hong_Kong）。本報告記錄 beta.22 凍結候選的有界視審，並保留本輪獨立 QA 環境待修正版複驗；不是完整功能回歸或正式平台驗收。候選為 `artifacts/base-experience-1.0.0-beta.22/dist/`；依主代理已完成的封包證據，ZIP SHA-256 為 `7e35b289fddb96b2f3d6d42e1e2665a53735ea4575430025f31ab4cb638462ef`，本輪未重算。

## 方法與前置

- 讀取 `AGENTS.md`、`base-experience-handoff.md`、`base-experience-ui-integration.md`、`base-experience-browser.md` 及 Playwright 技能與 CLI 參考。主代理已讀線上規格並下發本輪適用摘要。只檢查新增 UI 與直接周邊，不執行 tests／typecheck／build／pack 或整體回歸。
- 使用獨立 Chrome session `base-experience-visual-beta22-b6` 和新 profile，host `127.0.0.1:26443` 與 game `127.0.0.1:26442/preview/base-experience-visual-beta22/` 為跨來源子目錄 iframe；sandbox `allow-scripts allow-same-origin allow-pointer-lock`，allow `fullscreen; autoplay; gamepad`。新 game origin 的 canonical key 原為 null，僅一次種入先前經 `createPersistence.initialize()` 驗證的合成 format5 QA 存檔（camp/start、Lv30、HP580/660、MP6/98、小紅1／大紅1、無任務）；此為前置，不是正常進度或正式雲端驗收。證據見 `seed-and-reload.log`、`before.raw.json`。
- 完整截圖及原始紀錄在 `output/playwright/base-experience-visual-beta22/`。審圖使用同目錄 JPEG 縮圖／局部，最長邊不超過1280px、品質70。

## 已審視結果

| 項目 | 結果及限制 |
| --- | --- |
| NPC提示，實際遊戲 960×540、640×360 | **PASS（所見範圍）**。短按右方向後 `.ms-interaction-hint[data-target-key="npc:guide"]` 顯示「Space 互動：森芽」；兩尺寸文字有對比，未與世界畫面、底欄或保存狀態重疊。圖 `01-npc-before-960-review.jpg`、`03-npc-potion-640-review.jpg`。任務追蹤與原 toast 同時存在時尚未驗。 |
| 恢復卡，合成事件視覺診斷 960×540、640×360 | **PASS（版面）**。對公開 `window` 發送合成 blur/focus，觀察 `.ms-screen-card--focus-resume` 的標題、說明、繼續／返回均完整；卡片居中、保留邊距，footer 在卡片下方。640卡為 x100 y44.19 w440 h271.63、footer y323.5；960卡 x260 y134.19 w440 h271.63、footer y497.5。圖片 `04-resume-diagnostic-640-review.jpg`、`05-resume-diagnostic-960-review.jpg`；這不是實際 OS 失焦或恢復功能 PASS。 |
| 排隊狀態，實際遊戲 960×540 | **FAIL**。普通攻擊後立即按重斬；DOM 的 `[data-quick-slot="heavy-strike"] .ms-quick-slot__state` 為「已排隊」，但 box 1×1、`clip-path: inset(50%)`，實際圖上不可見。圖 `02-action-960-review.jpg`、紀錄 `action-visual.log`。`journal.css` 將狀態預設隱藏，只有 unavailable／buff 例外；動作中同樣無顯示 class，但本輪不重複追證。 |
| 冷卻、MP不足，實際遊戲 640×360 | **FAIL（冷卻完整性）**。小紅使用後，大紅冷卻 DOM 為「冷卻 1.0 秒」，圖上顯示「冷卻 1…」，數字及單位裁切；重斬「MP 不足」可辨。圖 `03-quickbar-crop-review.jpg`、紀錄 `potion-visual.log`。 |
| 小紅切大紅，實際遊戲 640×360 | **PARTIAL**。同一 `[data-quick-slot="small-red"]` 的 `data-item-id`、label、aria、title、icon alt/URL 均由小紅同步更新為大紅；六格保留。冷卻後數量視覺與 fallback 尚未驗；切換立即顯示冷卻但文字裁切如上。 |
| portal 長提示與 toast，實際遊戲 640×360 | **FAIL**。獨立空 game origin `127.0.0.1:26444` 一次種入經 `createPersistence.initialize()` 驗證的合成 camp/right spawn fixture（`portal-fixture-validator.log`，SHA-256 `4e55c8c1a8ef4c1078c46be6de7ff28b19cb10b132278761dfe3fe82e7c6fb00`）；不是從 NPC 走到此處，也沒有傳送。正常按一次 Space 觸發原有門檻 toast。長 `.ms-interaction-hint[data-target-key="portal:camp:east"]` 的第三行下半部被 `.ms-toast` 遮蓋；前者 rect x438 y111.78 w158 h58.17，後者 x160 y160.31 w320 h57.69。見 `06-portal-toast-640-review.jpg`、`06-portal-overlap-crop-review.jpg` 與 `portal-visual.log`。640 footer 未與 toast 相交。960 同狀態 DOM 幾何顯示兩者分開，但沒有另取圖審視，視覺 **UNVERIFIED**。 |
| 任務追蹤、其他快欄狀態與 fallback | **UNVERIFIED**。目前兩種尺寸 tracker 都因短 viewport 高度未呈現；沒有做長刷或變造任務。 |

## 修復交接與目前環境

已即時向主代理交付三個視覺缺陷與最小修法建議；主代理已派修並規劃獨立 beta.23，沒有覆寫 beta.22。修後複驗動作／排隊可見、640 冷卻完整，以及 portal 提示與 toast 不遮字和直接周邊；已過的恢復卡與 NPC 不重拍。

目前 portal 畫面已正常放開測試按鍵、透過遊戲暫停鈕停在「冒險已暫停」，原 QA raw 已存 `after.raw.json`，portal raw 存 `portal-before.raw.json`／`portal-after.raw.json`（`portal-pause-export.log`）。本輪專用原 server PID 34500（26442／26443）及 portal server PID 33572（26444／26445）／session 暫留供後續短段；本輪結束時須先正常放鍵／暫停、記錄 QA raw，核對完整命令列、profile 與 ports 後僅關自己的資源。不得以舊 PID、close-all 或 blind kill 清理。


## beta.23 修正版有限複驗

主代理提供 `artifacts/base-experience-1.0.0-beta.23/dist/`。實際 game iframe 內讀 `game.json` 確認 `brightwood-first-oath`／`1.0.0-beta.23`（`beta23-seed.log`、`beta23-portal-seed.log`）。分別以新的空 game origins `26446`、`26448` 各一次種入前述 validator-accepted camp/start、camp/right QA 前置；host ports 為 `26447`／`26449`，仍為相同 sandbox iframe。portal case 是獨立合成前置，不是從 NPC 正常行走或完成傳送。以下均是實際遊戲短段視覺檢查，不代表完整功能回歸。

| 指定修正 | beta.23 實際結果 |
| --- | --- |
| 「動作中」，960×540 與 640×360 | **PASS（所見）**。各短按一次普通攻擊，重斬格 `has-action-feedback` 顯示「動作中 0.6秒」，兩行完整落在原格內，狀態 box scroll/client 尺寸相等、clip-path 為 none。圖片 `beta23-action-960-review.jpg`、`beta23-action-640-review.jpg`，紀錄 `beta23-action.log`。 |
| 「已排隊」，960×540 與 640×360 | **PASS（所見）**。各新來源分別一次普攻接重斬，狀態可見且在原格內，clip-path none；圖片 `beta23-queued-960-review.jpg`、`beta23-queued-640-review.jpg`，紀錄同名 `.log`。 |
| 小紅轉大紅及 640 冷卻 | **PASS（所見）**。正常用掉一瓶小紅後，同一格的 ID、label、aria、title、icon URL／alt 更新為大紅；畫面以兩行完整顯示「冷卻 1.0秒」，未跨格，footer 未受阻。冷卻後 DOM 恢復「×1」，該數量階段沒有另截圖審視；fallback 仍未驗。圖片 `beta23-potion-640-review.jpg`，紀錄 `beta23-potion.log`。 |
| portal 長提示與 toast，640×360 | **PARTIAL／新缺陷**。提示與 toast 均完整可讀且互不遮蓋（hint x438 y111.78 w158 h58.17；toast x14 y160.31 w320 h57.69）；然而左移後 toast 遮住「Z 拾取」與「Space 互動」按鈕上方約17.5px，按鈕 y200.5 h30、toast 底 y218。footer 和快捷格未被 toast 遮蓋。圖 `beta23-portal-toast-640-review.jpg`，紀錄 `beta23-portal-visual.log`／`beta23-pause-export.log`。已即時回報主代理，不能標示操作無遮擋 PASS。 |

當時 beta.23 兩個 QA 畫面已放開測試按鍵並正常暫停，各自 raw 已存 `beta23-before.raw.json`／`beta23-after.raw.json`、`beta23-portal-before.raw.json`／`beta23-portal-after.raw.json`。當時記錄的伺服器 PID 31992（26446／26447）與 27912（26448／26449）及前述 beta.22 自有環境的續接狀態見下節。

## beta.23 640×360 臨時 CSS 診斷續接（未執行）

2026-10-28 後續續接時，Playwright CLI 的 `base-experience-visual-beta22-b6` session 顯示已關閉；sandbox 內未觀察到原記錄程序。HTTP 連線受 sandbox socket 權限阻擋，不能將其視為外部服務狀態的獨立證據。沿用既有 portal 伺服器腳本成功重新綁定 26448／26449（本次執行 session 54055），未刪除或重種原 profile 的 canonical 存檔。嘗試使用相同隔離 profile、Chrome headed 模式重新開啟 session 時，Chrome 的 crashpad 報告 named pipe 結束、crash server failed to launch，瀏覽器自行退出。經主代理允許，另以全新隔離 `profile-b8`／`base-experience-visual-beta22-b8` 作一次啟動，亦出現同一 crashpad 錯誤並自行退出；完整日誌 `beta23-portal-fresh-b8-open.log`。因此未取得遊戲畫面，也未 seed、發送按鍵、注入臨時 CSS、測量新 rect 或拍攝新圖。沒有進一步排查 OS 焦點或瀏覽器環境。此結果不影響上表先前實際觀察，亦不構成修正版或臨時排版 **PASS**。

依主代理收束指示，不再啟動 browser 或進行本輪診斷；beta.24 的實際畫面 **UNVERIFIED**。本次直接向自己啟動的 session 54055 傳送 Ctrl+C 結束 portal 服務，沒有以 PID 清理任何舊程序。Playwright CLI 現列出 `(no browsers)`，兩次 Chrome 啟動日誌均記錄該次程序退出；記錄的舊 PID 在 sandbox 的程序查詢中未出現，CIM 命令列查詢遭拒，故未對舊 PID 進行操作。收束後 `netstat` 未列 26442–26449，且同一 sandbox 中八埠逐一可綁定；HTTP 客戶端仍受 sandbox socket 權限阻擋，故此是該環境內證據而非全主機保證。詳細清理紀錄 `beta23-b8-cleanup.log`。所有原始截圖、fixture、raw 和兩個 QA profile 保留於 `output/playwright/base-experience-visual-beta22/`。
