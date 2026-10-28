# Plan16 W04 黃金沙海收尾 b17

日期：2026-10-27（香港時間）
狀態：接續既有 `sand-resume-b10` session／原 profile 的唯讀接手檢查；遊戲操作尚未開始。

## 規格與範圍

已完整讀取 repo `AGENTS.md`、Playroom `templates/game-agent-template.md` 與其列出的七份 `main` 規格：`docs/game-development.md`、`docs/command-contracts.md`、`templates/game.schema.json`、`templates/game-release.yml`、`examples/starter/playroom-sdk.js`、`docs/sdk-versioning.md`、`docs/save-compatibility.md`。另已讀 Playwright skill 及本次需要的 CLI／workflow references。

本輪只閉環既有 Plan16 W04：沿用原存檔、session、profile、game／host origins 與 server；只用正常 UI 操作；以 actual localStorage raw 與 HUD 核驗，不用按鍵次數當命中證據；勝利後正常返程手動領 q22／q14、確認並接受 q15，正常進入 `ruins-tide-camp` 後保存 entry raw／HUD 即停止。沒有 source、版本、dist、ZIP、build、測試、pack、發布或新 plan 變更。

## 接手前狀態（由 b12 owner handoff 提供，待 b17 live 核實）

原 owner `world_sand_finish_b12` 記錄：session `sand-resume-b10`，profile `output/playwright/world-frost-beta19-b6/profile`，game `127.0.0.1:64669`，host `localhost:64670`，server PID 31500。b12 最後 raw SHA-256 `91eae9963f632b6e65e21c03e8a5275cd583fad8537dcc306f20ae11f180895d`；記錄狀態為 Altar、HP 358、MP 98、金幣 12420、大紅 3、大藍 11，q22 basin 1／甲蟲 2 ready 未領，q14 active 0／1，遊戲暫停且首領 attempt 尚未完成。b17 不假設這些仍是 live 現況，初次接手需只讀核對。

## b17 進度

- 已列出本輪讀取文件、規範要求與驗收條件。
- 等待進行 host-side 原 session／profile／browser／port ownership 檢查，再讀 live snapshot 與遊戲 save key。
- 下一步：保存 live raw 與 HUD；截一張未遮擋 1280×720、JPEG q70 當前圖交 root 原 Sol 審閱。從截圖開始到 Sol 回覆前不移動、不攻擊、不用藥水。

## 驗證

尚未執行遊戲操作或驗收。沒有修改遊戲程式或存檔。

## b17 live 接手核對（2026-10-27）

- Host-side ownership readback：PID 31500 為 `node.exe`，命令列對應 `serve-candidate.mjs`／`world-sand-resume-b10`；127.0.0.1 的 64669 與 64670 listeners 均由 31500 持有。原 profile 存在，10 個 Chrome process 命令列包含該 profile 路徑。沒有啟動、停止或切換服務／瀏覽器。
- CLI 在原 session 工作目錄讀取 `sand-resume-b10`；host `http://localhost:64670/`、game iframe `http://127.0.0.1:64669/index.html`。snapshot HUD 明示「冒險已暫停」、HP 358/712、MP 98/98、Lv.30、金幣 12,420、區域「日井祭壇」；任務提示為「日井旁的歇腳處／任務完成，向琉砂回報」。
- 從 game frame 只讀 `brightwood-first-oath:save:v1` 兩次，讀回逐字相同。精確原始字串保存於 `output/playwright/world-sand-closure-b17/altar-current-initial-paused.raw.json`（1,786 bytes，SHA-256 `91eae9963f632b6e65e21c03e8a5275cd583fad8537dcc306f20ae11f180895d`），與 b12 最新 raw hash 相同；沒有讀取／輸出位置或 actor runtime 欄位。
- 目前 canvas 及 viewport 均為 1280×720。當前 canvas 圖保存於 `output/playwright/world-sand-closure-b17/altar-current-paused-1280x720.jpg`（113,565 bytes，JPEG quality 70，SHA-256 `b44caa6ecddccf316dabd4656770328fd434c50087825c0c6dfd573c3c6e720d`）。原 Sol 指出 pause 面板仍遮住 boss 血條左側；完整比例不可讀，不能將它算作未遮擋血條的驗收證據。
- 截圖後保持凍結：沒有移動、攻擊、藥水、對話、繼續或重載。正等待 root 的原 Sol 對此張當前圖提供方向／血條判讀；收到回覆前不送任何遊戲輸入。

