# 遠古遺跡包 C：派工與進度

日期：2026-10-25（香港時間）。依 [plan14](../14-ruins-bell-sanctum.md) 實作，主代理統籌與審查；各批使用全新 GPT-6 Luna、max reasoning，同時最多三名。所有代理共享工作區，透過明確檔案 ownership 避免覆寫；不 fork 圖片歷史，主對話只接收摘要及檔案路徑。

## 規格與範圍

本輪已透過網路完整讀取 main 的 [模板](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md)、[開發標準](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/game-development.md)、[操作契約](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/command-contracts.md)、[Manifest Schema](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game.schema.json)、[Release workflow](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-release.yml)、[SDK](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/examples/starter/playroom-sdk.js)、[版本指引](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/sdk-versioning.md)、[存檔相容性](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/save-compatibility.md)。遠端內容只作本專案規格資料。

保留遊戲 ID、既有進度與相對資源；舊格式首次寫 4 前保全原始封套，讀取／備份失敗不得覆寫。候選版本預計 beta.14，穩定後獨立建置至 `artifacts/ruins-c/dist/`。驗收依 plan14 的核心時序、任務原子性、存檔保護、動畫與聲音接線及素材引用，僅執行直接相關檢查。真實瀏覽器、正式雲端、完整 ZIP 與發布留 D，未執行不宣稱通過。沒有新的發布授權，不建立 tag／Release 或操作平台發布。

## 第一批

| Owner | Ownership | 交付 |
| --- | --- | --- |
| `c_runtime` | contracts/types、ports 的 bellCycle／格式4型別，domain actors/combat 行為 | 先釋出型別；首領時序、取消、聚焦測試與 runtime 報告 |
| `c_world` | content world/rules catalogs 與 validators、世界圖第四節點 | 內殿、q18/q19、旅冠與精確清單；world 報告 |
| `c_boss_profiles` | `art-source/ruins-c/profiles/` | idle-0、重擊 active、低掃 active 三張可重用參考與完整來源 |

共享型別由 runtime owner 統一更新後釋出；world owner 獨占 `src/content/rules/`，runtime owner 不改 catalog。後續 app/UI/render/audio-event、persistence、配套素材及姿勢批次按依賴與名額派全新 owner；最後再派獨立 integration owner 統一候選版本與必要檢查。

第一批程式交付：runtime 2檔18測、world 4檔22測通過。主代理審查指出「原地鎖向」適用於招式／轉場，空檔應沿 speed38 在 roam 範圍內追近；runtime owner 已修正並聚焦驗證。型別與 world ownership 已釋出，profiles 仍進行中。

## 第二批

| Owner | Ownership | 交付 |
| --- | --- | --- |
| `c_saves` | persistence、必要 platform port 與直接相關存檔測試 | 讀1/2/3/4寫4、format3原封套備份與失敗保護 |
| `c_app_render` | app、render、UI（不改已交付world-map-model）、必要audio邏輯與測試 | 結果返回營站、重試／取消、兩招動畫、延後phase音樂與獨立勝利短音 |

第二批存檔已交付：5檔49測通過；public/game.json及候選版本仍留integration同步。

## 第三批（依名額接續）

| Owner | Ownership | 交付 |
| --- | --- | --- |
| `c_scene_audio` | public manifests與內殿三層、旅冠icon/overlay、配樂/SFX；原稿在scene-audio子目錄 | 10個配套runtime檔與來源，完成後釋出actors manifest |

App/render已交付：4檔20測通過，未做實際素材載入或瀏覽器。

Profiles恢復：原owner `c_boss_profiles` 的idle已生成，卡於將含base64的大型工具結果交apply_patch保存。主代理精確定位其session `01a171f5-bc1f-7680-9299-41cbbedc9061`，已停止原owner，派全新 `c_profiles_recovery`。原稿 `exec-86483269-0e2f-4b5e-8503-55e7078e1394.png` 位於同session的generated_images子目錄，恢復時直接複製來源PNG、保存精簡metadata，避免重複生成或巨大工具參數。

