"""Technical packing of cave art and 18 authored Warden poses; no procedural drawing."""
import hashlib
import importlib.util
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
PUBLIC = ROOT / 'public'
OUT = ROOT / 'output/quality-pass4-20261105'
OUT.mkdir(parents=True, exist_ok=True)
spec = importlib.util.spec_from_file_location('terrain_export', ROOT / 'art-source/terrain-biomes-20261105/export-terrain.py')
terrain = importlib.util.module_from_spec(spec)
spec.loader.exec_module(terrain)
terrain.HERE = HERE
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 17)

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def opened(path):
    return Image.open(path).convert('RGBA')

def opaque_bounds(image):
    return image.getchannel('A').point(lambda a: 255 if a >= 128 else 0).getbbox()

entries = [terrain.platform('cave'), terrain.climber('cave', 'chain')]
for entry, record in zip(entries, terrain.RECORDS):
    entry['key'] = entry['key'].replace('env:cave:', 'env:frost-cave:')
    record['key'] = entry['key']

path = HERE / 'cave-ground-generated.png'
image = opened(path)
sw, sh = image.size
alpha = np.asarray(image.getchannel('A'))
surface = int(np.flatnonzero(np.min(alpha, axis=1) >= 240)[0])
image = image.crop((0, surface, sw, sh))
assert np.min(np.asarray(image.getchannel('A'))) >= 240
image.putalpha(255)
image = terrain.resize(image, (512, 512))
pixels = np.asarray(image.convert('RGBa'), dtype=np.float64)
profile = np.median(pixels[:, list(range(8)) + list(range(504, 512))], axis=1)
image = terrain.seam_edge(image, profile, 'x', (False, True), band=16)
assert np.array_equal(np.asarray(image)[:, 0], np.asarray(image)[:, -1])
assert image.getchannel('A').getextrema() == (255, 255)
target = PUBLIC / 'assets/environment/env-cave-ground-v1.png'
image.save(target, optimize=True)
entry = dict(key='env:frost-cave:ground', url='assets/environment/' + target.name, columns=1, rows=1,
             displayWidth=128, displayHeight=128, pivotX=0, pivotY=0)
entries.append(entry)
terrain.RECORDS.append(dict(**entry, source=path.name, sourceBounds=[0, surface, sw, sh], sourceSha256=sha(path),
                            outputSha256=sha(target), pixels=[512, 512], density=4,
                            compressedBytes=target.stat().st_size, baseRgbaBytes=512 * 512 * 4))
# Check that the chain remains visible at segment joins, as well as pixel-identical.
chain = opened(PUBLIC / entries[1]['url'])
assert np.count_nonzero(np.asarray(chain.getchannel('A'))[63, :64] > 127) >= 2

# Combine four existing samples with the remaining fourteen newly authored unique poses.
before = json.loads((HERE / 'actors-manifest-before.json').read_text(encoding='utf-8'))
old_entry = next(a for a in before['images'] if a['key'] == 'actor:frost-tide-warden')
old_path = PUBLIC / old_entry['url']
old_sha = sha(old_path)
old = opened(old_path)
assert old.size == (1632, 1360)
source_cells = {}
source_records = []
groups = [('sample', [0, 1, 12, 14], 2, ROOT / 'art-source/quality-pass3-20261105/warden-sample-generated.png')]
for name, indices in json.loads((HERE / 'pose-groups.json').read_text(encoding='utf-8')).items():
    groups.append((name, indices, 3 if name == 'walk' else 2, HERE / f'warden-{name}-generated.png'))
