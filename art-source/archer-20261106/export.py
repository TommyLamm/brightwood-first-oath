"""Technical crop/resample/atlas exports of retained ImageGen art; original native target/arrow shapes."""
from pathlib import Path
from PIL import Image, ImageDraw
import json, hashlib

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
PUBLIC = ROOT / 'public'
OUT = ROOT / 'output/archer-20261106'
OUT.mkdir(exist_ok=True)
records = []
manifests = {p: json.loads((PUBLIC/f'assets/{p}/manifest.json').read_text()) for p in ['actors','interface']}

def resize(im, size):
    return im.convert('RGBa').resize(size, Image.Resampling.LANCZOS).convert('RGBA')

def save(pack, key, name, im, display, columns=1, pivot=(.5,1)):
    url=f'assets/{pack}/{name}.png'
    im.save(PUBLIC/url, optimize=True)
    entry=dict(key=key,url=url,columns=columns,rows=1,displayWidth=display[0],displayHeight=display[1],pivotX=pivot[0],pivotY=pivot[1])
    manifests[pack]['images']=[e for e in manifests[pack]['images'] if e['key'] != key]+[entry]
    records.append(dict(key=key,url=url,size=im.size,sha256=hashlib.sha256((PUBLIC/url).read_bytes()).hexdigest()))

def rgba(name): return Image.open(HERE/f'{name}-source.png').convert('RGBA')
def cells(im, n): return [im.crop((round(i*im.width/n),0,round((i+1)*im.width/n),im.height)) for i in range(n)]

shoot_frames={}
for outfit,height in [('cloth',84),('leather',89),('iron',87)]:
    source=rgba(f'{outfit}-shoot'); frames=cells(source,4)
    boxes=[f.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox() for f in frames]
    top=min(b[1] for b in boxes); bottom=max(b[3] for b in boxes)
    scale=height/(bottom-top)
    atlas=Image.new('RGBA',(512,128));shoot_frames[outfit]=[]
    for i,(f,box) in enumerate(zip(frames,boxes)):
        piece=resize(f.crop(box),(round((box[2]-box[0])*scale),round((box[3]-box[1])*scale)))
        target=Image.new('RGBA',(128,128))
        x=round(64+(box[0]-f.width*.47)*scale);y=112-round((bottom-box[1])*scale)
        target.alpha_composite(piece,(x,y));atlas.alpha_composite(target,(128*i,0));shoot_frames[outfit].append(target)
    save('actors',f'actor:archer-{outfit}',f'archer-{outfit}-shoot-v1',atlas,(96,96),4)
    manifests['actors']['animations']=[a for a in manifests['actors']['animations'] if a['key']!=f'archer:{outfit}:attack']
    manifests['actors']['animations'].append(dict(key=f'archer:{outfit}:attack',imageKey=f'actor:archer-{outfit}',frames=[0,1,2,3],frameMs=[72,108,60,410],loop=False))