## 同一 q14 attempt：首個有界動作

原 Sol 建議的 350 ms Right → 全部放鍵 → 純 1 → 完整等待 1000 ms 已執行。立即回傳的 `pauseConfirmed` heading count 為 0；隨後 CLI snapshot 明示「冒險已暫停」，未再送輸入。snapshot HUD：HP 298/712（由 358 減 60）、MP 92/98（由 98 減 6）、金幣 12,420；沒有用 Q/W。此處只記 HUD 已讀的玩家 HP／MP，未讀 actor runtime 位置或 HP。

精確 localStorage 原始字串兩次讀回一致，保存為 `output/playwright/world-sand-closure-b17/altar-after-right350-heavy1-paused.raw.json`（1,786 bytes，SHA-256 `efbbaffeed764705b565d346aa75c425a99b27a6bff86a97f664c86eed7e7506`）。只抽取任務節點：q14 active、`sunwell-sentinel` 0；q22 active、Basin 1、甲蟲 2；q15 缺省。故此擊未達 q14 計數或勝利證據。keys released，當前以 snapshot 確認 pause dialog 可見。

下一段按 root 補充的 UI guard 執行：點繼續後先確認 pause heading count=0、公開 HUD「暫停遊戲」按鈕可用，條件不符則不攻擊；最多 3 次完整重斬，每次後等待 1000 ms；最後放鍵、pause heading count=1 再讀 raw。HP 低於 250 才用 Q，MP 低於 12 才用 W；不超過既有補給規則。

## 第二段與正常 Q 補給（同一 q14 attempt）

從 paused HUD 點「繼續遊戲」後，等待 pause heading hidden；確認 count 0 且 HUD「暫停遊戲」按鈕 count 1／enabled，才將 canvas focus 並動作。受上一次 boss hit（HUD HP 298→238）後，按 Sol／root 建議 Right 225 ms、放鍵、純 `1` 一次並等足 1000 ms。segment 結尾點 HUD「暫停遊戲」，await heading visible；keys released。HUD 為 HP 238/712、MP 86/98，表示 Q 門檻已觸發；localStorage 的 q14 仍 active／sentinel 0，未見勝利，不把 MP 消耗當命中。

按正常規則另做一次 guarded Q：heading visible 起始；繼續後 await hidden、確認暫停按鈕 enabled；Q 按鈕 enabled，正常使用 Q 後 HUD HP 438/712（238→438）、MP 86/98，再點 HUD pause 並 await heading visible。沒有用 W。Q 後 exact repeated readback raw：`output/playwright/world-sand-closure-b17/altar-after-short-followup-q-refill-paused.raw.json`（1,786 bytes，SHA-256 `11fd2e0aaef0ceb3b5062d9626839c929b1b52f69215fe17007bf3c7435edef1`）；q14 active／sentinel 0，q22 active／Basin 1／beetle 2，q15 缺省。故尚無首領勝利／任務領獎證據。

下一段仍需先 verify paused heading=1，再用同一公開 UI guard 點 Continue、await hidden、pause button enabled，最多依追擊需要 Right 200–250 ms 短步後純 `1`；每次至少等 1000 ms。任何 q14 counter 變 1 或勝利畫面立即停止攻擊，放鍵並用 HUD pause 收尾。HP<250 用 Q；MP<12 用 W（若兩者連用，間隔至少 1300 ms）。

## q14 正常勝利核對

後續最多三段的 guarded normal-play 操作在要求 pause heading visible 時逾時；我先停止所有戰鬥輸入並讀 snapshot。畫面為勝利 dialog「日井守衛已被擊敗！」，並提供正常「返回日井盆地」按鈕。這個明確勝利 dialog 本身凍結祭壇進程，不是死亡或 attempt 失敗；沒有重開、重 seed、reload 或額外攻擊。

