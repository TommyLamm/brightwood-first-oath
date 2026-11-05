# 夜間續作入口

**後續發布更新（07:36 HKT）：** 使用者另行要求建立 Release；[beta.85 GitHub prerelease](https://github.com/TommyLamm/brightwood-first-oath/releases/tag/v1.0.0-beta.85)已完成，Actions／完整 ZIP 驗證成功、下載附件 digest 一致。詳[發布報告](reports/release-beta85-20261106.md)。下方保留夜間工作當時授權與停止紀錄；排程未重建、未繼續開發或平台上架。

授權：在**本對話**持續改善遊戲體驗，可網路搜尋靈感，至2026-11-06 **05:50 HKT**。到時不開新項目，完成當前項目與必要測試再收尾。未授權發布。保留全部既有未提交修改。

## 最終狀態：已停止

**05:52 HKT，beta.85，dist/已建置。** 05:50 收尾訊息已收到；只完成當時已開始的操作說明修正，沒有新增功能項目。最終 manifest／版本一致性與 build 通過；beta.84 3 focused／typecheck 沿用。兩個一次性排程均已刪除，不再續作。[最終交接](reports/night-final-20261106.md)。

沒有本次待處理的已知失敗或外部阻塞。沒有發布、最終 ZIP、全回歸或新 browser；原存檔及全部 dirty 保留。下方為各小項實際結果，不是新的工作清單。

## 本輪結果索引

| 候選 | 改動／驗證 |
| --- | --- |
| beta.85 | [收尾](reports/night-final-20261106.md)：操作說明與預設／可選長按一致；manifest／版本檢查及 build 通過，不重跑未改範圍。 |
| beta.84 | [NPC 任務狀態](reports/npc-quest-status-20261106.md)：可交付優先、不只靠顏色；3 focused／typecheck／build，未新開 browser。 |
| beta.83 | [清空舊長按](reports/cleared-held-input-20261106.md)：9 focused／typecheck／build，未新開 browser。 |
| beta.82 | [標題繪製](reports/title-rendering-20261106.md)：visible=false仍active，typecheck／build＋四階段browser，0errors，已清。 |
| beta.81 | [守護說明](reports/guard-explanation-20261106.md)：共用加成、基礎／總防禦與獨立倒數；3新＋1既有／typecheck／build。 |
| beta.80 | [背包鍵盤](reports/inventory-keyboard-20261106.md)：3 focused／typecheck／build；限定headless六鍵焦點、右Ctrl預設1輪／hold3輪與停止、實際下跳500→517.33→600，0errors，已清QA。 |
| beta.79 | [滿包拾取](reports/pickup-capacity-20261106.md)：收得下的物優先、受阻提示／held不重試；10 focused／typecheck／build。 |
| beta.78 | [背景視差](reports/background-motion-20261106.md)：可選靜止／OS預設；5 focused／typecheck／build，營地相機／phase／重載QA，已清。 |
| beta.77 | [按住普攻](reports/held-basic-attack-20261106.md)：可選，預設single；12 focused／typecheck／build，beta.80補實機。 |
| beta.76 | [載入等待／恢復](reports/map-loading-20261106.md)：6直接相關案例／typecheck／build，刻意503重試browser；預期HTTP／console各1、無其他錯誤，已清。 |
| beta.75 | [地形導覽](reports/local-terrain-guide-20261106.md)：4 focused／typecheck／build，營地1280／640、移動不重建／未探索隱藏，已清。 |
| beta.74 | [模態焦點](reports/modal-focus-20261106.md)：背景inert／Tab循環；typecheck／build及21筆局部browser、面板焦點還原，已清。 |
| beta.73 | [長按鍵](reports/held-key-defaults-20261106.md)：repeat仍攔瀏覽器預設、不重複命令；7 focused／typecheck／build。 |
| beta.72 | [拾取提示](reports/pickup-hint-20261106.md)：同源90px／排除到期；11 focused／typecheck／build。beta.79擴充容量。 |
| beta.71 | [標題控制](reports/title-controls-20261106.md)：開始前隱藏header／按鍵提示；build；beta.74確認computed hidden。 |
| beta.70 | [閱讀字級](reports/reading-size-20261106.md)：裝置偏好；3 focused／typecheck／build及1920／1280局部browser，已清。 |
| beta.69 | [指定任務追蹤](reports/quest-tracking-20261106.md)：裝置偏好、完成回自動；13 focused／typecheck／build。 |
| beta.68 | [移動提示](reports/movement-hints-20261106.md)：攀爬／跳離／下跳、自訂鍵；8 focused／typecheck／build。 |
| beta.67 | [跳躍寬限／預輸入](reports/player-jump-20261105.md)：80／100ms、各排除／清除邊界及音效；focused／typecheck／content／build。 |
| beta.66 | [素材／NPC](reports/quality-pass5-20261105.md)：Plan52剩餘19環境原稿／26runtime新檔、7位NPC第二格腳位校正；10 focused／typecheck／content／build。 |

[beta.69局部實機](reports/night-beta69-qa-20261106.md)：森芽原位兩格、實際補跳／預輸入、提示與追蹤，已清QA。其他NPC是來源量測／GIF證據，不是全世界／全平台驗收。

## 排程／上下文

00:40 續作 heartbeat 與 05:50 收尾 heartbeat 均已觀察；05:50 後不開新項目，已完成當前文字項與建置。兩個排程 `11-6-00-40`／`11-6-05-50` 已由工具刪除（deleted），**不要重建或另開續作對話**。target 為 `01a1abfd-42b2-77e3-9c80-166e53cdf893`。

使用者希望每項乾淨上下文。無可呼叫compact工具；每項寫此短入口與獨立報告，系統壓縮／`/compact`後從此續作。不要重讀整個status歷史或全部圖片。完整log／原圖留workspace，AI審圖每次1–2張≤1280px／JPEG60–75。

## 約束／環境

- AGENTS最小驗證：不全回歸、不重複通過checks，純文字／CSS不預設browser。不用子代理。
- 新項目前網路取得Playroom範本及七份規格，最近03:15取得與已完整讀全文一致。固定ID、相對資源、SDK／工具不升級、存檔可讀1–5寫5。
- PATH Node24.19.0。後續使用既有 **24.22.1**：`C:/Users/Tommy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe`。保留早期檢查的原環境界線，不因切換而重跑。
- Browser headless:true，沿用一般使用者require_escalated已驗證路徑，不重演sandbox crashpad。獨立session／profile／output／port，只關本輪。CLI目前`C:/Users/Tommy/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/@playwright/cli/playwright-cli.js`，下次先確認；不下載重裝。
- **無活動browser／server**。最近title-beta82-20261106-01及43796程序／listener0，owner合成存檔已清。
- 不commit／push／tag／Release／平台發布，不動真玩家資料。ZIP／平台／帳號／雲端／高DPI未全面驗收。
