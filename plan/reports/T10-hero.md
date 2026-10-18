# T10-hero：主角動作圖集與 anchors

## 狀態

**UNFINISHED — 三套主角圖集均未達 runtime 驗收，未建立 anchors.json。**

布衣、皮甲、鐵甲都已有一份初次生成候選；每組均已按限制做過一次局部修正。修正後所有輸出仍是 1254 x 1254，寬高除以 8 皆餘 6，不能依 8 x 8 格均勻切片；各圖仍可見紅／黃或其他顏色殘邊。候選原稿已保存到 art-source/actors/hero/，未複製到 runtime。

## 已讀文件與適用要求

- 線上最新 Playroom 範本，以及七份完整主規格：game-development、command-contracts、game.schema、release workflow、starter SDK、sdk-versioning、save-compatibility；讀取完成日期 2026-10-18。
- 本地 plan/09-parallel-dispatch.md、plan/10-asset-spec.md、plan/tasks/T10-actor-assets.md、plan/07-shared-contracts.md、plan/08-content-spec.md、plan/reports/T10.md，以及 imagegen skill。
- Workspace 沒有根目錄 AGENTS.md 檔案副本；遵循使用者訊息所提供的根指令與本包明確限制。
- 適用要求：使用指定本地主角參考並逐圖檢視；透明輸出保留 alpha；圖集實際寬高必須可被列／欄整除；角色同臉、髮型、腳點與升級服裝可辨；不烘焙武器或帽子；anchors 依實際有效格量測，不猜點位。失敗最多一次局部修正後如實標示未完成。

## 交付檔案

- art-source/actors/hero/hero-cloth-v1-attempt-1.png
- art-source/actors/hero/hero-cloth-v1-repair-1.png
- art-source/actors/hero/hero-leather-v1-attempt-1.png
- art-source/actors/hero/hero-leather-v1-repair-1.png
- art-source/actors/hero/hero-iron-v1-attempt-1.png
- art-source/actors/hero/hero-iron-v1-repair-1.png
- art-source/actors/hero/source-log.md — 記錄每次完整 prompt、工具、本地參考、原始輸出路徑、候選檔及檢查結果。

**未建立 runtime 圖片、manifest 或 public/assets/actors/anchors.json。** 現有 gear PNG、gear-subset manifest 與根層 art-source/actors/source-log.md 未修改。

## T10-02/03 主角圖集

角色狀態列要求為 idle、walk、jump、climb、attack、hurt、dead、buff；各列有效 frame 數依序為 4、6、2、4、6、2、4、4，其餘格重複該列最後有效格。每張應有 32 個有效 frame。

| 圖集 | 候選／修正 | 視覺檢查 | 尺寸／alpha 檢查 | 結果 |
| --- | --- | --- | --- | --- |
| actor:hero-cloth | attempt-1、repair-1 | 可看出 8 x 8 姿勢排列；修正未去除紅黃雜邊，仍有武器攜行感斜帶 | 兩份皆 1254 x 1254 PNG Format32bppArgb，mod 8 = 6 x 6；透明 alpha 取樣有 0、255 | UNFINISHED |
| actor:hero-leather | attempt-1、repair-1 | 動作列可辨；修正後仍有角色輪廓彩色殘邊 | 兩份皆 1254 x 1254 PNG Format32bppArgb，mod 8 = 6 x 6；透明 alpha 取樣有 0、255 | UNFINISHED |
| actor:hero-iron | attempt-1、repair-1 | 動作列可辨；修正後仍有角色輪廓彩色殘邊 | 兩份皆 1254 x 1254 PNG Format32bppArgb，mod 8 = 6 x 6；透明 alpha 取樣有 0、255 | UNFINISHED |

逐圖抽樣背景 alpha 的結果（每圖共 24,649 個每 8px 取樣點；只用作 alpha/透明存在檢查，未推斷整張 alpha 品質）：

| 候選 | alpha=0 取樣點 |
| --- | ---: |
| cloth attempt-1 | 11,607 |
| cloth repair-1 | 11,166 |
| leather attempt-1 | 12,101 |
| leather repair-1 | 11,911 |
| iron attempt-1 | 12,342 |
| iron repair-1 | 11,739 |

尺寸是拒收原因：每張輸出均為 1254 x 1254，不能整除 8。視覺檢查也發現有彩色 fringe；因此 alpha channel 存在不等於達成可用透明邊緣。沒有做重採樣、裁切或手工修圖，也沒有再重試。

## T10-05 anchors

