# Plan50 — 互動介面圖像化

2026-10-30 Asia/Hong_Kong。使用者選定全部現有互動、圖示＋DOM文字、沿用奇幻手帳；明確指定 Luna Max 生成、Terra Max 視覺驗收。主代理整合。無發布授權。

## 規格與界線

本輪主代理重新經網路讀取 Playroom game-agent-template 及 game-development、command-contracts、game.schema.json、game-release.yml、playroom-sdk.js、sdk-versioning、save-compatibility（main）。沿用 ID、desktop 宣告、格式5及原確認／禁用／焦點／指令；素材從 entry-relative 路徑解析，保留 iframe 操作。子代理由主代理轉達適用規則，不重複讀無關平台管理規格。

## 覆蓋

所有面板關閉、HUD 拾取／互動／回城／系統、背包五分類與操作、商店三分類與買賣／最大數量／批售、裝卸、AP與SP、NPC任務／領獎／調查、手帳與地圖導航、設定音訊／重綁／恢復、標題／建立／暫停／死亡／結果／存檔選項。保留現有物品、技能、NPC、插畫與六個主要頁籤。

## 擁有者與素材

- control_art_system（gpt-6-luna/max）：close/settings/pause/play/keyboard/back/confirm/retry/cloud/warning；button-normal/hover/pressed。
- control_art_actions（gpt-6-luna/max）：pickup/dialogue/home/trade/equip/unequip/upgrade/reward/inspect/volume-on/volume-off/music/sfx。
- ui_visual_inventory（gpt-6.1-terra/max）：先審小樣，然後唯一隔離 browser／視審 owner；素材及畫面證據存 output 與 art-source。
- root：共用 control-art helper、CSS、各 builder 接入、manifest、一次 typecheck/build、版本及交接。

新素材 public/assets/interface/controls；原稿、prompts、匯出與來源放 art-source/ui-controls/{system,actions}。圖示128px RGBA，runtime24–32px；底板384×128、32px slice。先close/trade/normal小樣審批後完成餘項。

## 最小驗收

一次引用／尺寸／alpha檢查，一次 typecheck、一次 build；純呈現不新增業務測試或全套回歸。Terra 960×540 掃受影響UI，640×360只補密集分類／交易／關閉／長選項。稀有狀態可用隔離UiSnapshot外觀fixture，標合成、不得說成正常玩法或正式雲端通過。AI每次只讀1–2張<=1280 JPEG70合成縮圖；全圖保存在工作區。重拍僅修正過的表面。

## 進度

素材、實作、指定隔離UI視審與build完成；既有 beta57 驗收報告與 status 未提交修改保留。實際結果、修正與未驗界線見 plan/reports/plan50-handoff.md。未發布。
