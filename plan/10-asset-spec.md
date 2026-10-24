# 資產契約 v1

## 1. 固定風格與生成方法

經典2D側視、可愛大頭比例、清晰輪廓、溫暖森林與岩地、柔和分層背景；角色是點陣精靈觀感，不做3D渲染或極簡方塊替代。先生成一名短髮旅行劍士及一張森林風格參考，其他素材沿這兩份本地參考保持比例／色盤。角色不附文字／標誌／浮水印，外觀固定。

依 imagegen 技能使用內建工具。每個目標明確prompt／參考／透明需求，檢查後才接入；編輯本地圖先查看。工具輸出原檔保留在專案不入包的 art-source/{pack}/，最終可用檔放public/assets/{pack}/。不得只留在生成工具預設目錄。檔名帶id及版本，選定成品由manifest指向，不破壞未要求覆寫的檔案。

每包 source-log.md 記 id、prompt全文、工具、參考路徑、生成檔／入遊戲檔、尺寸、是否正式。ImageGen不可用時報真實失敗，不能暗切API／索取API key；CLI只有使用者明確要求才考慮。

## 2. 共用 manifest

每包僅寫自己的JSON，T00建立型別及loader，T14聚合。所有URL相對入口，例如 assets/actors/hero-cloth-v1.png；不含C槽或工具暫存路徑。

```ts
type AssetManifest = {
  version: 1;
  pack: 'actors' | 'environment' | 'interface' | 'audio';
  images: {
    key: string; url: string; columns: number; rows: number;
    displayWidth: number; displayHeight: number;
    pivotX: number; pivotY: number; // 0..1
  }[];
  animations: {
    key: string; imageKey: string; frames: number[];
    frameMs: number[]; loop: boolean;
  }[];
  audio: {
    key: string; url: string; fallbackUrl?: string;
    kind: 'music' | 'sfx'; loop: boolean;
    group?: string; layer?: 'base' | 'combat' | 'phase2'; // 同組各層同一樣本啟動
    duck?: number;     // 0..1，stinger 播放時音樂降至此倍數
    variance?: number; // 0..1200 cents，每次播放隨機音高
  }[];
};
```

圖片實際寬高必須可被columns／rows整除。顯示尺寸不等於原始生成尺寸，loader用實際尺寸／格數切frame，不假設工具精確產生768px。若格子不規則，請ImageGen修正輸出；不能交不可切割的概念圖作spritesheet。沒有動畫的圖片columns=rows=1。透明角色／道具／圖示必須真alpha，保留邊緣，不烘焙棋盤。

## 3. T10 actors 資產清單

manifest: public/assets/actors/manifest.json。角色圖display96×96、pivot(.5,1)，碰撞仍24×44。服裝用三份同主角完整身體圖集，切換body裝備換sheet，頭與臉保持一致；避免任意服裝組合造成生成錯位。

| image key | 規格／用途 |
| --- | --- |
| actor:hero-cloth／hero-leather／hero-iron | 每份8列×8欄，依下表8個狀態，各列8格，未用格重複最後有效格 |
| equip:starter-sword／iron-sword／steel-sword／guardian-sword | 透明獨立武器，display64×64，pivot(.25,.8)，輪廓與級別不同 |
| equip:cloth-cap／leather-cap／iron-helm | 透明帽子，display48×32，pivot(.5,1)，頭部overlay |
| actor:snail/slime/mushroom/boar/golem/sentinel | 6欄×5列，idle/walk/attack/hurt/dead；display96×96 |
| actor:guardian | 同6×5，display192×192 |
| actor:guide/mentor/merchant/healer/keeper | 每份2欄×1列idle，display96×96 |

主角row順序idle/walk/jump/climb/attack/hurt/dead/buff。有效frames／每格時間：idle前4×180ms循環；walk前6×100ms循環；jump前2依上升／下降選；climb前4×120ms、停爬凍格；attack前6按實際技能總時長縮放且與命中窗對齊；hurt前2×100ms；dead前4×120ms末格停；buff前4×100ms。每個animationKey=`hero:{服裝}:{狀態}`。

敵人動畫idle2×200ms、walk6×120ms、attack4按AI招式時長、hurt2×100ms、dead4×100ms末格停；未用格重複。NPC idle2×350ms。monster動畫key=`{monsterId}:{state}`，NPC=`npc:{id}:idle`。

另輸出public/assets/actors/anchors.json：每hero狀態每有效frame的hand{x,y,rotationDeg}、head{x,y}，坐標相對96×96左上。T10看實際圖片填；T07按pivot及縮放轉世界，facing=-1鏡像。武器攻擊rotation由anchors給，不在T07另猜；帽子跟head。cloth-shirt/leather-vest/iron-mail visualKey在loader映射對應hero三sheet。無裝備帽時不畫，無衣服時仍用cloth避免裸身缺圖。

## 4. T11 environment 資產清單