**BLOCKED**：每件服裝需為 32 個有效 frame 量測 hand{x,y,rotationDeg} 與 head{x,y}，總共 96 個有效 frame。現有候選未能以固定 8 x 8 整格切分且邊緣未通過檢視，不能用它們推算正式座標；public/assets/actors/anchors.json 尚不存在。待三張通過切格與 alpha 檢查的正式圖集後，再依每格 96 x 96 顯示座標量測 anchors。

## 檢查與未執行項

- 已逐一在 ImageGen 輸出中檢視六份生成／修正圖片。
- 已用 Windows System.Drawing.Bitmap 讀取六份 PNG 的像素格式、尺寸及 alpha 取樣；六張均為 1254 x 1254 Format32bppArgb、模 8 餘 6，取樣可見透明與不透明像素。
- 未跑程式測試、build、typecheck 或 content checker；本包為圖片與 anchors 資產工作，且目前沒有可供 runtime 驗收的圖集。
- T10-04 裝備圖及既有 subset manifest 不在本子包所有權內，未修改；怪物、boss、NPC、完整 actor manifest 亦未處理。

## 接線與後續

三個候選 key 目標仍為 actor:hero-cloth、actor:hero-leather、actor:hero-iron，但目前沒有可提供給 renderer 使用的 URL/manifest row。需要新的圖像生成結果能輸出可被 8 整除的實際尺寸，並通過透明邊緣與逐格檢視後，才可落到 runtime 並量測 anchors。屆時 T10 完整 manifest 由稍後指定的 T10 整合工作處理。

## Recovery v2（2026-10-18）

**結果仍為 UNFINISHED。** 對三套服裝各執行一次新生成及最多一次針對性修正；所有圖片均以 built-in ImageGen、`transparent_background: true` 產生，並以 `F:\Desktop\MapleStory\art-source\actors\hero-style-reference-v1.png` 作參考。各次 prompt 使用明確座標方格：布衣 1024/128 後修 2048/256；皮甲 2048/256 後修 1536/192；鐵甲 2048/256 後修 2560/320（前數為畫布邊長，後數為單格邊長）。沒有沿用舊 prompt、手工重採樣、裁切或繪圖修補。

| 圖集 | 保存於 `art-source/actors/hero/` | 尺寸／像素格式 | alpha=0／partial／255 | 結果 |
| --- | --- | --- | --- | --- |
| cloth | `hero-cloth-v2-attempt-1.png`, `hero-cloth-v2-repair-1.png` | 兩者均 1254×1254, Format32bppArgb, mod 8 = 6×6 | attempt 926,950／644,322／1,244；repair 766,472／803,870／2,174 | 彩邊與半透明暈染明顯；UNFINISHED |
| leather | `hero-leather-v2-attempt-1.png`, `hero-leather-v2-repair-1.png` | 兩者均 1254×1254, Format32bppArgb, mod 8 = 6×6 | attempt 730,682／839,728／2,106；repair 621,022／950,782／712 | 彩邊與半透明暈染明顯；UNFINISHED |
| iron | `hero-iron-v2-attempt-1.png`, `hero-iron-v2-repair-1.png` | 兩者均 1254×1254, Format32bppArgb, mod 8 = 6×6 | attempt 766,430／804,514／1,572；repair 716,193／854,075／2,248 | 彩邊與半透明暈染明顯；UNFINISHED |

逐張 ImageGen 預覽均可見紅／黃或其他彩色殘邊；邊緣也不符合乾淨硬邊 pixel sprite 要求。每套 prompt 均明確指定不同的 8×8 等分畫布，但實際輸出全為 1254×1254，無法整除 8；因此無法安全切成 8×8 cells 或證明 32 個有效 frame。alpha 已逐像素分類：雖有透明像素，但 partial alpha 遠多於 fully opaque 像素，不符合乾淨硬邊透明驗收。

六份候選僅保留於 `art-source/actors/hero/` 供追溯；未複製到 `public/assets/actors/hero/`，未建立局部 hero manifest 或 `public/assets/actors/anchors.json`。沒有合格 atlas 時，不能量測 96 個有效 frame 的 hand/head 座標，也不能從失敗格線推算 anchors。每套皆已達「一輪新生成＋一次修正」上限。只做圖像預覽及 System.Drawing 尺寸、像素格式、alpha 分類；未跑測試、build、typecheck 或 content checker。

