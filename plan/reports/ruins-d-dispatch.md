# 遺跡 D／Plan15 派工紀錄

2026-10-25 約20:46–20:52 HKT 開工，依使用者指示由主代理統籌，全新 GPT-6 Luna、max reasoning 實作，同時最多三名。使用者另指示線上及專案規範由主代理讀取轉述，子代理不重複讀取。圖片及長日誌留工作區，不傳回主對話。

## 規格與範圍

主代理透過 web 完整讀取當時 main 的[模板](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md)、[開發標準](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/game-development.md)、[操作契約](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/command-contracts.md)、[Schema](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game.schema.json)、[workflow](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-release.yml)、[SDK](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/examples/starter/playroom-sdk.js)、[版本指引](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/sdk-versioning.md)、[存檔相容性](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/save-compatibility.md)。首次合併工具輸出截斷，後續各檔獨立補讀至末行；shell 直連 raw.githubusercontent.com DNS 失敗，web 讀取成功。未下載規格副本進 repository。

適用要求：固定 ID `brightwood-first-oath`、desktop、schema2、SDK1.1.0／protocol1、讀1–4寫4；明確確認才匯入舊本機進度，原件及備份保全，雲端與訪客隔離。使用 Node24.22.1+、既有 tools1.2.0 lock/archive/metadata 驗證；獨立 D build、版本／preview 子目錄及跨來源 sandbox iframe 代表路線，穩定後直接 pack／完整 validate 同一成品並另掃機密。不新增格式、玩法或素材，不以本機 fixture 代替正式平台保存。

本輪授權止於 Plan15 D0–D2 本機交付；未獲 Git commit／push、tag／Release、平台匯入／人工 review／上架授權。正式平台及帳號環境未提供時明列未驗證，繼續本機範圍。

## 初始派工

| owner | 獨占範圍 | 交付 |
| --- | --- | --- |
| d_namespace | main／app／persistence／必要 contracts/UI 及直接相關測試 | canonical ID、保全舊 key 匯入、聚焦 coverage、namespace report |
| d_environment | runtime／固定工具／版本占用與 workflow 只讀稽核 | 合規 Node 路徑、hash、占用與環境 report；不改 package/version |
| d_browser_prep | D fixtures／browser harness 準備 | catalog 驗證 fixtures、兩 origin 服務方案；不 build、不啟 browser |

後續依 Plan15 使用全新整合、瀏覽器及封包 owner，等前批釋出檔案後接手；不並行封裝仍在修改的 dist。

## 來源基線

開工 HEAD `d410f674a7e69ba0ec3704b4764549bb5041323a`，候選 beta.14。A–C 大量既有未提交修改及 `.claude/`、`.worktrees/` 均保留，不還原或清理。派工時狀態與 diff stat 留於 `artifacts/ruins-d/logs/workspace-status-dispatch.txt`、`workspace-diff-stat-dispatch.txt`；該快照在首批代理開工後取得，不能當作精確逐檔改動前 hash。

驗證結果與後續批次將由各 report 及最終 handoff 分別記錄，不能以本派工紀錄宣稱通過。

## 收尾批次

namespace釋出後由全新integration owner完成metadata、typecheck、資源引用及一次D build；全新storage-failures owner僅補資料保全負例，沒有改runtime；全新browser owner重生fixtures後遭工具環境阻礙，未載遊戲，停止自有服務；全新package owner按主代理凍結指令驗同一來源／成品指紋後一次pack／完整validate及有限掃描。封包報告曾有路徑控制字元，已修正文案並僅重驗三份文檔／JSON，未重建或重驗ZIP。主代理核對交接產物存在性及索引文件diff whitespace，沒有重跑通過的遊戲檢查。

最終 **SOURCE_READY／ZIP_VALIDATED／LOCAL_BROWSER_UNVERIFIED**，beta.15；正式平台／雲端未驗證，未commit／push／發布。成果、指紋、完整限制與下一步統一見 [D交接](ruins-d-handoff.md)。
