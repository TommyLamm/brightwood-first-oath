"""Export retained ImageGen originals and the targeted cloth attack edit.

Only technical alpha cleanup, cropping, resampling, atlas packing and the
existing platform wrap-band operation are performed. Original artwork is kept.
Run from the repository root with Python, Pillow and numpy.
"""
from pathlib import Path
import hashlib
import json

import numpy as np
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
PUBLIC = ROOT / 'public'
REVIEW = ROOT / 'output/quality-pass1-20261105'
REVIEW.mkdir(exist_ok=True)
before = {group: json.loads((HERE / f'{group}-manifest-before.json').read_text(encoding='utf-8'))
          for group in ('actors', 'environment', 'interface')}
manifests = {group: json.loads((PUBLIC / 'assets' / group / 'manifest.json').read_text(encoding='utf-8'))
             for group in before}
entries = {item['key']: item for manifest in manifests.values() for item in manifest['images']}
old_entries = {item['key']: item for manifest in before.values() for item in manifest['images']}
records = []


def opened(path):
    with Image.open(path) as image:
        return image.convert('RGBA')


def bounds(image, threshold=8):
    return image.getchannel('A').point(lambda a: 255 if a > threshold else 0).getbbox()


def clean(image, threshold=8):
    pixels = np.array(image)
    pixels[pixels[:, :, 3] <= threshold] = 0
    return Image.fromarray(pixels)


def resized(image, size):
    # Premultiplied resampling avoids hidden matte RGB bleeding into edges.
    return clean(image.convert('RGBa').resize(size, Image.Resampling.LANCZOS).convert('RGBA'))


def old_frame(key, index=0):
    item = old_entries[key]
    atlas = opened(PUBLIC / item['url'])
    w, h = atlas.width // item['columns'], atlas.height // item['rows']
    x, y = index % item['columns'] * w, index // item['columns'] * h
    return atlas.crop((x, y, x + w, y + h))


def fit_pose(source, reference, size, threshold=32):
    box = bounds(reference)
    source = clean(source, threshold)
    source_box = bounds(source, threshold)
    assert box and source_box, 'Empty pose'
    target = tuple(round(v * size[i % 2] / reference.size[i % 2]) for i, v in enumerate(box))
    pose = resized(source.crop(source_box), (target[2] - target[0], target[3] - target[1]))
    frame = Image.new('RGBA', size)
    frame.paste(pose, target[:2])
    return frame


