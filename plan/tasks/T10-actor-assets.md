# T10：主角、裝備、怪物與NPC正式圖

目的：交出可直接入遊戲的角色素材，不只有概念圖。所有權public/assets/actors/**、art-source/actors/**、自己的report；不改renderer／總manifest／contracts。可先讀10生成風格參考，manifest接合待G0。

先讀imagegen技能及[10](../10-asset-spec.md)，本包全部key、格數、動畫與anchors照10。不要求使用者提供素材。內建ImageGen每次明確資產目標及本地參考，透明輸出保留alpha。

## 步驟

- [ ] T10-01 建source-log，生成固定短髮劍士、正側視／服裝輪廓參考，保留相同比例／五官／配色。這是開工參考，不當正式動畫完成。
- [ ] T10-02 生成hero-cloth的8×8動作圖集，依10的8列狀態，畫面純透明、foot一致、各格無裁切。檢查格數及跨格污染，不可用一張站姿當走路。
- [ ] T10-03 基於同主角參考製作hero-leather、hero-iron，動作／臉／髮不改、僅服裝不同；三衣服具可見升級差異。
- [ ] T10-04 生成四武器及三帽，透明、方向／pivot一致，主角圖集手上不烘焙固定武器，避免換裝仍拿兩把。
- [ ] T10-05 為每個hero有效frame填hand/head anchors，按10坐標，武器attack rotation逐格可用；不是全部frame盲填同一點。
- [ ] T10-06 逐個生成snail/slime/mushroom/boar/golem/sentinel五狀態圖集（6×5），身形／色盤一致但輪廓可分辨；不加第七普通怪。（部分：slime、sentinel入選；snail、mushroom、boar、golem為UNFINISHED，詳T10-creatures報告。）
- [ ] T10-07 生成guardian兩倍顯示尺寸五狀態圖集，具有可辨識蓄力／揮擊姿勢；phase2可用渲染染色，不額外增加AI招式。（UNFINISHED；詳T10-creatures報告。）
- [ ] T10-08 生成五NPC兩格idle，與role外觀相符，名字文字不放圖片中。（部分：guide、mentor、healer、keeper入選；merchant為UNFINISHED，詳T10-creatures報告。）
- [ ] T10-09 建本包manifest及animation keys，URL指入遊戲檔，實際寬高可整除格數；不假設工具固定產出尺寸。
- [ ] T10-10 檢視每個新圖的alpha、臉一致、foot／握點、格序；失敗僅重做該組。ImageGen修正local圖先查看再指定referenced_image_paths。
- [ ] T10-11 檔案複製進workspace，原稿／prompt留art-source不入dist，正式包內部預算18MiB；多餘候選不指入manifest。
- [ ] T10-12 report列實際image/animation key、圖格、anchors、每項formal/temporary、檢視及未完成，給T07一套主角+snail提早接入。

完成：三套完整主角、四武器、三帽、六普通怪、一boss、五NPC及可用metadata全部存在。不得用CSS形狀替代、只交prompt、只交站姿或靜態怪卻標動作完成。生成工具受限報主Agent排佇列，不建立新聊天／自行改用API。
