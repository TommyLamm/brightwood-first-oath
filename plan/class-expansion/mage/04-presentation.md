# 53-11-04・素材、聲音與介面

2026-11-06，Asia/Hong_Kong。**DONE**。上層：[法師實作](../11-mage-followup.md)。

## 已實作

- imagegen內建工具依現有三裝束參考產生12格施法原稿；技術匯出3套四幀，idle／walk／jump等沿用原主角。新增casting錨點extension，不改原劍／弓錨點。
- 六法杖世界圖＋六物品icon、六技能icon、主角／星蘅portrait、星蘅actor，共24個正式PNG。原稿、全部提示詞、未採用透明修正、SHA256與匯出程式在art-source/mage-20261106。
- 魔彈、霜環、閃現及前搖提示以原生graphics繪製；霜環只有透明輪廓，保留地形／玩家／首領預警辨識。
- 五個原創合成音效mage-cast／bolt／frost／blink／hit；音效按施法／實際出射／命中時序觸發。
- 建角有三路線、法師portrait與快捷鍵；能力頁三能力及INT預覽／全部AP；技能表含MP上限、脫戰恢復、首領免疫、閃現限制／rank冷卻；專職裝備與商店提示。

## 驗證及修復

正常法師UI轉職後學魔力彈、扣8MP，分配45INT，保存為INT57／AP0。1280×720能力頁與施法、960×540技能頁／兩角色列表已觀察；短技能頁可捲動，未新增手機宣告。

最初法杖生成有低alpha霧邊，改用乾淨重生成原稿；未採用版本保留。最初真實戰鬥揭露將音效寫入VisualEvent.key導致RendererAssetError；已拆為magic旗標，保留正式vfx:hit路徑，focused案例與修正後無頭流程通過。中斷前錯誤日誌保留，最終短段console為Errors0。

app-audio最新9案例、combat-ui-state7案例通過；五WAV header／單聲道48kHz／PCM16／非靜音峰值檢查通過。未宣稱主觀聆聽或完整裝備組合／動畫視覺驗收。