勝利後 exact raw 已兩次讀回一致並保存：`output/playwright/world-sand-closure-b17/altar-q14-victory.raw.json`（1,786 bytes，SHA-256 `40595b79b4b6ad514891bc9b8a4ffe7a423c50bffc9599b73118d88b745fc2e7`）。raw 核實 q14 仍 active、`sunwell-sentinel` 1；q22 active 且 Basin 1、甲蟲 2；q15 缺省。此 counter 加上明確勝利 dialog 是 q14 成功證據；MP 消耗不單獨當作命中數。勝利 snapshot HUD HP378/712、MP74/98、金幣12,420、大紅×2、大藍×11。下一步已獲 root 授權：點「返回日井盆地」，正常沿 Dune 回琉砂；分別保存 q22／q14 領獎前後 exact raw，核實 q15 可見並正常接取，再按已知西返路線由 shore 南梯進 `ruins-tide-camp`，只保存實際 entry raw／HUD 即停。

## 正常由勝利祭壇返 Basin

勝利 dialog 的「返回日井盆地」已正常點擊；actual HUD map 為「日井盆地」，沒有 reload／restore。此後使用 HUD「暫停遊戲」按鈕並 await heading visible 停住。Basin paused raw `output/playwright/world-sand-closure-b17/basin-after-q14-victory-paused.raw.json`（1,786 bytes，SHA-256 `c985c5ab8464b73fea4a7b3ac5525df5c015f0339e04091003bc5bf540909447`），兩次 readback 相同；mapId `sand-sunwell-basin`，coins 12,420，q14 active/sentinel1，q22 active/Basin1/beetle2，q15 null。reward 前 bag 只核目標 item：large-red ×2、large-blue ×11；HUD 同樣顯示 HP378/712、MP74/98、紅×2／藍×11。接下來走正常 Basin→Dune→琥珀砂岸路線，不點「返回城鎮」捷徑。

## Basin 西側出口定位檢查

按 root 的正常路線提示，先向左 500 ms，再做四段 Left 4000 ms（每段前後均以 paused heading／HUD pause button 控制、release keys、核 HUD HP）；其後 Right 500 ms 並正常 Space 一次。公開 HUD 仍顯示「日井盆地」，沒有過門；因此先保留為傳送未發生，不能宣稱到 Dune。最後 HUD HP 270/712、MP74/98，未達 Q 門檻，未用藥。現在已 HUD pause。

失敗傳送後 raw 已兩次讀回一致：`output/playwright/world-sand-closure-b17/basin-west-gate-space-no-transition.raw.json`（1,786 bytes，SHA-256 `dcc7636389a3005f8bf55758694aad859654fb7267ea90d95df26913bc3f855d`）；mapId 仍為 `sand-sunwell-basin`，q14 active/sentinel1，q22 active/Basin1／beetle2，q15 null，coins12,420。

為這個實際未傳送狀況另拍一張未遮擋定位圖：`output/playwright/world-sand-closure-b17/basin-west-gate-position-1280x720.jpg`（1280×720、JPEG q70、139,596 bytes、SHA-256 `059093dbc9fbf3e79b995767b80c06108f125ab96c49ead7377ef9fa64b45a42`）。capture 前按 HUD Continue 並 await paused heading hidden／HUD pause enabled；capture 後立即 HUD pause 並 await heading visible。HP/Mp 未變，沒有輸入方向鍵或藥水。從 capture 到 root 原 Sol 提供新位置指引前，保持完全凍結，不移動、不 Space、不用藥。

## Sol-directed Basin portal approach retry

依原 Sol 對西門圖的建議，於同一 Basin 檢查點 guarded Continue、await pause heading hidden／HUD pause enabled，向左 2800 ms、完全放鍵後 Space 一次，並再次點 HUD pause／await heading visible。公開區域標籤仍為「日井盆地」，所以第二次也未觀察到轉圖；沒有宣稱已到 Dune。移動後 HUD HP 低於 250，依規則正常用 Q；HUD 回升至 433/712，MP74/98，目標大紅由×2→×1、藍仍×11。

