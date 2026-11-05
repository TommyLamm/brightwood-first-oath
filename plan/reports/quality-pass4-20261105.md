# Plan52 續作交接：冰洞材質、冰潮首領完整精修

2026-11-05（Asia/Hong_Kong）。遊戲 `brightwood-first-oath`，候選 **1.0.0-beta.65**，本機成品 `dist/`。
承接 [beta.64首批](quality-pass3-20261105.md)，使用者要求「繼續」後完成冰雪範圍續作；未擴展砂海／遺跡／城鎮／背景。

## 已接入

1. 冰潮洞窟新增冰脈岩地面、覆冰岩棚與覆霜鐵鏈，套用原4個平台／4條攀爬路線；雪痕海岸／霜松隘道保留beta.64戶外雪地與繩。其他地圖fallback維持原樣。
2. `terrainStyle()`新增洞窟明確映射，既有derived required keys自動涵蓋新圖，載入與繪製仍使用同一地圖選材。沒有改renderer、app assets接線、地圖或物理。
3. 冰潮首領正式引用新 `frost-tide-warden-clarity-v1.png`：沿用上一批4格樣本，補齊14個不同姿勢，共18個唯一姿勢及12格重複填充。待機、行走、攻擊、受傷、倒地都採相同的冰晶／毛皮／線條標準，不再混用部分舊細節。
4. 維持1632×1360、6×5、單格272、192顯示框及原pivot；動畫frameMs／格序／loop全相同。各姿勢按原不透明主體位置擬合，alpha≥128外框底邊及水平中心誤差均0邏輯px；不以此外框指標宣稱內部所有部位完全重合。
5. package、lock、public與dist manifest同步beta.65。玩法／首領技能、碰撞、HUD、相機、SDK及存檔讀1–5／寫5保持現況。

## 素材與成本

本輪6份原稿使用內建imagegen；4格既有首領樣本直接沿用，未重複生成。
原生檔、工作區原稿、實際prompt、精確輸入、hash、匯出器及基線見 [素材入口](../../art-source/quality-pass4-20261105/README.md)。沒有CLI／API fallback或依賴安裝。

| 新runtime | 壓縮bytes | 基本RGBA bytes |
| --- | ---: | ---: |
| `env-cave-ground-v1.png` | 495,038 | 1,048,576 |
| `env-cave-platform-biome-v1.png` | 56,869 | 245,760 |
| `env-cave-chain-biome-v1.png` | 13,002 | 49,152 |
| `frost-tide-warden-clarity-v1.png` | 486,813 | 8,878,080 |
| 新檔合計 | **1,051,722** | **10,221,568** |

舊首領PNG518,827 bytes及其他舊檔保留。因此成品素材新增為1,051,722 bytes（約1.003 MiB），活躍引用壓縮淨增532,895 bytes；首領圖集尺寸不變，活躍參照集合基本RGBA淨增1,343,488 bytes（1.28125 MiB）。不將淨額誤當包體新增，也不當成實測瀏覽器記憶體峰值。

## 視覺證據

- [冰洞材質前後](../../output/quality-pass4-20261105/cave-material-comparison.jpg)
- [行走6格](../../output/quality-pass4-20261105/warden-walk-sequence.jpg)
- [攻擊4格](../../output/quality-pass4-20261105/warden-attack-sequence.jpg)
- [受傷2格](../../output/quality-pass4-20261105/warden-hurt-sequence.jpg)
- [倒地4格](../../output/quality-pass4-20261105/warden-dead-sequence.jpg)
- [待機2格](../../output/quality-pass4-20261105/warden-idle-sequence.jpg)

同目錄另有5個狀態GIF，以未改的Manifest時序匯出；待機／行走循環，其他不循環。
逐格審圖可見原姿勢差異及倒地進程保留，毛皮、冰晶與輪廓已一致。
這些是**離線素材與順序對照**，不是Phaser實際播放、戰鬥或正常相機的瀏覽器證據。

## 實際檢查

| 檢查 | 結果 |
| --- | --- |
| 素材匯出器 | 一次通過：3張地形、18姿勢／30格完整覆蓋、12格重複映射、原首領PNG保留、動畫契約及非目標Manifest條目、接縫／實心地面、主體外框底邊／中心、玩法基線hash |
| `src/render/terrain-style.test.ts` | **7/7，一次通過**；更新洞窟／戶外分流、三個required keys、非冰雪fallback，既有地形拼接與PNG尺寸一併覆蓋 |
| `npm run typecheck` | **一次通過** |
| `npm run check:content` | **一次通過**，rules／world跨表引用 |
| `npm run build` | **一次通過**，`dist/assets/index-Yg-XEwU-.js` |
| 版本／差異 | package／lock／public／dist均beta.65；所改程式與Manifest的`git diff --check`通過 |

檢查使用現有Node24.19.0，未下載／切換到宣告的24.22.1+；正式Release仍需符合線上規格的Node與固定工具。沒有重跑完整套件，純PNG變更未另加動畫系統測試，素材契約由匯出器直接核對。

未執行：新瀏覽器／Phaser實際合成與動畫銜接、左右向戰鬥、冰洞攀爬操作、其他地圖實玩、高DPI／4K、效能、iframe／全螢幕、帳號／雲端及pack／ZIP驗證。沒有宣稱上述項目通過。

## 規格、狀態與下一步

本輪開始前透過網路重新完整讀取Playroom main範本及七份規格，來源清單見
[Plan52](../52-remaining-low-quality-assets.md#7-本輪線上規格來源)。適用要求是相對路徑、保留玩法與存檔、版本化素材、候選版本提升及如實驗證；沒有SDK／格式變更或發布。

冰雪三圖地形與冰潮首領細節目前皆已接入，這一段完成。下一步可按需求做一次冰雪正常相機／首領動態視覺驗收，或接續Plan52砂海材質；不要把本輪離線逐格觀察當作實玩通過。
本輪未commit、push、tag、Release或平台上架，未建立server／瀏覽器session，未碰玩家存檔。
