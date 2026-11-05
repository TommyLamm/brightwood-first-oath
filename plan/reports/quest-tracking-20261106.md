# beta.69・指定追蹤任務

2026-11-06 00:12 HKT，`brightwood-first-oath`，本機`1.0.0-beta.69`，成品`dist/`，bundle`assets/index-CY2WzHKA.js`。

冒險手帳的可接取／進行中／可交付任務新增「追蹤這項任務」。指定後HUD維持該任務，不被其他可交付任務搶走；可按「停止指定追蹤」恢復原先ready→active→available自動順序。已領獎、鎖定或不存在的選擇在載入實際角色任務清單後清除，未載入角色的標題畫面不清除偏好。

沿用裝置偏好儲存方式，使用`<gameId>:ui:tracked-quest:v1`，不寫角色、雲端或存檔格式。儲存失敗時本次畫面仍可指定／停止。保留收合偏好；HUD查看按鈕及tooltip標示指定追蹤。手帳按鈕有aria-pressed，切換後恢復按鈕焦點。

設計參考[Game Accessibility Guidelines：遊玩中保留當前目標提醒](https://gameaccessibilityguidelines.com/indicate-allow-reminder-of-current-objectives-during-gameplay/)，本次選擇讓玩家指定想完成的任務，沒有新增任務或自動接取／交付。延續同一夜間工作已完整讀取的Playroom範本與七份main規格；ID／SDK／讀1–5寫5相容性契約沿用。

`src/ui/quest-tracker.test.ts` **13/13一次通過**，含指定優先、可交付保持、領獎／無效選擇回退、裝置偏好隔離、不改存檔、儲存受阻及原收合／進度行為。typecheck、一次build及相關`git diff --check`通過。本項沒有改內容表，不重跑content check或全回歸。

未開瀏覽器，因此新增手帳按鈕的實際排版、焦點與跨重載操作尚未驗；準備在一次有限的無頭檢查中與NPC／跳躍項目一起觀察。沒有發布、commit或操作玩家存檔。現有Node24.19.0限制沿用。
