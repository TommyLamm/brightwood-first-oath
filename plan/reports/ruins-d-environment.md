# Plan 15 D0：環境、固定工具與 beta.15 版本盤點

日期：2026-10-25（香港時間）

## 範圍與依據

本子任務讀取 plan/15-ruins-acceptance-and-package.md 的環境、工具、版本及驗收要求；Playroom 線上模板與列出的七份規格由主代理在本批工作前完整讀取，並轉述本次核對條件，因此此處不重複下載。核對的條件為：Node 24.22.1 以上的 24.x、Playroom 固定工具及其雜湊、Release workflow 的等效要求，以及 beta.15 tag／公開 Release 占用情況。

主代理已核對的線上文件：模板、開發標準、操作契約、Manifest Schema、Release workflow、starter SDK、SDK 版本指引及存檔相容性文件。Node 官方版本頁顯示目前 LTS 為 v24.22.1：[Node.js v24.22.1 下載頁](https://nodejs.org/en/download/archive/v24.22.1)。

## Node runtime

| 執行檔 | 觀察版本 | 判定 |
| --- | --- | --- |
| C:\Program Files\nodejs\node.exe | v24.19.0 | 不符合 Plan 15 的最低版本 |
| C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe | v24.22.1 | 符合；後續 D0+ 指令可明確呼叫此檔 |

已找到可用的 Codex bundled runtime，因此沒有下載 Node、建立 artifacts/ruins-d/runtime 副本或修改全域安裝。package.json 與 lock root 的 engines 目前都是 >=24 <25，尚未在欄位中表達 24.22.1 的下限；本子任務依要求只讀，不調整 package 或 lock。

## 固定 Playroom 工具

.playroom/game-tools.lock.json 鎖定 game tools 1.2.0 與 .playroom/tools/playroom-game-tools-1.2.0.zip。直接用 v24.22.1 計算後，archive SHA-256 為 24a2fd36b405ae9f1ce1303e53ac6b0a0d0a2798c04e796f5790a2663d46f022，與 lock 相符。

解壓 metadata 為 tools 1.2.0、SDK 1.1.0、protocol 1、manifest schema versions 1/2。Metadata 列出的 5 個檔案均逐檔 SHA-256 通過；目錄內容為這 5 個檔案及 metadata.json。metadata.json 的本機 SHA-256 是 f15a66842e2c455896926293f0a5fb62c5f536f22436bbdfdfd6e1497a69cf56；它未列在 metadata.files 內，來源完整性由鎖定 archive SHA 保護。

逐檔結果：

| 檔案 | SHA-256 | 結果 |
| --- | --- | --- |
| game.schema.json | befddc7b55eca9075d5993af4faa6f5aa5974cbf6c43b960d7e6d77e8d8f4088 | 通過 |
| pack-game.mjs | 848ed0cb8ca95c04b25f57a109eff69644a420c25b22f7018efb4f31f9266c57 | 通過 |
| playroom-sdk.d.ts | 46d85fb84e70530144557b451dad3cd1c4081f966a0e73ca7416a6ba653863d1 | 通過 |
| playroom-sdk.js | cadcf84cdb5322226567984bcf31b17a8f1eb47904b836effa0c1e7cb4827258 | 通過 |
| validate-game.mjs | 940dd6c5f2eb79fdbadeaeab139caa6993998ee9478806b9b8c877758b8af40e | 通過 |

未更動 lock、ZIP 或解壓工具，也未重建工具。

## Release workflow 對照

檢查 .github/workflows/release.yml，其現有流程已符合轉述的主要等效要求：

- checkout 設定 persist-credentials: false。
- setup-node 使用 Node 24 並設定 check-latest: true。
- 先執行 npm ci 及 npm run build。
- 建置後檢查 GAME_DIR 留在 workspace 範圍內，並要求 v + manifest.version 等於 release tag。
- 驗證 lock 中的 archive SHA，解壓後檢查 metadata 版本及其中每個檔案的 SHA。
- pack-game.mjs 與 validate-game.mjs 成功後才執行 Release 發布步驟。
- prerelease 狀態由 manifest 版本是否包含連字號決定；建立命令沒有 clobber 或更新既有 Release 的選項。
- GH_TOKEN 只在 Publish release asset 步驟設入環境。

權限範圍與目前模板等效：contents: write 在 workflow 頂層設定，GH_TOKEN 則只在 Publish release asset 步驟設入環境；核對結果符合主代理轉述的等效要求，無須為此拆分 job 或改寫 workflow。

目前 package.json、package-lock.json root version 與 public/game.json version 都是 1.0.0-beta.14，package / lock engines 都是 >=24 <25；game ID 為 brightwood-first-oath。這是目前工作區狀態，不是 beta.15 發布就緒確認。

## beta.15 占用檢查

- Git remote：origin 指向 https://github.com/TommyLamm/brightwood-first-oath。
- 本機 git tag --list v1.0.0-beta.15 沒有結果；本機現存 beta tags 最高只到 beta.5。
- git ls-remote --tags origin ...beta.15 及 gh release view 受目前 shell 網路限制，分別回報無法解析 github.com、無法連線 api.github.com，因此 Git transport 的遠端 ref 結果未能直接取得。
- 公開 [GitHub Releases 頁面](https://github.com/TommyLamm/brightwood-first-oath/releases) 可讀取，release 清單列出 beta.10、beta.5 至 beta.1，沒有 beta.15。
- 精確的 [beta.15 Release 頁面](https://github.com/TommyLamm/brightwood-first-oath/releases/tag/v1.0.0-beta.15) 回覆 404；公開 raw ref https://raw.githubusercontent.com/TommyLamm/brightwood-first-oath/v1.0.0-beta.15/public/game.json 亦回覆 404。

截至本次公開頁面檢查，未找到 beta.15 公開 Release；遠端 Git tag 未能由 git ls-remote 直接確認，raw ref 404 是未解析的旁證。發布前仍應在 Git transport 可用時重查遠端 tag，不能把本次 shell DNS 錯誤記作遠端已確認。

## 工作區基線與下一步

盤點時 HEAD 為 d410f674a7e69ba0ec3704b4764549bb5041323a，git status --short 有 82 行既存工作區變更／未追蹤狀態。這些變更早於本環境報告與記錄檔，不屬於本子任務。子任務僅新增本報告及 artifacts/ruins-d/logs/environment-check-20261025.txt；未觸碰遊戲 runtime、namespace owner 檔、package／manifest 版本、固定工具、提交、tag、push 或 Release。

後續可明確使用 bundled Node v24.22.1 繼續本機整合。發布前重新確認遠端 tag 可達性，並依整合結果決定是否需要把 package engines 下限與 workflow 寫入權限範圍納入修正。
