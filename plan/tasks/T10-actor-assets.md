# T10：主角、裝備、怪物與NPC正式圖

目的：交出可直接入遊戲的角色素材，不只有概念圖。所有權public/assets/actors/**、art-source/actors/**、自己的report；不改renderer／總manifest／contracts。可先讀10生成風格參考，manifest接合待G0。

先讀imagegen技能及[10](../10-asset-spec.md)，本包全部key、格數、動畫與anchors照10。不要求使用者提供素材。內建ImageGen每次明確資產目標及本地參考，透明輸出保留alpha。

目前狀態（2026-10-18，取代下方舊嘗試狀態）：素材製作 DONE。canonical actors manifest有22 images／64 animations與96個有效主角畫格anchors。使用者授權確定性匯出後，三套hero、四隻普通怪、guardian與merchant均由既有ImageGen原稿整理入庫。遊戲接合與裝備附著未驗證，詳reports/T10.md。

## 步驟

- [x] T10-01 已有主角身分與森林風格參考，沿用本地參考與既有ImageGen原稿。
- [x] T10-02 布衣hero-cloth-v9：8×8、八狀態及完整有效格，未用格重複末有效格。
- [x] T10-03 皮甲／鐵甲hero-leather-v9、hero-iron-v9：同主角特徵與八狀態規則。
- [x] T10-04 沿用已驗收四武器／三帽獨立透明素材。
- [x] T10-05 anchors.json含三服裝共96個有效畫格hand／head；以96×96左上座標，保留標註腳本與覆疊檢視。
- [x] T10-06 六普通怪完整五狀態圖集；沿用slime／sentinel，新復原snail／mushroom／boar／golem。
- [x] T10-07 guardian完整6×5圖集、五狀態、display192×192，已鏡像統一朝右。
- [x] T10-08 五NPC各兩格idle；merchant新復原入庫。
- [x] T10-09 canonical manifest有22 images／64 animations，引用皆為現有檔案，actual dimensions可切格。
- [x] T10-10 新圖已視檢動作／alpha／腳底／握點覆疊；原稿保留，匯出新圖安全邊至少16px、binary alpha。
- [x] T10-11 正式素材入public/assets/actors，原稿／prompt／匯出腳本留art-source，引用runtime PNG總14,397,572 bytes，低於18MiB。
- [x] T10-12 reports已列正式素材、格序、anchors及未驗證整合項；主Agent已做離線檔案／manifest核對。

完成：三套完整主角、四武器、三帽、六普通怪、一boss、五NPC及可用metadata全部存在。不得用CSS形狀替代、只交prompt、只交站姿或靜態怪卻標動作完成。生成工具受限報主Agent排佇列，不建立新聊天／自行改用API。

## T10-06 snail fresh composition update (2026-10-18)

UNFINISHED，source-only。新候選 snail-atlas-attempt-05.png 為 1373×1145，寬度不能整除6；alpha 含 638,942 個 partial pixels，且可見紅色外緣殘留。因格線無效，逐格結果僅作近似診斷：120 個cell邊中110個未達16px安全距離，腳底線也不一致。一次新構圖額度已用完，不作repair；無runtime PNG或subset manifest entry。完整prompt、參考路徑、工具、hash與檢查記於 art-source/actors/monsters/snail/source-log.md 和 plan/reports/T10-creatures.md。
**Snail attempt-06 (2026-10-18):** UNFINISHED, source-only. New built-in ImageGen output is 1374×1145 and divides exactly into 6×5 cells, but all 30 cells fail the 16 px safety margin on at least one side. The full atlas has 619,020 partially transparent pixels and visible red/yellow-green fringe; no repair or runtime copy was made. Full prompt, reference paths, hash and focused checks are in art-source/actors/monsters/snail/source-log.md and plan/reports/T10-creatures.md.

## T10-02 final fresh-composition attempt and manifest handoff (2026-10-18)

Hero-cloth v7 is UNFINISHED and source-only. A new composition was generated with the viewed local protagonist reference and a prompt specifying a 1024×1024 canvas, 8×8 cells of 128×128, a centered 60% character area, and at least 16 px fully transparent cell margins. The returned PNG is 1254×1254 RGBA (`mod 8 = 6×6`), with 834,922 transparent / 736,151 partial-alpha / 1,443 opaque pixels and visible colored fringe. Equal floor-bin diagnostics are not certifiable cell measurements because the output dimensions do not divide evenly. The full prompt, reference and output paths, alpha counts, hash, and diagnostic are recorded in `art-source/actors/hero/source-log.md` and `plan/reports/T10-hero.md`. No repair, crop, regrid, or runtime copy was made; do not retry hero-cloth again under this package.

`public/assets/actors/manifest.json` is available to T07 as a PARTIAL renderer input at `assets/actors/manifest.json` relative to the public root. It combines only accepted subset rows: 13 images and 14 animations, with no placeholder entries or schema extensions. Focused JSON, unique-key, file URL, grid divisibility, and animation-reference checks passed. It does not satisfy full T10-09; leave that step unchecked and do not claim full T10 coverage. No anchors are present. Latest report: `plan/reports/T10.md`.
## T10-02/06 recovery evidence (2026-10-18)

Hero-cloth v6 and its single targeted repair are both UNFINISHED and source-only. Both outputs are 1254×1254 RGBA, not divisible into 8×8 cells, and visibly retain colored fringe/soft alpha; the repair did not improve the full-image red-fringe diagnostic or approximate per-cell safety margins. No runtime hero image or anchors were created. See plan/reports/T10-hero.md and art-source/actors/hero/source-log.md.

Snail attempt-06 is also UNFINISHED and source-only. It divides into 6×5 cells but every cell misses the 16 px safety margin on at least one side and the atlas has visible colored fringe. No runtime snail image or manifest entry was created. See plan/reports/T10-creatures.md and art-source/actors/monsters/snail/source-log.md.

**Hero-cloth v8 parent-authorized one-shot recovery (2026-10-18):** One materially different pixel-art composition was attempted with the viewed protagonist reference and accepted guide sprite. It is still UNFINISHED: 1254×1254 RGBA is not divisible by 8, alpha contains extensive partial transparency, and visual review found soft painted edges and colored fringe. The original output is source-only at art-source/actors/hero/hero-cloth-v8-attempt-1.png; no runtime asset, manifest entry, or anchors were added. No crop or repair was performed. This one-shot allowance is exhausted; keep T10-02/T10-05 unchecked.
