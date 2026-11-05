"""Capture the beta.63 baseline and compact ImageGen edit references."""
import hashlib
import json
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = ROOT / 'output/quality-pass3-20261105'
OUT.mkdir(parents=True, exist_ok=True)

def reference(source, name, maximum=(1200, 1200)):
    image = Image.open(ROOT / source).convert('RGBA')
    image.thumbnail(maximum, Image.Resampling.LANCZOS)
    background = Image.new('RGB', image.size, '#36434b')
    background.paste(image, (0, 0), image)
    background.save(HERE / name, quality=72)

for pack in ('actors', 'environment'):
    target = HERE / f'{pack}-manifest-before.json'
    if not target.exists():
        target.write_bytes((ROOT / f'public/assets/{pack}/manifest.json').read_bytes())
paths = ['src/content/world/maps.ts', 'src/content/rules/monsters.ts', 'src/domain/actors/index.ts',
         'src/main.ts', 'public/playroom-sdk.js']
baseline = {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest() for name in paths if (ROOT / name).exists()}
target = HERE / 'baseline.json'
if not target.exists(): target.write_text(json.dumps(baseline, indent=2), encoding='utf-8')
reference('art-source/environment/env-tile-ground-v1.png', 'ground-reference.jpg')
reference('art-source/terrain-biomes-20261105/mine-platform-generated.png', 'platform-reference.jpg', (1200, 400))
reference('art-source/terrain-biomes-20261105/ridge-rope-generated.png', 'rope-reference.jpg')

manifest = json.loads((HERE / 'actors-manifest-before.json').read_text(encoding='utf-8'))
entry = next(a for a in manifest['images'] if a['key'] == 'actor:frost-tide-warden')
atlas = Image.open(ROOT / 'public' / entry['url']).convert('RGBA')
indices = [0, 1, 12, 14]
target = Image.new('RGBA', (1088, 1088))
for i, index in enumerate(indices):
    x, y = index % 6 * 272, index // 6 * 272
    cell = atlas.crop((x, y, x + 272, y + 272)).resize((544, 544), Image.Resampling.NEAREST)
    target.paste(cell, (i % 2 * 544, i // 2 * 544))
target.save(HERE / 'warden-edit-target.png')
review = Image.new('RGB', target.size, '#36434b')
review.paste(target, (0, 0), target)
review.save(HERE / 'warden-edit-target-review.jpg', quality=72)
(HERE / 'warden-sample-frames.json').write_text(json.dumps(indices), encoding='utf-8')
print('Saved immutable baseline and four compact edit references.')
