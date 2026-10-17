# T13：原創合成音訊與播放器

目的：提供與事件同步、可靜音及拒絕降級的音效／音樂。所有權src/audio/**、public/assets/audio/**、tools/audio/**。依G0及10，不能修改app／UI／settings契約。

不用ImageGen生成聲音，不需外部音樂服務或帳號。用確定性合成腳本產WAV，保留原創音符／波形／包絡腳本，播放器可由WebAudio或HTMLAudio實作，但對外同07 AudioController。

## 步驟

- [x] T13-01 寫可重跑腳本：22050Hz mono PCM16 WAV，音量正規化留headroom，不產clipping；原始音符／節奏可讀。
- [x] T13-02 創作town/field/boss各20秒循環，分別平和／探索／緊張；首尾相接平順，不取現成原曲旋律。
- [x] T13-03 產13種sfx按10固定key，attack/hit/hurt明顯不同，levelup／quest有短旋律，長度0.1–1.2秒。
- [x] T13-04 建audio manifest，audio.kind/loop及relative URL正確，images/animations為空陣列。
- [x] T13-05 createAudio不自動播放；unlock由第一個玩家手勢觸發，resume拒絕時捕捉，保留無聲玩法並可下次手勢再試。
- [x] T13-06 setMusic同key不重頭播放，切曲400ms淡出入；paused暫停位置，恢復繼續；mute不改使用者音量數值。
- [x] T13-07 setSettings套master×music/sfx，clamp0..1；同種sfx最多四個，超限丟最舊聲部，不無限累積node。
- [x] T13-08 dispose停止音源、清連線及監聽器；切圖不要建立另一AudioContext。播放器失敗不throw中斷主遊戲。
- [x] T13-09 最少檢查WAV header／長度／音量峰值及檔案存在；播放是否解鎖交T16整合，只對合成腳本必要斷言，不加重型音訊測試環境。
- [x] T13-10 report列音訊key、腳本執行方式、真實輸出及app事件映射：jump/attack/hit/hurt/pickup/potion/equip/quest/levelup/portal/death/boss-win/ui-click。

完成：三曲與13音效實際存在、可解碼、無必要外部請求，播放器有真實unlock／pause／mute處理；只有WebAudio beep佔位而無音樂不算整包完成。
