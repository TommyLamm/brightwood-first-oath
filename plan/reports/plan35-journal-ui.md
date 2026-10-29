# Plan35 W01・手帳選取接線

2026-10-29（Asia/Hong_Kong）。全新Luna Max `/root/plan35_journal_ui`交付，主代理依回報及完整四處局部diff補記本報告。

index.ts import既有chooseJournalQuest；buildWorldJournal開頭解析selectedQuest，傳同一questId給buildVisualQuests，路線selected也比對該questId；刪除尾段重複且不完整的find fallback。q21文案與滿等EXP附註使用同一結果。沒有修改helper政策、UI state、handler、任務資料、排序、CSS或焦點。

實際一次命令（Node完整exe為C:\Users\Tommy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe，v24.22.1）：

- `node_modules/vitest/vitest.mjs run tests/journal-selection.test.ts -t 'prioritizes a ready quest|handles a new adventure'`：exit0，2 PASS，1 location案例skip。既有helper測試覆蓋自動／手選／過期ID／全claimed／空結果，不是wrapper DOM測試。
- `node_modules/typescript/bin/tsc --noEmit`：exit0，執行一次。

未新增測試，未執行browser／DOM／build。主代理讀基線diff核對四處接線；實際初開／切選／狀態變更／全完成高亮、reader及focus未驗。線上規格由主代理本批完整網讀並於Plan記錄，無平台／存檔／發布變更。