**明確阻塞：** 內建 ImageGen 輸出未遵守 prompt 指定的畫布像素尺寸，且修正後仍有彩邊與大量 partial alpha。需要能實際輸出 8 整除尺寸及乾淨 alpha 邊界的圖像後，才能製作 runtime atlas、局部 manifest 與可量測 anchors；目前沒有合格資產供 T07 接線。

## T10-02 fresh cloth attempt and one targeted repair (2026-10-18)

**UNFINISHED — source-only.** After the earlier v3/v4 failures, one new v5 composition and one targeted repair were made with built-in ImageGen. The composition explicitly referenced `F:\Desktop\MapleStory\art-source\actors\hero-style-reference-v1.png`; the repair referenced the new v5 attempt and the same local hero style reference. Neither v3 nor v4 was used as a repair target or reference. Full prompts and raw generated paths are preserved in `art-source/actors/hero/source-log.md`.

| Candidate | Dimensions / grid | Alpha 0 / partial / 255 | SHA-256 | Result |
| --- | --- | --- | --- | --- |
| `hero/hero-cloth-v5-attempt-1.png` | 1254×1254 RGBA; mod 8 = 6×6 | 684,407 / 887,263 / 846 | `5e6871087357c4fa87312f0bba2a4395ccf8313de3a2b3b412b9b5577d462ec3` | Broad 8-row sequence recognizable; strong colored halos; invalid exact grid |
| `hero/hero-cloth-v5-repair-1.png` | 1254×1254 RGBA; mod 8 = 6×6 | 720,829 / 850,536 / 1,151 | `be6476e2c361a18217fb69d08a774c59343f5b9b4e062694b6410c49a66960f2` | Red-dominant diagnostic count increased from 324,654 to 358,296; halos remain |

Both copies are byte-identical to their raw ImageGen outputs; both have transparent corners, but each contains 256 alpha values and extensive partial alpha. Approximate equal-bin diagnostics (not valid cell measurements) found all 64 bins below the 16 px safe-margin target on at least one side. Because the actual dimensions cannot be divided into eight columns and rows, exact cell boundaries, 64-frame containment, cross-cell contamination, and consistent per-frame foot baselines cannot be certified. Visual review of the new image and its one repair confirms the colored fringe remains and is particularly visible on the repair. No cropping, resizing, regridding, recoloring, chroma key, runtime copy, manifest row, or anchors were added. The one allowed repair is exhausted.

Focused checks only: opened the local style reference, both v5 source copies, and each raw output; used Pillow to read PNG mode/dimensions, count full-image alpha categories, calculate the red-dominant diagnostic, and make explicitly approximate equal-bin safe-margin diagnostics; verified SHA-256 equality between source copies and raw outputs. No build, typecheck, content check, browser, or test suite was run because no runtime asset passed acceptance.
## T10-02 hero-cloth v6 candidate and targeted repair (2026-10-18)

**UNFINISHED — source-only; no runtime image, manifest entry or anchors.** One new hero-cloth composition and one targeted repair were generated with built-in ImageGen. The composition passed the local identity reference; the repair used the v6 attempt as its edit target and the same reference. Both raw outputs were copied unchanged to art-source/actors/hero/ and visually inspected.

| Candidate | Dimensions / grid | Alpha 0 / partial / 255 | Red-dominant pixels | SHA-256 |
| --- | --- | --- | ---: | --- |
| hero-cloth-v6-attempt-1.png | 1254×1254 RGBA; mod 8×8 = 6×6 | 725,880 / 845,503 / 1,133 | 348,014 | 2B13E731CAFC889E6A4E5C9FBE1843C81E9E31EBE178C69493D1398E639D9556 |
| hero-cloth-v6-repair-1.png | 1254×1254 RGBA; mod 8×8 = 6×6 | 746,646 / 824,542 / 1,328 | 398,943 | 4B00BE1420D163943323E1158E387A8BA3A17D33EC9EAFC154EA3B130F041538 |

Both generated outputs have transparent corners. The requested 8×8 canvases were not followed; neither image can be divided into equal integer cells. Approximate 156×156 diagnostic bins (not valid frame measurements) found all 64 bins below the 16 px safety-margin target on at least one edge. Visual review confirms persistent red/yellow-green fringe and soft painterly partial-alpha outlines; the repair increased the whole-image red-dominant diagnostic despite reducing partial-alpha count. The buff row also retains detached effects around characters. No crop, resize, regrid, recolor, chroma key, or alpha post-processing was applied. Both images remain source-only; no runtime asset, manifest row or anchors were added. The single repair is exhausted for this pass.

