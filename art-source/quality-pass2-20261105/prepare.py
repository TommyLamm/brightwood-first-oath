"""Extract unchanged edit targets and compact reference sheets; no artwork is drawn."""
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = ROOT / 'output/quality-pass2-20261105'
OUT.mkdir(parents=True, exist_ok=True)
for group in ('actors', 'environment'):
    path = HERE / f'{group}-manifest-before.json'
    if not path.exists():
        path.write_bytes((ROOT / f'public/assets/{group}/manifest.json').read_bytes())
actors = json.loads((HERE / 'actors-manifest-before.json').read_text(encoding='utf-8'))
entries = {item['key']: item for item in actors['images']}
review = Image.new('RGB', (1152, 672), '#34454d')
draw = ImageDraw.Draw(review)
records = []
for row, outfit in enumerate(('cloth', 'leather', 'iron')):
    entry = entries[f'actor:hero-{outfit}']
    path = ROOT / 'public' / entry['url']
    atlas = Image.open(path).convert('RGBA')
    assert atlas.size == (1536, 1536)
    sheet = Image.new('RGBA', (576, 384))
    draw.text((8, row * 224 + 6), outfit + ': original six attack frames, 1080-equivalent size', fill='white')
    for i in range(6):
        pose = atlas.crop((i * 192, 768, (i + 1) * 192, 960))
        sheet.paste(pose, (i % 3 * 192, i // 3 * 192))
        review.paste(pose, (i * 192, row * 224 + 28), pose)
    if outfit != 'cloth':
        sheet.save(HERE / f'{outfit}-attack-edit-target.png')
    records.append({'outfit': outfit, 'url': entry['url'], 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
review.save(OUT / 'attack-baseline-review.jpg', quality=73)
env = json.loads((HERE / 'environment-manifest-before.json').read_text(encoding='utf-8'))
for theme, climb in (('forest', 'vine'), ('mine', 'ladder')):
    sheet = Image.new('RGBA', (768, 384))
    for i, key in enumerate((f'env:{theme}:platform', f'env:{theme}:{climb}')):
        entry = next(e for e in env['images'] if e['key'] == key)
        image = Image.open(ROOT / 'public' / entry['url']).convert('RGBA')
        sheet.paste(image, (32, 40 + i * 160))
    sheet.save(HERE / f'{theme}-style-reference.png')
    background = Image.new('RGB', sheet.size, '#34454d')
    background.paste(sheet, mask=sheet.getchannel('A'))
    background.save(OUT / f'{theme}-style-review.jpg', quality=73)
(HERE / 'baseline.json').write_text(json.dumps({'version': '1.0.0-beta.62', 'actors': records,
    'worldMapsSha256': hashlib.sha256((ROOT / 'src/content/world/maps.ts').read_bytes()).hexdigest(),
    'actorRulesSha256': hashlib.sha256((ROOT / 'src/domain/actors/index.ts').read_bytes()).hexdigest()}, indent=2) + '\n', encoding='utf-8')
print('Prepared six-frame edit targets, two environment references and baseline fingerprints.')
