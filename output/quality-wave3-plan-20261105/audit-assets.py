"""Offline planning evidence; reads current manifests, never changes runtime art."""
import csv
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageStat

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
FONT = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 17)
SMALL = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 14)
assets = {}
animations = {}
rows = []
for pack in ('actors', 'environment', 'interface'):
    manifest_path = ROOT / 'public/assets' / pack / 'manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    animations.update({a['key']: a for a in manifest['animations']})
    for item in manifest['images']:
        path = ROOT / 'public' / item['url']
        with Image.open(path) as image:
            width, height = image.size
            fw, fh = width // item['columns'], height // item['rows']
            first = image.convert('RGBA').crop((0, 0, fw, fh))
            bounds = first.getchannel('A').getbbox()
            opaque_bounds = first.getchannel('A').point(lambda v: 255 if v >= 128 else 0).getbbox()
        row = dict(pack=pack, **item, width=width, height=height,
                   frameWidth=fw, frameHeight=fh,
                   densityX=fw / item['displayWidth'], densityY=fh / item['displayHeight'],
                   firstFrameAlphaBounds=bounds, firstFrameAlpha128Bounds=opaque_bounds, bytes=path.stat().st_size,
                   decodedRGBABytes=width * height * 4,
                   sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                   integralGrid=width % item['columns'] == 0 and height % item['rows'] == 0)
        rows.append(row)
        assets[item['key']] = row

report = {'baseline': '1.0.0-beta.63', 'date': '2026-11-05 Asia/Hong_Kong',
          'scope': 'Manifest registrations, not per-map live use; see map-usage.json and plan.',
          'densityMeaning': 'Source frame pixels / manifest logical display. Background overrides and DOM CSS require separate interpretation.',
          'assets': rows}
