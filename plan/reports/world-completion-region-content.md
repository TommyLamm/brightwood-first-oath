# W03/W04・霜雪與沙海支線內容

日期：2026-10-27（香港時間）  
狀態：**CONTENT_IMPLEMENTED／核心聚焦案例通過；玩家視覺閉環待 UI 整合及審圖**

## 本包實作

- 新增 q21「風雪中的航標」：雪芽給予／回報，前置 q09 claimed；在霜松隘道高台調查一次 `frost-route-marker`。獎勵為 500 金幣、大紅藥水×3、大藍藥水×2、EXP 0。
- 新增 q22「日井旁的歇腳處」：琉砂給予／回報，前置 q13 claimed；抵達 `sand-sunwell-basin`，並在接取後擊退兩隻 `sunwell-beetle`。沿用既有盆地甲蟲生成點（x=1120、2380）。獎勵為 600 金幣、大紅藥水×4、大藍藥水×2、EXP 0。
- 兩支線都不消耗任務物品、不成為後續主線前置。q21 不影響 q10/q11；q22 不影響 q14/q15。q22 reach 沿用 `visitedMaps` 語義，擊殺計數仍只更新接取中的任務。
- 雪芽／琉砂的對話及 q09、q11、q13、q14 後續文字補上支線與跨區方向；q11 交付後明確引導達 Lv30 的玩家往琥珀砂岸，q13 交付後提示盆地支線，q14 交付後指向南方潮痕營站。

## 航標位置與暫用圖像

- NPC／inspect ID：`frost-route-marker`；角色為 `keeper`；互動名稱「霜松航標」。沒有重用 `ruins-stele-west` 或 `ruins-stele-east` ID。
- 地圖位置：`frost-pine-pass` x=1910、y=430，位於既有上層平台 x=1710–1980、y=430；同一平台既有梯子 x=1840、topY=430、bottomY=600 可達。未改平台、梯子、怪物生成或傳點。
- 暫用 `visualKey`：`actor:ruins-stele`；既有圖片為 [ruins-stele-v1.png](../../public/assets/actors/npcs/ruins-stele-v1.png)，由 `public/assets/actors/manifest.json` 的 `actor:ruins-stele` 載入。這是內容接線使用的石造物佔位，不代表已通過視覺審核；需要 Sol 審查比例、辨識度及是否應另製航標圖。
- 玩家可互動的「調查航標」UI 按鈕尚未納入本包，已交下一批 UI owner；因此本包不宣稱玩家操作閉環或視覺通過。

## 驗證與限制

- 使用 Node 24.22.1 執行 `tools/check-content.ts`：通過 rules 與 world 跨表內容檢查。
- Focused tests（均排除 `.worktrees`）：`frost-quests.test.ts` 3 項及 `world-region-sidequests.test.ts` 2 項通過；`sunwell-quests.test.ts` 2 項通過。案例覆蓋精確 ID／前置／位置、接取後計數、一次 inspect 封頂、q22 已訪盆地、主線獨立及一次手動領獎／滿袋保留。
- Sunwell 舊 format 1 fixture 先驗證 `upgradeRequired`，再明確呼叫 `confirmSaveUpgrade()`；備份後以 format 5 重載再測 q14，沒有繞過升級閘門。
- Typecheck 當時只報 UI owner 正在編輯的 `src/ui/index.ts` unused imports（`objectivePlaces` 及一組未用 import）。依 root 指示，整合後由 root 做一次 typecheck；本包沒有改 UI。
- 未跑全回歸、build、browser 或素材審圖；未改 persistence wiring、manifest、版本、素材、dist、真實玩家資料，亦未發布。

## 下一步

1. UI owner 為 `frost-route-marker` 加入調查按鈕，dispatch `inspect { targetId: 'frost-route-marker' }`，並完成任務手帳分類與 q19 世界回顧整合。
2. 由 Sol 審查 `actor:ruins-stele` 圖像在霜松高台是否合適；若不足，再按審圖結果準備航標素材。
3. UI／內容整合後由 root 執行一次最終 typecheck；再安排集中瀏覽器路線。玩家 UI 閉環與圖像狀態在此之前仍屬未驗。
