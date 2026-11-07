# 現有角色素材盤點

日期：2026-11-05（Asia/Hong_Kong）；版本：1.0.0-beta.58

來源：目前 src/content/world/npcs.ts、maps.ts、src/content/rules/monsters.ts、items.ts、public/assets/actors/manifest.json，以及 src/render/index.ts、src/main.ts。

預覽從目前 runtime 貼圖擷取待機首格，依 manifest 顯示框縮放，使用 nearest-neighbor 並合成深色背景；不是本次遊玩截圖。1× 指 960×540 邏輯畫布內的尺寸，實際螢幕尺寸還受 FIT 縮放及裝置像素比影響。顯示框含透明留白。主角預覽未疊加帽子與武器。

共 1 位主角（3 種裝束）、10 位友善 NPC、13 種普通怪物、4 位首領；另有 3 個互動物件，共用 1 張石碑貼圖。所有項目皆有地圖引用。

| 類別 | 名稱 | 出現地點 | 原始單格 | 顯示框 | 待機可見身形（邏輯 px，約） | 檔案 |
|---|---|---|---|---|---|---|
| hero | 旅行布衣 | 所有地圖 | 128×128 | 96×96 | 37.5×63.0 | assets/actors/hero-cloth-v9.png |
| hero | 輕革甲 | 所有地圖 | 128×128 | 96×96 | 45.8×66.8 | assets/actors/hero-leather-v9.png |
| hero | 鐵環甲 | 所有地圖 | 128×128 | 96×96 | 34.5×65.2 | assets/actors/hero-iron-v9.png |
| npc | 森芽 | 晨光營地 | 384×384 | 96×96 | 40.8×87.8 | assets/actors/npcs/guide-idle-v1.png |
| npc | 岩嶺教官 | 木葉鎮 | 384×384 | 96×96 | 42.0×91.2 | assets/actors/npcs/mentor-idle-v1.png |
| npc | 木葉商人 | 木葉鎮 | 384×384 | 96×96 | 43.5×91.5 | assets/actors/npcs/merchant-idle-v3.png |
| npc | 晨露 | 木葉鎮 | 384×384 | 96×96 | 38.0×88.2 | assets/actors/npcs/healer-idle-v1.png |
| npc | 礦道守望者 | 赤岩山徑 | 384×384 | 96×96 | 39.5×91.8 | assets/actors/npcs/keeper-idle-v1.png |
| npc | 雪芽 | 雪痕海岸 | 887×887 | 96×96 | 39.7×81.9 | assets/actors/npcs/frost-guide-idle-v1.png |
| npc | 琉砂 | 琥珀砂岸 | 128×128 | 96×96 | 42.8×77.2 | assets/actors/npcs/sands-guide-idle-v1.png |
| npc | 芷衡 | 潮痕營站 | 96×96 | 96×96 | 43.0×90.0 | assets/actors/npc-ruins-archivist-v1.png |
| npc | 青禾 | 潮痕營站 | 96×96 | 96×96 | 36.0×90.0 | assets/actors/npc-ruins-medic-v1.png |
| npc | 行舟 | 回聲長廊 | 96×96 | 96×96 | 39.0×83.0 | assets/actors/npcs/ruins-pathfinder-idle-v1.png |
| prop | 西回聲碑 | 回聲長廊 | 192×256 | 96×128 | 49.5×111.5 | assets/actors/npcs/ruins-stele-v1.png |
| prop | 東回聲碑 | 回聲長廊 | 192×256 | 96×128 | 49.5×111.5 | assets/actors/npcs/ruins-stele-v1.png |
| prop | 霜松航標 | 霜松隘道 | 192×256 | 96×128 | 49.5×111.5 | assets/actors/npcs/ruins-stele-v1.png |
| monster | 苔殼蝸牛 | 晨光營地、嫩芽林道 | 128×128 | 96×96 | 58.5×42.0 | assets/actors/monsters/snail-atlas-v2.png |
| monster | 嫩芽史萊姆 | 嫩芽林道、菌傘深林 | 128×128 | 96×96 | 68.2×46.5 | assets/actors/monsters/slime-atlas-v2.png |
| monster | 菌傘菇 | 菌傘深林 | 128×128 | 96×96 | 60.0×52.5 | assets/actors/monsters/mushroom-atlas-v2.png |
| monster | 赤背野豬 | 赤岩山徑 | 128×128 | 96×96 | 63.0×49.5 | assets/actors/monsters/boar-atlas-v2.png |
| monster | 礦岩魔像 | 赤岩山徑、古礦入口 | 128×128 | 96×96 | 60.0×60.0 | assets/actors/monsters/golem-atlas-v2.png |
| monster | 鏽甲哨兵 | 古礦入口 | 128×128 | 96×96 | 73.5×89.2 | assets/actors/monsters/sentinel-atlas-v2.png |
| monster | 霜牙雪狼 | 雪痕海岸、霜松隘道 | 229×229 | 96×96 | 67.1×47.8 | assets/actors/monsters/frost-wolf-atlas-v1.png |
| monster | 冰甲蟹 | 霜松隘道、冰潮洞窟 | 229×229 | 96×96 | 48.6×31.4 | assets/actors/monsters/frost-crab-atlas-v1.png |
| monster | 琥珀蠍 | 琥珀砂岸、砂丘關道、日井盆地 | 96×96 | 96×96 | 73.0×57.0 | assets/actors/monsters/sand-scorpion-atlas-v1.png |
| monster | 日井甲蟲 | 砂丘關道、日井盆地 | 96×96 | 96×96 | 74.0×52.0 | assets/actors/monsters/sunwell-beetle-atlas-v1.png |
| monster | 苔陶蟲 | 盤根石道 | 96×96 | 96×96 | 74.0×40.0 | assets/actors/monster-ruins-moss-carapace.png |
| boss | 古礦守衛 | 守衛祭壇 | 128×128 | 192×192 | 114.0×126.0 | assets/actors/monsters/guardian-atlas-v2.png |
| boss | 日井守衛 | 日井祭壇 | 96×96 | 192×192 | 154.0×156.0 | assets/actors/monsters/sunwell-sentinel-atlas-v1.png |
| boss | 冰潮守望獸 | 冰潮洞窟 | 272×272 | 192×192 | 91.1×59.3 | assets/actors/monsters/frost-tide-warden-atlas-v1.png |
| monster | 斷弦木偶 | 回聲長廊 | 96×96 | 96×96 | 50.0×72.0 | assets/actors/monster-ruins-string-puppet.png |
| monster | 巡鈴石獸 | 回聲長廊 | 96×96 | 96×96 | 85.0×60.0 | assets/actors/monster-ruins-bell-prowler.png |
| boss | 失序司鐘者 | 誓鐘內殿 | 192×192 | 192×192 | 180.0×132.0 | assets/actors/monster-ruins-bell-keeper-v1.png |

