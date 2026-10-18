# T10 creatures 子包報告

## 範圍與規格核對

依 `plan/09-parallel-dispatch.md`、`plan/10-asset-spec.md`、`plan/tasks/T10-actor-assets.md` 及 T06/T08 資料，只處理六普通怪、一首領和五 NPC 的圖像與本子集 manifest。普通怪 6×5、96×96 顯示，列序 idle/walk/attack/hurt/dead；guardian 同為 6×5、192×192 顯示；NPC 各 2×1 idle、96×96 顯示。不加新角色、不把名稱繪入圖。Enemy key 採 `actor:{id}`，動畫 key 採 `{id}:{state}`；NPC key 採 `actor:{id}` 與 `npc:{id}:idle`。來源圖保留於 `art-source/actors/monsters/` 或 `npcs/`，子集 manifest 使用相對 URL。每張正式圖均明確引用本地主角參考 `F:\Desktop\MapleStory\art-source\actors\hero-style-reference-v1.png`。

開始前已完整讀取最新線上 `templates/game-agent-template.md` 和七份主規格：`docs/game-development.md`、`docs/command-contracts.md`、`templates/game.schema.json`、`templates/game-release.yml`、`examples/starter/playroom-sdk.js`、`docs/sdk-versioning.md`、`docs/save-compatibility.md`；另讀 imagegen skill 及 prompt 參考。僅套用與本包有關的資產 key/相對路徑/版本與發佈界線要求；這是素材工作，未做平台建置或發佈宣稱。

## 已交付

本子集目前有 6 張可用 runtime 圖：

- 普通怪：`public/assets/actors/monsters/slime-atlas-v1.png`（`actor:slime`）、`public/assets/actors/monsters/sentinel-atlas-v1.png`（`actor:sentinel`）。各含 `idle/walk/attack/hurt/dead`，動畫 keys 分別為 `slime:idle`、`slime:walk`、`slime:attack`、`slime:hurt`、`slime:dead` 及 `sentinel:idle`、`sentinel:walk`、`sentinel:attack`、`sentinel:hurt`、`sentinel:dead`。
- NPC：`public/assets/actors/npcs/guide-idle-v1.png`（`actor:guide` / `npc:guide:idle`）、`mentor-idle-v1.png`（`actor:mentor` / `npc:mentor:idle`）、`healer-idle-v1.png`（`actor:healer` / `npc:healer:idle`）、`keeper-idle-v1.png`（`actor:keeper` / `npc:keeper:idle`）。四張均為 2×1 idle、兩格各350ms循環、96×96顯示。

局部 manifest `public/assets/actors/creature-subset-manifest-v1.json` 共 6 images、14 animations、0 audio entries；所有 URL 均相對於 `public/`。正式稿與 runtime 檔分別保存在對應 `art-source/actors/monsters/`、`art-source/actors/npcs/` 路徑並由各自 `source-log.md` 記錄提示全文及檢視證據。

