# 盜賊主角動作與肖像

2026-11-07，Plan54／beta.89。使用內建 imagegen（非CLI／API）生成三裝束、四幀短刃動作圖集。參考本專案既有hero-cloth-v9-clarity-v2及mage-cloth-cast-v1，保留同一主角外貌。完整提示詞見dagger-atlas.prompt.txt，原稿dagger-atlas-source.png，技術匯出export.py，正式四張PNG的尺寸／SHA256見export-report.json。

匯出僅做等格裁切、預乘alpha縮放及圖集排列，沒有程式繪圖或語意改圖。衣服分布衣／輕革／鐵甲；主角手部留空，由既有六短刃世界圖覆蓋。手部／頭部錨點以96px座標保存於anchors.json的dagger additive extension。肖像由布衣動作原稿裁出。待機、移動、跳躍等仍沿用同一主角既有姿勢。

新二轉技能使用八個既有原創技能圖示的明確alias，沒有宣稱新製八張技能圖。飛鏢、毒傷指示與新星環為遊戲原生graphics。既有生成音效按新職業／出射時序接線，未新增第三方素材或依賴。

必要合成背景縮圖：output/class-completion-20261107/rogue-art-review.jpg；原圖保留alpha。實際遊戲短段與未驗界線見Plan54最終交接。
