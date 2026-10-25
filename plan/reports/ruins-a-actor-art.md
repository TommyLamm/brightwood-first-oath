# 包 A 演員素材交接

日期：2026-10-25（香港時間）

## 範圍與狀態

已完成兩名營站NPC的正式runtime素材與manifest接線；苔陶蟲只完成共用身份錨點，完整6×5 runtime圖集交由主代理的單幀素材代理及整合代理續做。此交接不包含環境、音訊、規則、domain、render或UI。

## 可用成品

- 芷衡：`public/assets/actors/npc-ruins-archivist-v1.png`，192×96 RGBA、2欄×1列、96×96顯示格、pivot(0.5,1)。manifest為`actor:ruins-archivist`；動畫`npc:ruins-archivist:idle`，frames `[0,1]`、[350,350]ms、loop。
- 青禾：`public/assets/actors/npc-ruins-medic-v1.png`，同為192×96 RGBA及雙格idle；manifest為`actor:ruins-medic`與`npc:ruins-medic:idle`，時間及pivot相同。
- 芷衡使用keeper/archivist researcher外觀：短髮、白石與青綠研究服、筆記本及刻痕工具；青禾有青綠營站醫者衣著及藥包／小藥瓶。兩名NPC的最終雙格都閉嘴，只有輕微呼吸差異。
- 苔陶蟲共用右向idle身份錨點：`art-source/ruins-a/actors/moss-carapace-idle-anchor-v1-mirrored-right.png`（96×96 RGBA），只供後續生成與身份一致性參照，並非runtime。高解析原稿為`art-source/ruins-a/actors/generated/moss-carapace-idle-anchor-generated-v1.png`。

正式原稿、逐次ImageGen來源ID、完整prompt、參考路徑、拒絕原因與正規化方式都記在`art-source/ruins-a/actors/source-log.md`。檢視縮圖在同目錄的`review/`，均使用中性底JPEG q70、長邊不超過1280。

## 苔陶蟲未完成項目

- 已生成的原始6姿勢row v1，以及idle row v2都保存在`art-source/ruins-a/actors/generated/`，沒有放進public。審查發現姿勢本體高alpha跨格連通、外側姿勢有裁切；無法安全地按等分框裁出完整角色。不可把這些row直接重排成runtime。
- 主代理已將同一右向錨點交給兩個新單幀代理；預計產出8個idle/walk有效frame及10個attack/hurt/dead有效frame，再由整合代理重新排成576×480、6×5圖集。
- 整合時仍需遵守戰鬥報告的精確動畫格：idle `[0,1]` 200ms loop；walk `[6..11]` 六格各120ms loop；attack `[12..15]` 依序275/275/80/770ms non-loop；hurt `[18,19]` 100ms；dead `[24..27]` 四格各100ms；idle/attack/hurt/dead的未使用格重複各列最後有效格。不得將idle複製成walk或attack。
- 本代理未建立`monster-ruins-moss-carapace.png`或苔陶蟲manifest entry；整合完成後再新增image及五個動畫key。

## 驗證

- 以局部素材檢查腳本確認兩個NPC成品均192×96 RGBA、alpha範圍0–255、兩格各有完整人物主體，並且frame差異可見。
- 解析`public/assets/actors/manifest.json`確認新增key、image引用、兩格frame及[350,350]ms loop設定一致；未跑瀏覽器、遊戲測試或build。主代理會統一執行build與全體引用驗收。

## 下一步

接手的整合代理使用上述共享錨點生成並檢視各個真實姿勢，完成後新增runtime PNG及manifest，再做一次本批素材尺寸／alpha／animation contract檢查。之後由主代理做build；本階段未commit、未發布。
