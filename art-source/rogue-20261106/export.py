"""Technical crop/resample only; retain generated alpha and archive original sources."""
from pathlib import Path
from PIL import Image
import json, hashlib
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
PUBLIC=ROOT/'public'
packs={p:json.loads((PUBLIC/f'assets/{p}/manifest.json').read_text(encoding='utf8')) for p in ['actors','interface']}
records=[]
def resize(im,size): return im.convert('RGBa').resize(size,Image.Resampling.LANCZOS).convert('RGBA')
def box(im): return im.getchannel('A').point(lambda a:255 if a>20 else 0).getbbox()
def save(pack,key,name,im,display,pivot=(.5,.5)):
    url=f'assets/{pack}/{name}.png';im.save(PUBLIC/url,optimize=True)
    entry=dict(key=key,url=url,columns=1,rows=1,displayWidth=display[0],displayHeight=display[1],pivotX=pivot[0],pivotY=pivot[1])
    packs[pack]['images']=[x for x in packs[pack]['images'] if x['key']!=key]+[entry]
    records.append(dict(key=key,url=url,size=im.size,sha256=hashlib.sha256((PUBLIC/url).read_bytes()).hexdigest()))
daggers=['starter-dagger','iron-dagger','steel-dagger','guardian-dagger','frost-tide-dagger','sunwell-oathdagger']
atlas=Image.open(HERE/'dagger-source.png').convert('RGBA')
for i,name in enumerate(daggers):
    cell=atlas.crop((round(i*atlas.width/6),0,round((i+1)*atlas.width/6),atlas.height));piece=cell.crop(box(cell))
    piece=resize(piece,(round(piece.width*96/piece.height),96))
    frame=Image.new('RGBA',(80,112));frame.alpha_composite(piece,((80-piece.width)//2,8))
    save('actors','equip:'+name,'equip-'+name+'-v1',frame,(25,35),pivot=(.5,.8))
    icon=Image.new('RGBA',(64,64));piece=resize(piece,(round(piece.width*54/piece.height),54));icon.alpha_composite(piece,((64-piece.width)//2,5))
    save('interface','item:'+name,'item-'+name+'-v1',icon,(32,32))
atlas=Image.open(HERE/'skill-source.png').convert('RGBA')
for i,name in enumerate(['dagger-basic','rogue-double-stab','rogue-shadow-lunge','rogue-smoke','rogue-dagger-mastery','rogue-combo-rhythm']):
    # Crop only the painted square panels, excluding the generated gutter texture.
    cell=atlas.crop((round((i+0.055)*atlas.width/6),round(atlas.height*.278),round((i+.985)*atlas.width/6),round(atlas.height*.735)))
    save('interface','skill:'+name,'skill-'+name+'-v1',resize(cell,(96,96)),(32,32))
mentor=Image.open(HERE/'mentor-source.png').convert('RGBA');b=box(mentor);piece=mentor.crop(b)
piece=resize(piece,(round(piece.width*138/piece.height),138));frame=Image.new('RGBA',(128,160));frame.alpha_composite(piece,((128-piece.width)//2,150-piece.height))
save('actors','actor:rogue-mentor','rogue-mentor-v1',frame,(76.8,96),pivot=(.5,1))
packs['actors']['animations']=[a for a in packs['actors']['animations'] if a['key']!='npc:rogue-mentor:idle']+[dict(key='npc:rogue-mentor:idle',imageKey='actor:rogue-mentor',frames=[0,0],frameMs=[350,350],loop=True)]
head=mentor.crop((b[0],b[1],b[2],b[1]+round((b[3]-b[1])*.49)));head.thumbnail((192,192),Image.Resampling.LANCZOS)
save('interface','portrait:rogue-mentor','portrait-rogue-mentor-v1',head,(96,96))
for pack,manifest in packs.items(): (PUBLIC/f'assets/{pack}/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(HERE/'export-report.json').write_text(json.dumps(records,indent=2)+'\n',encoding='utf8')
review=Image.new('RGB',(960,300),'#263b45')
for i,name in enumerate(daggers):
    im=Image.open(PUBLIC/f'assets/actors/equip-{name}-v1.png').convert('RGBA');review.paste(im,(i*140+30,10),im)
for i,name in enumerate(['dagger-basic','rogue-double-stab','rogue-shadow-lunge','rogue-smoke','rogue-dagger-mastery','rogue-combo-rhythm']):
    im=Image.open(PUBLIC/f'assets/interface/skill-{name}-v1.png').convert('RGBA');review.paste(im,(i*140+20,160),im)
review.save(ROOT/'output/rogue-20261106/assets-review.jpg',quality=72)
print(f'Exported {len(records)} rogue PNG assets')
