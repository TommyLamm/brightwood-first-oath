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
- 古礦守衛一次局部修正後紅色高 alpha 外緣像素抽樣反增（alpha>32 樣本由29至65），未通過視覺透明邊緣檢查，列為 `UNFINISHED`。兩張原稿保留於 `art-source/actors/monsters/guardian/`，沒有 runtime PNG 或 manifest entry；其招式動畫時長尚未接線。
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
