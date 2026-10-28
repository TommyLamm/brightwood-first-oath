# 基礎體驗計畫：靜態證據

日期：2026-10-28，香港時間。對應 [Plan17](../17-base-game-experience.md)。本檔只記規劃證據，不是遊戲驗收報告。規劃代理只擁有本檔及Plan17，沒有修改遊戲、素材、版本、存檔或既有交接。

## 已讀文件與授權

已讀根AGENTS、Plan16、status頂部、world-completion-live-handoff頂部最小驗證收束決策、world-completion-handoff、Sand closure及Frost finish；另讀本對話最新 [current-handoff](base-experience-current-handoff.md)。最新要求優先：主代理分析／指揮，實作交全新Luna Max，browser／視覺交Terra Max；子代理按包選讀規格，無需每包完整重讀八份。04:05前只規劃，04:05觸發後由主代理接續派工；不新增玩法內容、不發布。

本輪在香港時間約00:12–00:25使用網路工具完整取得下列main原文；初次合併輸出截斷後已分開補讀，包含game-development末行196。規格未另存副本入repo：

1. [game-agent-template](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md)
2. [game-development](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/game-development.md)
3. [command-contracts](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/command-contracts.md)
4. [game.schema.json](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game.schema.json)
5. [game-release.yml](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-release.yml)
6. [starter playroom-sdk.js](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/examples/starter/playroom-sdk.js)
7. [sdk-versioning](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/sdk-versioning.md)
8. [save-compatibility](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/save-compatibility.md)

適用要求：固定ID、desktop如實宣告、相對資源及跨來源iframe；背景行為可預期；保存失敗不當空檔、正式saved:true才稱雲端已保存；保留格式相容與玩家原件；新候選使用固定工具完整驗證；發布另需明確授權。本文件不構成平台合規證明。

## 原始碼盤點

行號是本輪讀取時的快照，後續按符號重定位。`.codegraph/`不存在，因此使用rg及定點原文閱讀。

| 依據 | 靜態確認 | 決策／證據界線 |
| --- | --- | --- |
| `src/app/app.ts:169–174`，`GameApp.setWindowFocused`；`src/app/panels.ts:28–30`，`isWorldFrozen` | blur凍結，focus true可直接解除；沒有獨立的明確恢復閘門 | 增app-only閘門是有意的安全策略改善；未聲稱已重現玩家因此受損 |
| `src/app/keyboard.ts:217–236,242–245,287–320` | window／visibility、canvas pointer、UI輸入焦點是不同路徑；UI欄位刻意不觸發遊戲鍵 | 保留區分，不能把同頁input焦點當window blur，不能讓canvas click自動復戰 |
| `src/app/app.ts:176–249,738–748`；`src/main.ts:26–31` | fixed tick多次setState，每次onStateChange都render UI | 不改simulation／通知架構，只減快捷欄圖示的重複建立；未量得FPS提升 |
| `src/app/gameplay.ts:745–791`，nearestNpc／nearNpc／interactNearest | Math.hypot、64px含邊界、NPC優先；各類距離後ID排序；portal先level再claimed判定 | 抽單一純helper供Space與HUD共用，不增距離或改選擇順序 |
| `src/app/gameplay.ts:1241–1249`，lockedPortalMessage | ready未claimed仍需向NPC回報；active／available提示不同 | 搬移既有純文案函式，不另寫不一致的HUD門檻 |
| `src/app/state.ts:120–129`；`src/contracts/ports.ts:164–193`，UiSnapshot | 只有已開啟對話interaction，沒有即時目標、收招或buffer摘要 | snapshot增選填欄位；正式app明確填值，舊fixture可省略；不寫SaveData |
| `src/app/gameplay.ts:436–495,929–932` | 已有MP詳細失敗訊息、收招鎖與600ms技能buffer | 補狀態資訊，不改600ms、不新增「揮空」事件、不以MP消耗推斷命中 |
| `src/domain/combat/index.ts:49–58,118–152` | 技能cooldown與完整windup＋active＋recovery分開；hitIds與真正命中由combat決定 | UI僅讀玩家有效attack及buffer；不改combat、傷害、敵人或判定 |
| `src/ui/index.ts:680–760` | basic只顯MP0；技能顯示概括cooldown／MP原因；每次更新圖示replaceChildren；藥水另一次覆寫 | 補冷卻／動作／排隊資訊，先分skill/item，再以素材descriptor維持節點identity |
| `src/ui/index.ts:181–207`，makeInterfaceIcon | 有missing與error fallback；新img附once error listener | cache需保留fallback、URL／尺寸／label變更失效，不能每tick重試壞圖 |
| `src/ui/index.ts:1037–1043,1058–1063,1245–1283` | Continue、攻擊、互動、關panel已有canvas焦點處理 | 不重做舊修復，只把明確恢復焦點綁已commit狀態並尊重原panel／欄位 |
| `tests/integration/app-foundation.test.ts:18–25` | 既有catalog計數斷言含歷史值，與本期焦點修改無關 | 新focused檔避免牽入整套舊斷言，不為無關環境／fixture問題擴scope |

## 已交付基線與不能推斷之處

- Plan16：beta20 SOURCE_DELIVERED／ZIP_VALIDATED／LOCAL_ACCEPTANCE_PARTIAL。四區18圖、format5、q21／q22及世界回顧已交付；不是本輪新測得的結果。
- Sand closure §101起：原同attempt正常勝利，q22／q14手動領獎、q15實際入Ruins。早期未傳送嘗試含焦點／定位不確定，後已正常閉環，不足以判portal bug。
- Frost finish §49起：q09 active3/6、q10未接、raw雙讀一致；QA resources已關。舊鏈未改，不重新長刷；未重演不標PASS。
- Frost兩次MP採樣中間有未即時採樣的三次heavy，CLI亦有wrapper／丟session_id記錄；不能將差值全算作等待扣MP。
- [canvas audit](world-completion-canvas-audit.md)未定位舊灰畫面根因；[motion review](overnight-motion-review-20261026.md)只有單場景短段，不能推全區效能或所有視差通過。
- 正式平台、實際音訊、精確預警時序與部分小尺寸畫面仍未驗；本期局部接受不能清除這些限制。

## 實際操作與文件檢查

只做網路規格閱讀、必要report／source閱讀、路徑存在檢查、git status摘要及本輪新增文件靜態核對。新增前確認17編號及本證據檔尚未使用。

第一次寫入曾因自動審核所需用量耗盡而沒有執行；04:05恢復後重試保存。這不是安全拒絕，也沒有繞過審核。

未派子代理，未改遊戲／素材／版本／存檔，未啟動browser或service，未跑遊戲tests／typecheck／content／build／pack，未commit／push／tag／Release／平台操作。具體文件檢查結果由交付回報列明；不宣稱未驗行為通過。
