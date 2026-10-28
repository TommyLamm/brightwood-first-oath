# Plan17 最終交接：基礎遊戲體驗

2026-10-28 香港時間。**最新beta24 SOURCE_DELIVERED／ZIP_VALIDATED／LOCAL_ACCEPTANCE_PARTIAL；新增內容限定視審已收束，最後640 toast布局所見PASS，未發布。** 04:05一次性排程已在觸發後刪除，沒有後續排程。

## 新增內容視覺補驗與最新候選

使用者要求「派視覺驗證，檢查新增內容，不做全回歸」，並要求繼續驗證。唯一Terra6.1 Max分階段使用隔離QA profile、validator接受的合成format5前置與雙來源sandbox iframe；不是正常任務通關或正式平台驗收。主代理依實證分析，交全新Luna Max局部修正，沒有擴大玩法範圍。

| 表面 | 實際證據與最終界線 |
| --- | --- |
| 恢復卡、NPC提示 | beta22在960×540／640×360呈現通過限定視審。恢復卡以合成blur/focus事件展示，只證版面，真OS失焦／恢復仍未驗。 |
| 動作中、已排隊 | beta22發現state被1×1／clip隱藏；beta23補同優先序可見class，960及640實畫均通過，未改disabled／buffer。 |
| 冷卻文字、藥水圖示 | beta22的640冷卻被省略；beta23格內換行及緊湊秒數後完整可讀，小紅用盡切大紅的圖示／名稱／ID同步。冷卻後數量只核DOM，fallback未驗。 |
| 門檻hint與toast／操作鈕 | beta22兩提示遮字；beta23左移後互不遮字，卻蓋操作鈕約17.5px。beta24改窄短尺寸、有hint、非top toast為全寬緊湊通知；恢復環境後640實畫**PASS（所見）**，全文可讀，未遮profile、hint、操作鈕、快捷列或footer。toast實測(12,172,616,26)，hint下距約2.05px、操作鈕上距2.5px。 |

前次續接的兩個隔離Chrome在crashpad啟動階段退出；使用者再授權診斷及恢復後，Terra以同Node24.22.1、同快取CLI及Chrome對照：受限sandbox仍報TransactNamedPipe 0x6D退出，一般桌面權限成功啟動並完成beta24實畫。證據支持受限執行環境的權限／IPC差異，未證明更底層Windows機制；不是已確認遊戲缺陷或Node版本問題。沒有改系統安全設定或遊戲程式。已過項不重跑、不全回歸。詳[啟動恢復與beta24視審](base-experience-browser-recovery.md)、[beta22／23視覺報告](base-experience-visual-beta22.md)、[beta23修正](base-experience-visual-fix.md)及[beta24修正／封包](base-experience-toast-fix.md)。

最新候選：

- [beta24 dist](../../artifacts/base-experience-1.0.0-beta.24/dist/)；[beta24 game.zip](../../artifacts/base-experience-1.0.0-beta.24/game.zip)，131,523,016 bytes／274 entries。
- ZIP SHA-256 `6bd31bb852cd0290b73a82b47081d42df4398ef2d7fcf0c02439903a76fb7a97`；dist／ZIP逐檔tree同為 `3c4a6cca6e5f9f62d063db7b1d4e68a6798cf9c9fdf7044199760f0d9d4815e8`。
- beta24一次Vite build、固定tools1.2.0 pack及完整ZIP validate通過；14個文字entries有限掃描0命中，binary未掃。CSS-only沒有新增或重跑tests／typecheck／content；後續僅追加上述指定browser短段，原27 focused與beta23最後tsc結果沿用。

