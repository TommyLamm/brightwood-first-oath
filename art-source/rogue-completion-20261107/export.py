"""Technical atlas crop/resample only; no semantic drawing. Preserve original alpha."""
from pathlib import Path
from PIL import Image
import json, hashlib

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
PUBLIC = ROOT / 'public'
OUT = ROOT / 'output/class-completion-20261107'
atlas = Image.open(HERE / 'dagger-atlas-source.png').convert('RGBA')
packs = {p: json.loads((PUBLIC / f'assets/{p}/manifest.json').read_text(encoding='utf8')) for p in ['actors','interface']}
records = []
frames_by_outfit = {}

def resize(im, size):
    return im.convert('RGBa').resize(size, Image.Resampling.LANCZOS).convert('RGBA')

def save(pack, key, filename, im, columns=1):
    url = f'assets/{pack}/{filename}.png'
    im.save(PUBLIC / url, optimize=True)
    entry = dict(key=key,url=url,columns=columns,rows=1,displayWidth=96,displayHeight=96,pivotX=.5,pivotY=1 if pack=='actors' else .5)
    packs[pack]['images'] = [entry0 for entry0 in packs[pack]['images'] if entry0['key'] != key] + [entry]
    records.append(dict(key=key,url=url,size=im.size,sha256=hashlib.sha256((PUBLIC/url).read_bytes()).hexdigest()))

for row, outfit in enumerate(['cloth','leather','iron']):
    cells = [atlas.crop((round(col*atlas.width/4), round(row*atlas.height/3), round((col+1)*atlas.width/4), round((row+1)*atlas.height/3))) for col in range(4)]
    boxes = [cell.getchannel('A').point(lambda a: 255 if a > 20 else 0).getbbox() for cell in cells]
    top = min(b[1] for b in boxes); bottom = max(b[3] for b in boxes); scale = 84/(bottom-top)
    sheet = Image.new('RGBA',(512,128)); frames = []
    for col,(cell,b) in enumerate(zip(cells,boxes)):
        piece = resize(cell.crop(b),(round((b[2]-b[0])*scale),round((b[3]-b[1])*scale)))
        frame = Image.new('RGBA',(128,128))
        frame.alpha_composite(piece,(round(64+(b[0]-cell.width/2)*scale),112-round((bottom-b[1])*scale)))
        sheet.alpha_composite(frame,(col*128,0)); frames.append(frame)
    frames_by_outfit[outfit] = frames
    key = f'actor:rogue-{outfit}'
    save('actors',key,f'rogue-{outfit}-stab-v1',sheet,4)
    animkey = f'rogue:{outfit}:attack'
    packs['actors']['animations'] = [a for a in packs['actors']['animations'] if a['key'] != animkey] + [dict(key=animkey,imageKey=key,frames=[0,1,2,3],frameMs=[110,80,80,150],loop=False)]

save('interface','portrait:rogue','portrait-rogue-v1',resize(frames_by_outfit['cloth'][0].crop((30,22,102,93)),(192,192)))
aliases = {'guardian-rally':'iron-guard','berserker-flurry':'sweep','marksman-snipe':'archer-piercing-shot','ranger-volley':'archer-retreat-shot','elementalist-nova':'mage-frost-ring','arcanist-siphon':'mage-mana-bolt','shadowblade-venom':'rogue-shadow-lunge','thrower-shuriken':'rogue-double-stab'}
for target, source in aliases.items():
    existing = next(i for i in packs['interface']['images'] if i['key'] == 'skill:'+source)
    packs['interface']['images'] = [i for i in packs['interface']['images'] if i['key'] != 'skill:'+target] + [{**existing,'key':'skill:'+target}]

for pack, manifest in packs.items():
    (PUBLIC/f'assets/{pack}/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
path = PUBLIC/'assets/actors/anchors.json'
anchors = json.loads(path.read_text(encoding='utf8'))
# Hands measured in the exported 96px coordinate space, not the high-resolution source.
hands = [(50,66,-30),(59,67,-55),(64,51,-70),(53,58,-25)]
anchors['dagger'] = {'version':1,'cast':{outfit:[dict(hand=dict(x=x,y=y,rotationDeg=angle),head=dict(x=49,y=31)) for x,y,angle in hands] for outfit in frames_by_outfit}}
path.write_text(json.dumps(anchors,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(HERE/'export-report.json').write_text(json.dumps(records,indent=2)+'\n',encoding='utf8')
review=Image.new('RGB',(1024,384),'#243c47')
for row,outfit in enumerate(frames_by_outfit):
    for col,frame in enumerate(frames_by_outfit[outfit]):
        piece=resize(frame,(192,192));review.paste(piece,(col*256,row*128-48),piece)
review.save(OUT/'rogue-art-review.jpg',quality=72)
print(f'Exported {len(records)} rogue assets and {len(aliases)} existing-icon aliases')
