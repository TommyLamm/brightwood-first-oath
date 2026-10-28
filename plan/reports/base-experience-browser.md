# Plan17 B06：beta.21 瀏覽器短段收束

日期：2026-10-28（Asia/Hong_Kong）  
狀態：**PARTIAL／正常操作局部觀察；其餘未驗**。依主代理的最小驗證收束指令停止，沒有因環境限制延長測試。以下只描述實際開啟的 beta.21，不宣稱 beta.22 或完整遊戲通過。

## 候選與範圍

- 實測候選：`artifacts/base-experience-1.0.0-beta.21/dist/`，ID `brightwood-first-oath`、版本 `1.0.0-beta.21`。依 B05 [候選報告](base-experience-candidate.md)，ZIP SHA-256 為 `6b2fcc4437f82e7218682d407965449d2aa65f7b3a9d8ac0f4ee0f56dc79e8f2`，dist tree SHA-256 為 `3dbc499ea0ba165479702a51fe83f5eb41d2edd2126ac9339b6900437695ce40`；本包沒有重算整個候選或重跑 build／tests。
- 主代理提供 beta.22 為後續修正版，但本包沒有開啟或直接驗證 beta.22。beta.21 證據的可沿用範圍由主代理按實際差異判定。
- 本包讀取 AGENTS、Plan17 §3／B06／§6、交接／派工、B04 UI 整合報告及既有 beta.20 短 harness，並讀 Playwright 技能與所需 CLI references、Computer Use 技能與必要指引。線上讀取 Playroom main 模板及 `game-development.md` 的 iframe／子目錄／Esc／不可 mock 相關原文；本輪完整七份規格由主代理讀取。
- 瀏覽器是有視窗的 Chrome／Playwright，新 session `base-experience-beta21-b06`、新 profile，主頁與遊戲分別使用 `127.0.0.1:26343` 和 `127.0.0.1:26342/preview/base-experience-1.0.0-beta.21/index.html`。host iframe 使用 `sandbox="allow-scripts allow-same-origin allow-pointer-lock"` 及 `allow="fullscreen; autoplay; gamepad"`。配置目標為 960×540，但未另採集實際 viewport 尺寸或做佈局視審，不能將尺寸驗收標為通過。

## 合成前置與操作

由 `output/playwright/base-experience-1.0.0-beta.21/prepare-fixture.ts` 依既有 `world-ui-beta19-b4/fixture-builder.ts` 的方法建立獨立 QA format5 存檔，使用現有 `createPersistence.initialize()` 驗得 `ready`，確認返回資料相等且 validator 沒有寫入。fixture 為 camp/start、Lv30 劍士、重斬 rank 1、HP 580/660、MP 6/98、小紅 1／大紅 1、無任務；它是合成前置，不是正常遊戲達到的進度。`seed-fixture-format5.json` 611 bytes、SHA-256 `4288426d53e000d0b138fdc9d8bca95df9881c40df410dc7dfdb544d0049de31`。

新 game origin 的 canonical key `brightwood-first-oath:save:v1` 初次讀取為 `null`；只種入該 fixture 一次，reload 後以標題頁正常「繼續冒險」載入。此後只使用正常 UI／鍵盤及公開 DOM 讀取，未注入遊戲私有狀態、位置、HP 或任務，未讀寫原玩家 q08／Frost／Sand profile。

| 項目 | 實際觀察與限制 |
| --- | --- |
| NPC 目標提示 | canvas 焦點、`document.hasFocus()=true`、`visibilityState=visible` 且無恢復卡時，初始在 NPC 範圍外沒有目標；正常短按右方向鍵並放鍵後，小行顯示 `Space 互動：森芽`、`data-target-key=npc:guide`。沒有再做離開範圍的反向短移。 |
| Space 與同頁焦點 | 正常按 Space 後開啟標題為「森芽」的對話，與提示同名；對話的「接取任務」按鈕在同頁獲焦時，公開狀態為 hasFocus true、visible、恢復卡不存在。未接任務。 |
| 切離與恢復 | 一次 Playwright 新 tab／`bringToFront` 的嘗試，切離時遊戲 frame 公開值仍為 visible／hasFocus true，返回後也相同且無恢復卡，不能當作真失焦或恢復 gate 驗收。桌面控制只確認了獨立 QA 視窗的唯一標題；後續視窗狀態／啟動操作呼叫被中斷，沒有完成真切換證據。真 tab／window blur、回來仍凍結、明確 Continue 後再移動、panel 存在時 Esc 優先關閉與焦點 commit 回復均 **UNVERIFIED**；沒有合成事件冒稱真切換。 |
| 暫停 | 收束時放開本包使用過的方向鍵、Control、Space，透過正常「暫停遊戲」鈕觀察到「冒險已暫停」卡片；沒有量測暫停時的時間／位置，也沒有測 Esc。 |
| portal／技能／圖示 | portal 目的地與門檻、動作中／排隊／冷卻／不足 MP、圖示節點身份、小紅轉大紅及 error fallback 均 **UNVERIFIED**；沒有開始這些操作。 |
| 尺寸／視覺 | 沒有測試 640×360，沒有生成或審查截圖；恢復卡、互動小行、快捷列及保存 footer 的視覺佈局均 **UNVERIFIED**。 |

## 現況、console 與清理

收束前公開 HUD 為 HP `580 / 660`、MP `6 / 98`、森芽對話仍開、一般暫停卡顯示；canonical 本機 raw 以 host 端點保存為 `after.raw.json`，format5、611 bytes，與 `before.raw.json` 同 SHA-256（即 fixture 的 `4288426d53e000d0b138fdc9d8bca95df9881c40df410dc7dfdb544d0049de31`）。這只記錄當時實際 localStorage，不能證明正式雲端保存。精簡 HUD／暫停／raw 證據為 `final-hud-and-raw.log`；NPC／dialogue／focus 證據分別留 `npc-enter.log`、`dialogue-snapshot.log`、`tab-focus-gate.log`。

本次 CLI 收集的 console 檔只有兩筆 Phaser 啟動 `LOG`，未見該檔內的其他 console 異常；沒有完成 network／全部資源審核，不能外推全部素材正常。正式平台、真帳號雲端、實際音訊、原生／沉浸 fullscreen、完整玩法及舊任務仍未驗。

清理前以完整命令列識別專用 session daemon PID 23888、其 Chrome PID 33300 的獨立 profile，以及 server PID 31492 的專用腳本和 26342／26343 listener，記於 `ownership-before-cleanup.txt`。以該 session 的 `close` 關閉 browser，再核對 server 指令與兩個 ports 的 owner 後只停止 PID 31492。最後核對自有 browser／daemon／server process 與兩個 listener 均無剩餘；`profile/`、raw、日志與 harness 保留。實際結果見 `cleanup-status.json`；未操作其他 profile、服務或視窗。沙箱曾拒絕 loopback 且沙箱內初次 server 未存活，之後使用主機權限啟動上述自有資源。

沒有在本次已完成的局部觀察中確認新的 source 缺陷；未執行的項目不能推定正常。
