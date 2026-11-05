"""Comparison sheets and focused structural checks for the selected runtime art."""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
PUBLIC = ROOT/'public'
OUT = ROOT/'output/character-clarity-20261105'
OUT.mkdir(parents=True,exist_ok=True)
report = json.loads((HERE/'export-report.json').read_text(encoding='utf-8'))
manifest = json.loads((PUBLIC/'assets/actors/manifest.json').read_text(encoding='utf-8'))
images = {im['key']:im for im in manifest['images']}
inventory = json.loads((ROOT/'output/character-inventory-20261105/inventory.json').read_text(encoding='utf-8'))
names = {a['image']['key']:a['name'] for a in inventory['actors']}
records = {a['key']:a for a in report['assets']}
FONT = 'C:/Windows/Fonts/msjh.ttc'

def font(size): return ImageFont.truetype(FONT,size)

def frame(key,index=0,old=False):
    asset = images[key]
    path = records[key]['previousUrl'] if old else asset['url']
    with Image.open(PUBLIC/path) as raw:
        image=raw.convert('RGBA')
    w,h=image.width//asset['columns'],image.height//asset['rows']
    x,y=index%asset['columns']*w,index//asset['columns']*h
    return image.crop((x,y,x+w,y+h)).resize((asset['displayWidth']*2,asset['displayHeight']*2),Image.Resampling.NEAREST)

def canvas(width,height,title,subtitle):
    image=Image.new('RGB',(width,height),'#172833'); draw=ImageDraw.Draw(image)
    draw.text((20,14),title,font=font(27),fill='#f4e1b4')
    draw.text((20,56),subtitle,font=font(16),fill='#b6ced4')
    return image

def save(image,name):
    image.save(OUT/(name+'.png'))
    image.save(OUT/(name+'.jpg'),quality=75,subsampling=0)

def comparison(image,key,x,y,index=0,label=None):
    draw=ImageDraw.Draw(image)
    draw.rounded_rectangle((x+4,y+3,x+396,y+239),radius=8,fill='#263d48',outline='#46616a')
    draw.text((x+14,y+10),label or names[key],font=font(19),fill='#f6eddb')
    draw.text((x+32,y+38),'舊版',font=font(14),fill='#b6ced4')
    draw.text((x+235,y+38),'更新後',font=font(14),fill='#9ed5bc')
    for offset,old in [(6,True),(202,False)]:
        pose=frame(key,index,old); image.paste(pose,(x+offset,y+46),pose)

hero=canvas(1200,1060,'主角三套裝束：前後對照','左右皆為相同 2× 遊戲顯示比例；新稿保留身形位置，頭髮、臉部與材質重新繪製')
for column,outfit in enumerate(['cloth','leather','iron']):
    key='actor:hero-'+outfit
    for row,(state,index) in enumerate([('待機',0),('移動',8),('攻擊',35),('倒地',51)]):
        comparison(hero,key,column*400,96+row*240,index,names[key]+'／'+state)
save(hero,'01-hero-comparison')

