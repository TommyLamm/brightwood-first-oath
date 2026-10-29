# Plan49・手帳 NPC 地圖入口交接

2026-10-29（Asia/Hong_Kong）。**SOURCE_DELIVERED／ZIP_VALIDATED／BROWSER_UNVERIFIED；GITHUB_PRERELEASED**。[Plan49](../49-journal-contact-map.md)在[Plan48](plan48-handoff.md)完成後開始。root 完整網讀八份規格（refs188–191），核現有 selected／definition／底部單一 map 按鈕／button focus 及 Plan48 查找與 handler。基線 .playroom/tmp/plan49-integration-review/illustrated-before.ts。新 beta56 artifact/tmp 與 tag 均預核未用。

W01 全新 Luna Max 僅改 illustrated-panels 呈現與單次 tsc，root 審後 W02 新候選；不重跑未改 Plan48 或舊 checks。真 UI 未驗、不 git 寫入／發布／排程；保留 dirty／作者／ID／存檔相容／真資料及舊候選。02:40／07:50 排程已觸發刪除。

W01 全新 Luna Max /root/plan49_journal_ui 完成，[UI 報告](plan49-journal-ui.md)及原 tsc log 經 root 核讀；指定 Node24.22.1 單次 tsc exit0。root 對本批 illustrated-before.ts 審兩hunks：命名 import／底部單一 map 區塊，ready 取 turnIn、available 取 giver；其餘狀態、缺 definition／NPC／placement 完整回原入口，無新狀態或 gameplay。既有 AP dirty 保留。W02 全新 Luna Max /root/plan49_candidate 建立 beta56 新候選，不重跑 W01。

最新使用者已要求本 Plan 完成後收尾／簡單驗證／Release，並優先修正剛發現的 frost map 返回誤標。不建立 Plan50；原 beta56 凍結後全新 Luna 修補 world-map 兩處文字分支，再新 beta57／Release。root 已新任務完整網讀 refs199–202，公開 repo 已確認；詳 Plan 最新追加。前段不發布界線由此明確授權取代，平台匯入／上架仍不做。

原 W02 /root/plan49_candidate 已凍結 beta56，root 核候選報告及原 validate／audit exit0：build82modules／pack／完整 ZIP／Python audit 各一次成功；ZIP274entries／131,528,762 bytes／SHA8c8228a0f356d811187aef9d22c97e8c4df1fcd3cdd242fa4d64371906bc531f，六metadata一致，14text／1,772,623bytes／8類0findings，260binary未掃。此為補丁前歷史候選。全新 Luna Max /root/plan49_frost_return_fix 接兩處world-map呈現修補；新beta57目錄與tag已預核未用。

收尾補丁全新 Luna Max /root/plan49_frost_return_fix 完成，[修補報告](plan49-frost-return-fix.md)及原 tsc log 經 root 核讀；單次指定 tsc exit0，root 審 world-map-before.ts 的兩處末段分支，與既有 gameplay frost-shore／result 雪痕海岸一致，未改動 gameplay。beta57 新候選由全新 Luna Max /root/plan49_release_candidate 接手；同 Plan49 audit 複製需只換 beta tokens，避免合法 plan49 被 legacy guard 拒絕。

Plan49 含追加修補完成；[beta57 候選報告](plan49-release-candidate.md)及原 validate／audit log 經 root 核讀。全新 Luna Max /root/plan49_release_candidate prepare／build82modules／pack／完整 ZIP／有限 audit 各一次 exit0。六metadata一致beta57，ZIP274entries／131,528,778bytes／SHA6d5afe2557db1a1119ffb55e087772b358d79f9d31a81a8c969c832c2d6d9ddc。14text／1,772,764bytes／8類0findings，260binary未掃。root 依最新授權進行[Release 收尾](release-beta57-20261029.md)，不再開新 Plan；真 UI 未驗。

收尾文件引用檢查一次：10 documents／112 local links／6 anchors，failures []，exit0；git diff --check exit0（僅既有 LF／CRLF 提示，無空白錯誤）。

root 完成程式／測試／metadata 提交 bcc3abe，準備文件獨立提交及 v1.0.0-beta.57。有限 repository 文字掃描192檔／8類0findings，未重跑遊戲 checks。

最終完成：[beta57 GitHub prerelease](https://github.com/TommyLamm/brightwood-first-oath/releases/tag/v1.0.0-beta.57)已發布，[workflow](https://github.com/TommyLamm/brightwood-first-oath/actions/runs/40796409735)success。tag commit7f99f66、source commitbcc3abe。實際附件131,528,745bytes／SHAda32d0cfdf606c86d954466a54dabc0f765edf6ba1ff116635180f703c20589f，與Windows候選4個text差異僅JSON格式／HTML換行及空行，JS/CSS及binary一致；實際附件有限14text8類0findings。詳既有Release進度報告。依使用者要求本次收尾，不建立Plan50／排程，不操作平台確認／上架，真UI仍未驗。