Focused checks: viewed the local reference and each generated output; used Pillow to verify PNG dimensions, alpha histogram, corners and diagnostic bins; confirmed SHA-256 equality between each source copy and its ImageGen raw output. No build, typecheck, content check, browser, test suite or project-level validation was run. Full prompts and paths are recorded in art-source/actors/hero/source-log.md.
## T10-02 hero-cloth v7 fresh composition (2026-10-18)

**UNFINISHED — source-only; no runtime image, animation entry or anchors.** One clean-room composition used built-in ImageGen with transparent_background=true and the locally viewed protagonist style reference. The original output was copied unchanged to art-source/actors/hero/hero-cloth-v7-attempt-1.png; its SHA-256 matches the raw ImageGen file (F2C8D2F16A7A10DDDD32F90EAB22EF2707ADAE5A23E69C0898F758C893825312).

| Candidate | Dimensions / grid | Alpha 0 / partial / 255 | Red-dominant pixels | Result |
| --- | --- | --- | ---: | --- |
| hero-cloth-v7-attempt-1.png | 1254×1254 RGBA; mod 8×8 = 6×6 | 834,922 / 736,151 / 1,443 | 315,097 | Invalid equal-cell grid; 0/64 approximate bins pass 16 px margin; visible colored fringe |

All four corners are alpha 0, but alpha has 256 unique values. Because dimensions are invalid, floor-divided 156×156 bins are diagnostic only: 0/64 contain their nontransparent bounds within the requested central 76×76 area, and 0/64 pass the 16 px transparent margin. Visual review shows the action rows and same hero identity, but sprites exceed the intended small central area and retain red/yellow-green fringe and painterly partial-alpha outlines. No image was cropped, resized, regridded, recolored, or otherwise processed. It remains source-only; no runtime image, manifest row or anchors were added. No further hero retry is planned.

Focused checks: viewed the local identity reference and output; used Pillow to verify dimensions, grid modulo, alpha histogram, corners, approximate-bin bounds and SHA-256 equality to the raw output. No build, typecheck, content check, browser or test suite was run. Full prompt and output paths are recorded in art-source/actors/hero/source-log.md.

## Hero-cloth v8 one-shot pixel-art recovery (2026-10-18)

**UNFINISHED — source-only.** Before this task, I read the current Playroom game-agent template and its seven linked main-branch specifications: game-development, command-contracts, game.schema.json, game-release.yml, playroom-sdk.js, sdk-versioning, and save-compatibility. I also read the root AGENTS.md instructions, plan/01-game-design.md, plan/07-shared-contracts.md, plan/08-content-spec.md, plan/09-parallel-dispatch.md, plan/10-asset-spec.md, the T10 task, this report, the hero source log, and the ImageGen skill plus its shared prompt references. Applicable asset checks were exact 8×8 dimensions, true alpha, per-cell containment and safe margins, consistent protagonist identity, and visual edge quality. Playroom constraints relevant to the game remain relative self-contained assets, truthful desktop-only support, no top navigation/popup/account or admin API, and no publishing without explicit authorization.

One fresh built-in ImageGen call used transparent_background=true and two viewed local references: F:\Desktop\MapleStory\art-source\actors\hero-style-reference-v1.png for protagonist identity/palette, and F:\Desktop\MapleStory\public\assets\actors\npcs\guide-idle-v1.png for accepted actor sprite scale/style. The full prompt and exact output/reference/source paths are in art-source/actors/hero/source-log.md.

The raw image is 1254×1254 RGBA, so both dimensions leave remainder 6 when divided by 8; it cannot be sliced into exact 8×8 cells. Alpha counts are 880,648 transparent / 690,117 partial / 1,751 opaque, with all 256 alpha values present. The raw output and art-source/actors/hero/hero-cloth-v8-attempt-1.png have matching SHA-256 4c5d6cf8f371f226e8825efbbc9a04f6575685a8e3d9b572f6d5ed4aa57dcb99. Visual review found recognizable broad action rows and the same hero, but still painterly soft edges plus red/yellow/green fringe. Since the actual grid is invalid, frame containment and the required 16 px per-cell margin cannot be certified. No crop, regrid, threshold, recolor, alpha editing, runtime copy, manifest entry, or anchors were created. The one-shot recovery allowance is exhausted.

Focused checks only: viewed both local references and the output; checked PNG mode, exact dimensions, 8×8 modulo, full-image alpha histogram and raw/source SHA-256 equality. No tests, build, typecheck, content check, browser, or Playroom acceptance were run.
