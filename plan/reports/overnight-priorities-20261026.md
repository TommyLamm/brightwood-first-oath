# 夜間優化優先順序與證據

依00:50–09:00自主目標，先完成未完的beta.15真browser範圍，改善以已觀察或直接程式證據支持者優先，不為填滿時段新增章節或重設凍結的首領數值。

1. **NPC對話鍵盤操作。** `src/ui/index.ts`的HUD互動在dispatch後把focus送回canvas；新dialogue只保留原panel內的focus，沒有首次action聚焦。新owner先以Space／HUD真browser確認，成立才限縮改善dialogue；閉合/Esc回canvas現有邏輯保留。另明示普攻／技能採點按，避免把長hold誤認為連發；01設計沒有授權自動戰鬥，不把文案問題改成新戰鬥規則。
2. **匯入被競爭寫入取消時的說明。** 已有browser log `namespace-retry-20261025/conflict-same-doc-result.log`證明late canonical沒有覆寫舊件，卻只回到既有title，沒有獨立取消說明。程式兩處pre-copy recheck目前直接回`localOutcome(generation)`。下一個可處理的owner應只補可理解的取消／重新確認訊息，保留原有canonical優先、資料驗證、status與重新確認候選行為，不改format或覆寫策略。需覆蓋目標出現、來源變更、第二次pre-copy recheck、壞canonical與無法讀取情況；優先沿用並擴充既有focused namespace用例，不重跑已過的其他browser與全套回歸。

其餘改進等待主線／枝線實測結果後再排。正式雲端或平台環境缺少不以mock補綠，也不以此停掉能做的本機工作。新source與候選必須保留beta.15原dist／ZIP、明確記版本與fingerprint；不要把舊證據套到新bytes。
