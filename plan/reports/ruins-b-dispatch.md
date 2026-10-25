# 遠古遺跡包 B：派工紀錄

日期：2026-10-25（香港時間）。依使用者指示，由主代理統籌、全新 GPT-6 Luna（max reasoning）分批實作，同時最多三名。只實作 [13 回聲探索計畫](../13-ruins-echo-exploration.md) 的 B，不延伸 C／D，不發布。

## 開工基線與規格

開工時 package／manifest 為 beta.12，`.codegraph/` 不存在。既有 A 與其他未提交修改全部保留，沒有重設工作區。A 成品 `artifacts/ruins-a/dist/` 保留。runtime 資產基線記於 `artifacts/ruins-b/baseline-assets.json`，用於區分本輪新增檔案及 A+B 預算。

主代理本日以網路工具讀取 main 的 [模板](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md)、[開發標準](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/game-development.md)、[操作契約](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/command-contracts.md)、[Schema](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game.schema.json)、[Release workflow](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-release.yml)、[SDK](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/examples/starter/playroom-sdk.js)、[版本指引](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/sdk-versioning.md)、[存檔相容性](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/save-compatibility.md)。未將規格副本放進 runtime。

本批適用：相對資源 URL、保留遊戲 ID、獨立候選版本、格式 1／2／3 內容驗證與寫 3 前本機原封套保全、雲端失敗停止覆寫、候選與正式驗收分開。正式存檔寫 3 仍依賴實際理解 B catalog／inspect 的相容公開版本，不能靠宣告或 fixture 視為已部署。

## 批次與檔案所有權

第一批：`contracts_saves` 擁有 contracts／domain quests／persistence；`monster_rules` 擁有 rules／domain actors；`monster_profiles` 只擁有 art-source 的單角色 profile／active pose。每批完成即停，下批以新代理閱讀 repository 交接接續。

已完成首批、`world_content` 與 `app_ui_render`。目前素材批次為 `scene_npc_assets`（長廊環境／NPC／碑／items／SFX，獨占 public manifests）、`puppet_motion`（木偶 idle-1＋walk六幀）及 `prowler_motion`（石獸 idle-1＋walk六幀）。共同參考已有四個 accepted normalized frame，見 `ruins-b-monster-profiles.md`。下一批仍需每隻各九個 action frames（attack-0／1／3、hurt-0／1、dead-0..3），使用新代理，合格 attack-2 不重生。最後素材組裝代理等待所有18×2有效幀並取得 actor manifest ownership 後組圖。

目前直接檢查：contracts/domain/save 2檔15測、combat 1檔6測、world/atlas/entry 3檔13測、app/audio/animation 3檔10測通過。World owner 曾跑 app-foundation，三個用例因 required B assets 尚未交付而失敗；保留為待素材依賴，不反覆排查。最終整合另需更新既有 persistence／platform／ruins-save 的 format 2 寫入預期至3，以及 rules固定數量舊斷言；只跑直接受影響的測試，不重跑未改動且已通過的B focused tests。

額度中斷後，使用者已明確要求恢復繼續。未沿用三個 errored owner；改派全新 `scene_assets_resume`、`puppet_motion_resume`、`prowler_motion_resume`，同時仍最多三名。Scene 已保留七張 raw（sky／far／mid／行舟兩姿勢／碑／銅弦），先恢復來源並檢查舊 session 有無未複製圖，再只生成缺失素材。木偶 idle-1 原稿已恢復且待審；石獸 idle-1 已接受並正規化。舊 motion 來源 session 分別為 `01a17182-62bd-7681-b820-a9b2e2ba7b96`、`01a17183-550e-7cb0-b888-6db90dabcd6a`；只讀指定批次的 savedPath／revisedPrompt，不用全域最新圖猜來源，不重生已保存成果。

Scene 恢復補記：核對 session metadata 的 `agent_path=/root/scene_npc_assets`，精確 rollout 為 `rollout-2026-10-25T13-19-15-01a1717f-aeba-7ef1-8712-5a5aa386d30e.jsonl`。新 owner 恢復八張來源映射並找回尚未複製的 muted-bell-fragment；已有七 raw 與指定 savedPath 的 SHA 一致，本批沒有補生成圖片。Prowler 新 owner 也恢復已記錄為 unmapped 的首個 idle 呼叫，保留為未採用來源，不冒充視覺不合格。

Scene 已完成，runtime 八檔共2,130,659 bytes，`actor` manifest已釋出；石獸motion已完成。下一批全新 `prowler_actions`、`puppet_actions` 各擁有自己九幀action來源目錄，不碰manifest。主代理核對 `10-asset-spec.md` 的環境風格為「柔和分層背景」，角色才要求點陣精靈觀感，因此scene報告中背景較柔和的描述不構成額外重生理由；保留已審的恢復素材，實際遊戲組合畫面仍列未驗證。

木偶motion也已交接，兩怪目前各有2張共同參考＋7張motion（各9張）。新 `integration` owner 已啟動：先處理候選版本／格式manifest及直接受影響legacy斷言，統一必要的focused legacy tests／typecheck／content check；等待action與正式atlas組裝後才執行全4包loader／引用與一次B獨立build。整合不寫共享素材manifest。所有未改動且已通過的B focused tests不重跑。

兩怪action九幀各已接受；全36有效姿勢及metadata齊備。全新 `atlas_assembly` 取得actor manifest獨占，只追加兩怪image與十animations，保留scene／既有entries。組裝核對alpha>0的3px邊距／y92腳底、每格來源像素及unused複製。整合已完成beta.13版本同步、格式宣告、36項直接受影響legacy測試與typecheck／content各一次；待組裝後才最終loader／引用及build。

最終：兩張正式atlas與metadata已交接，4包loader／207引用通過；B10新runtime共2,467,832bytes，A+B14,308,281bytes。素材齊備後app-foundation12／12通過，單次B獨立build exit0，產物manifest為beta.13，限定tracked diff check通過。各組92項聚焦測試分批最終通過，未全回歸。主代理審閱各交接與證據後，決定B程式／素材／候選完成，更新狀態與索引；正式遊玩／格式3雲端橋接／ZIP／Release／上架仍未驗證，完成B即停。總交接：[ruins-b-handoff.md](ruins-b-handoff.md)。

待接口完成：world owner 擁有地圖／NPC／dialogue／quest／world validator／第三地標；app owner 擁有 inspect 命令重新驗證／UI／renderer／動畫節拍／音效事件；素材 owner 分開 references、motion、action、environment、NPC／item／SFX，manifest 僅明確交接後單一 owner 修改。

## 驗證與交接

各 owner 只做核心 focused checks，Vitest 一律排除 `**/.worktrees/**`。程式穩定後整合統一 typecheck、content check；素材齊備後 loader／引用及獨立 build 各一次。已通過且相關檔未改不重跑，不跑全回歸。瀏覽器、正式雲端、完整 ZIP、Release／上架留作未驗證，不能以 build 代替。

主對話只傳文字與檔案路徑。完整原稿／prompt／metadata／長日誌保存在工作區；代理自審只看必要縮圖／局部圖，不把原圖回傳主代理。所有批次在 `plan/reports/ruins-b-*.md` 記錄進度、來源、未完成、實際檢查與下游路徑。