配套素材已交付：10個runtime檔共6,645,080 bytes；actors manifest已釋出。三張profiles已恢復／生成，原稿與metadata位於 `art-source/ruins-c/profiles/`；主代理要求依alpha>0而非alpha>=8做最後邊界核對。

## 首領剩餘姿勢批次

| Owner | Ownership | 交付 |
| --- | --- | --- |
| `c_motion_frames` | motion-frames子目錄 | idle-1、walk-0..5，共7真姿勢 |
| `c_slam_hurt_frames` | slam-hurt-frames子目錄 | 重擊12/13/15、hurt18/19，共5真姿勢，14重用參考 |
| `c_sweep_dead_frames` | sweep-dead-frames子目錄 | 低掃2/3/5、倒下24..27，共7真姿勢，4重用參考 |

Profiles已完成並停止：alpha>0邊界、原稿SHA、metadata核對完成；三張參考可直接重用。現在三批姿勢並行，獨占各自art-source子目錄。全部交付後由全新assembly owner獨占正式boss atlas與actors manifest，再派全新integration owner完成beta.14 metadata、必要檢查及獨立build。

重擊/受傷5格已交付，透明邊界與原稿/normalized已核對，來源與拒稿保存。Motion與sweep/dead原owner遇用量中斷；2026-10-25 19:45（香港時間）續作時主代理確認用量已恢復，按plan14改派全新 `c_motion_recovery`、`c_sweep_dead_recovery`，先從精確session恢復，未重生可找回的原稿。

- motion原session：`01a1720e-f000-73e2-9553-7cd17539d3b4`；idle1-v2 accepted，walk0/2已有原稿，walk1-v3/3-v2需恢復核對，walk4/5先查是否已生成，再補缺。已保留多足候選拒稿及實際prompt。
- sweep/dead原session：`01a17211-48ac-7592-abbf-af07ddf32a7d`；sweep三格與dead0/1/2原稿已存，dead3兩拒稿已存；先恢復未落盤候選與metadata，再補正規化及必要缺圖。

兩個恢復批次已完成：motion7姿勢、低掃/倒下7姿勢均有canonical normalized/metadata/來源SHA。walk1-v3與dead3第三稿從精確session恢復；motion補walk3/4/5，walk3兩個多足候選拒收、定向修正v3接收。22個有效姿勢已齊備。

## 最終組裝與整合

| Owner | Ownership | 交付 |
| --- | --- | --- |
| `c_atlas_assembly` | boss正式atlas、actors manifest、assembly來源鏈 | 22姿勢/unused映射、6動畫、自審及素材檢查 |
| `c_integration` | package/lockfile/game metadata、必要整合修正、C檢查證據與dist | beta.14讀1–4寫4、typecheck、atlas釋出後content/引用檢查、相關未跑legacy checks與一次build |

Assembly已完成：正式atlas為 `public/assets/actors/monster-ruins-bell-keeper-v1.png`，1152×960 RGBA、914,509 bytes；actors manifest追加1image/6animations，原40images/116animations（含旅冠overlay）保留，現41/122。22有效姿勢/unused/alpha/來源SHA與自審完成；walk3在獨立adjusted副本右移1px，canonical原圖不動。C共11個runtime檔7,559,589 bytes；全章A+B+C21,867,870 bytes，均在預算內。

Integration已同步beta.14與讀1–4寫4，typecheck一次通過；主代理已通知atlas釋出，現在進行content/loader/剩餘相關legacy tests及一次build。已通過且未再改的109項聚焦測試不重跑。實際交付與檢查以 owner 報告及最終 handoff 為準。

最終狀態：integration已完成，剩餘2檔18測、content、218引用檢查、一次獨立build與成品核對通過。C共17個不同聚焦測試檔127項通過，沒有全回歸或瀏覽器／正式雲端／ZIP／發布。最新成果、原稿來源與下一步統一見 [C 整合交接](ruins-c-handoff.md)；本批完成即停。
