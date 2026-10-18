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
  audio: {key:string;url:string;kind:'music'|'sfx';loop:boolean}[];
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

## 6. T13 audio 資產清單

manifest: public/assets/audio/manifest.json。自行合成WAV16bit mono 22050Hz；三段原創循環theme-town/theme-field/theme-boss，各20秒；sfx keys：ui-click、jump、attack、hit、hurt、pickup、potion、equip、quest、levelup、portal、death、boss-win，各0.1–1.2秒。無人聲，不抄原曲旋律，不使用外部串流。音樂總音量預設.35、sfx.65、master.8。

以可重現小腳本產生音符／包絡／打擊音，輸出WAV及manifest，原始作曲／腳本放tools/audio，runtime放src/audio。T13可用確定性程式產音訊；這不等於使用ImageGen生成音訊。播放器處理首次手勢、拒絕、淡入淡出400ms、同音效併發≤4、暫停與dispose。

## 7. 內部體積與完成證據

壓縮包預算48MiB：actors18、environment16、interface6、audio4、程式／封面／SDK4。只是內部預算，平台硬限制以05為準。資產metadata、腳本及source-log留專案，需要的runtime檔才入dist，原始生成稿不入包。

每包完成需實際存在的檔案、可解析manifest、圖格尺寸整除、key唯一、正式／暫用狀態、必要視覺檢視。不反覆截遊戲所有畫面；只查看該新資產。T14核對動作／握點／平台與特效節拍後才標視覺已接合。