- `public/assets/actors/monsters/slime-atlas-v1.png`：6×5 圖集，實際 1374×1145，每格 229×229；顯示 96×96、pivot (.5, 1)。idle/walk/attack/hurt/dead 的 animation metadata 已放入 `public/assets/actors/creature-subset-manifest-v1.json`。攻擊列經一次局部修正後可辨識壓低、伸展、前撲、回復；透明底，沒有可見紅邊或文字。抽樣僅見極低 alpha 1/3 的稀疏紅色像素，不形成可見暈邊。
- 原稿及首次候選保留於 `art-source/actors/monsters/slime/`，生成與修正 prompt、參考、尺寸、視覺檢視及輸出路徑記錄於 `art-source/actors/monsters/source-log.md`。
- 苔殼蝸牛生成及一次修正後仍有肉眼可見紅色邊緣殘留，故列為 `UNFINISHED`。兩張原稿保留於 `art-source/actors/monsters/snail/`，沒有 runtime PNG 或 manifest entry。依每組最多一次修正的規則不再重試。
- 菌傘菇生成及一次修正後仍有肉眼可見紅色邊緣殘留，故列為 `UNFINISHED`。兩張原稿保留於 `art-source/actors/monsters/mushroom/`，沒有 runtime PNG 或 manifest entry。依每組最多一次修正的規則不再重試。
- 赤背野豬生成及一次修正後仍有肉眼可見紅色外緣瑕疵，故列為 `UNFINISHED`。兩張原稿保留於 `art-source/actors/monsters/boar/`，沒有 runtime PNG 或 manifest entry。依每組最多一次修正的規則不再重試。
- 礦岩魔像 `actor:golem` 仍為 `UNFINISHED`。2026-10-18 新增 attempt-03 與其唯一一次修正版 attempt-04，兩張只保留於 `art-source/actors/monsters/golem/`，未建立 runtime PNG 或 subset manifest entry。attempt-03 是 1374×1145、6×5可整除，但 alpha 統計有 886,983 個 partial pixels，30格每格腳底皆到局部 y=228、底部無透明邊，且仍可見紅／黃／綠色暈。attempt-04 是 1373×1145、寬度不能被6整除；四角透明，但仍有 874,323 個 partial pixels、可見彩邊及柔邊，因此也不合格。SHA-256 分別為 `D536E2E847469FE9E3BD9D82BCA5663717D87E33E7EBE8FA238D34C37E2B3DF6` 與 `B1DE080859A8D61221CC2AC9ABEB624DC96F60A83A0E7EEAA80515E734FD454C`。完整 prompt、alpha 細節及輸出檢查在怪物 source log。
- 鏽甲哨兵首稿有少量外緣紅點，局部修正後 alpha 抽樣最大值由 5 降至 2；視覺無可見色暈，故以 1374×1145、6×5 正式入選。原稿及 runtime SHA-256 相同，metadata 顯示 96×96 並含五種動畫。
- 古礦守衛舊候選及新構圖 attempt-03/04 均未通過，列為 `UNFINISHED`。新圖與唯一一次針對修正都為 1373×1145，寬度不能整除6；修正版可見紅色柔邊且全圖紅色高 alpha 診斷像素增加。兩張保留於 `art-source/actors/monsters/guardian/`，沒有 runtime PNG 或 manifest entry；其招式動畫時長尚未接線。
- 森芽 NPC 雙格 idle 修正版以 1774×887 尺寸通過：正好 2×1 等方格、四角 alpha=0、兩姿勢有細微差異且足底基線一致。以 `actor:guide` / `npc:guide:idle` 入選，source/runtime SHA-256 一致，顯示 96×96，350ms 循環。
- 岩嶺教官 NPC 雙格 idle 修正版以 1774×887 尺寸通過：2×1格、透明角、人物與姿勢可辨。以 `actor:mentor` / `npc:mentor:idle` 入選，source/runtime SHA-256 一致，顯示96×96、350ms循環。外緣紅像素抽樣總量由86降至66；alpha>32樣本為47，視覺沒有明顯色暈。
- 木葉商人 `actor:merchant` / `npc:merchant:idle` 仍為 `UNFINISHED`。先前兩輪 attempt-01..04 均只留 source。本輪只生成 attempt-05，並作一次 referenced-image 修正 attempt-06；兩張均1774×887、2×1方格、四角 alpha=0，兩個全身姿勢、方向及基線可辨。修正版完整預覽仍見紅色外緣與柔化／繪畫式輪廓；alpha histogram 為透明1,071,220、部分透明501,654、不透明664，未符合乾淨硬邊及無外緣色暈要求。attempt-05/06 與完整提示、檢查保留於 `art-source/actors/npcs/merchant/` 及 NPC source log；不複製 runtime，也不加入 `public/assets/actors/creature-subset-manifest-v1.json` 的 images 或 animations。已用完本輪一次生成與一次修正，不再重試。
- 晨露治療師雙格 idle 一次修正版尺寸1774×887，2×1格、透明角、掛身藥瓶與兩種姿勢可辨，外緣沒有明顯色暈，正式入選。以 `actor:healer` / `npc:healer:idle` 接入，96×96顯示、每格350ms循環。
- 礦道守望者雙格 idle 一次修正版尺寸1774×887，2×1格、透明角、拐杖/腰燈/兩姿勢可辨，外緣沒有明顯色暈，正式入選。以 `actor:keeper` / `npc:keeper:idle` 接入，96×96顯示、每格350ms循環；source/runtime SHA-256一致。

