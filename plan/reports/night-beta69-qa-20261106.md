# beta.69 有限實機檢查交接

2026-11-06 00:34 HKT，候選`1.0.0-beta.69`，`brightwood-first-oath`，`dist/`。一個獨立Chrome headless:true session、1920×1080／DPR1／正常相機，已結束。

正常介面建立隔離角色Night QA，實際操作確認：森芽兩格原位idle與腳部穩定；攀爬／跳離／下跳提示；走出平台後補跳；落地前預輸入後自動起跳；手帳指定追蹤、焦點、重載保留與停止指定。正常平台及手帳實畫已檢視，未見這些畫面中的新增遮擋。

pageerror／console error／failed request／HTTP錯誤均0，session console0warning。QA腳本首次忽略逐格Sprite footOffset，提早停止攀爬；改用唯讀腳部深度後補完未完成項目，沒有改遊戲、重新建立環境或重跑已通過項目。

本輪只有測試腳本／證據／文件，沒有改遊戲程式或提高版本，沒有重跑單元套件／build。空origin原本無存檔；只建立並清理合成Night QA存檔。具名browser及專屬server已正常關閉，匹配Node／Chrome0、埠43782 listening0。未發布。

證據、來源、完整方法及具體未驗項目：[run record](../../output/playwright/night-beta69-20261106-01/run-record.md)。僅此範圍實玩通過，不宣稱所有NPC／世界／平台／帳號驗收。
