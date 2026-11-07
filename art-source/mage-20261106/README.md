# 法師素材製作紀錄

2026-11-06，Asia/Hong_Kong。對應 Plan53-11／本機候選 1.0.0-beta.87。正式輸出清單、尺寸與 SHA256 見 [export-report.json](export-report.json)，共24個PNG；本目錄只供製作與交接，不進入遊戲ZIP。

## 來源與採用

本輪以內建 imagegen 工具產生原創素材，依既有主角／弓術三裝束作為視覺參考。沒有下載第三方角色、武器或音效。各次完整提示詞與原稿均保留。

| 原稿 | 提示詞 | 結果 |
| --- | --- | --- |
| cast-atlas-source.png | cast-atlas.prompt.txt | 採用。4欄×3列，布衣／輕革／鐵環甲各4個施法姿勢 |
| staff-atlas-source.png | staff-atlas.prompt.txt | 未採用；霧光及低alpha邊緣不適合小尺寸武器 |
| staff-alpha-attempt-unused.png | staff-alpha-attempt.prompt.txt | 未採用；透明編輯仍有霧邊 |
| staff-clean-atlas-source.png | staff-clean-atlas.prompt.txt | 採用。重新生成乾淨、無光霧的六階法杖 |
| skill-atlas-source.png | skill-atlas.prompt.txt | 採用。六個技能／普攻圖示 |
| mentor-source.png | mentor.prompt.txt | 採用。符文導師星蘅 |

## 技術匯出與接線

[export.py](export.py)只做裁切、縮放與圖集排列，保留生成圖的alpha；未以程式重畫或語意修改生成素材。輸出為三套四幀施法圖集、六法杖世界圖、六法杖物品icon、六技能icon、星蘅actor及主角／星蘅兩張portrait。

runtime放在public/assets，並由actors／interface manifest引用。施法增加獨立casting錨點，原劍／弓錨點及主角行走、跳躍姿勢沿用。魔彈、霜環、閃現與前搖輪廓由遊戲原生graphics繪製。

已檢視必要縮圖、正常布衣法師施法及1280／960介面短段；沒有宣稱三裝束與全部法杖組合皆做過實際逐格視審。

## 聲音

tools/audio/scores/sfx.mjs新增五個原創合成配方：mage-cast、mage-bolt、mage-frost、mage-blink、mage-hit，經既有generate-audio.mjs的指定key流程輸出到runtime音效目錄及manifest。沒有外部錄音來源。

五個WAV實際檢查為單聲道48kHz、PCM16、非空且峰值非零，明細見 [audio-check.json](../../output/mage-20261106/audio-check.json)。音效觸發時序有app-audio集中案例；未做主觀聆聽，也不以本紀錄宣稱整套音訊產線的完整驗證退出碼。

最終候選及驗收界線見 [法師交接](../../plan/reports/mage-beta87-20261106.md)。