## 未完成與接線

- 尚未交付：snail、mushroom、boar、golem、guardian、merchant。商人本輪 attempt-05/06 已視檢且檢查尺寸、格數及 alpha，仍 `UNFINISHED`，本輪不再重試。
- T07/T14 可先透過本子集 manifest 載入史萊姆；T14 聚合時仍須將本子集 entries 合併至總 actors manifest。這個子包不修改 `public/assets/actors/manifest.json`。
- Guardian 實際招式 `guardian-slam` 總時長 1800ms、`guardian-wave` 總時長 2100ms；待首領圖集完成時，單一 `guardian:attack` 的四格時間需採專案約定並向接線方說明兩招共用狀態的限制。

## 檢查

- 已檢視所有正式素材原尺寸預覽；抽核六張 image 的實際尺寸與透明角，檢查正常怪/首領/NPC 的列格或雙格動作，對存在色邊疑慮的稿件採 alpha 抽樣後決定入選或 `UNFINISHED`。
- 本輪逐格檢視商人 attempt-05/06：兩張均為1774×887，可切成2×1個887×887方格，四角 alpha=0；兩個全身姿勢及工具袋／腰袋可辨。修正版 attempt-06 仍有可見紅色外緣與柔化輪廓；PNG alpha histogram 為透明1,071,220、部分透明501,654、不透明664，因此判定不通過。候選僅保存於 source，未建立 runtime 檔或 manifest entry；未檢查其他 NPC／怪物或整包。
- T10-06 golem attempt-03/04 已逐格查看並對原稿做 alpha/bounds 檢查：attempt-03 尺寸可整除但所有 cell 的腳底位於最後像素列，無底部安全邊；attempt-04 寬度 1373 無法切成六等分，不能作逐格驗收。兩張都仍有肉眼可見彩色外緣及大量 partial alpha，僅 source-only；沒有複製 runtime、修改 subset manifest 或檢查其他素材。
- `package.json` 沒有專用 assets-check script。已以 PowerShell `ConvertFrom-Json` + `System.Drawing` 對本子集 manifest 執行局部完整性檢查：JSON 可解析、6 個 URL 存在、圖像尺寸可被 columns/rows 整除、image/animation keys 唯一、frame index 在格數範圍內、frameMs 數量相符且皆為正數。實際輸出：`PASS manifest JSON v1, 6 images, 14 animations; all URLs exist, grids divide image dimensions, keys are unique, and frames/timings are in range.`
- 沒有執行 `typecheck`、`build`、完整測試套件或 `check:content`。`plan/tasks/T10-actor-assets.md` 的 T10-06/07/08 保持未完成勾選，並附上 partial/UNFINISHED 狀態。
- 上輪提交記錄曾因 `.git/index.lock` 權限被拒而未建立 scoped commit。本輪僅商人 source/log 與兩張 source-only 候選已由精確路徑提交，commit `2ae81ef`；本輪 task/report 狀態另作獨立提交，未改 runtime 或 subset metadata。

## `actor:mushroom` reattempt (2026-10-18)

**UNFINISHED — source-only; no runtime asset or subset-manifest entry.** Before updating this report, the live template and seven linked Playroom specifications were read in full at 2026-10-18 01:40 UTC. Their exact raw URLs, applicable requirements, and this package's check scope are recorded in the corresponding mushroom section of `art-source/actors/monsters/source-log.md`. Applicable requirements: keep resource URLs relative if promoted, accurately declare desktop support, handle iframe size, avoid navigation/popups/forms, avoid account/admin APIs, and do not publish. Checks were limited to this mushroom atlas and its possible subset metadata.

