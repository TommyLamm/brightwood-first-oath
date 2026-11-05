"""Capture beta.65 and prepare small, composited artwork references."""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = ROOT / 'output/quality-pass5-20261105'
OUT.mkdir(parents=True, exist_ok=True)
for pack in ('actors', 'environment'):
    target = HERE / f'{pack}-manifest-before.json'
    if not target.exists(): target.write_bytes((ROOT / f'public/assets/{pack}/manifest.json').read_bytes())
paths = ['src/content/world/maps.ts', 'src/content/rules/monsters.ts', 'src/domain/actors/index.ts',
         'src/main.ts', 'public/assets/actors/manifest.json', 'public/playroom-sdk.js']
baseline = {p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in paths if (ROOT / p).exists()}
target = HERE / 'baseline.json'
if not target.exists(): target.write_text(json.dumps(baseline, indent=2), encoding='utf-8')

def reference(path, name):
    im = Image.open(ROOT / path).convert('RGBA')
    im.thumbnail((1200, 1000), Image.Resampling.LANCZOS)
    bg = Image.new('RGB', im.size, '#46515b')
    bg.paste(im, (0, 0), im)
    bg.save(HERE / f'{name}-reference.jpg', quality=72)

for name, path in {
    'ground': 'public/assets/environment/env-tile-ground-v1.png',
    'platform': 'art-source/quality-pass4-20261105/cave-platform-generated.png',
    'rope': 'art-source/quality-pass3-20261105/snow-rope-generated.png',
    'chain': 'art-source/quality-pass4-20261105/cave-chain-generated.png',
    'ladder': 'art-source/terrain-biomes-20261105/mine-ladder-generated.png',
}.items(): reference(path, name)

manifest = json.loads((HERE / 'environment-manifest-before.json').read_text(encoding='utf-8'))
for theme in ('forest', 'rock', 'frost', 'ruins-gallery'):
    entry = next(e for e in manifest['images'] if e['key'] == f'env:{theme}:mid')
    reference('public/' + entry['url'], f'{theme}-mid')
    # Native composition reference, transparency preserved; preview above is the inspection image.
    Image.open(ROOT / 'public' / entry['url']).save(HERE / f'{theme}-mid-target.png')
print('Captured beta.65 contracts and material/midground references.')
