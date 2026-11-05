"""Re-export retained ImageGen art with native detail and unchanged game geometry.

No poses are drawn by code. Technical alpha cleanup and atlas packing follow the
project's existing recovery exporters; original generated PNGs remain untouched.
"""
from pathlib import Path
import sys
import ast
import hashlib
import importlib.util
import json
import re

sys.dont_write_bytecode = True

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
PUBLIC = ROOT / 'public'
MANIFEST = PUBLIC / 'assets/actors/manifest.json'
BEFORE = HERE / 'manifest-before.json'
if not BEFORE.exists():
    BEFORE.write_bytes(MANIFEST.read_bytes())
manifest = json.loads(BEFORE.read_text(encoding='utf-8'))
images = {image['key']: image for image in manifest['images']}
records = []


def module(name, relative):
    spec = importlib.util.spec_from_file_location(name, ROOT / relative)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def opened(path):
    with Image.open(path) as image:
        return image.convert('RGBA')


def clean(image, threshold=8, hero=False, components=False):
    pixels = np.array(image)
    alpha = pixels[:, :, 3]
    if hero:
        # Same color-key residue rules as the accepted v9 hero recovery exporter.
        r, g, b = [pixels[:, :, i].astype(np.int32) for i in range(3)]
        residue = ((r > 175) & (r > g*1.8) & (r > b*1.8) & (g < 95))
        residue |= ((g > 100) & (g > r*1.55) & (g > b*1.5))
        residue |= ((r > 150) & (g > 150) & (b < 100) & (abs(r-g) < 70))
        alpha[residue] = 0
    alpha[alpha <= threshold] = 0
    pixels[alpha == 0] = 0
    result = Image.fromarray(pixels)
    return hero_export.retain_character(result) if components else result


