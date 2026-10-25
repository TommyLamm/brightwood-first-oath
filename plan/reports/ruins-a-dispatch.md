# 遺跡 A 批次交接

日期：2026-10-25（香港時間）。來源：[章節設計](../12-next-chapter-ancient-ruins.md)。本輪依設計第 9 節完成 A 後停，不延伸 B／C；未授權發布。

## 分工與對話

主代理負責拆解、審查、整合及最小驗證；實作使用 GPT-6 Luna、max reasoning，同時最多三名。每批建立全新子代理，完成後不再派工作給舊代理。只回傳文字摘要及檔案路徑；原稿、prompt、縮圖和完整日誌保存在工作區。

第一批：world（兩張地圖、NPC、q15／q16、航路）、combat（苔陶蟲與材料、技能及角色素材）、saves（讀取 1／2、寫入 2、保留舊存檔及拒絕不相容格式）。後續依空出的名額派新代理補齊區域圖、環境、NPC／材料素材與音樂。

## 開始前已讀規格

主代理於本日經網路完整讀取 [Playroom 模板](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md)、[開發標準](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/game-development.md)、[操作契約](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/command-contracts.md)、[Schema](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game.schema.json)、[workflow](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-release.yml)、[SDK](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/examples/starter/playroom-sdk.js)、[版本指引](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/sdk-versioning.md)、[存檔契約](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/save-compatibility.md)。以帶本日查詢參數的 main 回應避開舊快取；PowerShell 直接請求因 DNS 限制失敗，web 工具讀取成功。今日 main 為 tools 1.2.0／ZIP 512 MiB，不能沿用舊快取的 64 MiB。

## 契約與驗收範圍

- q14 claimed 開營站，q15 claimed 開石道及鎮內直航；ready 不開門，回程無鎖。
- q16 僅接取後擊殺三隻苔陶蟲；完成本批後沒有通往未實作地圖的 portal。
- 保留既有 q01–q14、Guardian flags、日井誓刃與使用者未提交的視差／素材變更。
- 存檔讀 1／2、寫 2，未知格式保留且禁止覆寫。正式雲端寫 2 尚須能理解新 ID 的橋接版配合，預覽／fixture 不代表帳號遷移通過。
- 相對資源 URL、真透明分層背景、碰撞地形由程式定義；新增 runtime 壓縮預算 24 MiB。
- 依變動執行聚焦核心測試、typecheck、content check、必要 build；不跑全回歸。瀏覽器、ZIP、帳號及發布驗收按實際結果另列，不能推定通過。

最終完成狀態、驗證及下一步另寫本批整合交接。既有 beta.11 候選不作發布或覆寫 Release。
