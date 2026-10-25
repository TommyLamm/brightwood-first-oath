來源

已完整閱讀 plan/12-next-chapter-ancient-ruins.md、AGENTS.md，以及 2026-10-25 線上 Playroom main 規格：templates/game-agent-template.md、docs/game-development.md、docs/command-contracts.md、templates/game.schema.json、templates/game-release.yml、examples/starter/playroom-sdk.js、docs/sdk-versioning.md、docs/save-compatibility.md。網路讀取加上 ?read=20261025，僅作本專案開發規格。

實作前盤點 src/content/world 的地圖、NPC、對話、任務與驗證器，參考 src/app/gameplay.ts 的門鎖／互動／轉圖行為，以及 tests/integration/sunwell-quests.test.ts 的聚焦整合測試慣例。

已完成

新增潮痕營站與盤根石道兩張可玩的 MapDef。營站為安全地圖，包含芷衡與青禾；石道配置三隻 ruins-moss-carapace。沿用既有地面座標，石道加上平台與梯路。砂岸新增南航高台、樓梯及 q14 門鎖，回程出生點落在高台上。

新增路線：砂岸進營站需 q14 claimed；營站進石道需 q15 claimed。營站回砂岸、石道回營站均無鎖。木葉鎮直達營站的入口需 q15 claimed，營站前往木葉鎮無鎖。石道未連到尚不存在的回聲長廊。

新增 q15「南方的錯拍」：由琉砂發起，抵達營站後向芷衡手動領取六瓶大紅藥水與三瓶大藍藥水。新增 q16「盤根之下」：由芷衡發起，擊退三隻苔陶蟲後回營站手動領取 700 金幣。

新增芷衡 keeper 與青禾 healer 的對話及營站配置。NPC actorKey 為 actor:ruins-archivist、actor:ruins-medic；動畫狀態沿現有 loader 命名為 npc:ruins-archivist:idle、npc:ruins-medic:idle。

擴充世界內容驗證的地圖／NPC／任務 ID、主題與音樂鍵、安全地圖、怪物 roster、平台門與出生點落腳面檢查，以及 NPC／門／門之間互動範圍不可重疊的檢查。新增 tests/ruins-entry.test.ts，覆蓋 q14/q15 門鎖、q15 抵達與手動領獎、q16 三次擊殺與手動領獎、木葉鎮直航、無鎖回程及 NPC／門距離。

待做

尚待另一批把新地圖接入 mapOrder／遠古遺跡區域圖。怪物規則與招式由另一代理接入；新 NPC 藝術、環境素材與 theme-ruins 音樂由主代理處理。存檔讀取 1／2、寫入 2 由存檔代理處理。這批未做 q17 以後任務，也未提供回聲長廊。

驗證

執行 git diff --check，未見 whitespace 錯誤。依主代理安排未執行 Vitest、build、瀏覽器或全套測試；tests/ruins-entry.test.ts 待素材／怪物／存檔依賴完成後由主代理統一執行。未宣稱遊玩或發布驗收通過。