for category,keys,name,title in [
    ('npc',[k for k in records if k in ['actor:merchant','actor:sands-guide','actor:ruins-archivist','actor:ruins-medic','actor:ruins-pathfinder']], '02-npc-comparison','NPC：從保留原稿恢復細節'),
    ('monster',[k for k in records if k not in ['actor:guardian','actor:sunwell-sentinel'] and any(a['image']['key']==k and a['category']=='monster' for a in inventory['actors'])], '03-monster-comparison','普通怪物：恢復原稿細節與色階')]:
    image=canvas(1200,100+240*((len(keys)+2)//3),title,'同一個角色、同一個待機格、相同 2× 顯示比例：左舊版，右更新後')
    for i,key in enumerate(keys): comparison(image,key,i%3*400,96+i//3*240)
    save(image,name)

image=canvas(1200,1080,'兩位首領：前後對照','左：舊版　右：更新後；雙方皆為 2× 遊戲顯示比例，原有體型及動作位置保留')
draw=ImageDraw.Draw(image)
for row,key in enumerate(['actor:guardian','actor:sunwell-sentinel']):
    y=100+row*480
    draw.text((20,y),names[key],font=font(23),fill='#f6eddb')
    draw.text((170,y+32),'舊版',font=font(16),fill='#b6ced4')
    draw.text((770,y+32),'更新後',font=font(16),fill='#9ed5bc')
    for x,old in [(20,True),(620,False)]:
        pose=frame(key,0,old); image.paste(pose,(x,y+60),pose)
save(image,'04-boss-comparison')

# Review the retained head/hand anchors with the real independent equipment.
anchors=json.loads((PUBLIC/'assets/actors/anchors.json').read_text())
image=canvas(1152,984,'主角裝備錨點檢視','新角色搭配現有帽子與武器；待機、移動、攻擊，沿用原有 96×96 座標')
draw=ImageDraw.Draw(image)
for col,(outfit,weapon,hat) in enumerate([
    ('cloth','starter-sword','cloth-cap'),('leather','iron-sword','leather-cap'),('iron','steel-sword','iron-helm')]):
    key='actor:hero-'+outfit
    for row,(state,index,pose_index) in enumerate([('idle',0,0),('walk',8,0),('attack',35,3)]):
        x,y=col*384,100+row*288
        cell=Image.new('RGBA',(384,288))
        cell.alpha_composite(frame(key,index),(96,40))
        annotation=anchors['heroes'][outfit][state][pose_index]
        for slot,equipment in [('weapon',weapon),('hat',hat)]:
            gear=images['equip:'+equipment]
            point=annotation['hand' if slot=='weapon' else 'head']
            position=(96+point['x']*2,40+point['y']*2)
            sprite=Image.open(PUBLIC/gear['url']).convert('RGBA').resize((gear['displayWidth']*2,gear['displayHeight']*2),Image.Resampling.LANCZOS)
            layer=Image.new('RGBA',cell.size)
            layer.alpha_composite(sprite,(round(position[0]-gear['pivotX']*sprite.width),round(position[1]-gear['pivotY']*sprite.height)))
            if slot=='weapon':
                layer=layer.rotate(-point['rotationDeg'],resample=Image.Resampling.BICUBIC,center=position)
            cell.alpha_composite(layer)
        draw.rounded_rectangle((x+4,y+3,x+380,y+284),radius=8,fill='#263d48',outline='#46616a')
        draw.text((x+14,y+9),names[key]+'／'+{'idle':'待機','walk':'移動','attack':'攻擊'}[state],font=font(18),fill='#f6eddb')
        image.paste(cell,(x,y),cell)
save(image,'05-hero-equipment-anchors')

# Check all real runtime frames referenced by the unchanged animation contracts.
checked=0; maximum_delta=0
for key,record in records.items():
    asset=images[key]
    with Image.open(PUBLIC/asset['url']) as raw:
        assert raw.mode=='RGBA',key
        assert raw.width%asset['columns']==0 and raw.height%asset['rows']==0,key
        assert raw.getchannel('A').getextrema()[0]==0,key
        w,h=raw.width//asset['columns'],raw.height//asset['rows']
        active={index for a in manifest['animations'] if a['imageKey']==key for index in a['frames']}
        for index in active:
            pose=raw.crop((index%asset['columns']*w,index//asset['columns']*h,(index%asset['columns']+1)*w,(index//asset['columns']+1)*h))
            bounds=pose.getchannel('A').point(lambda a:255 if a>8 else 0).getbbox()
            assert bounds is not None,(key,index)
            previous=record['frames'][index]['oldBounds']
            delta=max(abs(bounds[i]*asset['displayWidth' if i%2==0 else 'displayHeight']/(w if i%2==0 else h)-previous[i]*asset['displayWidth' if i%2==0 else 'displayHeight']/record['oldFrame'][i%2]) for i in range(4))
            maximum_delta=max(maximum_delta,delta)
            assert delta<=1,(key,index,delta)
            checked+=1
result={'assets':len(records),'activeFrames':checked,'maximumSilhouetteBoundsDeltaLogicalPx':round(maximum_delta,3),'totalNewBytes':sum(a['bytes'] for a in records.values()),'browserVerified':False}
(OUT/'structural-check.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result))