(OUT / 'asset-audit.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
fields = ['pack', 'key', 'url', 'width', 'height', 'frameWidth', 'frameHeight', 'displayWidth', 'displayHeight', 'densityX', 'densityY', 'bytes', 'decodedRGBABytes', 'sha256']
with (OUT / 'asset-audit.csv').open('w', encoding='utf-8-sig', newline='') as stream:
    writer = csv.DictWriter(stream, fieldnames=fields, extrasaction='ignore')
    writer.writeheader()
    writer.writerows(rows)

def frame(key, index=0):
    a = assets[key]
    with Image.open(ROOT / 'public' / a['url']) as image:
        x, y = index % a['columns'] * a['frameWidth'], index // a['columns'] * a['frameHeight']
        return image.convert('RGBA').crop((x, y, x + a['frameWidth'], y + a['frameHeight']))

def paste_frame(sheet, key, index, x, y):
    a = assets[key]
    img = frame(key, index).resize((a['displayWidth'] * 2, a['displayHeight'] * 2), Image.Resampling.NEAREST)
    sheet.paste(img, (x, y), img)

# Each boss keeps its production 384x384 screen frame at the 1080p baseline.
sheet = Image.new('RGB', (1200, 960), '#353f49')
draw = ImageDraw.Draw(sheet)
for col, key in enumerate(('actor:frost-tide-warden', 'actor:ruins-bell-keeper', 'actor:guardian')):
    a = assets[key]
    draw.text((col * 400 + 8, 8), key, font=FONT, fill='white')
    draw.text((col * 400 + 8, 34), f"cell {a['frameWidth']}px / display {a['displayWidth']} logical", font=SMALL, fill='#e4dbb4')
    attack = next(v for k, v in animations.items() if v['imageKey'] == key and 'attack' in k)
    for row, idx in enumerate((0, attack['frames'][len(attack['frames']) // 2])):
        y = 65 + row * 440
        paste_frame(sheet, key, idx, col * 400 + 8, y)
        draw.text((col * 400 + 12, y + 387), f'frame {idx} | nearest | 2 screen px / logical px', font=SMALL, fill='white')
sheet.save(OUT / 'boss-density-review.jpg', quality=72)

keys = ['actor:frost-wolf', 'actor:frost-crab', 'actor:sand-scorpion', 'actor:ruins-moss-carapace', 'actor:guide', 'actor:sands-guide', 'env:tile-slope', 'env:tile-ground', 'env:tile-platform', 'env:ladder', 'env:forest:platform', 'env:mine:platform']
sheet = Image.new('RGB', (1200, 900), '#39434b')
draw = ImageDraw.Draw(sheet)
for i, key in enumerate(keys):
    x, y = (i % 4) * 300, (i // 4) * 300
    a = assets[key]
    draw.text((x + 8, y + 5), key, font=FONT, fill='white')
    draw.text((x + 8, y + 30), f"{a['frameWidth']}x{a['frameHeight']} -> {a['displayWidth']}x{a['displayHeight']}", font=SMALL, fill='#e4dbb4')
    paste_frame(sheet, key, 0, x + (300 - a['displayWidth'] * 2) // 2, y + 44)
sheet.save(OUT / 'terrain-actor-review.jpg', quality=72)

# A matched source crop; compares actual pixel detail without shrinking an entire panorama.
keys = ['env:forest:mid', 'env:rock:mid', 'env:frost:mid', 'env:ruins-gallery:mid']
sheet = Image.new('RGB', (1200, 640), '#39434b')
draw = ImageDraw.Draw(sheet)
crop_coordinates = {}
for i, key in enumerate(keys):
    a = assets[key]
    with Image.open(ROOT / 'public' / a['url']) as image:
        image = image.convert('RGBA')
        # Select a populated 300x135 logical crop, rather than an empty panorama center.
        candidates = [(x, y, x + 300, y + 135) for x in range(0, image.width - 299, 150) for y in range(0, image.height - 134, 67)]
        box = max(candidates, key=lambda b: ImageStat.Stat(image.getchannel('A').crop(b)).sum[0])
        crop_coordinates[key] = box
        crop = image.crop(box).resize((600, 270), Image.Resampling.NEAREST)
    x, y = i % 2 * 600, i // 2 * 320
    draw.text((x + 8, y + 5), key + ' | source top-center crop at 1080p scale', font=FONT, fill='white')
    sheet.paste(crop, (x, y + 35), crop)
sheet.save(OUT / 'midground-detail-review.jpg', quality=72)
(OUT / 'review-crop-coordinates.json').write_text(json.dumps(crop_coordinates, indent=2), encoding='utf-8')

# DOM artwork also includes files outside the three pack manifests.
ui_files = []
for directory in ('journal', 'illustrated', 'controls'):
    ui_files.extend((ROOT / 'public/assets/interface' / directory).rglob('*.png'))
for name in ('region-frost-isles-map-v1.png', 'region-ancient-ruins-map-v1.png', 'world-map-background-v2.png'):
    ui_files.append(ROOT / 'public/assets/interface' / name)
registered_urls = {a['url'] for a in rows}
ui_rows = []
for path in sorted(ui_files):
    with Image.open(path) as img:
        ui_rows.append(dict(url=path.relative_to(ROOT / 'public').as_posix(), width=img.width, height=img.height,
                            bytes=path.stat().st_size, registered=path.relative_to(ROOT / 'public').as_posix() in registered_urls,
                            usageEvidence='control-art.ts; index.ts; illustrated-panels.ts; world-map.ts; CSS (directory-level review)'))
(OUT / 'direct-ui-audit.json').write_text(json.dumps(ui_rows, indent=2), encoding='utf-8')

sheet = Image.new('RGB', (1200, 780), '#39434b')
draw = ImageDraw.Draw(sheet)
for row, outfit in enumerate(('cloth', 'leather', 'iron')):
    key = 'actor:hero-' + outfit
    for col, state in enumerate(('idle', 'jump', 'climb', 'hurt', 'dead', 'buff')):
        anim = next(a for k, a in animations.items() if a['imageKey'] == key and k.endswith(':' + state))
        index = anim['frames'][-1] if state == 'dead' else anim['frames'][len(anim['frames']) // 2]
        draw.text((col * 200 + 5, row * 260 + 5), outfit + ' / ' + state, font=FONT, fill='white')
        draw.text((col * 200 + 5, row * 260 + 27), 'frame ' + str(index), font=SMALL, fill='#e4dbb4')
        paste_frame(sheet, key, index, col * 200 + 4, row * 260 + 52)
sheet.save(OUT / 'hero-other-states-review.jpg', quality=72)

print(json.dumps({'registeredImages': len(rows), 'packs': {p: sum(a['pack'] == p for a in rows) for p in ('actors','environment','interface')},
                  'additionalDirectUIImages': sum(not a['registered'] for a in ui_rows),
                  'missing': 0, 'nonIntegralGrids': [a['key'] for a in rows if not a['integralGrid']],
                  'evidence': ['asset-audit.json', 'asset-audit.csv', 'boss-density-review.jpg', 'terrain-actor-review.jpg', 'midground-detail-review.jpg']}, ensure_ascii=False))
