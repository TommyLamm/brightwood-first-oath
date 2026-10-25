# 遠古遺跡包 A：整合交接

日期：2026-10-25（香港時間）。遊戲 ID：`brightwood-first-oath`。新候選：`1.0.0-beta.12`。本輪依 [章節計畫](../12-next-chapter-ancient-ruins.md) 第 9 節，只實作 A，完成即停；B、C、D 尚未完成。狀態：**A 程式與素材完成，獨立候選建置完成；實際遊玩、正式存檔、ZIP 與發布驗收未執行**。

由主代理負責分工與審查，GPT-6 Luna、max reasoning 負責實作，同時最多三名；每批完成後新建代理，不沿用舊代理。主對話未載入生成圖片，原稿與必要審圖留在 `art-source/ruins-a/`。未提交、推送、建立 tag／Release 或呼叫平台發布 API。

2026-10-25 12:31（香港時間）額度恢復後續作：上一批 motion／action／assembly 三個代理因額度中止，未沿用。已確認其 8＋10 張獨立單幀原稿全部生成，分別位於 `.codex/generated_images/01a1712b-8698-7f23-9cd9-416886917a49` 與 `01a1712b-dab9-7b31-ac43-5ec40085b018`；派三個全新 Luna Max 恢復來源紀錄、正規化與組裝，避免重生既有成果。逐 call 路徑 metadata 若無法恢復，須明列群組來源與視覺編排依據，不偽造對應。

## 已接合的行為

- 琥珀砂岸高台南航需 q14 **claimed**，不要求持有日井誓刃；梯子直達平台，返航回到平台。
- 潮痕營站安全無怪，芷衡負責交接，青禾沿既有 healer 恢復；q15 抵達後手動領取大紅 6／大藍 3。
- q15 **claimed** 才能進盤根石道及使用木葉鎮直航。營站返砂岸／木葉鎮、石道返營站皆無任務鎖。
- 石道有三隻苔陶蟲。q16 接取後擊殺三隻，再回芷衡手動領取 700 金幣。沒有通往未實作長廊的 portal。
- 苔陶蟲有獨立 `ruins-carapace-bite`，550／80／770 ms，起手間隔至少 1400 ms，鎖向預警及每次攻擊只命中一次；必掉苔紋陶片 1，金幣 90，EXP 0。
- renderer 僅為新怪物使用 `[275,275,80,770]` 逐格出招時間，使咬擊姿勢與傷害窗一致。保留使用者既有視差變更。
- Atlas 新增 ruins 分區、世界入口與兩個真實節點；只選取圖表，不傳送角色。q17–q20、石碑、長廊、內殿與首領尚未實作。
- 新主題為 `ruins-camp`／`ruins-root`，音樂為 `theme-ruins` base／combat，另有滴水／遠鐘環境音。

## 存檔與部署邊界

本機與雲端讀 format 1／2，僅寫 2。舊檔缺 q15／q16 合法，保留原 SaveData 形狀與兩個 Guardian flags。本機首次轉寫 2 前，將原封套字串備份至同 key 的 `:format1-backup` 並確認成功；備份失敗或有不同既存備份時停止覆寫。未知格式保留，不能以新角色取代。

Manifest 使用 schema 2、`readableFormats: [1,2]`、`writeFormat: 2`。正式雲端寫 2 仍需先部署實際理解新 ID 且可讀 1／2 的橋接版；目前沒有此部署或帳號遷移驗收。預覽／fixture 不代表正式保存成功。舊版不能被宣稱可讀新增內容或安全降版。

A 候選只理解目前已實作的內容，不理解未來 q17–q20／inspect。後續 B／C 仍須重新審查實際 data 相容性；若先公開 A，再新增 A 不認識的 ID，不能只沿用格式號 2 便宣稱可回退。正式橋接與內容版應在完整 catalog／counter 規則確定後另作可驗收的部署方案。

既有 beta.11 產物不作本輪 build 輸出；本輪已輸出至 `artifacts/ruins-a/dist/`，不覆寫舊 Release／ZIP。入口為 `artifacts/ruins-a/dist/index.html`。

## 已執行的檢查

