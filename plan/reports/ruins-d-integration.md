# 遠古遺跡包 D：namespace 整合與候選 build

日期：2026-10-25（香港時間）。狀態：**SOURCE_READY；D production-asset 引用核對及獨立 beta.15 build 完成**。未做瀏覽器／ZIP／平台／發布驗收。

## 依據與範圍

已讀 `plan/15-ruins-acceptance-and-package.md`、`plan/reports/ruins-d-environment.md`、`plan/reports/ruins-d-namespace.md`、C handoff 與 C integration report。主代理已先讀 Playroom 線上模板及七項規格；本子任務沿用已記錄要求，沒有重抓文件。

Namespace owner 已停止修改共享檔並釋出。報告記錄的兩個聚焦測試檔共23項通過；本子任務未重跑。檢視 namespace report 與相關 diff，未發現需要阻擋 metadata/build 的問題。該報告也記錄 CloudReady 不提供帳號識別／session token；authenticated 模式不顯示舊進度匯入，因此沒有宣稱可辨識 authenticated-to-authenticated 帳號切換。

## Metadata

- `package.json`、`package-lock.json` root 與 `public/game.json` 升至 `1.0.0-beta.15`；engines 同步為 `>=24.22.1 <25`。
- 未更新依賴；lock 變更限於 root version、root version duplicate 與 engines。
- 保持 ID `brightwood-first-oath`、schema 2、SDK 1.1.0／protocol 1（固定工具 metadata，詳見 D environment report）、讀格式1–4／寫格式4、desktop 裝置宣告；沒有排行榜欄位。
- `game.json` 描述沿用 C 的誓鐘內殿內容。沒有修改玩法、素材或存檔格式。

## 實際檢查

所有 Node 命令使用 D environment report 指定的 bundled Node v24.22.1，沒有使用系統 v24.19.0。

| 命令 | 結果 |
| --- | --- |
| `& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules\typescript\bin\tsc --noEmit` | 通過，exit 0；一次。 |
| `& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --import tsx artifacts\ruins-d\check-assets.mjs` | 通過：production loader 載入 actors／environment／interface／audio 四包、hero anchors，檢查219個 runtime 引用（102,740,963 bytes）及 beta.15 manifest。exit 0；一次。未重驗 C 的22姿勢原稿／圖集來源。 |
| `& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules\vite\bin\vite.js build --outDir artifacts/ruins-d/dist` | Vite production build 通過，65 modules，exit 0；一次。建置前確認 `artifacts/ruins-d/dist` 不存在；A／B／C 成品未覆寫。 |
| `& 'C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' artifacts\ruins-d\verify-build.mjs` | 通過：入口、source/build manifest 一致、全部219個引用的 dist 檔案存在且 SHA 與來源相符；exit 0。 |

D asset reference、build 與來源指紋腳本保存在 `artifacts/ruins-d/`。D dist 有274個檔案、135,702,472 bytes；逐檔 SHA-256 見 `artifacts/ruins-d/build-summary.json`。

| 指紋 | SHA-256 | 範圍 |
| --- | --- | --- |
| Source | `8c9388902ffee77d3081e56bbf6caa80388902e8c1ef8beb162a4d2ab6401407` | `src/`、`public/`、index、package/lock、tsconfig、Vite config，共341檔；包含未提交 workspace 內容。基礎 HEAD `d410f674a7e69ba0ec3704b4764549bb5041323a`。逐檔 SHA 見 `artifacts/ruins-d/source-fingerprint.json`。 |
| Dist | `8789d7abde697223beb41fcc2cd4fe5077869848d579b52691035fd8311f715a` | `artifacts/ruins-d/dist/` 274個檔案；清單與逐檔 SHA 見 `artifacts/ruins-d/build-summary.json`。 |

## 尚未驗證與下一步

沒有重跑 namespace owner 的23項測試、C 的127項通過紀錄或 `check:content`；D namespace 沒改 content catalog。沒有執行 browser／iframe、ZIP pack／validate、Playroom preview／正式雲端、GitHub tag／Release、平台匯入或上架。

下一步由 browser owner 使用 `artifacts/ruins-d/dist/` 驗收。瀏覽器 owner 修正若觸及 source/runtime，需按實際變更重跑直接相關檢查並重建；若僅測試／文件變動，不應把現有 runtime fingerprint 說成已更新。此交接未 commit、push、tag、pack 或 release。
