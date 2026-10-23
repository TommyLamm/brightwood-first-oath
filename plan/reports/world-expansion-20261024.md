# 霜雪群島擴充交接與進度

更新：2026-10-24（香港時間）。本報告是本輪續作紀錄，狀態板見 ../status.md。

## 本輪任務與範圍

使用者授權持續擴充關卡、怪物與世界地圖未開發區域。首批先開放霜雪群島，同時保留原有 q01–q08 主線、桌面單人劍士和既有存檔格式。舊版「七圖、六普通怪」是首版範圍，已由本次明確擴充授權覆蓋；本輪不修改雲端／排行榜契約、不提高等級上限、不發布或推送。

## 開發規格與驗收

已讀取根目錄 AGENTS.md、本專案線上模板及其七份指定規格：

- https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md
- docs/game-development.md
- docs/command-contracts.md
- templates/game.schema.json
- templates/game-release.yml
- examples/starter/playroom-sdk.js
- docs/sdk-versioning.md
- docs/save-compatibility.md

另參照 plan/README.md、plan/10-asset-spec.md、plan/status.md 與 imagegen skill。適用要求：素材與 manifest 使用入口相對 URL、保持跨來源 iframe／子目錄相容、維護舊存檔相容；沒有使用者授權不得建立 Release、tag 或平台上架。最小驗收是新增地圖可由 q08 已領獎存檔抵達並返回，world map 能列出地標，舊格式存檔可以記錄新地圖位置，素材 manifest／世界內容／型別及相關測試有效。

## Stage A：雪痕海岸路徑與存檔相容

已新增 frost-shore「雪痕海岸」作為第八個正式地圖，接在 Guardian Arena。通往雪岸的 portal 要求 q08 狀態為 claimed（已完成並領獎）；回程 portal 不受任務鎖定。新地圖已加入 mapOrder、world landmark 和探索總數，霜雪群島從 planned region 移除，黃金沙海及遠古遺跡仍維持待開發。SaveData 格式及欄位沒有改動；測試驗證同格式存檔可以把 frost-shore 記為目前與已訪地圖。

雪痕海岸目前是無怪物探索地圖，不應宣稱已完成戰鬥內容。雪岸 sky/far/mid 三層環境圖已接入 frost theme 和 environment manifest，所有 URL 均相對於遊戲入口。

直接相關檢查結果：

- npm.cmd run typecheck：exit 0。
- npm.cmd run check:content：exit 0，rulesCatalog 與 worldCatalog 交叉驗證通過。
- .\node_modules\.bin\vitest.cmd run tests/world-map.test.ts tests/persistence.test.ts tests/integration/app-foundation.test.ts：exit 0，Vitest 輸出 9 files／74 tests passed；runner 實際回報檔案數比預期的指定檔案多，因此只記錄原始輸出，不宣稱僅執行三個檔案。
- git diff --check：exit 0；Windows Git 對少數 LF 工作檔提示下次會轉成 CRLF，無 whitespace error。
- 未跑瀏覽器、build、全套回歸或發布驗證。

Stage A 程式、focused tests 與狀態／報告 commit：f347c76（Add playable Frost Shore route）。素材接入 commit 已在 main：97be61e（sky，來源 commit 7121210）與 f632528（far/mid，來源 commit a5d86d3）。

## 後續實作

下一波以三張圖完成可遊玩的霜雪群島小區域：frost-shore → frost-pine-pass → frost-tide-cavern。新增霜牙雪狼 frost-wolf，Lv30 不超過現行玩家等級上限，並加入與其行為有差異的短距衝刺敵人，以及具有可躲預警的小首領。接著建立可手動領取與回報的區域挑戰，使 frost-fang 有收集及獎勵用途；完成後再集中接上道具圖示、地區卡插畫和必要的 UI／manifest。若任務或 item 資料需要演進，先保持舊格式存檔可載入。每階段只改明確擁有的檔案，明確路徑暫存並各自 commit。

## 代理、工作樹與素材狀態

- /root：主代理，規劃與協調，不直接改程式碼；要求主代理提供每批素材 prompt 指引，已對兩名素材代理提供規格。
- /root/game_expansion：程式、manifest、驗證、git 整合與本報告；工作樹在專案 main。
- /root/expansion_art：工作樹 .worktrees/expansion-art，branch codex/expansion-art。sky、far、mid 素材已分別提交 7121210、a5d86d3，已 cherry-pick 到 main 為 97be61e、f632528；霜狼 6×5 atlas 與其 source log 仍在製作。
- /root/frost_interface_art：branch codex/frost-interface-art，獨立 worktree 路徑待代理回報。霜牙 item icon、地區卡插畫與 source log 待提交。icon 檔需沿用既有 128×128 RGBA 檔，runtime manifest 顯示 32×32；region 插畫 960×540。
- 當前工作樹內有未追蹤 .worktrees/，是隔離素材代理目錄；提交程式時不要使用 git add .，只加入明確檔案路徑。

## 工具限制、續作與定時資訊

本機預設 shell 曾遇到無輸出的 PowerShell FileSystem provider 問題，node_repl 啟動超時。已驗證可行方式為使用 powershell.exe、login=false，以及窄範圍 require_escalated exec_command；不要重複大量同類失敗呼叫。functions.apply_patch 曾因長時間無輸出被終止且沒有部分寫入；後以小份 PowerShell 檔案替換成功。變更後需檢查 git diff，避免把 .worktrees/ 加入 index。

本聊天曾建立一次性 heartbeat automation 06-55-2：ACTIVE、COUNT=1，排程 2026-10-24 香港時間 06:55，目標是本聊天。建立時讀到帳戶五小時使用窗為 8%，該窗重設時間 06:51 香港時間；此數字是當時快照，不代表目前用量。

中斷後續作步驟：先讀本報告和 plan/status.md；核對 git status -sb、main HEAD 與未追蹤 worktrees；保留素材分支。Stage A 已提交 f347c76，素材接入已提交 97be61e 與 f632528；沿 Stage B/C/D 的小階段完成怪物、任務、UI 接線與最少必要檢查。不要推送、發 tag、建立 Release 或上架。