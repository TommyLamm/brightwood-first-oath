"""Retain beta.64 contracts and prepare compact pose/material edit references."""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = ROOT / 'output/quality-pass4-20261105'
OUT.mkdir(parents=True, exist_ok=True)
for pack in ('actors', 'environment'):
    path = HERE / f'{pack}-manifest-before.json'
    if not path.exists(): path.write_bytes((ROOT / f'public/assets/{pack}/manifest.json').read_bytes())
paths = ['src/content/world/maps.ts', 'src/content/rules/monsters.ts', 'src/domain/actors/index.ts',
         'src/main.ts', 'src/render/index.ts', 'src/app/assets.ts']
baseline = {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest() for name in paths}
path = HERE / 'baseline.json'
if not path.exists(): path.write_text(json.dumps(baseline, indent=2), encoding='utf-8')

def reference(source, name):
    image = Image.open(ROOT / source).convert('RGBA')
    image.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
    review = Image.new('RGB', image.size, '#36434b')
    review.paste(image, (0, 0), image)
    review.save(HERE / name, quality=72)

reference('art-source/quality-pass3-20261105/snow-ground-generated.png', 'cave-ground-reference.jpg')
reference('art-source/quality-pass3-20261105/snow-platform-generated.png', 'cave-platform-reference.jpg')
reference('art-source/quality-pass3-20261105/snow-rope-generated.png', 'cave-chain-reference.jpg')
reference('art-source/quality-pass3-20261105/warden-sample-generated.png', 'warden-style-reference.jpg')
manifest = json.loads((HERE / 'actors-manifest-before.json').read_text(encoding='utf-8'))
entry = next(a for a in manifest['images'] if a['key'] == 'actor:frost-tide-warden')
atlas = Image.open(ROOT / 'public' / entry['url']).convert('RGBA')
groups = {'walk': [6, 7, 8, 9, 10, 11], 'action': [13, 15, 18, 19], 'dead': [24, 25, 26, 27]}
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 15)
overview = Image.new('RGB', (1200, 900), '#36434b')
draw = ImageDraw.Draw(overview)
for group_index, (name, indices) in enumerate(groups.items()):
    columns = 3 if name == 'walk' else 2
    target = Image.new('RGBA', (columns * 384, 768))
    for index, frame in enumerate(indices):
        x, y = frame % 6 * 272, frame // 6 * 272
        cell = atlas.crop((x, y, x + 272, y + 272))
        target.paste(cell.resize((384, 384), Image.Resampling.NEAREST), (index % columns * 384, index // columns * 384))
        # Overview is a smaller diagnostic strip, not a live game screenshot.
        thumb = cell.resize((192, 192), Image.Resampling.NEAREST)
        xx, yy = index * 200, group_index * 300
        draw.text((xx + 4, yy + 4), name + ' frame ' + str(frame), font=font, fill='white')
        overview.paste(thumb, (xx + 4, yy + 50), thumb)
    target.save(HERE / f'warden-{name}-target.png')
    review = Image.new('RGB', target.size, '#36434b')
    review.paste(target, (0, 0), target)
    review.save(HERE / f'warden-{name}-target-review.jpg', quality=72)
overview.save(OUT / 'warden-remaining-baseline.jpg', quality=72)
(HERE / 'pose-groups.json').write_text(json.dumps(groups, indent=2), encoding='utf-8')
print('Captured beta.64 baseline and remaining 14 unique poses.')
