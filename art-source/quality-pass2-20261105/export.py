"""Technical alpha cleanup, source cropping, resampling and atlas packing only.

All artwork comes from the retained built-in ImageGen outputs. Run from repo root.
"""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
PUBLIC = ROOT / 'public'
OUT = ROOT / 'output/quality-pass2-20261105'
before = {group: json.loads((HERE / f'{group}-manifest-before.json').read_text(encoding='utf-8'))
          for group in ('actors', 'environment')}
manifests = {group: json.loads((PUBLIC / f'assets/{group}/manifest.json').read_text(encoding='utf-8'))
             for group in before}
records = []

def opened(path):
    return Image.open(path).convert('RGBA')

def clean(im, threshold=8):
    pixels = np.array(im)
    pixels[pixels[:, :, 3] <= threshold] = 0
    return Image.fromarray(pixels)

def bounds(im):
    return im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()

def resize(im, size):
    return clean(im.convert('RGBa').resize(size, Image.Resampling.LANCZOS).convert('RGBA'))

def save(group, entry, image, source_path, previous=None, **extra):
    path = PUBLIC / entry['url']
    image.save(path, optimize=True)
    assert image.getchannel('A').getextrema()[0] == 0
    old = opened(PUBLIC / previous['url']) if previous else None
    records.append({'key': entry['key'], 'url': entry['url'], 'size': list(image.size),
        'bytes': path.stat().st_size, 'decodedBytes': image.width * image.height * 4,
        'previousUrl': previous['url'] if previous else None,
        'previousBytes': (PUBLIC / previous['url']).stat().st_size if previous else 0,
        'previousDecodedBytes': old.width * old.height * 4 if old else 0,
        'source': source_path.relative_to(ROOT).as_posix(),
        'sourceSha256': hashlib.sha256(source_path.read_bytes()).hexdigest(),
        'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), **extra})

review = Image.new('RGB', (1152, 888), '#34454d')
draw = ImageDraw.Draw(review)
for outfit_row, outfit in enumerate(('leather', 'iron')):
    previous = next(e for e in before['actors']['images'] if e['key'] == f'actor:hero-{outfit}')
    entry = next(e for e in manifests['actors']['images'] if e['key'] == previous['key'])
    original = opened(PUBLIC / previous['url'])
    assert original.size == (1536, 1536)
    atlas = original.copy()
    source_path = HERE / f'{outfit}-generated.png'
    source = opened(source_path)
    assert source.width % 3 == source.height % 2 == 0
    sw, sh = source.width // 3, source.height // 2
    geometry = []
    for i in range(6):
        old = original.crop((i * 192, 768, (i + 1) * 192, 960))
        box = bounds(old)
        cell = clean(source.crop((i % 3 * sw, i // 3 * sh, (i % 3 + 1) * sw, (i // 3 + 1) * sh)), 64)
        source_box = bounds(cell)
        assert box and source_box
        pose = resize(cell.crop(source_box), (box[2] - box[0], box[3] - box[1]))
        frame = Image.new('RGBA', (192, 192))
        frame.paste(pose, box[:2])
        final_box = bounds(frame)
        delta = max(abs(a - b) / 2 for a, b in zip(box, final_box))
        assert delta <= 0.5, (outfit, i, box, final_box)
        atlas.paste(frame, (i * 192, 768))
        geometry.append({'frame': 32 + i, 'oldBounds': box, 'newBounds': final_box, 'maxLogicalDelta': delta})
        for j, image in enumerate((old, frame)):
            y = outfit_row * 444 + j * 216
            draw.text((8, y + 4), outfit + (' before' if j == 0 else ' after'), fill='white')
            review.paste(image, (i * 192, y + 24), image)
    old_pixels, new_pixels = np.array(original), np.array(atlas)
    changed = list(range(32, 38))
    for index in range(64):
        x, y = index % 8 * 192, index // 8 * 192
        if index not in changed:
            assert np.array_equal(old_pixels[y:y + 192, x:x + 192], new_pixels[y:y + 192, x:x + 192])
    entry['url'] = f'assets/actors/hero-{outfit}-v9-clarity-v2.png'
    save('actors', entry, atlas, source_path, previous, changedFrames=changed,
         unchangedFrameCount=58, geometry=geometry)
review.save(OUT / 'attack-comparison-review.jpg', quality=73)

# Each source quadrant is one authored component. Export logical 64-square frames
# with common attachment bands: cap 32px, repeat 32px, foot 24px, climb tie 28px.
decor_review = Image.new('RGB', (1024, 256), '#34454d')
for theme_row, theme in enumerate(('forest', 'mine')):
    source_path = HERE / f'{theme}-generated.png'
    source = opened(source_path)
    sheet = Image.new('RGBA', (512, 128))
    for index in range(4):
        w, h = source.width // 2, source.height // 2
        cell = clean(source.crop((index % 2 * w, index // 2 * h,
                                  (index % 2 + 1) * w, (index // 2 + 1) * h)), 32)
        box = bounds(cell)
        assert box
        component = cell.crop(box)
        if index == 0:  # retain the fork / diagonal braces, omit long lower stem
            component = component.crop((0, 0, component.width, round(component.height * 0.7)))
            target = (0, 0, 128, 64)
        elif index == 1:
            target = (52, 0, 76, 64)
        elif index == 2:
            component = component.crop((0, round(component.height * 0.55), component.width, component.height))
            target = (0, 0, 128, 48) if theme == 'forest' else (40, 0, 88, 48)
        else:
            if theme == 'forest':
                component = component.crop((0, 0, component.width, round(component.height * 0.55)))
            target = (32, 0, 96, 56) if theme == 'forest' else (16, 0, 112, 32)
        frame = Image.new('RGBA', (128, 128))
        frame.paste(resize(component, (target[2] - target[0], target[3] - target[1])), target[:2])
        assert bounds(frame)
        sheet.paste(frame, (index * 128, 0))
        decor_review.paste(frame, (index * 256 + 64, theme_row * 128), frame)
    entry = {'key': f'env:{theme}:supports', 'url': f'assets/environment/env-{theme}-supports-v1.png',
        'columns': 4, 'rows': 1, 'displayWidth': 64, 'displayHeight': 64, 'pivotX': 0, 'pivotY': 0}
    current = next((e for e in manifests['environment']['images'] if e['key'] == entry['key']), None)
    if current:
        assert current == entry
    else:
        manifests['environment']['images'].append(entry)
    save('environment', entry, sheet, source_path, frameBands={'cap': 32, 'body': 32, 'foot': 24, 'tie': 28})
decor_review.save(OUT / 'support-atlas-review.jpg', quality=73)

for group, manifest in manifests.items():
    assert manifest['animations'] == before[group]['animations']
    assert manifest['audio'] == before[group]['audio']
    for old in before[group]['images']:
        new = next(e for e in manifest['images'] if e['key'] == old['key'])
        if old['key'] not in ('actor:hero-leather', 'actor:hero-iron'):
            assert new == old
        else:
            assert {k: v for k, v in new.items() if k != 'url'} == {k: v for k, v in old.items() if k != 'url'}
    (PUBLIC / f'assets/{group}/manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
baseline = json.loads((HERE / 'baseline.json').read_text())
for key, path in (('worldMapsSha256', 'src/content/world/maps.ts'), ('actorRulesSha256', 'src/domain/actors/index.ts')):
    assert hashlib.sha256((ROOT / path).read_bytes()).hexdigest() == baseline[key]
report = {'records': records, 'compressedBytesDelta': sum(r['bytes'] - r['previousBytes'] for r in records),
    'newRuntimeFileBytes': sum(r['bytes'] for r in records),
    'decodedBytesDelta': sum(r['decodedBytes'] - r['previousDecodedBytes'] for r in records),
    'worldAndActorRulesUnchanged': True, 'animationContractsUnchanged': True}
(HERE / 'export-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'assets': len(records), 'activeHeroFrames': 12, 'unchangedFramesPerOutfit': 58,
                  'compressedBytesDelta': report['compressedBytesDelta'], 'decodedBytesDelta': report['decodedBytesDelta']}))