bows=['starter-bow','iron-bow','steel-bow','guardian-bow','frost-tide-bow','sunwell-oathbow']
for name,cell in zip(bows,cells(rgba('bow-atlas'),6)):
    box=cell.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox();prop=cell.crop(box)
    prop.thumbnail((56,120),Image.Resampling.LANCZOS)
    frame=Image.new('RGBA',(64,128));frame.alpha_composite(prop,((64-prop.width)//2,(128-prop.height)//2))
    save('actors',f'equip:{name}',f'equip-{name}-v1',frame,(28,56),pivot=(.6,.5))
    icon=Image.new('RGBA',(64,64));prop.thumbnail((42,58),Image.Resampling.LANCZOS);icon.alpha_composite(prop,((64-prop.width)//2,(64-prop.height)//2))
    save('interface',f'item:{name}',f'item-{name}-v1',icon,(32,32),pivot=(.5,.5))

skill_ids=['bow-basic','archer-double-shot','archer-piercing-shot','archer-retreat-shot','archer-bow-mastery','archer-steady-aim']
for key,cell in zip(skill_ids,cells(rgba('skill-atlas'),6)):
    # The medallions occupy the central horizontal band; exclude the sheet's white gutters.
    size=cell.width; top=round(cell.height*.25);icon=cell.crop((0,top,size,top+size))
    save('interface',f'skill:{key}',f'skill-{key}-v1',resize(icon,(96,96)),(32,32),pivot=(.5,.5))

mentor=rgba('mentor');box=mentor.getbbox();prop=mentor.crop(box);prop.thumbnail((98,138),Image.Resampling.LANCZOS)
frame=Image.new('RGBA',(128,160));frame.alpha_composite(prop,((128-prop.width)//2,150-prop.height))
save('actors','actor:archer-mentor','archer-mentor-v1',frame,(76.8,96))
portrait=mentor.crop((box[0],box[1],box[2],box[1]+round((box[3]-box[1])*.6)))
portrait.thumbnail((192,192),Image.Resampling.LANCZOS)
save('interface','portrait:archer-mentor','portrait-archer-mentor-v1',portrait,(96,96),pivot=(.5,.5))
portrait=shoot_frames['cloth'][1].crop((26,18,104,96))
save('interface','portrait:archer','portrait-archer-v1',resize(portrait,(192,192)),(96,96),pivot=(.5,.5))

# Original simple native shapes; no third-party art or semantic alteration of generated art.
target=Image.new('RGBA',(96,128));d=ImageDraw.Draw(target)
d.line([(32,115),(45,56),(64,115)],fill='#6f4b2d',width=8)
for inset,color in [(0,'#664527'),(4,'#d2af69'),(10,'#f0ddb1'),(18,'#a85036'),(27,'#f0ddb1'),(33,'#a85036')]:
    d.ellipse((8+inset,8+inset,88-inset,88-inset),fill=color)
save('actors','actor:archery-target','archery-target-v1',target,(48,64))
arrow=Image.new('RGBA',(64,16));d=ImageDraw.Draw(arrow)
d.line((5,8,58,8),fill='#f2d99b',width=3);d.polygon([(63,8),(51,2),(51,14)],fill='#dfecef');d.polygon([(7,8),(0,1),(14,4),(18,8)],fill='#5a9f8f')
save('actors','vfx:arrow','arrow-v1',arrow,(24,6),pivot=(1,.5))
for npc,key in [('archer-mentor','actor:archer-mentor')]+[(f'archery-target-{s}','actor:archery-target') for s in ['low','high','far']]:
    animation=f'npc:{npc}:idle'
    manifests['actors']['animations']=[a for a in manifests['actors']['animations'] if a['key']!=animation]
    manifests['actors']['animations'].append(dict(key=animation,imageKey=key,frames=[0,0],frameMs=[350,350],loop=True))
for pack,manifest in manifests.items(): (PUBLIC/f'assets/{pack}/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
anchors=json.loads((PUBLIC/'assets/actors/anchors.json').read_text())
anchors['archery']={'version':1,'shoot':{o:[dict(hand={'x':72,'y':52,'rotationDeg':0},rearHand={'x':x,'y':50},arrow={'x':72,'y':52},head={'x':49,'y':30}) for x in [54,42,39,55]] for o in shoot_frames}}
(PUBLIC/'assets/actors/anchors.json').write_text(json.dumps(anchors,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(HERE/'export-report.json').write_text(json.dumps(records,indent=2)+'\n')
review=Image.new('RGB',(960,420),'#243c47')
for row,outfit in enumerate(shoot_frames):
    for col,frame in enumerate(shoot_frames[outfit]):
        pose=resize(frame,(192,192));review.paste(pose,(col*240,row*135-20),pose)
review.save(OUT/'shoot-review.jpg',quality=72)
print(f'Exported {len(records)} archer assets')
