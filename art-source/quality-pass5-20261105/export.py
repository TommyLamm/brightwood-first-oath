"""Pack authored regional materials and midgrounds without changing gameplay geometry."""
import hashlib
import importlib.util
import json
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
PUBLIC = ROOT / 'public'
DEST = PUBLIC / 'assets/environment'
spec = importlib.util.spec_from_file_location('terrain_export', ROOT / 'art-source/terrain-biomes-20261105/export-terrain.py')
terrain = importlib.util.module_from_spec(spec)
spec.loader.exec_module(terrain)
terrain.HERE = HERE
before = json.loads((HERE / 'environment-manifest-before.json').read_text(encoding='utf-8'))
entries = []
records = terrain.RECORDS

def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()

for style, kind in [('village', 'ladder'), ('sand', 'rope'), ('sunwell', 'chain'), ('ruins', 'chain')]:
    entries.extend([terrain.platform(style), terrain.climber(style, kind)])

# Explicit art crop removes the generated matte above the solid surface. The crop's top
# becomes the original y=600 walk-line; it does not move the world foothold.
surface_rows = {'village': 70, 'ridge': 94, 'mine': 82, 'sand': 82, 'sunwell': 82, 'ruins': 70}
for style, surface in surface_rows.items():
    source_path = HERE / f'{style}-ground-generated.png'
    source = Image.open(source_path).convert('RGBA')
    image = terrain.resize(source.crop((0, surface, source.width, source.height)), (512, 512))
    image.putalpha(255)
    pixels = np.asarray(image.convert('RGBa'), dtype=np.float64)
    profile = np.median(pixels[:, list(range(8)) + list(range(504, 512))], axis=1)
    image = terrain.seam_edge(image, profile, 'x', (False, True), band=16)
    assert np.array_equal(np.asarray(image)[:, 0], np.asarray(image)[:, -1])
    assert image.getchannel('A').getextrema() == (255, 255)
    target = DEST / f'env-{style}-ground-v1.png'
    image.save(target, optimize=True)
    entry = dict(key=f'env:{style}:ground', url=target.relative_to(PUBLIC).as_posix(), columns=1, rows=1,
                 displayWidth=128, displayHeight=128, pivotX=0, pivotY=0)
    entries.append(entry)
    records.append(dict(**entry, source=source_path.name, sourceBounds=[0, surface, source.width, source.height],
                        sourceSha256=sha(source_path), outputSha256=sha(target), pixels=list(image.size), density=4,
                        compressedBytes=target.stat().st_size, baseRgbaBytes=image.width * image.height * 4))

for theme in ('forest', 'rock', 'frost', 'ruins-gallery', 'mine'):
    source_path = HERE / f'{theme}-mid-generated.png'
    source = Image.open(source_path).convert('RGBA')
    # Keep the whole horizontal composition. Fit the authored upper decoration band to
    # the established 150/180px height; no new pixels enter the clear gameplay area.
    alpha = source.getchannel('A').point(lambda a: 0 if a <= 8 else a)
    source.putalpha(alpha)
    bounds = alpha.getbbox()
    assert bounds
    height = 150 if theme == 'frost' else 180
    strip = terrain.resize(source.crop((0, bounds[1], source.width, bounds[3])), (1920, height))
    image = Image.new('RGBA', (1920, 540))
    image.paste(strip, (0, 0))
    assert image.getchannel('A').crop((0, height, 1920, 540)).getbbox() is None
    target = DEST / f'env-{theme}-mid-clarity-v1.png'
    image.save(target, optimize=True)
    key = f'env:{theme}:mid'
    previous = next((e for e in before['images'] if e['key'] == key), None)
    entry = dict(previous) if previous else dict(key=key, columns=1, rows=1, displayWidth=1920, displayHeight=540, pivotX=0, pivotY=0)
    entry['url'] = target.relative_to(PUBLIC).as_posix()
    entries.append(entry)
    records.append(dict(**entry, source=source_path.name, sourcePixels=list(source.size), sourceBounds=bounds,
                        sourceSha256=sha(source_path), outputSha256=sha(target), pixels=list(image.size), density=1,
                        transparentFromY=height, previousUrl=previous['url'] if previous else None,
                        previousBytes=(PUBLIC / previous['url']).stat().st_size if previous else 0,
                        previousBaseRgbaBytes=1920 * 540 * 4 if previous else 0,
                        compressedBytes=target.stat().st_size, baseRgbaBytes=image.width * image.height * 4))

manifest_path = DEST / 'manifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
new_by_key = {e['key']: e for e in entries}
assert len(new_by_key) == len(entries) == 19
manifest['images'] = [new_by_key.pop(e['key'], e) for e in before['images']] + list(new_by_key.values())
assert manifest['animations'] == before['animations'] and manifest['audio'] == before['audio']
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
for record in records:
    if 'chain' in record['key'] or 'rope' in record['key'] or 'ladder' in record['key']:
        alpha = np.asarray(Image.open(PUBLIC / record['url']).getchannel('A'))
        assert np.count_nonzero(alpha[63, :64] > 127) >= 2, record['key']

baseline = json.loads((HERE / 'baseline.json').read_text(encoding='utf-8'))
preserved = {name: expected for name, expected in baseline.items() if name != 'public/assets/actors/manifest.json'}
for name, expected in preserved.items(): assert sha(ROOT / name) == expected, name
report = dict(tool='built-in imagegen', runtime=records, unchangedGameplayHashes=preserved,
              addedCompressedBytes=sum(r['compressedBytes'] for r in records),
              activeCompressedDelta=sum(r['compressedBytes'] - r.get('previousBytes', 0) for r in records),
              addedBaseRgbaBytes=sum(r['baseRgbaBytes'] for r in records),
              activeBaseRgbaDelta=sum(r['baseRgbaBytes'] - r.get('previousBaseRgbaBytes', 0) for r in records))
(HERE / 'export-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print('Exported 14 terrain textures and 5 midgrounds;', report['addedCompressedBytes'], 'new runtime bytes.')
