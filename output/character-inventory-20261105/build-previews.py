"""Read existing runtime textures and make labelled review sheets; no game assets are edited."""
from pathlib import Path
import json
import math
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent
ROOT = OUT.parent.parent
data = json.loads((OUT / 'inventory.json').read_text(encoding='utf-8'))
FONT = 'C:/Windows/Fonts/msjh.ttc'

def font(size):
    return ImageFont.truetype(FONT, size)

def frame(actor, state='idle'):
    image = actor['image']
    with Image.open(ROOT / 'public' / image['url']) as source:
        source = source.convert('RGBA')
        w, h = source.width // image['columns'], source.height // image['rows']
        animation = next((a for a in actor['animations'] if a['key'].split(':')[-1] == state), None)
        index = animation['frames'][0] if animation else 0
        x, y = index % image['columns'] * w, index // image['columns'] * h
        crop = source.crop((x, y, x + w, y + h))
        if state == 'idle':
            actor['sourceSheet'] = [source.width, source.height]
            actor['sourceFrame'] = [w, h]
            actor['idleFrame'] = index
            bbox = crop.getchannel('A').point(lambda a: 255 if a >= 16 else 0).getbbox()
            actor['idleVisibleSource'] = [bbox[2]-bbox[0], bbox[3]-bbox[1]] if bbox else [0,0]
            actor['idleVisibleDisplay'] = [round(actor['idleVisibleSource'][0]*image['displayWidth']/w, 1),
                                           round(actor['idleVisibleSource'][1]*image['displayHeight']/h, 1)]
        return crop.resize((image['displayWidth'], image['displayHeight']), Image.Resampling.NEAREST)

def base(width, height, title, subtitle):
    image = Image.new('RGB', (width, height), '#172833')
    draw = ImageDraw.Draw(image)
    draw.text((24, 15), title, font=font(27), fill='#f4e1b4')
    draw.text((24, 58), subtitle, font=font(16), fill='#b6ced4')
    return image

def save(image, filename):
    image.save(OUT / (filename + '.png'))
    image.save(OUT / (filename + '.jpg'), quality=75, subsampling=0)