前次Terra只結束專屬server，sandbox內26442–26449清理證據見[原QA目錄](../../output/playwright/base-experience-visual-beta22/)的`beta23-b8-cleanup.log`。本次恢復另用新profile及26450／26451，先放鍵、正常暫停並保存before／after raw，再依完整命令列核實後關閉專屬session／Chrome／daemon及server；查無本輪匹配程序，兩埠不再LISTENING，全部子代理完成。詳[恢復報告](base-experience-browser-recovery.md)。所有profiles、raw、截圖與完整日誌保留於[beta24 QA目錄](../../output/playwright/base-experience-visual-beta24/)。beta21–23與更早候選保留，沒有commit／push／tag／Release或發布。該畫面採validator接受的合成camp/right前置，不是從NPC正常行走或完成傳送；其他未驗viewport／狀態不泛稱通過。真OS焦點、正式平台／雲端、音訊與下述舊限制仍未驗。本輪停止，不新增plan或後續排程。

以下保留beta22核心交付及驗證歷史；與本節衝突時以本節為準。

## 已交付的改動

- 失焦後明確恢復：新增只存在app記憶體的恢復閘門；回到前景或點畫布不自動復戰。失焦清理held keys、暫時遊戲命令與技能buffer，保留面板、進度與已開始的攻擊。玩家明確繼續後才恢復，UI在已commit的狀態轉換後回復畫布或原面板控制焦點。
- 互動提示與Space同源：NPC／出入口目標共用純helper，保留64px、NPC優先、距離／ID排序與原門檻；HUD顯示當前對象、目的地及門檻，沿用玩家重綁鍵。
- 戰鬥狀態資訊：顯示冷卻剩餘、動作中與有效技能排隊；只讀現有runtime，不改傷害、MP、冷卻、600ms buffer或原disabled政策。
- 快捷欄圖示重用：相同素材描述保留圖示節點；素材URL／尺寸／標籤及小藥轉大藥會更新；錯誤fallback不逐tick重試。未做FPS提升聲明。
- beta22補上命令層保護：主代理靜態確認UI只攔實體Esc，但escape action可重綁，故派全新Luna在appCommand統一阻止conflict／saveUpgrade下的togglePause。涵蓋重綁鍵及所有命令來源，不能繞過高優先存檔卡。

本輪不新增地圖、任務、怪物、技能、素材或玩法內容；ID `brightwood-first-oath`、desktop／Lv30、四區18圖及存檔讀1–5寫5不變。原玩家資料、QA profiles、所有既有dirty及beta19／20／21候選保留。沒有commit、push、tag、Release或平台上架。

## beta22歷史候選

- [beta22 dist](../../artifacts/base-experience-1.0.0-beta.22/dist/)
- [beta22 game.zip](../../artifacts/base-experience-1.0.0-beta.22/game.zip)：131,522,814 bytes／274 entries。
- ZIP SHA-256：`7e35b289fddb96b2f3d6d42e1e2665a53735ea4575430025f31ab4cb638462ef`。
- dist／ZIP entry tree同為 `165501b7de464befe30a4ae20081d10924336e011e656c99ae2ca11a87d7f674`，逐檔內容相符。
- Source 351檔，tree `fbf85da28e59e889777f3db707abd0c250698c6d034d7d301e47433ef65a7c0d`；此scope比beta21另含修復focused test，不能只按檔數比較來源。
- 逐檔清單／摘要位於候選目錄；詳[修正版候選報告](base-experience-candidate-fix.md)。beta21 ZIP原hash仍為 `6b2fcc4437f82e7218682d407965449d2aa65f7b3a9d8ac0f4ee0f56dc79e8f2`，沒有覆寫。

## 實際檢查

| 項目 | 結果與範圍 |
| --- | --- |
| 焦點核心 | 最終 `app-focus-resume.test.ts` 6/6通過，含真GameAppState與KeyboardInputState產生的KeyP重綁命令、conflict／upgrade四種組合及一般恢復。這是focused邏輯證據，非OS視窗切換實測。 |
| 互動核心 | `interaction-target.test.ts` 13/13通過，含Space產生及stepGameplay實際選擇、64px與門檻契約。 |
| 戰鬥摘要 | `combat-ui-state.test.ts` 5/5通過，含玩家attack／buffer邊界與不修改輸入。 |
| Snapshot接線 | `base-experience-ui-snapshot.test.ts` 3/3通過，含同源目標／runtime欄位安全預設。 |
| 型別 | 最後guard修正後bundled Node的 `tsc --noEmit` exit 0。 |
| Build／ZIP | Node24.22.1；beta21及修正版beta22各一次Vite build、固定tools1.2.0 pack與官方完整validate通過。未重跑未變的focused檔。 |
| 有限文字掃描 | beta22 ZIP內14個文字entries指定token／PEM樣式0命中；二進位未掃，非完整機密稽核。 |

