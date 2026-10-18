# 2026-10-18 素材交付

本次範圍只完成素材。已讀取Playroom模板及七份指定main文件（2026-10-18，香港時間），適用自包含素材、相對路徑、保留來源及如實標示驗收邊界。遊戲ID／版本沿用，未修改發行內容。

使用者明確允許對ImageGen原稿作裁切透明留白、逐格排列、最近鄰縮放、清邊及alpha處理，並保留原稿和處理腳本。本輪沒有新增ImageGen呼叫：原素材均由先前內建ImageGen生成，此輪完成確定性匯出，沒有程式繪製角色或特效。

| 包 | 正式交付 | 引用PNG總bytes | 狀態 |
| --- | --- | ---: | --- |
| actors | 22 images／64 animations，三套主角＋七怪（含首領）＋五NPC＋七裝備；另96個hero anchors | 14,397,572 | 素材完成，低於18MiB |
| environment | 20 images；補平台128×32及可旋轉斜坡材質128×128 | 16,265,754 | 素材完成，低於16MiB |
| interface | 47 images／5 animations；補重斬768×128六格圖集 | 3,212,480 | 素材完成，低於6MiB |

三套新主角各1024×1024、8×8；五組新怪物各768×640、6×5；商人256×128、2×1。有效動作保留來源姿勢，未用格重複末有效格。新actor／重斬圖集每格至少16px透明邊，alpha僅0／255。Guardian已統一朝右。

正式素材及manifest位於 `public/assets/actors/`、`public/assets/environment/`、`public/assets/interface/`。所有原稿、prompt與本地參考紀錄留於對應 `art-source/` 的source-log.md。精確來源、格框、hash及匯出參數見：

- [主角報告](T10-hero.md)、[怪物／商人報告](T10-creatures.md)
- [地形報告](T11.md)、[介面特效報告](T12.md)
- [離線audit](../../art-source/asset-delivery-audit-20261018.json)、[素材總覽圖](../../art-source/asset-delivery-preview-20261018.png)

可重現的處理腳本：`art-source/actors/hero/export_hero_v9.py`、`export_hero_anchors_v9.py`、`art-source/actors/recovery-creatures-export.py`、`art-source/environment/export_terrain_v1.py`、`art-source/interface/export_heavy_strike_v9.py`。手／頭anchors以人工標註的正式128px畫格換算為96×96左上座標；逐格覆疊預覽保留在hero來源目錄。`anchors.json`的schema為version1、coordinateSpace、heroes.{cloth,leather,iron}.{state}有效frame陣列。

已完成的必要檢查：新素材視檢；匯出內部斷言；一次離線audit核對檔案存在、相對URL、全局key唯一、切格、動畫引用、96個anchors及體積。應用程式 `loadRequiredAssetManifests` 以本地JSON作fetcher讀取四包通過，audio沿用既有16 entries。這只是素材metadata檢查。

未執行build、typecheck、測試套件、瀏覽器、遊戲實玩、ZIP pack/validate或iframe驗收。沒有修改遊戲src。角色透明邊使可見腳底高於frame pivot，後續T07/T14應依可見腳底／邊距貼齊foothold；anchors裝備附著、武器方向與攻擊節拍亦需遊戲接合。素材完成不代表可玩候選完成。沒有建立封面、ZIP、tag、Release或平台發布。