def card(image, actor, x, y, width=320, height=294, boss=False):
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((x+5, y+5, x+width-5, y+height-5), radius=9, fill='#263d48', outline='#46616a')
    draw.text((x+14, y+13), actor['name'], font=font(21), fill='#f6eddb')
    sprite = frame(actor)
    scale = 2
    enlarged = sprite.resize((sprite.width*scale, sprite.height*scale), Image.Resampling.NEAREST)
    if boss:
        image.paste(enlarged, (x+(width-enlarged.width)//2, y+57), enlarged)
        label_y = y+450
    else:
        image.paste(sprite, (x+12, y+247-sprite.height), sprite)
        image.paste(enlarged, (x+116, y+247-enlarged.height), enlarged)
        draw.text((x+22, y+46), '1×', font=font(14), fill='#9dc9c4')
        draw.text((x+184, y+46), '2×', font=font(14), fill='#9dc9c4')
        label_y = y+261
    src = actor['sourceFrame']
    display = actor['image']
    draw.text((x+14, label_y), f"每格 {src[0]}×{src[1]} → 遊戲 {display['displayWidth']}×{display['displayHeight']}",
              font=font(14), fill='#b8d0d2')

heroes = [a for a in data['actors'] if a['category']=='hero']
image = base(1248, 590, '主角：同一位冒險者的三種裝束', '上排：遊戲尺寸 1×（待機／移動／攻擊）　下排：待機 2× 檢視；武器及帽子由遊戲另外疊加')
draw = ImageDraw.Draw(image)
for col, actor in enumerate(heroes):
    x = col*416
    draw.rounded_rectangle((x+6, 99, x+409, 580), radius=9, fill='#263d48', outline='#46616a')
    draw.text((x+22, 112), actor['name'], font=font(23), fill='#f6eddb')
    for n, (state, label) in enumerate([('idle','待機'), ('walk','移動'), ('attack','攻擊')]):
        sprite = frame(actor, state)
        image.paste(sprite, (x+22+n*130, 177), sprite)
        draw.text((x+48+n*130, 151), label, font=font(16), fill='#9dc9c4')
    sprite = frame(actor)
    enlarged = sprite.resize((192,192), Image.Resampling.NEAREST)
    image.paste(enlarged, (x+112, 321), enlarged)
    src = actor['sourceFrame']
    draw.text((x+24, 544), f"每格 {src[0]}×{src[1]} → 遊戲 96×96", font=font(17), fill='#b8d0d2')
save(image, '01-heroes')

for category, title, filename in [('npc','10 位友善 NPC','02-npcs'), ('monster','13 種普通怪物','03-monsters')]:
    actors = [a for a in data['actors'] if a['category']==category]
    rows = math.ceil(len(actors)/4)
    image = base(1280, 104+294*rows, title, '左：遊戲邏輯尺寸 1×　右：2× 放大檢視；均取目前載入貼圖的待機首格（並非遊玩截圖）')
    for index, actor in enumerate(actors):
        card(image, actor, index%4*320, 100+index//4*294)
    save(image, filename)

actors = [a for a in data['actors'] if a['category']=='boss']
image = base(1024, 1104, '4 位首領', '待機首格 2× 放大檢視；遊戲中的完整貼圖顯示框均為 192×192')
for index, actor in enumerate(actors):
    card(image, actor, index%2*512, 100+index//2*500, 512, 500, True)
save(image, '04-bosses')

props = [a for a in data['actors'] if a['category']=='prop']
image = base(960, 470, '共用石碑素材的 3 個互動物件', '西回聲碑／東回聲碑／霜松航標：不是三位人物，使用同一張貼圖；以下以 2× 檢視')
draw = ImageDraw.Draw(image)
for index, actor in enumerate(props):
    sprite = frame(actor)
    enlarged = sprite.resize((192,256), Image.Resampling.NEAREST)
    image.paste(enlarged, (index*320+64, 165), enlarged)
    draw.text((index*320+65, 116), actor['name'], font=font(21), fill='#f6eddb')
save(image, '05-interactive-props')

(OUT/'inventory.json').write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
lines = ['# 現有角色素材盤點', '', '日期：2026-11-05（Asia/Hong_Kong）；版本：'+data['game']['version'], '',
         '來源：目前 src/content/world/npcs.ts、maps.ts、src/content/rules/monsters.ts、items.ts、public/assets/actors/manifest.json，以及 src/render/index.ts、src/main.ts。', '',
         '預覽從目前 runtime 貼圖擷取待機首格，依 manifest 顯示框縮放，使用 nearest-neighbor 並合成深色背景；不是本次遊玩截圖。1× 指 960×540 邏輯畫布內的尺寸，實際螢幕尺寸還受 FIT 縮放及裝置像素比影響。顯示框含透明留白。主角預覽未疊加帽子與武器。', '',
         '共 1 位主角（3 種裝束）、10 位友善 NPC、13 種普通怪物、4 位首領；另有 3 個互動物件，共用 1 張石碑貼圖。所有項目皆有地圖引用。', '',
         '| 類別 | 名稱 | 出現地點 | 原始單格 | 顯示框 | 待機可見身形（邏輯 px，約） | 檔案 |',
         '|---|---|---|---|---|---|---|']
for a in data['actors']:
    src = '×'.join(map(str,a['sourceFrame']))
    dst = f"{a['image']['displayWidth']}×{a['image']['displayHeight']}"
    visible = '×'.join(map(str,a['idleVisibleDisplay']))
    lines.append(f"| {a['category']} | {a['name']} | {'、'.join(a['locations'])} | {src} | {dst} | {visible} | {a['image']['url']} |")
lines += ['', '## 裝備疊圖', '', '武器與帽子是獨立素材，不另算角色：'+ '、'.join(a['name'] for a in data['equipment'])+'。', '',
          '## 解析度相關觀察', '', 'Phaser 使用 CANVAS、960×540 邏輯畫布、Scale.FIT，且 antialias:false。主角每格 128×128，但遊戲顯示框為 96×96；顯示框亦含透明空間。全畫面放大與角色可見面積都會影響細節。以上為靜態程式與圖片觀察，尚未測量實際瀏覽器／螢幕的模糊成因。', '',
          '## 規範、驗證與交接', '', '2026-11-05 已透過網路閱讀 Playroom game-agent-template.md 與其列出的 game-development.md、command-contracts.md、game.schema.json、game-release.yml、playroom-sdk.js、sdk-versioning.md、save-compatibility.md（main）。本次為素材盤點，未更改玩法、存檔、runtime 素材或版本，未發布。', '',
          '已執行：角色與地圖／manifest 引用交叉盤點、圖片尺寸及待機 frame 擷取、預覽排版檢視。未執行：build、型別檢查、測試套件或啟動瀏覽器（本次無遊戲變更）。', '',
          '下一步：使用者選定升級範圍及視覺方向後，先以主角三套裝束做高解析度樣板，再沿用動畫狀態、裝備錨點與顯示比例擴展；實際升級尚未開始。', '']
(OUT/'README.md').write_text('\n'.join(lines), encoding='utf-8')
print(json.dumps({'sheets':5, 'actors':len(data['actors']), 'sourceFrames':sorted(set(tuple(a['sourceFrame']) for a in data['actors']))}))
