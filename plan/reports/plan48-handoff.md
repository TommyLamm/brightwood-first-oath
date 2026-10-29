# Plan48・商人地圖入口交接

2026-10-29（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED**。[Plan48](../48-merchant-map-shortcut.md) 在 [Plan47](plan47-handoff.md) 完成後開始。root 完整網讀八份規格（refs183–186），核 catalog 與既有資訊地圖流程；基線 .playroom/tmp/plan48-integration-review/ui-before.ts。beta55 新 artifact/tmp 與 tag 未用。

先 W01 全新 Luna Max 查找 model／三組 focused，root 審後 W02 全新 Luna Max 單 owner UI／單次 tsc，審後 W03 新候選。真 UI 未驗，不 git 寫入／發布／新增排程，保留作者、ID、存檔相容、dirty、真資料及舊候選。兩個指定一次性排程皆已刪除。

W01 全新 Luna Max /root/plan48_npc_map_target 完成，[model 報告](plan48-npc-map-target.md)、helper／tests 及修正後原 log 經 root 審閱接受。初次 focused 2 PASS／1 FAIL 是測試快照 scope 比較錯誤，僅改斷言後必要重跑該檔，3／3 PASS／exit0；兩份 log 保留，非重跑未改已過套件。helper 原序查第一個 placement／先驗 NPC 定義／三欄位資料且無輸入寫入。W02 全新 Luna Max /root/plan48_merchant_map_ui 接單一 UI owner，範圍為 import/action、handler、商店 intro 後按鈕；不改 gameplay。

W02 全新 Luna Max /root/plan48_merchant_map_ui 完成，[UI 報告](plan48-ui-integration.md)及原 tsc log 經 root 核讀；指定 Node24.22.1 單次 tsc exit0。root 以本批 ui-before.ts 核四處 diff（import／union、handler、shop intro 後入口），接受 currentView ?? view 取得最新 snapshot；僅改 selectedMapId／既有 setPanel，不移動角色或改交易。代理另做 git diff --check 無空白診斷；無 tests／browser／server。W03 全新 Luna Max /root/plan48_candidate 接 beta55 新候選，不重跑 W01／W02。

W03 全新 Luna Max /root/plan48_candidate 完成，[候選報告](plan48-candidate.md)及原 validate／audit log 經 root 核讀。prepare 成功；指定 Node24.22.1 build（82 modules）／pack／完整 ZIP／Python311 audit 各一次 exit0。ZIP 274 entries／131,528,625 bytes，SHA-256 ef4f758160bd30100032e0fd7bd8c0551c6562e21027f92bb4c717a54e957b7c。source435 files／135,790,534 bytes、dist274 files／135,754,495 bytes；六處 metadata 一致。14 text entries／1,772,158 bytes／8 pattern 類為 0 findings，260 binary entries 未掃。

本批 source／候選完成，未做 browser／server，真 click／focus／跨區選圖／reader／layout 仍未驗。未 git 寫入或發布，原資料／dirty／全部候選保留，02:40／07:50 排程已刪除。下一個明確基礎體驗範圍：手帳可接取／待回報狀態的現有地圖按鈕直接查看對應接取／回報 NPC 地圖，其他狀態保留原世界地圖入口；先完整網讀再開 Plan49。

文件引用檢查一次：7 documents／90 local links／6 anchors，failures []，exit0；成功後未重跑。