One new composition and the one permitted targeted repair used built-in ImageGen with `transparent_background: true`. The first call passed the accepted slime atlas, accepted sentinel atlas, and hero style reference through `referenced_image_paths`. The repair call passed attempt-05 as target and the same three style references. Both generated files were copied unchanged to `art-source/actors/monsters/mushroom/`:

| Candidate | Image dimensions and alpha | Per-cell/layout result | SHA-256 |
| --- | --- | --- | --- |
| `mushroom-atlas-attempt-05.png` | 1374×1145 RGBA, exact 229×229 cells; alpha 0/partial/255 = 823,027/749,544/659; transparent corners | All five action rows are visible; red halo persists. All 30 cells miss the 16 px safety margin in at least one direction; several attack poses touch horizontal cell edges and rows 1–4 touch vertical edges. | `AB6682DE0C27EB3E065FFA10489D8D8C7F41FE936728727D009683E8BD8B1DC6` |
| `mushroom-atlas-attempt-06.png` (repair) | 1374×1145 RGBA, exact 229×229 cells; alpha 0/partial/255 = 824,771/748,221/238; transparent corners | Red fringe is more vivid after repair. Every cell still has <16 px margin on at least one side, so containment fails. | `81B0A3037584B0C70E9B273D4E89244F46434421064FE15692615C9EF4472B89` |

Visual review of both full sheets plus focused `System.Drawing.Bitmap` dimension/alpha/bounds checks were performed; each project copy's hash matches the corresponding generated output. The single repair is exhausted. Neither image was copied to `public/assets/actors/`, and the existing six-image/14-animation creature subset remains unchanged. No complete actors manifest or T10 completion is claimed. No build, tests, typecheck, browser, or project-level regression checks were run.

## actor:snail fresh composition (2026-10-18)

**UNFINISHED — source-only; no runtime image or subset-manifest entry.** One fresh composition was generated with built-in ImageGen and copied unchanged to art-source/actors/monsters/snail/snail-atlas-attempt-05.png. No targeted repair was run. This prompt changed the earlier taller, cream-bodied presentation to a low horizontal moss-green body, broad low-set chestnut spiral shell, and cream rim, and specified the 229 px cell geometry and safety margins before generation. The full prompt, tool output path, references, and metadata are recorded in art-source/actors/monsters/snail/source-log.md.

References explicitly passed by absolute path via referenced_image_paths and viewed before generation:

- F:\Desktop\MapleStory\art-source\actors\hero-style-reference-v1.png
- F:\Desktop\MapleStory\public\assets\actors\monsters\slime-atlas-v1.png
- F:\Desktop\MapleStory\public\assets\actors\monsters\sentinel-atlas-v1.png

The output has recognizable snail character design and five approximate action rows, though the walk frames vary too subtly to read clearly. It fails the mandatory structural and edge checks:

| Candidate | Dimensions / grid | Alpha zero / partial / opaque | Corner alpha | Approximate per-cell diagnostics | SHA-256 |
| --- | --- | --- | --- | --- | --- |
| snail-atlas-attempt-05.png | 1373×1145 RGBA; width mod 6 = 5, so no valid equal-width 6×5 grid | 932,316 / 638,942 / 827 | all 0 | Using floor-divided bins only for diagnosis, 110 of 120 sides have under 16 px of transparent margin; row baseline lowest-pixel ranges: idle 228–228, walk 228–228, attack 228–228, hurt 228–228, dead 200–228 | C49109C1CE9C1AEA4C2BEA95804BA6F9533B370874C0383635EF42C1E54C0BF6 |

The approximate bounds are not formal cell measurements because the image width is invalid. Visual review shows bright red edge residue and softened, partially transparent contours. Both the grid divisibility and per-cell safety-margin requirements fail; the baseline is inconsistent in the dead row. The source copy hash matches the raw ImageGen output. No PNG was placed under public/assets/actors, the existing creature subset manifest was not changed, and T10-06 remains unfinished. This used the single new-composition allowance; no repair or additional generation was made.