for name, indices, columns, path in groups:
    source = opened(path)
    assert source.width % columns == source.height % 2 == 0
    assert source.getchannel('A').getextrema()[0] == 0
    width, height = source.width // columns, source.height // 2
    source_records.append(dict(group=name, path=path.relative_to(ROOT).as_posix(), sha256=sha(path), frames=indices))
    for index, frame in enumerate(indices):
        source_cells[frame] = source.crop((index % columns * width, index // columns * height,
                                           (index % columns + 1) * width, (index // columns + 1) * height))
assert len(source_cells) == 18
poses = {}
pose_records = []
for frame, source in source_cells.items():
    original = old.crop((frame % 6 * 272, frame // 6 * 272, (frame % 6 + 1) * 272, (frame // 6 + 1) * 272))
    bounds = opaque_bounds(original)
    source_bounds = source.getchannel('A').point(lambda a: 255 if a >= 64 else 0).getbbox()
    assert bounds and source_bounds
    body = terrain.resize(source.crop(source_bounds), (bounds[2] - bounds[0], bounds[3] - bounds[1]))
    actual = opaque_bounds(body)
    assert actual
    # Position by the opaque foot line, not the original atlas's very faint alpha residue.
    x = round((bounds[0] + bounds[2] - actual[0] - actual[2]) / 2)
    y = bounds[3] - actual[3]
    cell = Image.new('RGBA', (272, 272))
    cell.paste(body, (x, y))
    fitted = opaque_bounds(cell)
    assert fitted[3] == bounds[3]
    assert abs((fitted[0] + fitted[2]) - (bounds[0] + bounds[2])) <= 1
    assert abs((fitted[2] - fitted[0]) - (bounds[2] - bounds[0])) <= 4
    assert abs((fitted[3] - fitted[1]) - (bounds[3] - bounds[1])) <= 4
    poses[frame] = cell
    pose_records.append(dict(frame=frame, originalAlpha128Bounds=bounds, outputAlpha128Bounds=fitted,
                             generatedCrop=source_bounds, opaqueFootErrorLogicalPx=0,
                             opaqueCenterErrorLogicalPx=abs((fitted[0] + fitted[2]) - (bounds[0] + bounds[2])) / 2 * 192 / 272))

atlas = Image.new('RGBA', old.size)
original_hashes = {}
duplicates = []
for frame in range(30):
    original = old.crop((frame % 6 * 272, frame // 6 * 272, (frame % 6 + 1) * 272, (frame // 6 + 1) * 272))
    digest = hashlib.sha256(original.tobytes()).hexdigest()
    representative = original_hashes.setdefault(digest, frame)
    assert representative in poses, representative
    atlas.paste(poses[representative], (frame % 6 * 272, frame // 6 * 272))
    if representative != frame: duplicates.append(dict(frame=frame, sameAs=representative))
target = PUBLIC / 'assets/actors/monsters/frost-tide-warden-clarity-v1.png'
atlas.save(target, optimize=True)
assert sha(old_path) == old_sha

actor_manifest_path = PUBLIC / 'assets/actors/manifest.json'
actors = json.loads(actor_manifest_path.read_text(encoding='utf-8'))
for entry in actors['images']:
    if entry['key'] == old_entry['key']: entry['url'] = target.relative_to(PUBLIC).as_posix()
expected = json.loads(json.dumps(before))
next(a for a in expected['images'] if a['key'] == old_entry['key'])['url'] = target.relative_to(PUBLIC).as_posix()
assert actors == expected
actor_manifest_path.write_text(json.dumps(actors, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

environment_path = PUBLIC / 'assets/environment/manifest.json'
environment = json.loads(environment_path.read_text(encoding='utf-8'))
environment_before = json.loads((HERE / 'environment-manifest-before.json').read_text(encoding='utf-8'))
keys = {entry['key'] for entry in entries}
assert [entry for entry in environment['images'] if entry['key'] not in keys] == environment_before['images']
environment['images'] = [entry for entry in environment['images'] if entry['key'] not in keys] + entries
assert environment['animations'] == environment_before['animations'] and environment['audio'] == environment_before['audio']
environment_path.write_text(json.dumps(environment, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# Offline frame-order contact sheets and timed previews use the unchanged production animations.
animations = [a for a in actors['animations'] if a['imageKey'] == old_entry['key']]
for animation in animations:
    state = animation['key'].split(':')[-1]
    count = len(animation['frames'])
    contact = Image.new('RGB', (1200, 680), '#36434b')
    draw = ImageDraw.Draw(contact)
    rendered = []
    for index, frame in enumerate(animation['frames']):
        cell = atlas.crop((frame % 6 * 272, frame // 6 * 272, (frame % 6 + 1) * 272, (frame // 6 + 1) * 272))
        sprite = cell.resize((384, 384), Image.Resampling.NEAREST)
        xx, yy = index % 3 * 400, index // 3 * 330
        draw.text((xx + 8, yy + 8), f'{state} / frame {frame} / {animation["frameMs"][index]}ms', font=font, fill='white')
        crop = sprite.crop((0, 96, 384, 384))
        contact.paste(crop, (xx + 8, yy + 34), crop)
        view = Image.new('RGB', (384, 384), '#36434b')
        view.paste(sprite, (0, 0), sprite)
        rendered.append(view)
    contact.save(OUT / f'warden-{state}-sequence.jpg', quality=72)
    options = {'loop': 0} if animation['loop'] else {}
    rendered[0].save(OUT / f'warden-{state}.gif', save_all=True, append_images=rendered[1:], duration=animation['frameMs'], disposal=2, **options)

baseline = json.loads((HERE / 'baseline.json').read_text(encoding='utf-8'))
for name, expected in baseline.items(): assert sha(ROOT / name) == expected, name
actor_record = dict(key=old_entry['key'], url=target.relative_to(PUBLIC).as_posix(), pixels=list(atlas.size),
                    compressedBytes=target.stat().st_size, baseRgbaBytes=atlas.width * atlas.height * 4,
                    outputSha256=sha(target), previousUrl=old_entry['url'], previousBytes=old_path.stat().st_size,
                    previousSha256=old_sha,
                    sources=source_records, poses=pose_records, duplicatePadding=duplicates)
records = terrain.RECORDS + [actor_record]
report = dict(tool='built-in imagegen', runtime=records, uniqueWardenPoses=18, totalAtlasCells=30,
              actorAnimationContractUnchanged=actors['animations'] == before['animations'], preservedProductionHashes=baseline,
              addedCompressedBytes=sum(row['compressedBytes'] for row in records),
              activeCompressedDelta=sum(row['compressedBytes'] for row in records) - old_path.stat().st_size,
              addedBaseRgbaBytes=sum(row['baseRgbaBytes'] for row in records),
              activeBaseRgbaDelta=sum(row['baseRgbaBytes'] for row in terrain.RECORDS))
(HERE / 'export-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(f"Exported cave materials and 18 unique Warden poses; {report['addedCompressedBytes']} new runtime bytes")
