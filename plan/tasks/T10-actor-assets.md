# T10：主角、裝備、怪物與NPC正式圖

目的：交出可直接入遊戲的角色素材，不只有概念圖。所有權public/assets/actors/**、art-source/actors/**、自己的report；不改renderer／總manifest／contracts。可先讀10生成風格參考，manifest接合待G0。

先讀imagegen技能及[10](../10-asset-spec.md)，本包全部key、格數、動畫與anchors照10。不要求使用者提供素材。內建ImageGen每次明確資產目標及本地參考，透明輸出保留alpha。

## 步驟

- [x] T10-01 建source-log，生成固定短髮劍士、正側視／服裝輪廓參考，保留相同比例／五官／配色。這是開工參考，不當正式動畫完成。
- [ ] T10-02 生成hero-cloth的8×8動作圖集，依10的8列狀態，畫面純透明、foot一致、各格無裁切。檢查格數及跨格污染，不可用一張站姿當走路。（本輪 UNFINISHED：v3 attempt + 一次 targeted repair 仍輸出 1254×1254、mod 8=6×6 且有彩邊／大量 partial alpha；候選及完整 prompts 僅存 art-source/actors/hero，未入 runtime／manifest／anchors，詳 plan/reports/T10.md。）回收的 v4 原稿與一次修正均為 1254×1254，未整除 8×8 且仍有彩邊；僅保存於 source，詳 plan/reports/T10.md。
- [ ] T10-03 基於同主角參考製作hero-leather、hero-iron，動作／臉／髮不改、僅服裝不同；三衣服具可見升級差異。本輪 leather/iron v3 各生成一版並各做一次修正；仍未整除 8×8 且邊緣檢視不合格，僅保存於 source。
- [x] T10-04 生成四武器及三帽，透明、方向／pivot一致，主角圖集手上不烘焙固定武器，避免換裝仍拿兩把。
- [ ] T10-05 為每個hero有效frame填hand/head anchors，按10坐標，武器attack rotation逐格可用；不是全部frame盲填同一點。
- [ ] T10-06 逐個生成snail/slime/mushroom/boar/golem/sentinel五狀態圖集（6×5），身形／色盤一致但輪廓可分辨；不加第七普通怪。（部分：slime、sentinel已驗收入選；snail、mushroom、boar、golem均UNFINISHED且只有source候選。golem新增attempt-03/04後仍未通過：attempt-03可整除但有可見彩邊、柔邊且腳底貼格底；attempt-04寬1373不能整除6，仍有彩邊與大量partial alpha。無runtime/manifest entry；完整prompt、hash及檢查詳`plan/reports/T10-creatures.md`與怪物source log。）
- [ ] T10-07 生成guardian兩倍顯示尺寸五狀態圖集，具有可辨識蓄力／揮擊姿勢；phase2可用渲染染色，不額外增加AI招式。（UNFINISHED；已有一次生成及一次針對修正，修正版紅色高alpha殘像增加且仍可見，因此不入runtime；詳`plan/reports/T10-creatures.md`及怪物source log。）
- [ ] T10-08 生成五NPC兩格idle，與role外觀相符，名字文字不放圖片中。（部分：guide、mentor、healer、keeper已驗收入選；merchant仍為UNFINISHED。單項追補生成／referenced-image修正為attempt-05/06，兩格尺寸合規但修正版仍有紅色外緣與大量部分透明柔邊，不入runtime／manifest；提示全文及檢查詳`plan/reports/T10-creatures.md`及NPC source log。）
- [ ] T10-09 建本包manifest及animation keys，URL指入遊戲檔，實際寬高可整除格數；不假設工具固定產出尺寸。（目前只有gear與creature subset metadata，未建立完整`manifest.json`。）
- [ ] T10-10 檢視每個新圖的alpha、臉一致、foot／握點、格序；失敗僅重做該組。ImageGen修正local圖先查看再指定referenced_image_paths。
- [ ] T10-11 檔案複製進workspace，原稿／prompt留art-source不入dist，正式包內部預算18MiB；多餘候選不指入manifest。
- [ ] T10-12 report列實際image/animation key、圖格、anchors、每項formal/temporary、檢視及未完成，給T07一套主角+snail提早接入。（目前可用子集及所有未完成／拒收項已列於`plan/reports/T10.md`、`plan/reports/T10-creatures.md`與source logs；hero、snail仍未完成。）

完成：三套完整主角、四武器、三帽、六普通怪、一boss、五NPC及可用metadata全部存在。不得用CSS形狀替代、只交prompt、只交站姿或靜態怪卻標動作完成。生成工具受限報主Agent排佇列，不建立新聊天／自行改用API。