Focused checks only: viewed all three required references and the source copy; read the PNG IHDR and decoded RGBA alpha to count pixels, inspect corners, calculate diagnostic bins/baselines, and compare source/output SHA-256. No build, typecheck, test suite, browser, or project-level check was run.

## Guardian boss follow-up (2026-10-18)

The fresh left-facing guardian composition and one targeted repair were generated with `transparent_background: true`, explicitly referencing the local hero style, accepted slime, and accepted sentinel images; the repair also referenced attempt-03. The original PNGs were copied unchanged to the source folder and their hashes match the ImageGen outputs.

| Candidate | Dimensions / grid | Alpha zero / partial / opaque | Corners | Red-dominant count* | Result |
| --- | --- | --- | --- | ---: | --- |
| `guardian-atlas-attempt-03.png` | 1373×1145 RGBA; width not divisible by 6, so no valid 6×5 cells | 726,487 / 845,088 / 510 | all 0 | 79,676 | Source-only; visible red fringe and approximate cell bounds fail safe margins. |
| `guardian-atlas-attempt-04.png` (repair) | 1373×1145 RGBA; width not divisible by 6, so no valid 6×5 cells | 746,771 / 824,122 / 1,192 | all 0 | 108,322 | Source-only; red fringe remains and the diagnostic count increased. |

*Red-dominant diagnostic: `R > 1.5G`, `R > 1.5B`, and alpha > 32, counted across the whole image; it is not a cell-specific fringe segmentation. Because the sheet width is invalid, equal-width bin bounds are approximate diagnostics, not valid sprite cells. All 30 approximate bins had under 16 px of margin on at least one side. The visual review found the side-profile silhouette and five action rows recognizable, but numerous poses approach or touch bin edges and retain soft red contamination. Full prompts, generation times, raw output paths, reference paths, per-bin bounds, and SHA-256 values are recorded in the guardian section of the monster source log. The one repair is exhausted. No guardian runtime PNG or creature subset manifest entry was added; no build, typecheck, test suite, or browser check was run, and T10 is not complete.
## actor:snail attempt-06 (2026-10-18)

**UNFINISHED — source-only; no runtime image or subset-manifest entry.** One new composition used built-in ImageGen with transparent_background=true, explicitly referencing the local hero style reference and the accepted slime and sentinel runtime atlases. All three local references were viewed before generation and passed by absolute path. The original output was copied unchanged to art-source/actors/monsters/snail/snail-atlas-attempt-06.png; source and output SHA-256 match (F4AE5731EC4B50C1B863FA41CA256F6D4C55E2444B40BBEC86543E3D2794D83E).

| Candidate | Dimensions / grid | Alpha 0 / partial / 255 | Corners | Margin / visual result |
| --- | --- | --- | --- | --- |
| snail-atlas-attempt-06.png | 1374×1145 RGBA; exact 6×5 grid of 229×229 cells | 953,493 / 619,020 / 717 | 0, 0, 1, 0 | All 30 cells have at least one side under the 16 px transparent safety margin; visible red/yellow-green fringe and softened edges |

The whole-image red-dominant diagnostic (alpha > 32, R > 1.5G, R > 1.5B) is 206,439 pixels; this is not an edge-only segmentation, and visual review separately confirms the fringe. The action rows are recognizable, but idle frames are nearly duplicates and the walk differences are weak. The exact grid alone does not qualify the atlas: all cells fail safe-margin review and the edges fail transparency review. This attempt is preserved only under art-source; it was not copied to public/assets/actors, and the existing creature subset manifest remains unchanged. T10-06 remains unfinished.

Focused checks: viewed the output; used Pillow to verify dimensions, alpha histogram, corner alpha, exact 229×229 cells, per-cell alpha bounding boxes and safe margins; compared the source copy hash with the raw output. No build, typecheck, tests, browser or project-level checks were run. Full prompt and reference paths are recorded in the snail source log. No repair was made.