最終不同focused案例共 **4檔27項通過**。未跑full suite；內容表未改，略過content check；沒有為純樣式加測試或安裝DOM測試套件。修復過的focus檔與typecheck才重查，其他已過未變結果沿用。

## beta21／22歷史瀏覽器實測與當時未驗

唯一Terra Max使用beta21凍結候選、獨立新profile／雙來源子目錄sandbox iframe。只在新空origin一次種入嚴格validator接受的合成format5 QA前置，之後正常UI；不是從零通關或原玩家進度。

實際完成：初始NPC範圍外無提示，正常短移後顯示「Space互動：森芽」，Space開同名對話；同頁對話按鈕獲焦時未出現恢復卡。收束時以正常暫停鈕觀察到一般暫停卡，沒有量測時間或位置凍結。canonical raw前後相同，並不代表雲端保存。

Playwright切頁時公開visibility／hasFocus仍為visible／true，桌面控制呼叫未完成真切換；主代理依最小驗證要求收束。**真實失焦與明確恢復、panel焦點commit／Esc、portal、技能狀態、圖示identity／小藥切大藥／fallback、640×360及視覺審核均未驗。** console檔僅兩筆Phaser啟動LOG；network與全資源未審核。

beta22沒有直接開瀏覽器。它與21的唯一遊戲邏輯差異是命令層save blocker guard；未變UI的上述局部觀察可明確沿用，但不稱beta22完整route或視覺通過。新guard由6個focused案例與tsc驗證。完整限制與證據見[瀏覽器報告](base-experience-browser.md)及[QA目錄](../../output/playwright/base-experience-1.0.0-beta.21/)。

正式平台、真帳號雲端、實際音訊、原生／沉浸fullscreen、原預警精確時序、灰畫面根因，以及舊Frost q09 active3/6／q10未重演繼續保留未驗邊界。不宣稱整體CANDIDATE_READY／PLATFORM_RELEASED。

## 清理與後續

Terra以完整命令列／profile／ports核實後，只關獨立session與server PID31492；最後核自有daemon／Chrome／server及26342／26343 listeners皆退出。profile、raw、harness及長日誌保留於QA目錄，詳`cleanup-status.json`與ownership檔。主代理沒有開服務；實作／封包代理沒有browser服務，所有子代理已完成。

beta22階段當時已收束且未有確認source缺陷；其後使用者追加的視審、確認問題與修正詳頂端最新章節。未測項不推定正常，後續僅依使用者指定短段接續，不重刷舊任務、不自動新增plan／排程或發布。

## 來源與分工

[Plan17](../17-base-game-experience.md)／[規劃證據](base-experience-plan-evidence.md)由全新Sol6.1 xhigh完成；主代理分析、派工、審閱與交接。全新Luna Max分別交付[焦點](base-experience-focus.md)、[互動](base-experience-interaction.md)、[戰鬥摘要](base-experience-combat-ui.md)、[UI](base-experience-ui-integration.md)、[beta21候選](base-experience-candidate.md)及[guard修復](base-experience-resume-guard.md)／[beta22候選](base-experience-candidate-fix.md)。唯一Terra6.1 Max負責browser，沒有Luna自行開QA。

主代理本輪完整網路讀取Playroom範本及七份main規格，截斷段補讀；依使用者最新指令，各子代理按包收適用摘要或閱讀封包／iframe相關原文，無固定每包重讀八份要求。無新圖片需求，未使用imagegen。
