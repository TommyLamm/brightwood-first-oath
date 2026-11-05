"""Technical export: crop, premultiplied resize, seam wrapping, and sample packing.

Artwork is authored by built-in ImageGen. Does not draw replacement artwork.
"""
import hashlib
import importlib.util
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = ROOT / 'output/quality-pass3-20261105'
PUBLIC = ROOT / 'public'
OUT.mkdir(parents=True, exist_ok=True)
spec = importlib.util.spec_from_file_location('terrain_export', ROOT / 'art-source/terrain-biomes-20261105/export-terrain.py')
terrain = importlib.util.module_from_spec(spec)
spec.loader.exec_module(terrain)
terrain.HERE = HERE

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def opened(path):
    return Image.open(path).convert('RGBA')

entries = [terrain.platform('snow'), terrain.climber('snow', 'rope')]
for entry, record in zip(entries, terrain.RECORDS):
    entry['key'] = entry['key'].replace('env:snow:', 'env:frost:')
    record['key'] = entry['key']

# Align a dense, continuous upper snow edge to logical ground y, retaining opaque geology below.
path = HERE / 'snow-ground-generated.png'
image = opened(path)
source_width, source_height = image.size
alpha = np.asarray(image.getchannel('A'))
surface = int(np.flatnonzero(np.min(alpha, axis=1) >= 240)[0])
image = image.crop((0, surface, image.width, image.height))
# ImageGen supplied near-opaque (244-253) alpha over the solid geology. Normalize only
# this verified dense rectangle, so repeated ground sprites cannot show the backdrop through it.
assert np.min(np.asarray(image.getchannel('A'))) >= 240
image.putalpha(255)
image = terrain.resize(image, (512, 512))
pixels = np.asarray(image.convert('RGBa'), dtype=np.float64)
profile = np.median(pixels[:, list(range(8)) + list(range(504, 512))], axis=1)
image = terrain.seam_edge(image, profile, 'x', (False, True), band=16)
pixels = np.asarray(image)
assert np.array_equal(pixels[:, 0], pixels[:, -1])
assert np.min(pixels[24:, :, 3]) >= 250, 'Ground must have no transparent holes below the snow edge'
target = PUBLIC / 'assets/environment/env-snow-ground-v1.png'
image.save(target, optimize=True)
entry = dict(key='env:frost:ground', url='assets/environment/' + target.name, columns=1, rows=1,
             displayWidth=128, displayHeight=128, pivotX=0, pivotY=0)
entries.append(entry)
terrain.RECORDS.append(dict(**entry, source=path.name, sourceBounds=[0, surface, source_width, source_height],
                            sourceSha256=sha(path), outputSha256=sha(target), pixels=[512, 512], density=4,
                            compressedBytes=target.stat().st_size, baseRgbaBytes=512 * 512 * 4))

manifest_path = PUBLIC / 'assets/environment/manifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
before = json.loads((HERE / 'environment-manifest-before.json').read_text(encoding='utf-8'))
keys = {entry['key'] for entry in entries}
assert [entry for entry in manifest['images'] if entry['key'] not in keys] == before['images']
manifest['images'] = [entry for entry in manifest['images'] if entry['key'] not in keys] + entries
assert manifest['animations'] == before['animations'] and manifest['audio'] == before['audio']
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# The four boss poses remain isolated samples; no actor manifest or runtime atlas is changed.
actors = json.loads((HERE / 'actors-manifest-before.json').read_text(encoding='utf-8'))
assert json.loads((PUBLIC / 'assets/actors/manifest.json').read_text(encoding='utf-8')) == actors
warden = next(entry for entry in actors['images'] if entry['key'] == 'actor:frost-tide-warden')
old = opened(PUBLIC / warden['url'])
generated = opened(HERE / 'warden-sample-generated.png')
assert generated.width % 2 == generated.height % 2 == 0
assert generated.getchannel('A').getextrema()[0] == 0
sw, sh = generated.width // 2, generated.height // 2
samples = Image.new('RGBA', (544, 544))
review = Image.new('RGB', (1200, 880), '#36434b')
draw = ImageDraw.Draw(review)
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 17)
sample_records = []
for index, frame in enumerate([0, 1, 12, 14]):
    x, y = frame % 6 * 272, frame // 6 * 272
    original = old.crop((x, y, x + 272, y + 272))
    bounds = original.getchannel('A').point(lambda a: 255 if a >= 128 else 0).getbbox()
    source = generated.crop((index % 2 * sw, index // 2 * sh, (index % 2 + 1) * sw, (index // 2 + 1) * sh))
    source_bounds = source.getchannel('A').point(lambda a: 255 if a >= 64 else 0).getbbox()
    assert source_bounds, frame
    size = (bounds[2] - bounds[0], bounds[3] - bounds[1])
    source = terrain.resize(source.crop(source_bounds), size)
    sample = Image.new('RGBA', (272, 272))
    sample.paste(source, bounds[:2])
    samples.paste(sample, (index % 2 * 272, index // 2 * 272))
    # Four pairs at unchanged 1080p screen scale, no extra magnification.
    xx, yy = index % 2 * 600, index // 2 * 440
    draw.text((xx + 10, yy + 8), f'Frame {frame}: current / sample (not adopted)', font=font, fill='white')
    for col, img in enumerate((original, sample)):
        # Local 192x192 source crop (within the 272 frame) remains at its original screen density.
        # A full 384px display frame is clipped by this comparison cell, never rescaled to fit.
        rendered = img.resize((384, 384), Image.Resampling.NEAREST)
        crop = rendered.crop((55, 96, 327, 384))
        review.paste(crop, (xx + 10 + col * 290, yy + 45), crop)
    sample_records.append(dict(frame=frame, originalAlpha128Bounds=bounds, generatedCrop=source_bounds,
                               policy='fit to original opaque body bounds; samples only, not runtime'))
samples.save(HERE / 'warden-detail-samples.png', optimize=True)
review.save(OUT / 'warden-sample-comparison.jpg', quality=72)

# Check only unchanged gameplay/render-scale contracts captured for this batch.
baseline = json.loads((HERE / 'baseline.json').read_text(encoding='utf-8'))
for name, expected in baseline.items():
    assert sha(ROOT / name) == expected, name
report = dict(tool='built-in imagegen', runtime=terrain.RECORDS,
              addedCompressedBytes=sum(row['compressedBytes'] for row in terrain.RECORDS),
              addedBaseRgbaBytes=sum(row['baseRgbaBytes'] for row in terrain.RECORDS),
              groundSourceSurfaceRow=surface, wardenSamples=sample_records,
              wardenRuntimeAdopted=False, actorManifestUnchanged=True,
              preservedProductionHashes=baseline)
(HERE / 'export-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(f"Exported {len(entries)} winter terrain images and four isolated boss samples; {report['addedCompressedBytes']} bytes added")
