# Plan16 W03-02・beta.20 霜松航標位置視覺取證

日期：2026-10-27（香港時間）  
狀態：**NORMAL_UI_INSPECT_CONFIRMED／SOL_VISUAL_PASS（限本1280×720構圖）**。Luna只作正常操作與取圖；以下畫面結論由沿用的原 Sol High 提供。

原Sol審核追加：名稱「霜松航標」在約x723–802／y156完整可讀，距右手帳左邊約140px，解除先前此構圖的名稱遮擋PARTIAL。石碑底座與hero腳底同接平台頂面約y344，沒有明顯懸空／穿地；hero在碑右約60px，梯頂更右側約x855，石碑未遮梯頂。輪廓／刻紋／底座在藍白雪景可辨，既有素材重用合理，不需新素材或補圖。此結論不外推640、其他攝像位置、任務全程或音訊；詳[同Sol原報告](world-completion-visual-review.md)。下文取圖時的「待審」是階段記錄，由此追加結果更新。

## 範圍與規格

- 只確認凍結 beta.20 中既有 `frost-route-marker` 新位置的單一梯頂視角；不改 source、版本、候選、存檔格式或舊玩家 profile，不建立新計畫，不發布。
- 開始前完整閱讀根目錄 `AGENTS.md`、Playroom `game-agent-template.md` 與列出的七份 `main` 規格（`game-development.md`、`command-contracts.md`、`game.schema.json`、`game-release.yml`、`playroom-sdk.js`、`sdk-versioning.md`、`save-compatibility.md`），並閱讀 Playwright skill／CLI references、`world-completion-marker-readability.md`、`world-completion-frost.md`、`world-completion-candidate-beta20.md` 及 live-handoff 最新段。
- 本次適用要求：只使用 root 凍結的 beta.20；以真實 Playwright browser 開啟版本／預覽子目錄及跨來源 iframe，sandbox 為 `allow-scripts allow-same-origin allow-pointer-lock`，iframe permissions 為 `fullscreen; autoplay; gamepad`；所有角色移動及調查均走正常 UI。只在全新空 profile 用合法 canonical fixture seed 一次，明列它是合成前置而非從零通關。不讀寫 Phaser／scene／actor 私有 runtime state，不 teleport、不改 HP、不補血、不重載補狀態。保留 raw／單張必要 JPEG，待原 Sol 審圖。

## 候選與隔離環境

- 使用 b13 已凍結候選 `artifacts/world-completion-beta20/dist/`，版本 `1.0.0-beta.20`。b13 的 build／pack／full ZIP validate 已通過；本取證沒有重跑。
- Host origin：`http://127.0.0.1:26341/`；game origin：`http://127.0.0.1:26340/preview/beta20/index.html`。兩者不同 port；新 host iframe 使用上述 sandbox／permissions，server 將 `/preview/beta20/` 映射到凍結 dist。
- Playwright session：`world-marker-visual-b14`；專用 persistent profile：`output/playwright/world-marker-visual-b14/profile/`。新 game origin 的 `brightwood-first-oath:save:v1` 初讀為 `null`。只將 fixture 寫入此空 profile 一次，reload 後用遊戲標題的「繼續冒險」正常載入。
- Fixture 複本：`output/playwright/world-marker-visual-b14/seed-fixture-format5.json`，1402 bytes，SHA-256 `d64e4b0311ccd1d028fbdb65484372fb939c3ade438444f589588c8b141ef6fe`。合成前置為 q01–q10 claimed、q11 active／warden 0、q21 active／marker 0、Pine/right（右側地面 spawn）；不是從零進度，也沒有預設 q21 已完成。

## 正常 UI 操作與 HUD/raw 結果

- 標題頁按「繼續冒險」後，角色 `Frost QA B6` Lv.30 劍士，HUD 初始 HP 712/712、MP 98/98、金幣 5,750；q21 航標 counter 0，q11 首領 counter 0。
- 從 fixture 的 right spawn 以方向鍵正常向左接近梯，按上爬梯，再短步向左靠近航標；時間只用既有移速與地圖幾何作有界估計，沒有讀座標或假稱精確世界位置。每次移動均 release 按鍵並用遊戲 HUD pause 確認。
- 在梯頂按一次 Space 開啟「霜松航標」對話，然後只按一次對話內「調查航標」；HUD 任務卡變為「風雪中的航標／任務完成，向雪芽回報」，對話顯示「航標方向已記錄。回雪痕海岸找雪芽報告。」沒有回程或領獎。
- 調查後 raw 顯示 format 5、q21 仍 active 且 `frost-route-marker: 1`；q11 仍 active 且 warden 0。HP 為 680/712、MP 98/98、金幣 5,750、大紅藥水 24、大藍藥水 18。HP 在正常 UI 操作期間由 712 降至 680；原因不另作判定，未使用藥水或手動改血量。

| 證據 | 檔案 | SHA-256 |
| --- | --- | --- |
| 調查前 canonical raw（q21 marker 0） | `output/playwright/world-marker-visual-b14/before.raw.json`（1402 B） | `d64e4b0311ccd1d028fbdb65484372fb939c3ade438444f589588c8b141ef6fe` |
| 調查後 canonical raw（q21 marker 1） | `output/playwright/world-marker-visual-b14/after.raw.json`（1402 B） | `62d36b1157fd80e7496796643d79eb5bed7728ac0e5ef59f34366135798ef305` |
| 梯頂航標場景單張 JPEG | `output/playwright/world-marker-visual-b14/world-marker-scene.jpg`（174,905 B，1280×720，JPEG quality 70） | `36599598a7a49df2edc26dacade1a91ed8772aeb6e703915a64596fa795ea503` |

JPEG 在 HUD 暫停狀態先按遊戲內「繼續遊戲」，等 160 ms 後截取；截取 finally release 方向鍵／Space 並按 HUD pause。browser 回報 pause heading 存在；沒有用暫停 overlay 圖冒充角色場景。截圖未由本代理目視審查，請原 Sol 只判新 marker 名稱／輪廓與右上 tracker 的可讀性。

## 清理與限制

- 自有 Playwright session 已關閉；browser PID 34484 已退出。自有 Node server PID 30556 已停止；26340／26341 listener 已清空。專用 profile、raw、JPEG 及自有 harness／owner 記錄保留於上述 output 目錄，供原 Sol／root查看。
- CLI console 記錄中三筆 HTTP 400 是初次 raw 傳送時 harness evaluate 參數錯誤；修正後 before／after raw 均以 201 寫入並核對 SHA。初次 root host 路由另有一次 favicon 404，改用預覽子目錄 host 後已以 204 處理；beta.20 Phaser 資源正常載入。這些是本地取證 harness 輸出，不作候選遊戲錯誤結論。
- 未執行 source tests、build、pack、full regression、額外地圖視角或其他 UI／任務案例。原Sol其後只確認本張1280構圖的名稱可讀／避手帳與石碑位置合理；其他尺寸、攝像位置及任務全程未由此包驗證。