目前 paused exact raw 兩次讀回一致：`output/playwright/world-sand-closure-b17/basin-after-sol-left2800-q-refill-paused.raw.json`（1,786 bytes，SHA-256 `dd86a9741e1c3bf14ca6603f43c6a3dcad10a65f45856d5cc6d917e2df5b645a`）。mapId 仍為 `sand-sunwell-basin`，coins12,420，q14 active/sentinel1，q22 active/Basin1／beetle2，q15 null；大紅×1、大藍×11。

不再盲試門或重複截圖；停在這個 paused Basin 檢查點，等待 root／原 Sol 決定是否需要新的可視定位或短互動方向。沒有移動、Space、藥水或攻擊。 

## Basin 西門延伸修正結果

按 root 明確指示，從上一個 paused Basin checkpoint 再 Left 4000 ms ×2（兩段各自鍵放開、HP 核對、HUD pause），然後 Right 900 ms、鍵放開、Space 一次。操作成功執行，但 actual 公開區域標籤仍是「日井盆地」；沒有 Dune transition。全段 HUD HP433/712、MP74/98、未用 Q/W，最後 heading「冒險已暫停」count1。沒有再截圖、開圖、查 source 或私讀 actor 位置。

此時已停止路線輸入並回報 root 等下一步；保留上一個同map／同任務 checkpoint raw，不把按鍵或傳點嘗試寫成 PASS。q14／q22目前仍可用原有 raw證據，手動 claim及q15／Ruins接縫尚未完成。

## Keyboard focus guard note

Root identified a keyboard-focus guard: after the pause heading becomes hidden, the page's pause-control button can retain focus and game keys may be ignored. Prior route scripts called `canvas.focus()` but did not perform a normal canvas click or verify `document.activeElement.tagName === 'CANVAS'` and `document.hasFocus()`. Therefore their movement durations are attempted inputs, not proof that the player moved; the unchanged map label cannot be diagnosed as a portal failure from those attempts. Current session remains paused in Basin. No repeated route keys are sent from this checkpoint; any later authorized segment must click the canvas and verify these public focus indicators before key input.

## Focus-verified Basin exit retry

按 root 指示改用標準 canvas click：每次 Continue 後 `page.bringToFront()`、正常 click iframe canvas，公開 DOM 核對 `activeElement.tagName === 'CANVAS'` 且 `document.hasFocus() === true`，再送鍵。該次核對在 Left4000 ms ×2 與 Right900 ms 前均成功；每段 release keys、HUD pause heading 確認，Space 僅按一次。最終公開 HUD 仍為「日井盆地」，HP433/712、MP74/98、未用 Q/W；現已 paused。這是有效焦點下仍未觀察到地圖切換，不將輸入時長當位移／傳點成功。等待 root 下一步，不再截圖或盲試。

### Read-only visible panel check after focus probe
- Queried public visible h1, h2, h3, and [role=dialog] nodes across the host and game frames only; no private panel/runtime state was read.
- The only visible dialog/heading is the game-frame pause dialog 冒險已暫停; the host frame has none. No world-map or other heading/dialog is visible. The game remains paused; this query sent no input.
- Raw DOM summary: output/playwright/world-sand-closure-b17/visible-panels-after-focus-probe.json.

### Current Basin location screenshot for visual review
- Followed the authorized flow: resumed from the pause dialog, waited for its heading to hide, clicked the game canvas, and confirmed public focus guard activeElementTag=CANVAS, hasFocus=true, visibilityState=visible.
- Released held movement/action keys only, waited 160 ms, captured one 1280×720 JPEG at quality 70, then clicked the HUD pause button and waited for 冒險已暫停 to return. No movement, attack, or potion was sent.
- Screenshot: output/playwright/world-sand-closure-b17/basin-current-after-left-probe-1280x720.jpg, 139427 bytes, SHA256 9e09c02d194f72294d0197f19a48e04bb190581818fc88ee141a46fb19384ba9.
- Current public pause heading count: 1. Scene location/door distance awaits Sol visual review; no route conclusion inferred from this screenshot by me.

