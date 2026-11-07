# 盜賊素材來源

2026-11-06製作，2026-11-07收尾，Asia/Hong_Kong。Plan53-12／beta.88。

本輪使用內建imagegen生成三張原創原稿，沒有使用API／CLI替代路線或第三方下載素材。完整提示詞分別保存在[dagger.prompt.txt](dagger.prompt.txt)、[skill.prompt.txt](skill.prompt.txt)及[mentor.prompt.txt](mentor.prompt.txt)；原稿為同名前綴的`*-source.png`。

[export.py](export.py)只做技術裁切、縮放與圖集匯出，保留生成alpha；沒有以程式重畫或語意修改圖像。技能原稿有多餘襯底，匯出僅裁取六個正方形圖示。正式輸出20個PNG：六短刃世界圖、六物品圖、六技能圖、夜嵐actor與portrait。完整尺寸／SHA256見[export-report.json](export-report.json)。資源放在public/assets並接actors／interface manifest。

主角沿用既有布衣／輕革／鐵甲近戰動畫與手部錨點，同一角色外貌保留，只替換短刃；不宣稱新增三套盜賊身體動畫或逐套武器組合全部視審。必要縮圖見[assets-review.jpg](../../output/rogue-20261106/assets-review.jpg)，煙幕與連刺線條使用遊戲原生graphics。

三個原創合成聲效rogue-slash、rogue-lunge、rogue-smoke由tools/audio/scores/sfx.mjs及既有指定key生成流程產出，接入出手／兩段連刺時序。生成器實際完成57項音訊資料驗證；另檢查這三WAV為48kHz單聲道PCM16、非空、非零峰值，見[audio-check.json](../../output/rogue-20261106/audio-check.json)。未作主觀聆聽。

本輪只觀察必要素材縮圖與1280／960實際短段；詳[最終交接](../../plan/reports/rogue-beta88-20261107.md)。