## 裝備疊圖

武器與帽子是獨立素材，不另算角色：練習短劍、鐵製長劍、精鋼長劍、守衛之刃、冰潮長鋒、日井誓刃、布帽、皮帽、鐵盔、守誓旅冠。

## 解析度相關觀察

Phaser 使用 CANVAS、960×540 邏輯畫布、Scale.FIT，且 antialias:false。主角每格 128×128，但遊戲顯示框為 96×96；顯示框亦含透明空間。全畫面放大與角色可見面積都會影響細節。以上為靜態程式與圖片觀察，尚未測量實際瀏覽器／螢幕的模糊成因。

## 規範、驗證與交接

2026-11-05 已透過網路閱讀 Playroom game-agent-template.md 與其列出的 game-development.md、command-contracts.md、game.schema.json、game-release.yml、playroom-sdk.js、sdk-versioning.md、save-compatibility.md（main）。本次為素材盤點，未更改玩法、存檔、runtime 素材或版本，未發布。

已執行：角色與地圖／manifest 引用交叉盤點、圖片尺寸及待機 frame 擷取、預覽排版檢視。未執行：build、型別檢查、測試套件或啟動瀏覽器（本次無遊戲變更）。

下一步：使用者選定升級範圍及視覺方向後，先以主角三套裝束做高解析度樣板，再沿用動畫狀態、裝備錨點與顯示比例擴展；實際升級尚未開始。
