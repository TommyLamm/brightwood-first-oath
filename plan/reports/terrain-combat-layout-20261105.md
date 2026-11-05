# beta.62：平台與戰鬥配置

## 範圍與問題

- 遊戲：`brightwood-first-oath`，本地版本 `1.0.0-beta.62`，成品 `dist/`；尚未發布。
- 使用者希望剛完成素材更新的平台對戰鬥有實際用途。
- beta.61 的五張素材更新地圖共 13 個平台，但怪物生成一律鎖在地面 `y=600`；不少平台間距超過正常跳躍距離。上平台大多只是退出交戰。
- 本輪重新配置這五張地圖，保留既有素材。其他 13 張地圖未重排。

## 已實作的用途

| 地圖 | 平台配置與戰術用途 | 上層守敵 |
| --- | --- | --- |
| 嫩芽林道 | 第一段樹枝避開地面蝸牛；50px 間距連接高低樹枝，可跳上去交戰、由另一側藤蔓包抄，或落回路面反擊 | 蝸牛一隻、史萊姆一隻 |
| 菌傘深林 | 第一段跨過地面菇，後兩段成為相連的上層交戰路線；右側藤蔓提供另一個接近方向 | 菌傘菇兩隻 |
| 赤岩山徑 | 兩側岩台提供避開地面野豬的換位點；中段由野豬駐守，玩家可選路面交戰或上層交戰，55px 間距可連跳 | 野豬一隻 |
| 古礦入口 | 第一段棚架高於魔像近戰範圍，能暫時脫離攻擊並落下反擊；55px 間距接上由哨兵駐守的棚架 | 鏽甲哨兵一隻 |
| 守衛祭壇 | 兩個平台移到守衛活動區內，均離地 70px；可避開 50px 高震波，仍受到 100px 高重擊威脅，也能以普攻打到守衛上半身 | 保留原本一隻地面首領 |

13 個平台各有一條從地面直達的平台攀爬路線，合計 13 條。林道、深林、山徑、礦入口的相鄰平台可依原本移速與跳力雙向跳越。守衛祭壇兩平台分居交戰區兩側，不設計為直接連跳。

平台的避攻來自既有攻擊範圍與高度判定。沒有新增高地傷害加成、落下斬技能、遠程武器、傷害豁免或阻擋投射物的規則。

## 程式行為

- `src/content/world/maps.ts`：怪物藍圖支援可選 `y`，其餘生成仍預設地面。調整上述平台、攀爬入口與六隻上層守敵的巡邏範圍。維持原本怪物數量、種類、生成 ID 次序、任務、掉落及出入口。
- `src/content/world/validate.ts`：怪物位置須為有限值且站在合法落腳面。上層怪物的完整巡邏範圍連同身體寬度須容納在同一平台，避免出生懸空或巡邏超出台緣。
- `src/domain/actors/index.ts`：守衛若準備選擇低位震波，但玩家高度使震波打不到，而重擊能打到，則改選重擊。只在新攻擊開始前選擇；已進入蓄力的震波不改招、不變更既有預警。
- 上層怪物沿用既有巡邏、近戰、擊退與重生流程，不新增攀梯或跨平台追擊 AI。遭擊退離台後可落到地面。
- 原先存檔按地圖與入口重建角色及怪物，沒有儲存平台坐標；原入口及地面保持可用。存檔仍讀格式 1–5、寫格式 5，SDK／本機命名空間不變。

## 驗證

已執行：

- 新增 `tests/terrain-combat.test.ts`，10 項通過：浮空／超出台緣資料拒絕、六隻上層守敵巡邏及同層攻擊、13 個平台攀爬和落地、四張普通地圖雙向連跳、地面近戰避讓及落下後普攻、兩個首領平台的震波／重擊／玩家命中，以及已出招震波不變而下一次選招會改用重擊。
- 既有 `tests/actors.test.ts` 12 項通過，涵蓋原有首領地面輪替、巡邏、擊退與重生。沒有在通過後重跑。
- 初次新增案例在省略 recovery 狀態的一個固定步時失敗；修正測試時間步進後，新增 10 項全數通過。遊戲程式沒有為該測試改動狀態轉移。
- `tsc --noEmit` 通過。
- `tools/check-content.ts` 通過規則與世界跨表驗證。
- Vite production build 通過，主程式 `dist/assets/index-3dUM_FvG.js`。
- 本輪修改檔案的 `git diff --check` 通過。

未執行：瀏覽器實機畫面、完整回歸、iframe／全螢幕、登入／雲端存檔、效能量測、ZIP／發布驗收。beta.61 的實機截圖是改版前配置，不能作為本輪新位置的通過證據。

測試使用正式 movement、actors、combat 與地圖資料執行固定時間步，能驗證命中／路線邏輯；戰鬥節奏與視覺易讀性仍待實玩評估。本輪依最小必要驗證原則未啟動瀏覽器。

## 線上規格與交接

2026-11-05（香港時間）開始修改前已透過網路完整讀取：

- [開發範本](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md)
- [開發與發布標準](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/game-development.md)
- [操作契約](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/command-contracts.md)
- [Manifest Schema](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game.schema.json)
- [Release workflow](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-release.yml)
- [SDK](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/examples/starter/playroom-sdk.js)
- [版本指引](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/sdk-versioning.md)
- [存檔相容性](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/save-compatibility.md)

本次適用：提高遊戲版本、保持相對資源路徑與存檔相容、執行相關檢查，將未做的發布／實機項目明列。無 commit、push、tag、Release 或平台操作。

如下一輪要求實機測試：沿用 AGENTS.md 的無頭普通使用者啟動方式，建立新 session／profile／port。舊 `terrain-biomes-20261105-01` 已正常關閉，其固定平台座標與測試路線不適用新版；針對林道上層交戰、礦入口包抄及守衛兩種攻擊進行短流程驗收即可。
