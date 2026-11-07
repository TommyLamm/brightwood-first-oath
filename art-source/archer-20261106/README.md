# 弓箭手一期素材

2026-11-06。使用 imagegen skill 的內建工具，未使用 CLI/API fallback。原創生成素材以本專案既有主角作風格與身份參考；無外部第三方素材。六個提示詞見同目錄 `.prompt.txt`，原始輸出見 `*-source.png`；引用三套正式角色首幀見 `*-reference.png`。原有劍士圖與錨點不替換。

`export.py` 只對生成原稿做技術裁切、等比縮圖、透明合成與atlas封裝；箭／靶為本檔案可重現的原創簡單圖形。世界人物96px、射擊原格128px，腳底112px；原站立、移動、跳躍、攀爬、受傷、倒地沿用三套既有動作。四個新射擊幀：舉弓、拉弦、放弦、收招。動畫按各技能windup及第二箭排程選幀，非統一播放速度。

雙手及箭點見 `public/assets/actors/anchors.json` 的 additive `archery.version=1`；前手沿用hand名稱、另有rearHand／arrow／head。出箭相對腳底(24,-32)，模擬與渲染共用 `src/contracts/archery.ts`。帽與劍士原錨點保留。射擊時使用施放方向，左右鏡像；短段從身體到弓口也參與牆／敵碰撞，避免貼牆穿射。弓弦沿弓素材保留，拉弦用後手與搭箭表現。

26個runtime匯出與SHA256見 `export-report.json`；只在 `public/assets/{actors,interface}` 引用使用中的匯出。三套小樣縮圖 `output/archer-20261106/shoot-review.jpg`。六弓世界圖／圖示、六技能圖示、角色肖像、青翎／頭像、靶及箭齊全。穿透尾跡、後撤短線、瞄準圈及既有命中特效由renderer合成，不遮首領預警。

原創音效沿 `tools/audio/scores/sfx.mjs` 可重現合成管線：bow-draw、bow-release、bow-pierce、bow-hit、bow-retreat。二連射共用單箭音色，兩次實際放箭分別發聲，避免整段重播。原音量、靜音及手勢啟動保留。正式包不包含本目錄原稿、提示詞與製作腳本。
