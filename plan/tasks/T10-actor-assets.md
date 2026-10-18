# T10：主角、裝備、怪物與NPC正式圖

目的：交出可直接入遊戲的角色素材，不只有概念圖。所有權public/assets/actors/**、art-source/actors/**、自己的report；不改renderer／總manifest／contracts。可先讀10生成風格參考，manifest接合待G0。

先讀imagegen技能及[10](../10-asset-spec.md)，本包全部key、格數、動畫與anchors照10。不要求使用者提供素材。內建ImageGen每次明確資產目標及本地參考，透明輸出保留alpha。

## 步驟

- [x] T10-01 建source-log，生成固定短髮劍士、正側視／服裝輪廓參考，保留相同比例／五官／配色。這是開工參考，不當正式動畫完成。
- [ ] T10-02 生成hero-cloth的8×8動作圖集，依10的8列狀態，畫面純透明、foot一致、各格無裁切。檢查格數及跨格污染，不可用一張站姿當走路。（UNFINISHED：v3/v4與2026-10-18新構圖v5及唯一一次針對修正均為1254×1254、mod 8=6×6；v5修正後仍有大量partial alpha和彩色halo，近似等分格診斷64/64格安全邊不足16px。僅source保存，無runtime／manifest／anchors；本輪生成與修正額度已用完，不裁切、重排或色鍵。prompt、參考路徑、尺寸、alpha、hash與視檢記於art-source/actors/hero/source-log.md及plan/reports/T10-hero.md。）
- [ ] T10-03 基於同主角參考製作hero-leather、hero-iron，動作／臉／髮不改、僅服裝不同；三衣服具可見升級差異。最新v3 attempt/repair仍為1254×1254、mod 8=6×6且有紅／黃綠外緣與繪畫式柔邊；未通過格線、安全邊與輪廓檢視，僅保存於source，詳plan/reports/T10.md。
- [x] T10-04 生成四武器及三帽，透明、方向／pivot一致，主角圖集手上不烘焙固定武器，避免換裝仍拿兩把。
- [ ] T10-05 為每個hero有效frame填hand/head anchors，按10坐標，武器attack rotation逐格可用；不是全部frame盲填同一點。
- [ ] T10-06 逐個生成snail/slime/mushroom/boar/golem/sentinel五狀態圖集（6×5），身形／色盤一致但輪廓可分辨；不加第七普通怪。（部分：slime、sentinel已驗收入選；snail、mushroom、boar、golem均UNFINISHED且只有source候選。golem新增attempt-03/04後仍未通過：attempt-03可整除但有可見彩邊、柔邊且腳底貼格底；attempt-04寬1373不能整除6，仍有彩邊與大量partial alpha。無runtime/manifest entry；完整prompt、hash及檢查詳`plan/reports/T10-creatures.md`與怪物source log。）

  **Mushroom reattempt (2026-10-18):** Read gate completed at 2026-10-18 01:40 UTC; the live template and seven linked Playroom specifications were read in full (exact URLs and applicable requirements recorded in `art-source/actors/monsters/source-log.md`). Applicable requirements: relative asset paths, truthful desktop-only declaration, iframe sizing/no top navigation or popup, no account/admin API, and no publishing. Check scope: image grid, per-cell safe margins/containment, silhouette, baseline, alpha edges, and matching hash/metadata only. One fresh composition and its single targeted repair (`attempt-05/06`) both produced divisible 6×5 grids but visible red edge contamination; all 30 cells missed the required 16 px safe margin in at least one direction. Both are preserved source-only; no runtime asset or subset metadata entry was added. The generation/repair allowance is exhausted. See `plan/reports/T10-creatures.md` and the mushroom section in the monster source log.
- [ ] T10-07 生成guardian兩倍顯示尺寸五狀態圖集，具有可辨識蓄力／揮擊姿勢；phase2可用渲染染色，不額外增加AI招式。（UNFINISHED；新構圖 attempt-03 及唯一一次針對修正 attempt-04 均為1373×1145，寬度不能整除6；修正版紅色高alpha殘像增加，且逐格診斷未達16px安全邊，故只保留source，不進runtime／manifest。生成額度已用完；驗收詳`plan/reports/T10-creatures.md`及怪物source log。）
- [ ] T10-08 生成五NPC兩格idle，與role外觀相符，名字文字不放圖片中。（部分：guide、mentor、healer、keeper已驗收入選；merchant仍為UNFINISHED。單項追補生成／referenced-image修正為attempt-05/06，兩格尺寸合規但修正版仍有紅色外緣與大量部分透明柔邊，不入runtime／manifest；提示全文及檢查詳`plan/reports/T10-creatures.md`及NPC source log。）
- [ ] T10-09 建本包manifest及animation keys，URL指入遊戲檔，實際寬高可整除格數；不假設工具固定產出尺寸。（目前只有gear與creature subset metadata，未建立完整`manifest.json`。）
- [ ] T10-10 檢視每個新圖的alpha、臉一致、foot／握點、格序；失敗僅重做該組。ImageGen修正local圖先查看再指定referenced_image_paths。
- [ ] T10-11 檔案複製進workspace，原稿／prompt留art-source不入dist，正式包內部預算18MiB；多餘候選不指入manifest。
- [ ] T10-12 report列實際image/animation key、圖格、anchors、每項formal/temporary、檢視及未完成，給T07一套主角+snail提早接入。（目前可用子集及所有未完成／拒收項已列於`plan/reports/T10.md`、`plan/reports/T10-creatures.md`與source logs；hero、snail仍未完成。）

完成：三套完整主角、四武器、三帽、六普通怪、一boss、五NPC及可用metadata全部存在。不得用CSS形狀替代、只交prompt、只交站姿或靜態怪卻標動作完成。生成工具受限報主Agent排佇列，不建立新聊天／自行改用API。

## T10-06 snail fresh composition update (2026-10-18)

UNFINISHED，source-only。新候選 snail-atlas-attempt-05.png 為 1373×1145，寬度不能整除6；alpha 含 638,942 個 partial pixels，且可見紅色外緣殘留。因格線無效，逐格結果僅作近似診斷：120 個cell邊中110個未達16px安全距離，腳底線也不一致。一次新構圖額度已用完，不作repair；無runtime PNG或subset manifest entry。完整prompt、參考路徑、工具、hash與檢查記於 art-source/actors/monsters/snail/source-log.md 和 plan/reports/T10-creatures.md。
**Snail attempt-06 (2026-10-18):** UNFINISHED, source-only. New built-in ImageGen output is 1374×1145 and divides exactly into 6×5 cells, but all 30 cells fail the 16 px safety margin on at least one side. The full atlas has 619,020 partially transparent pixels and visible red/yellow-green fringe; no repair or runtime copy was made. Full prompt, reference paths, hash and focused checks are in art-source/actors/monsters/snail/source-log.md and plan/reports/T10-creatures.md.
## T10-02/06 recovery evidence (2026-10-18)

Hero-cloth v6 and its single targeted repair are both UNFINISHED and source-only. Both outputs are 1254×1254 RGBA, not divisible into 8×8 cells, and visibly retain colored fringe/soft alpha; the repair did not improve the full-image red-fringe diagnostic or approximate per-cell safety margins. No runtime hero image or anchors were created. See plan/reports/T10-hero.md and art-source/actors/hero/source-log.md.

Snail attempt-06 is also UNFINISHED and source-only. It divides into 6×5 cells but every cell misses the 16 px safety margin on at least one side and the atlas has visible colored fringe. No runtime snail image or manifest entry was created. See plan/reports/T10-creatures.md and art-source/actors/monsters/snail/source-log.md.
