"""Technical crop, resample and atlas export only. Preserve generated alpha and original sources."""
from pathlib import Path
from PIL import Image
import json, hashlib

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
PUBLIC=ROOT/'public'
OUT=ROOT/'output/mage-20261106'
packs={p:json.loads((PUBLIC/f'assets/{p}/manifest.json').read_text(encoding='utf8')) for p in ['actors','interface']}
records=[]
def resize(im,size):return im.convert('RGBa').resize(size,Image.Resampling.LANCZOS).convert('RGBA')
def save(pack,key,name,im,display,columns=1,pivot=(.5,1)):
    url=f'assets/{pack}/{name}.png'; im.save(PUBLIC/url,optimize=True)
    entry=dict(key=key,url=url,columns=columns,rows=1,displayWidth=display[0],displayHeight=display[1],pivotX=pivot[0],pivotY=pivot[1])
    packs[pack]['images']=[x for x in packs[pack]['images'] if x['key']!=key]+[entry]
    records.append(dict(key=key,url=url,size=im.size,sha256=hashlib.sha256((PUBLIC/url).read_bytes()).hexdigest()))
def source(name):return Image.open(HERE/f'{name}-source.png').convert('RGBA')
def box(im):return im.getchannel('A').point(lambda a:255 if a>20 else 0).getbbox()
def anim(key,image,frames,times,loop):
    packs['actors']['animations']=[a for a in packs['actors']['animations'] if a['key']!=key]+[dict(key=key,imageKey=image,frames=frames,frameMs=times,loop=loop)]

atlas=source('cast-atlas'); cast_frames={}
for row,(outfit,height) in enumerate([('cloth',84),('leather',89),('iron',87)]):
    frames=[atlas.crop((round(col*atlas.width/4),round(row*atlas.height/3),round((col+1)*atlas.width/4),round((row+1)*atlas.height/3))) for col in range(4)]
    boxes=[box(f) for f in frames]; top=min(b[1] for b in boxes); bottom=max(b[3] for b in boxes); scale=height/(bottom-top)
    sheet=Image.new('RGBA',(512,128));cast_frames[outfit]=[]
    for col,(frame,b) in enumerate(zip(frames,boxes)):
        piece=resize(frame.crop(b),(max(1,round((b[2]-b[0])*scale)),max(1,round((b[3]-b[1])*scale))))
        target=Image.new('RGBA',(128,128)); target.alpha_composite(piece,(round(64+(b[0]-frame.width*.5)*scale),112-round((bottom-b[1])*scale)))
        sheet.alpha_composite(target,(col*128,0));cast_frames[outfit].append(target)
    save('actors',f'actor:mage-{outfit}',f'mage-{outfit}-cast-v1',sheet,(96,96),4)
    anim(f'mage:{outfit}:attack',f'actor:mage-{outfit}',[0,1,2,3],[100,150,80,420],False)

staffs=['starter-staff','iron-staff','steel-staff','guardian-staff','frost-tide-staff','sunwell-oathstaff']
atlas=source('staff-clean-atlas')
for i,name in enumerate(staffs):
    cell=atlas.crop((round(i*atlas.width/6),0,round((i+1)*atlas.width/6),atlas.height)); b=box(cell); piece=cell.crop(b)
    piece=resize(piece,(max(1,round(piece.width*120/piece.height)),120))
    frame=Image.new('RGBA',(64,128));frame.alpha_composite(piece,((64-piece.width)//2,4))
    save('actors','equip:'+name,'equip-'+name+'-v1',frame,(28,56),pivot=(.5,.63))
    icon=Image.new('RGBA',(64,64)); piece=resize(cell.crop(b),(max(1,round((b[2]-b[0])*56/(b[3]-b[1]))),56))
    icon.alpha_composite(piece,((64-piece.width)//2,4)); save('interface','item:'+name,'item-'+name+'-v1',icon,(32,32),pivot=(.5,.5))

atlas=source('skill-atlas')
ids=['wand-basic','mage-mana-bolt','mage-frost-ring','mage-blink','mage-mana-affinity','mage-rune-study']
for i,name in enumerate(ids):
    cell=atlas.crop((round(i*atlas.width/6),0,round((i+1)*atlas.width/6),atlas.height));b=box(cell)
    save('interface','skill:'+name,'skill-'+name+'-v1',resize(cell.crop(b),(96,96)),(32,32),pivot=(.5,.5))

mentor=source('mentor'); b=box(mentor);piece=mentor.crop(b);piece=resize(piece,(round(piece.width*138/piece.height),138))
frame=Image.new('RGBA',(128,160));frame.alpha_composite(piece,((128-piece.width)//2,150-piece.height))
save('actors','actor:mage-mentor','mage-mentor-v1',frame,(76.8,96))
anim('npc:mage-mentor:idle','actor:mage-mentor',[0,0],[350,350],True)
head=mentor.crop((b[0],b[1],b[2],b[1]+round((b[3]-b[1])*.55)))
head.thumbnail((192,192),Image.Resampling.LANCZOS)
save('interface','portrait:mage-mentor','portrait-mage-mentor-v1',head,(96,96),pivot=(.5,.5))
save('interface','portrait:mage','portrait-mage-v1',resize(cast_frames['cloth'][1].crop((24,22,102,100)),(192,192)),(96,96),pivot=(.5,.5))

for pack,manifest in packs.items():(PUBLIC/f'assets/{pack}/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
path=PUBLIC/'assets/actors/anchors.json';anchors=json.loads(path.read_text(encoding='utf8'))
anchors['casting']={'version':1,'cast':{outfit:[dict(hand={'x':41,'y':61,'rotationDeg':0},head={'x':49,'y':29}) for _ in range(4)] for outfit in cast_frames}}
path.write_text(json.dumps(anchors,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(HERE/'export-report.json').write_text(json.dumps(records,indent=2)+'\n',encoding='utf8')
review=Image.new('RGB',(960,480),'#243c47')
for row,outfit in enumerate(cast_frames):
    for col,frame in enumerate(cast_frames[outfit]):
        piece=resize(frame,(192,192));review.paste(piece,(col*240,row*150-15),piece)
review.save(OUT/'cast-review.jpg',quality=72)
props=Image.new('RGB',(840,170),'#243c47')
for i,name in enumerate(staffs):
    piece=Image.open(PUBLIC/f'assets/actors/equip-{name}-v1.png').convert('RGBA');props.paste(piece,(i*140+40,20),piece)
props.save(OUT/'staff-review.jpg',quality=72)
print(f'Exported {len(records)} mage runtime assets; original alpha retained')