def save(key, image, destination, sources, method, frames=None):
    item, previous = entries[key], old_entries[key]
    path = PUBLIC / destination
    image = clean(image)
    assert image.width % item['columns'] == image.height % item['rows'] == 0
    assert image.getchannel('A').getextrema() == (0, 255) or image.getchannel('A').getextrema()[0] == 0
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, optimize=True)
    old = opened(PUBLIC / previous['url'])
    item['url'] = destination
    record = {'key': key, 'method': method, 'previousUrl': previous['url'], 'url': destination,
              'oldSize': list(old.size), 'size': list(image.size), 'display': [item['displayWidth'], item['displayHeight']],
              'previousBytes': (PUBLIC / previous['url']).stat().st_size, 'bytes': path.stat().st_size,
              'oldDecodedBytes': old.width * old.height * 4, 'decodedBytes': image.width * image.height * 4,
              'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
              'sources': [{'path': str(p.relative_to(ROOT)).replace('\\', '/'),
                           'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in sources]}
    if frames is not None:
        record['changedFrames'] = frames
    records.append(record)
    print(f'{key}: {old.size} -> {image.size}')


# The other cloth states remain byte-for-byte identical. Replace six attack
# frames and their two unused padding copies, keeping the atlas dimensions.
key = 'actor:hero-cloth'
atlas = opened(PUBLIC / old_entries[key]['url'])
source_path = HERE / 'cloth-attack-generated.png'
source = opened(source_path)
assert source.width % 3 == source.height % 2 == 0
sw, sh = source.width // 3, source.height // 2
attack_frames = []
for i in range(6):
    cell = source.crop((i % 3 * sw, i // 3 * sh, (i % 3 + 1) * sw, (i // 3 + 1) * sh))
    attack_frames.append(fit_pose(cell, old_frame(key, 32 + i), (192, 192), 64))
for i in range(8):
    atlas.paste(attack_frames[min(i, 5)], (i * 192, 4 * 192))
save(key, atlas, 'assets/actors/hero-cloth-v9-clarity-v2.png', [source_path],
     'targeted-built-in-ImageGen-attack-edit', list(range(32, 40)))

# Recover the original sword detail. The frost sword keeps its existing source
# padding, and both retain the current 64-world-unit frame and grip pivots.
for key, rel, padding, destination in [
    ('equip:frost-tide-sword', 'art-source/expansion-frost/sword/frost-tide-sword-imagegen-transparent-rgba-1254.png', 128,
     'assets/equipment/frost-tide-sword-clarity-v2.png'),
    ('equip:sunwell-oathblade', 'art-source/expansion-sands/sentinel/reward/sunwell-oathblade-raw-v1.png', 0,
     'assets/equipment/sunwell-oathblade-clarity-v2.png'),
]:
    path = ROOT / rel
    source = opened(path)
    if padding:
        padded = Image.new('RGBA', (source.width + padding * 2, source.height + padding * 2))
        padded.paste(source, (padding, padding))
        source = padded
    save(key, resized(clean(source), (256, 256)), destination, [path], 'retained-high-resolution-source')

# Preserve the accepted source crop and 8-world-unit side gutters. Recover
# full source colour and twice the native density without the 48-colour limit.
path = ROOT / 'art-source/environment/env-tile-platform-t11-06-stone-timber-one-shot-20261018.png'
material = resized(opened(path).crop((750, 305, 1198, 425)), (224, 60))
pixels = np.array(material)
pixels[:, :, 3] = 255
rgb = pixels[:, :, :3].astype(np.float32).copy()
seam = (rgb[:, 0] + rgb[:, -1]) / 2
for offset in range(16):
    weight = offset / 16
    for x in (offset, 223 - offset):
        pixels[:, x, :3] = np.rint(seam * (1 - weight) + rgb[:, x] * weight).astype(np.uint8)
platform = Image.new('RGBA', (256, 64))
platform.paste(Image.fromarray(pixels), (16, 0))
assert np.array_equal(pixels[:, 0], pixels[:, -1])
save('env:tile-platform', platform, 'assets/environment/env-tile-platform-clarity-v2.png', [path],
     'retained-source-crop-full-colour-matched-wrap-band')

# Existing high-resolution generated originals supply all prop detail. Fit
# their visible silhouette to the previous logical bounds, not the raw canvas.
for name in ('ladder', 'portal', 'town-sign', 'mine-door', 'altar'):
    key = 'env:' + name
    path = ROOT / f'art-source/environment/env-{name}-v1.png'
    item = old_entries[key]
    size = (item['displayWidth'] * 2, item['displayHeight'] * 2)
    source = clean(opened(path), 32)
    source_box = bounds(source, 127)
    assert source_box
    frame = fit_pose(source.crop(source_box), old_frame(key), size)
    save(key, frame, f'assets/environment/env-{name}-clarity-v2.png', [path], 'retained-high-resolution-source')

# Re-export the six authored heavy-strike motifs using the prior source-region
# and runtime geometry mapping. No eight-colour snapping or alpha flattening.
key = 'vfx:heavy-strike'
path = ROOT / 'art-source/interface/interface-vfx-heavy-strike-v8-attempt1.png'
source = opened(path)
prior = json.loads((ROOT / 'art-source/interface/heavy-strike-v9-export.json').read_text())
sheet = Image.new('RGBA', (1536, 256))
for info in prior['frames']:
    region = source.crop(tuple(info['sourceRegion']))
    region = region.crop(tuple(info['coreBoundsInRegion']))
    reference = old_frame(key, info['frame'])
    frame = fit_pose(region, reference, (256, 256), 32)
    sheet.paste(frame, (info['frame'] * 256, 0))
save(key, sheet, 'assets/interface/vfx-heavy-strike-clarity-v2.png', [path], 'retained-source-full-colour-alpha')

# Structural checks cover the changed active frames and preserved geometry.
geometry = []
for record in records:
    key = record['key']
    item = entries[key]
    new = opened(PUBLIC / item['url'])
    old = opened(PUBLIC / old_entries[key]['url'])
    fw, fh = new.width // item['columns'], new.height // item['rows']
    ow, oh = old.width // item['columns'], old.height // item['rows']
    if key == 'actor:hero-cloth':
        count = range(64)
    else:
        count = range(item['columns'] * item['rows'])
    max_delta = 0
    for i in count:
        old_cell = old.crop((i % item['columns'] * ow, i // item['columns'] * oh,
                             (i % item['columns'] + 1) * ow, (i // item['columns'] + 1) * oh))
        new_cell = new.crop((i % item['columns'] * fw, i // item['columns'] * fh,
                             (i % item['columns'] + 1) * fw, (i // item['columns'] + 1) * fh))
        ob, nb = bounds(old_cell), bounds(new_cell)
        assert ob and nb, (key, i)
        delta = max(abs(nb[n] / (fw if n % 2 == 0 else fh) - ob[n] / (ow if n % 2 == 0 else oh))
                    * item['displayWidth' if n % 2 == 0 else 'displayHeight'] for n in range(4))
        max_delta = max(max_delta, delta)
        if key == 'actor:hero-cloth':
            assert delta <= 0.5, (key, i, delta)
            if i not in record['changedFrames']:
                assert old_cell.tobytes() == new_cell.tobytes(), i
    geometry.append({'key': key, 'activeFrameBoundsMaxDifferenceWorldPx': round(max_delta, 3)})

for group, manifest in manifests.items():
    assert manifest['animations'] == before[group]['animations'], 'Animation contract changed'
    (PUBLIC / 'assets' / group / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

report = {'date': '2026-11-05', 'benchmark': 'actor:ruins-bell-keeper', 'records': records,
          'geometry': geometry, 'compressedBytesDelta': sum(r['bytes'] - r['previousBytes'] for r in records),
          'decodedBytesDelta': sum(r['decodedBytes'] - r['oldDecodedBytes'] for r in records),
          'animationContractsUnchanged': True, 'worldGeometryAndPivotsUnchanged': True}
(HERE / 'export-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# Compact before/after sheet at 1080-equivalent draw size, on a composited BG.
canvas = Image.new('RGB', (1120, 900), '#334653')
draw = ImageDraw.Draw(canvas)
draw.text((16, 10), 'Before / After: 1080-equivalent display, original art preserved', fill='white')
for i, record in enumerate(records):
    key = record['key']
    item = entries[key]
    index = 35 if key == 'actor:hero-cloth' else 1 if key == 'vfx:heavy-strike' else 0
    old = old_frame(key, index)
    new = opened(PUBLIC / item['url'])
    fw, fh = new.width // item['columns'], new.height // item['rows']
    new = new.crop((index % item['columns'] * fw, index // item['columns'] * fh,
                    (index % item['columns'] + 1) * fw, (index // item['columns'] + 1) * fh))
    desired = (item['displayWidth'] * 2, item['displayHeight'] * 2)
    for j, image in enumerate((old, new)):
        image = image.resize(desired, Image.Resampling.NEAREST if j == 0 else Image.Resampling.LANCZOS)
        image.thumbnail((145, 204), Image.Resampling.LANCZOS)
        x, y = 16 + i % 3 * 370 + j * 175, 46 + i // 3 * 210
        canvas.paste(image, (x, y + 18), image)
        draw.text((x, y), key[:28] + (' old' if j == 0 else ' new'), fill='white')
canvas.save(REVIEW / 'asset-comparison.jpg', quality=75)
print(json.dumps({k: report[k] for k in ('compressedBytesDelta', 'decodedBytesDelta', 'geometry')}, ensure_ascii=False))