def strip(path, columns, rows=1, threshold=8):
    image = opened(path)
    return [(clean(image.crop((c*image.width//columns, r*image.height//rows,
                               (c+1)*image.width//columns, (r+1)*image.height//rows)), threshold), path)
            for r in range(rows) for c in range(columns)]


def pack(key, sources, kind='retained-source'):
    entry = images[key]
    previous_url = entry['url']
    old = opened(PUBLIC / previous_url)
    cols, rows = entry['columns'], entry['rows']
    old_w, old_h = old.width//cols, old.height//rows
    new_w, new_h = max(old_w,entry['displayWidth']*2), max(old_h,entry['displayHeight']*2)
    atlas = Image.new('RGBA', (cols*new_w, rows*new_h))
    geometry = []
    for index in range(cols*rows):
        col, row = index%cols, index//cols
        old_frame = old.crop((col*old_w, row*old_h, (col+1)*old_w, (row+1)*old_h))
        bounds = old_frame.getchannel('A').point(lambda a:255 if a>8 else 0).getbbox()
        source, source_path = sources[index]
        hard = source.getchannel('A').point(lambda a:255 if a>8 else 0).getbbox()
        if not bounds or not hard:
            raise ValueError(f'{key} empty pose {index}')
        dest = (round(bounds[0]*new_w/old_w), round(bounds[1]*new_h/old_h),
                round(bounds[2]*new_w/old_w), round(bounds[3]*new_h/old_h))
        pose = source.crop(hard).resize((dest[2]-dest[0], dest[3]-dest[1]), Image.Resampling.LANCZOS)
        pose = clean(pose)
        atlas.paste(pose, (col*new_w+dest[0], row*new_h+dest[1]))
        geometry.append({'frame':index, 'oldBounds':bounds, 'newBounds':dest,
                         'source':Path(source_path).relative_to(ROOT).as_posix(), 'sourceBounds':hard})
    destination = Path(previous_url).with_name(Path(previous_url).stem+'-clarity-v1.png')
    atlas.save(PUBLIC / destination, optimize=True)
    entry['url'] = destination.as_posix()
    source_paths = sorted(set(str(path) for _,path in sources.values()))
    records.append({'key':key, 'method':kind, 'previousUrl':previous_url, 'url':entry['url'],
                    'oldFrame':[old_w,old_h], 'newFrame':[new_w,new_h], 'display':[entry['displayWidth'],entry['displayHeight']],
                    'bytes':(PUBLIC/destination).stat().st_size,
                    'sources':[{'path':Path(p).relative_to(ROOT).as_posix(),
                                'sha256':hashlib.sha256(Path(p).read_bytes()).hexdigest()} for p in source_paths],
                    'frames':geometry})
    print(f'{key}: {old_w}x{old_h} -> {new_w}x{new_h}', flush=True)


def equal_sources(path, columns, rows=1, counts=None, threshold=8):
    poses = strip(path, columns, rows, threshold)
    return {r*columns+c:poses[r*columns+min(c,(counts[r]-1) if counts else c)]
            for r in range(rows) for c in range(columns)}


# Newly generated detailed hero artwork. Match the existing per-frame normalized
# silhouette bounds, retaining the v9 anchors' original 128px measurement space.
hero_export = module('hero_export', 'art-source/actors/hero/export_hero_v9.py')
counts = [4,6,2,4,6,2,4,4]
for outfit in ['cloth','leather','iron']:
    path = HERE / f'hero-{outfit}-candidate-1.png'
    image = clean(opened(path), 159, True)
    mask = np.array(image.getchannel('A')) > 0
    ycuts = hero_export.separators(mask.sum(axis=1))
    sources = {}
    for row, count in enumerate(counts):
        xcuts = hero_export.separators(mask[ycuts[row]:ycuts[row+1]].sum(axis=0))
        for col in range(8):
            source_col = min(col,count-1)
            pose = clean(image.crop((xcuts[source_col],ycuts[row],xcuts[source_col+1],ycuts[row+1])),0,True,True)
            sources[row*8+col] = (pose,path)
    pack('actor:hero-'+outfit,sources,'new-ImageGen-art')

# Recover source detail removed by the old 48px / 32-color creature export.
creatures = module('creature_export', 'art-source/actors/recovery-creatures-export.py')
for ident, attempt in creatures.CONFIG:
    path = ROOT / f'art-source/actors/monsters/{ident}/{ident}-atlas-attempt-{attempt}.png'
    poses, _ = creatures.extract(path,6,5)
    if ident == 'guardian':
        poses = [pose.transpose(Image.Transpose.FLIP_LEFT_RIGHT) for pose in poses]
    sources = {r*6+c:(poses[r*6+min(c, [2,6,4,2,4][r]-1)],path) for r in range(5) for c in range(6)}
    pack('actor:'+ident,sources)
for ident, attempt in [('slime','01'),('sentinel','02')]:
    path = ROOT / f'art-source/actors/monsters/{ident}/{ident}-atlas-attempt-{attempt}.png'
    # These source poses extend beyond nominal 229px rows. Use the retained
    # exporter's transparent gutters, rather than cutting through their bodies.
    poses, _ = creatures.extract(path,6,5)
    sources = {r*6+c:(poses[r*6+min(c,[2,6,4,2,4][r]-1)],path) for r in range(5) for c in range(6)}
    pack('actor:'+ident,sources)

for key,path in [
    ('merchant','art-source/actors/npcs/merchant/merchant-idle-attempt-06.png'),
    ('sands-guide','art-source/expansion-sands/guide/sands-guide-idle-refined-v2.png'),
    ('ruins-archivist','art-source/ruins-a/actors/generated/npc-ruins-archivist-generated-v2.png'),
    ('ruins-medic','art-source/ruins-a/actors/generated/npc-ruins-medic-generated-v2.png')]:
    pack('actor:'+key,equal_sources(ROOT/path,2,threshold=127 if key=='merchant' else 8))
pathfinder = ROOT / 'art-source/ruins-b/scene-npc/raw'
pack('actor:ruins-pathfinder',{i:(clean(opened(pathfinder/f'ruins-pathfinder-idle-{i}-source.png')),pathfinder/f'ruins-pathfinder-idle-{i}-source.png') for i in range(2)})

# Source metadata retains exact accepted pose-to-cell mappings for the ruins.
ruins = ROOT / 'art-source/ruins-b'
metadata = json.loads((ruins/'assembly/monster-atlas-assembly.json').read_text(encoding='utf-8'))
for actor in metadata['atlases']:
    sources = {}
    for record in actor['frames']:
        path = ruins / record['sourceRawPath']
        pose = clean(opened(path))
        for cell in record['cells']:
            sources[cell] = (pose,path)
    pack(actor['imageKey'],sources)

moss = ROOT/'art-source/ruins-a'
sources = {}
for frame, name in re.findall(r'\| frame-(\d+) \| `(exec-[^`]+\.png)`', (moss/'motion-frames/source-log.md').read_text(encoding='utf-8')):
    path = moss/'motion-frames/raw'/name
    sources[int(frame)] = (clean(opened(path)),path)
for frame, name in re.findall(r'\| `frame-(\d+)\.png` \| `(exec-[^`]+\.png)`', (moss/'action-frames/source-log.md').read_text(encoding='utf-8')):
    path = moss/'action-frames/raw/generated-batch-a'/name
    sources[int(frame)] = (clean(opened(path)),path)
for index,last in [(i,1) for i in range(2,6)]+[(16,15),(17,15)]+[(i,19) for i in range(20,24)]+[(28,27),(29,27)]:
    sources[index] = sources[last]
pack('actor:ruins-moss-carapace',sources)

# Sand creatures and the Sunwell boss use independently authored source poses.
folder = ROOT/'art-source/expansion-sands/scorpion'
tree = ast.parse((folder/'export_scorpion_preview.py').read_text())
specs = next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='POSE_SOURCES' for t in n.targets))
poses = []
for _,filename,cols,rows,threshold in specs:
    poses += strip(folder/filename,cols,rows,threshold-1)
pack('actor:sand-scorpion',dict(enumerate(poses)))

beetle = module('beetle_export','art-source/expansion-sands/sunwell/beetle/export_atlas_v1.py')
sources = {}
for index,spec in enumerate(beetle.FRAMES):
    path = beetle.SOURCE/spec['filename']
    raw = opened(path); cw = raw.width//spec['columns']; x0,y0,x1,y1 = spec['bounds']
    pose = clean(raw.crop((spec['column']*cw+x0,y0,spec['column']*cw+x1,y1)))
    sources[index] = (pose,path)
pack('actor:sunwell-beetle',sources)

folder = ROOT/'art-source/expansion-sands/sentinel/actor'
report = json.loads((folder/'sunwell-sentinel-atlas-build-report-v1.json').read_text())
sources = {}
for record in report['frames']:
    path = ROOT/record['source']
    sources[record['index']] = (clean(opened(path),31),path)
pack('actor:sunwell-sentinel',sources)

MANIFEST.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(HERE/'export-report.json').write_text(json.dumps({'date':'2026-11-05','benchmark':'actor:ruins-bell-keeper','assets':records},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'upgraded':len(records),'bytes':sum(r['bytes'] for r in records)}))