## Closure completed in b17
- Resumed the existing sand-resume-b10 attempt and preserved its save/profile. The game is now paused at the first normal entry to ruins-tide-camp; no Ruins gameplay was started.
- Basin west exit: after the new public screenshot/review and corrected focus, Right 250 ms plus one Space transferred normally to sand-dune-pass. Paused raw: output/playwright/world-sand-closure-b17/basin-west-gate-right250-space1-paused.raw.json (SHA256 e2903078742d3aff16443e3dcf2f5edf60195c9cd0a65b59244af913c345c011).
- Dune return: four Left 5000 ms segments, each followed by key release and HUD pause; HP 433→399→362→362, with no potion needed. Right 500 ms plus one Space transferred normally to sand-glass-shore. Paused raw: output/playwright/world-sand-closure-b17/dune-west-to-shore-right500-space1-paused.raw.json (SHA256 16e4d5ac294b50e074b15573275de30d667fe318f2aaa30118cfd33411dd27a9).
- Shore return: three Left 5000 ms segments to the west side, then Right 1500 ms and Space opened Liusha’s public dialogue. HP ended at 252; no potion was used. Before q22 claim raw: output/playwright/world-sand-closure-b17/shore-liusha-approach-before-claims.raw.json (SHA256 5f296926566ca5d59777e5a5cd2143ffd3f071a6bd497bae1666523913617923).
- q22 was manually claimed by clicking the reward button inside the visible ARTICLE titled 日井旁的歇腳處. Before state is the preceding Shore raw. After state: q22 claimed, +600 coins, large-red 1→5, large-blue 11→13. After raw: output/playwright/world-sand-closure-b17/shore-after-q22-manual-claim.raw.json (SHA256 835f3edcfc4839e0c903345f791eca0d4e7da0cf215c570c4dee79cbfdaf964f).
- q14 was manually claimed by clicking the reward button inside the visible ARTICLE titled 日井守衛的誓約. Before state is the q22 after raw. After state: q14 claimed, +1800 coins, sunwell-oathblade ×1. After raw: output/playwright/world-sand-closure-b17/shore-after-q14-manual-claim.raw.json (SHA256 bd5c5405883dd174660f6a453f2cbeb8a474eaea42c73e6862ab228b0987ed97).
- q15 南方的錯拍 became visible after q14 claim and was manually accepted by its title-scoped 接取任務 button. Before state is the q14 after raw. After state: q15 active with ruins-tide-camp counter 0/1. After raw: output/playwright/world-sand-closure-b17/shore-after-q15-accept.raw.json (SHA256 bf3c16d1e68ab97e6d43f2a33b95ab731c5588ba9d563b33460aabd583926b03).
- From Shore, closed dialogue, moved Left 700 ms, held Up 1500 ms on the ladder, then used Space once at the south gate. The normal transition completed to ruins-tide-camp and q15 counter became 1/1. Entry HUD text and exact raw are saved at output/playwright/world-sand-closure-b17/shore-ruins-tide-camp-entry.public.json (SHA256 30221bf8e6c020dff6b716f3ff61671d9511cdae0dc41f6eda87036cd2eb4986) and output/playwright/world-sand-closure-b17/shore-ruins-tide-camp-entry.raw.json (SHA256 c19213aaa86ff76aacfbb67b92e3c2876d7e720f46387b427bf3395ecc5ca89c).
- Final paused state: map ruins-tide-camp; q14 and q22 claimed; q15 active with ruins-tide-camp=1; HP 252, MP 74, coins 14,820, large-red ×5, large-blue ×13, sunwell-oathblade ×1. No source/version/dist/ZIP edits, builds, tests, packs, or publication were performed.

### Resource cleanup
- Marked this closure resources_closed in output/playwright/world-sand-closure-b17/ownership-handoff.json.
- The CLI listed sand-resume-b10 with the original QA profile path. Closed only that session. Afterward its CLI daemon and Chrome profile processes were gone; the separate world-frost-q09q10-b15 session remained open.
- Rechecked PID 31500 command line and ports 64669/64670 immediately before stopping it: it was the task server at output/playwright/world-sand-resume-b10/serve-candidate.mjs serving artifacts/world-completion-beta19/dist, and both listeners belonged to PID 31500. Stopped that PID; the final process and listener query returned none for PID 31500 and ports 64669/64670.
- Kept the profile directory, saved raws, screenshot, public HUD record, and report. No close-all, no Frost 4176/4177 operations, no profile deletion.