| 檢查 | 實際結果 |
| --- | --- |
| `node node_modules/vitest/vitest.mjs run tests/ruins-entry.test.ts` | 1 檔、2 測試通過；涵蓋門鎖、轉圖、三次擊殺、領獎、直航、返回與互動距離 |
| `npx vitest run tests/ruins-save.test.ts` | 存檔代理回報 1 檔、8 測試通過 |
| `npm test -- tests/persistence.test.ts src/platform/playroom-port.test.ts` | 存檔代理回報 18 檔、150 測試通過；substring 篩選選入舊工作樹同名測試，並非全回歸 |
| `node node_modules/vitest/vitest.mjs run tests/ruins-carapace.test.ts tests/rules.test.ts` | 10 檔、65 通過／1 失敗，exit 1；唯一失敗來自 `.worktrees/frost-region-map/tests/rules.test.ts` 的舊 25／26 物品數斷言。未修改該工作樹，未重跑已通過項目 |
| `node node_modules/vitest/vitest.mjs run tests/world-map.test.ts` | Atlas 代理回報 9 檔、55 測試通過；亦選入舊工作樹，不宣稱嚴格單檔範圍 |
| `npm.cmd run check:content` | rules／world 跨表驗證通過 |
| `npm.cmd run typecheck` | 主代理於程式整合後執行，通過 |
| `git diff --check -- src tests tools/audio public/game.json package.json package-lock.json` | 通過；只有 Git CRLF 提示 |
| `node --import tsx artifacts/ruins-a/check-assets.mjs` | 4 個素材包、197 個檔案引用通過；新地圖 actor／環境／音樂／掉落圖示、PNG 切格、動畫契約、版本及存檔宣告相符；證據為 `artifacts/ruins-a/asset-reference-check.json` |
| `npm.cmd run build -- --outDir artifacts/ruins-a/dist` | 通過；Vite 8.3.4 建置 65 modules。另核對成品 game.json 為 beta.12，入口及新 atlas 存在；摘要為 `artifacts/ruins-a/build-summary.json` |

後續聚焦命令應加 `--exclude '**/.worktrees/**'`。不為不相關舊副本擴大測試、修復或清理範圍。

未執行真實瀏覽器／跨來源 iframe、音訊實際播放、桌面手感、時長／難度、全螢幕、正式帳號／多設備存檔、ZIP pack／validate 或平台上架驗收。開發 Node 為 24.19.0；將來正式 Release 另需依當日規格使用已更新 Node（本日規格為 24.22.1+）。

## 素材與最後結果

環境六張 PNG 共 4.32 MiB，尺寸／RGBA／透明界線已由環境代理核對；兩張 mid 的 y>=180 全透明，原有 38 筆 manifest entry 與本輪開始時相同。材料圖示為 128×128 RGBA、runtime 32×32；區域底圖為 960×540，文字與兩個地標由 UI 繪製。

遺跡音樂 base／combat 的 Ogg＋M4A 四檔共 5.69 MiB。首輪曾使用 120k AAC，主代理審查後由全新介面代理恢復專案規定的 160k target，移除可調 bitrate 例外；只重新生成新組，ffprobe 確認 AAC-LC、48 kHz、stereo。生成器同時驗證 40 個音訊項目。首輪音訊報告中的 120k／4.89 MiB 為已被本次修正取代的歷史狀態。

兩位 NPC 使用正式 192×96 RGBA、兩格閉嘴微呼吸圖集。苔陶蟲最終由 18 個獨立 AI 姿勢組成 576×480 RGBA、6×5、每格 96px；18 個採用姿勢均恢復精確 savedPath／revisedPrompt 來源映射，保留原稿與 SHA。攻擊組修正映射後重新組圖，30 格來源像素及 unused 複製、透明邊距、朝向／腳底、五組動畫契約由組裝代理驗證通過。

新增 runtime 檔案共 **15 個、11,840,449 bytes（11.29 MiB，壓縮前）**，低於 24 MiB 增量預算；此為新增資源原始檔案大小核對，沒有冒充 ZIP pack／validate。原稿、提示、失敗候選與審圖都留在 `art-source/ruins-a/`，不在 public 或成品中。主代理沒有載入原圖，也未重跑各素材代理已通過的 alpha／音訊檢查。

## 來源與接續入口

本日線上規格來源及首次讀取情形見 [派工紀錄](ruins-a-dispatch.md)。未把規格快照放入 runtime；以今日 main 回應避開舊快取。

- [地圖與任務](ruins-a-world.md)
- [存檔](ruins-a-saves.md)
- [戰鬥及早期圖集缺口](ruins-a-combat.md)
- [Atlas 與首輪音訊](ruins-a-atlas-audio.md)
- [六層環境素材](ruins-a-environment.md)
- [介面素材與 160k AAC 修正](ruins-a-interface-art.md)
- [NPC 與共用單角色參考](ruins-a-actor-art.md)
- [待機與走路八個姿勢恢復](ruins-a-motion-frames.md)
- [攻擊／受傷／倒下十個姿勢恢復](ruins-a-action-frames.md)
- [正式圖集組裝與動畫契約](ruins-a-sprite-assembly.md)

下一章工作從包 B 開始，需用全新代理閱讀本交接及章節計畫；新增 inspect 時同步更新 gameplay 確認命令、UI／任務邏輯、content validator 及 save counter／claimed 完整性。不得把本輪未做的 B／C／D 或舊 beta.11 視差瀏覽器驗收標成通過。