manifest: public/assets/environment/manifest.json。四theme：camp/town/forest/rock；mine及arena沿用rock加飾物。每theme提供sky、far、mid三圖層，各display960×540，可水平延展，背景不烘焙怪物／NPC／操作文字／可走平台。

共用透明tile-ground、tile-platform、tile-slope、ladder、portal、town-sign、mine-door、altar。地面display128×128、平台128×32、梯32×128、傳點64×96，其餘合理縮放。各圖layer固定scrollFactor sky0/far.2/mid.5；前景少量裝飾.95，不遮落點。

T07依MapDef foothold位置重複畫平台及斜坡，T11可用texture旋轉／拼接呈現斜坡，不能要求T05改碰撞來配合背景。每個image key=`env:{theme}:{layer}`或`env:{prop}`，不得每圖改另一套命名。

## 5. T12 interface 資產清單

manifest: public/assets/interface/manifest.json。24個item:{id}圖示，display32×32；5技能圖示skill:{id}，display32×32（不含basic）；marker:quest、marker:portal、marker:shop、marker:player四標記；panel:frame、button:normal/hover/pressed、bar:hp/mp/exp、slot:normal/selected。

效果vfx:heavy-strike、vfx:sweep、vfx:hit、vfx:levelup、vfx:guard；每組6欄×1列透明圖集，單格display128×128，pivot(.5,.5)，60ms/格、非loop，guard用外圈疊角色不遮臉。傷害數字及介面文字由程式繪製。UI皮膚允許CSS處理可縮放邊框／色塊，正式角色、圖示、特效仍用生成點陣資產。

## 6. T13 audio 資產清單（1.0.0-beta.10 重做）

manifest: public/assets/audio/manifest.json，全部由 `node tools/audio/generate-audio.mjs` 離線確定性合成（零外部樣本、無 npm 依賴，只需 ffmpeg 編碼），`--check` 驗證已提交檔案。風格為管弦奇幻，全部曲目由原創主導動機「首誓」變奏，不抄原曲旋律，不使用外部串流；合唱為 formant 合成音色，無錄音人聲及歌詞。

- 音樂：48 kHz 立體聲，Ogg Vorbis q5 為主、AAC M4A 160k 為 fallbackUrl。迴圈為樣本精確無縫（尾音繞回開頭，不淡出到靜音），長度為 640 樣本倍數。9 組：theme-title（標題／建立角色）、theme-town、theme-brightwood、theme-ridge、theme-frost、theme-sands 各一 base；後四組另有 `:combat` 層；boss-guardian、boss-frost、boss-sunwell 各有 base＋`:phase2` 層。同組各層等長、同和聲，runtime 同一 AudioContext 時間啟動並以增益交叉淡化。主層整合響度 −18.5..−15 LUFS，峰值 ≤ 0.98。
- 地圖→音樂組由 MapDef.musicKey 決定，validate.ts 的 expectedMusic 鎖定。
- Stinger：boss-win、death、levelup、quest 為 kind:'sfx' 的 Ogg＋M4A，帶 duck。
- 音效：48 kHz 單聲道 PCM16 WAV（TPDF dither），0.05–1.5 s，峰值 ≤ 0.9。keys：ui-click、panel-open、dialogue、jump、attack、attack-heavy、attack-sweep、hit、crit-hit、hurt、pickup、potion、equip、guard、monster-die、telegraph、boss-phase、portal；攻擊／命中類帶 variance。
- 環境音：src/audio/ambience.ts 依 MapDef.themeKey 於瀏覽器即時程序合成（0 位元組資源），音量 = sfxVolume×0.9，戰鬥時降至 0.3 倍，事件聲部上限 18。
- 自適應：720 px 內怪物處於追擊／出招狀態 → combat，脫戰 4.5 s 後回 explore；Boss 血量 < 50% 或 phase 2 → phase2。設定面板只 duck 不暫停；暫停／失焦仍暫停。
- 音量預設 music .35、sfx .65、master .8；不新增 Settings 欄位，存檔格式不變。
- 播放器：只在首次玩家手勢後解鎖，拒絕或解碼失敗時靜默可玩；只載入當前音樂組，換組時釋放舊組 buffer。
- 試聽：開發用 audio-lab.html（`npm run dev` → /audio-lab.html），不在 build 輸入。

## 7. 內部體積與完成證據

壓縮包預算：actors18、environment16、interface6、audio 約 48（Ogg 20.8 MiB＋M4A 25.6 MiB＋WAV 1 MiB；玩家只下載一種音樂編碼及當前音樂組）、程式／封面／SDK4。只是內部預算；平台硬限制為 Playroom tools 1.2.0 的 ZIP 512 MiB。資產metadata、腳本及source-log留專案，需要的runtime檔才入dist，原始生成稿不入包。

每包完成需實際存在的檔案、可解析manifest、圖格尺寸整除、key唯一、正式／暫用狀態、必要視覺檢視。不反覆截遊戲所有畫面；只查看該新資產。T14核對動作／握點／平台與特效節拍後才標視覺已接合。
