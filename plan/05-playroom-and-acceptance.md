# Playroom 規格、候選交付與發布邊界

## 最新讀取紀錄

2026-10-17 22:16（Asia/Hong_Kong）已經由GitHub網路工具重新取得並完整閱讀主範本及七份指定main文件。本次未下載規格副本至遊戲repository。下一次新開發／改造／發布仍須依根AGENTS重新讀當時main，不以本文件代替。

| 來源 | 用途 |
| --- | --- |
| [主範本](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-agent-template.md) | 開工、執行限制、驗收及回報 |
| [開發發布標準](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/game-development.md) | 靜態成品、路徑、裝置及iframe |
| [操作錯誤契約](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/command-contracts.md) | 狀態競爭及機器碼 |
| [Manifest Schema](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game.schema.json) | 欄位、schema2與存檔格式 |
| [Release workflow](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/templates/game-release.yml) | Node24、工具驗證與發布 |
| [SDK](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/examples/starter/playroom-sdk.js) | 成績／存檔及診斷介面 |
| [版本升級指引](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/sdk-versioning.md) | 固定工具bootstrap、版本軸及相容 |
| [存檔相容規格](https://raw.githubusercontent.com/TommyLamm/playroom-platform/main/docs/save-compatibility.md) | revision、格式、快照與恢復 |

讀到版本軸為SDK1.1.0／protocol1／Manifest schema2／game tools1.1.0，正式bootstrap再核對及固定；不能假設遠端工具Release已存在。失敗時報實際URL／原因，不依缺失資料猜接入。

## 本次適用要求

遊戲交已建置靜態成品，平台不安裝套件、不編譯、不執行遊戲後端、不提供多人房間或SharedArrayBuffer需要的隔離。首版單機並只宣告desktop；手機／iOS／手把不在本版驗收範圍。

自有資源相對路徑，Vite base='./'，若有router用hash，不依根路徑或SPA fallback。ZIP根直接含game.json、index.html、cover及資產，不多包dist一層。輸出ZIP、固定工具、lock與工具執行目錄都在dist之外。

跨來源sandbox iframe必須可玩，驗收設定：
```html
<iframe sandbox="allow-scripts allow-same-origin allow-pointer-lock"
        allow="fullscreen; autoplay; gamepad"></iframe>
```
禁止跳頂層、popup、表單提交及索取相機／麥克風／平台憑證。音效／全螢幕由玩家手勢並處理拒絕；不自行鎖頂層Esc。一般／原生全螢幕／沉浸模式resize不重載iframe，操作及退出後進度保留。

Manifest使用06的執行預設ID／名稱／作者／版本，schemaVersion2及cloudSave readableFormats[1]/writeFormat1，devices只有desktop，首版不宣告leaderboard。必填id/name/version/description/author/entry/cover/tags/instructions/devices，無$schema或未知欄位。封面來自實際遊戲。

## 存檔必要契約

帳號、權限、密碼、session、Cookie、CSRF、IP與管理API由平台處理，遊戲只用SDK。進度與成績可用性分開；SDK不可用仍可單機遊玩，不能無限等網路。

先load且驗format/data再套用；成功null才是無資料並可revision0，讀取拒絕不當空存檔。data JSON物件≤64KiB UTF-8、≤32層；每帳號每分鐘≤60寫／120讀，採序列檢查點，不靠關頁保存。

只有正式saved:true才顯已保存；預覽save回null只暫存本次連線。訪客local與帳號分開、不自動匯入。相同快照回應遺失沿用requestId；SAVE_REVISION_CONFLICT停寫重讀／由玩家選擇，REQUEST_ID_REUSED不改內容重用ID，SAVE_FORMAT_INCOMPATIBLE停寫提示相容版本。401／403停帳號寫入但仍可操作。舊平台缺machineCode的409保守停，不自行提高revision。

format1初版沒有遷移工作；未來改格式須設read/write相容與實際data遷移，不能認為格式號大小自動相容。平台格式變更／本人恢復最多保留20舊快照，普通同格式保存不新增；回退遊戲不回退玩家資料。遊戲iframe不呼叫本人snapshot恢復／管理API。

## 固定工具與候選包

T15在隔離平台checkout依標準安裝並生成sdk/schema/game-tools，將工具ZIP及SHA256 lock放遊戲.playroom並納入版本控制。SDK相對匯入、正式CloudPort單一薄adapter，不自行抄寫協定。

使用固定工具node pack-game.mjs／node validate-game.mjs完整驗證，手動zip／schema檢查不替代。硬限制ZIP≤64MiB、解壓≤256MiB、entries≤10000、封面≤5MiB；不可有越界路徑、symlink、大小寫碰撞、機密／.env／原稿及無關檔案。機密另查，ZIP驗證不代替。

T16按11集中實際iframe／主線／SDK驗收。沒有正式平台環境的項目列UNVERIFIED，fake／build／載入畫面不能當正式保存證明。只做範圍相關最少檢查，不每包開瀏覽器／跑全套。

## 發布與上架

本次只授權文件拆分；下一位Agent實作依其實作指示執行。公開上架是目標，沒有明確發布要求及指定公開repository不推tag、不建Release、不呼平台發布API。

正式發布使用當時最新workflow，GAME_DIR=dist，Node24，版本檢查前做真實安裝／build，驗固定工具整包SHA／metadata／逐檔雜湊，完整pack/validate後才發布。token只交發布步驟，無continue-on-error或always繞過失敗。Manifest版本無v，tag=v<version>一致，預發布標記prerelease，舊成品不可覆寫，修正增版。

平台管理者匯入後逐版本真實預覽／人工確認／發布，不能自動假確認。發布／回退／下架使用確認時expectedActiveVersion／expectedPublished；STATE_CONFLICT刷新重新人工確認，不填最新狀態自動重送。權限撤銷／保存格式不相容等依機器碼處理，不比對中文文字。

最終分開回報程式完成、ZIP驗證、GitHub Release、平台公開上架；列ID/version、最新規格讀取時間、入口／成品、真實檢查與未驗證。當前四者皆未執行，只有計劃文件。
