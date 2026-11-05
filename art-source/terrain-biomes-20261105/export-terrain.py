"""Technical export only: alpha cleanup, density, atlas slicing and seam wrapping.

Creative pixels come from the six built-in ImageGen originals beside this script.
Run from any directory: python art-source/terrain-biomes-20261105/export-terrain.py
"""
from pathlib import Path
import hashlib
import json

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
DEST = ROOT / 'public/assets/environment'
RECORDS = []


def source(name):
    path = HERE / f'{name}-generated.png'
    image = Image.open(path).convert('RGBA')
    alpha = image.getchannel('A').point(lambda a: 0 if a < 64 else a)
    image.putalpha(alpha)
    bounds = alpha.getbbox()
    assert bounds, name
    return path, image.crop(bounds), bounds


def resize(image, size):
    return image.convert('RGBa').resize(size, Image.Resampling.LANCZOS).convert('RGBA')


def seam_edge(image, profile, axis, end, band=8):
    """Wrap only internal join bands in premultiplied color; outer caps stay intact."""
    pixels = np.asarray(image.convert('RGBa'), dtype=np.float64).copy()
    for edge_end in end if isinstance(end, tuple) else (end,):
        for i in range(band):
            weight = (band - i) / band
            at = (-1-i) if edge_end else i
            if axis == 'x':
                pixels[:, at] = pixels[:, at] * (1-weight) + profile * weight
            else:
                pixels[at, :] = pixels[at, :] * (1-weight) + profile * weight
    return Image.frombytes('RGBa', image.size, np.rint(pixels).astype('uint8').tobytes()).convert('RGBA')


def finish(name, key, frames, display, source_path, source_bounds):
    width, height = frames[0].size
    atlas = Image.new('RGBA', (width * len(frames), height))
    for i, frame in enumerate(frames):
        assert frame.size == (width, height) and frame.getchannel('A').getbbox()
        atlas.paste(frame, (width*i, 0))
    assert atlas.getchannel('A').getextrema()[0] == 0
    path = DEST / f'env-{name}-biome-v1.png'
    atlas.save(path, optimize=True)
    entry = dict(key=key, url='assets/environment/'+path.name, columns=len(frames), rows=1,
                 displayWidth=display[0], displayHeight=display[1], pivotX=0, pivotY=0)
    RECORDS.append(dict(**entry, source=source_path.name, sourceBounds=source_bounds,
                        sourceSha256=hashlib.sha256(source_path.read_bytes()).hexdigest(),
                        outputSha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                        pixels=list(atlas.size), compressedBytes=path.stat().st_size,
                        baseRgbaBytes=atlas.width*atlas.height*4, density=2))
    return entry


def platform(style):
    path, image, bounds = source(style+'-platform')
    # Preserve source aspect. At 2x density, the continuous walk surface is row 16.
    image = resize(image, (640, round(image.height*640/image.width)))
    alpha = np.asarray(image.getchannel('A'))
    first_rows = [np.flatnonzero(alpha[:, x] > 127)[0]
                  for x in range(90, 550) if np.any(alpha[:, x] > 127)]
    surface = round(float(np.median(first_rows)))
    strip = Image.new('RGBA', (640, 96))
    strip.paste(image, (0, 16-surface))
    frames = [strip.crop((128*i, 0, 128*(i+1), 96)) for i in range(5)]
    # Common internal seam profile excludes the outer silhouettes and large decorations.
    colors = np.asarray(strip.convert('RGBa'), dtype=np.float64)
    profile = np.median(colors[:, [180, 250, 330, 410, 480]], axis=1)
    for i in range(5):
        ends = (True,) if i == 0 else (False,) if i == 4 else (False, True)
        frames[i] = seam_edge(frames[i], profile, 'x', ends)
    for a, b in zip(frames, frames[1:]):
        assert np.array_equal(np.asarray(a)[:, -1], np.asarray(b)[:, 0])
    return finish(style+'-platform', f'env:{style}:platform', frames, (64, 48), path, bounds)


def climber(style, kind):
    path, image, bounds = source(style+'-'+kind)
    scale = min(56/image.width, 384/image.height)
    image = resize(image, (max(1, round(image.width*scale)), round(image.height*scale)))
    strip = Image.new('RGBA', (64, image.height))
    strip.paste(image, ((64-image.width)//2, 0))
    height = strip.height
    assert height >= 192
    middle = (height-64)//2
    frames = [strip.crop((0, 0, 64, 64)), strip.crop((0, middle, 64, middle+64)),
              strip.crop((0, height-64, 64, height))]
    colors = np.asarray(strip.convert('RGBa'), dtype=np.float64)
    alpha = np.asarray(strip.getchannel('A'))
    # Choose a thin core/rail row, avoiding leaves, knots and ladder rungs at joins.
    join = min(range(64, height-64), key=lambda y: np.count_nonzero(alpha[y] > 127))
    profile = colors[join]
    frames[0] = seam_edge(frames[0], profile, 'y', True)
    frames[1] = seam_edge(frames[1], profile, 'y', (False, True))
    frames[2] = seam_edge(frames[2], profile, 'y', False)
    assert np.array_equal(np.asarray(frames[0])[-1], np.asarray(frames[1])[0])
    assert np.array_equal(np.asarray(frames[1])[-1], np.asarray(frames[2])[0])
    return finish(style+'-'+kind, f'env:{style}:{kind}', frames, (32, 32), path, bounds)


def main():
    entries = []
    for style, kind in [('forest', 'vine'), ('ridge', 'rope'), ('mine', 'ladder')]:
        entries.extend([platform(style), climber(style, kind)])
    manifest_path = DEST / 'manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    new_keys = {entry['key'] for entry in entries}
    manifest['images'] = [a for a in manifest['images'] if a['key'] not in new_keys] + entries
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')
    report = dict(tool='built-in imagegen', export='premultiplied resample, alpha cleanup, slice, internal seam wrap',
                  platformFrames=['left-cap', 'body-a', 'body-b', 'body-c', 'right-cap'],
                  climbFrames=['top-cap', 'body', 'bottom-cap'],
                  platformSurfaceInset=8, records=RECORDS,
                  addedCompressedBytes=sum(r['compressedBytes'] for r in RECORDS),
                  addedBaseRgbaBytes=sum(r['baseRgbaBytes'] for r in RECORDS))
    (HERE/'export-report.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
    print(f"Exported {len(entries)} atlases; {report['addedCompressedBytes']} compressed bytes; {report['addedBaseRgbaBytes']} base RGBA bytes")


if __name__ == '__main__':
    main()
