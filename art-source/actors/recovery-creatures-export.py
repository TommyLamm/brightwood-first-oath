"""Repack the existing ImageGen creature sources without redrawing artwork.

Authorized by the user's 2026-10-18 approval of deterministic asset export.
Original PNGs stay untouched. The source sheets have uneven gutters; detect
actual row bands, split at local column valleys, crop alpha, use one fixed scale
per character, reduce to a restrained palette, and nearest-neighbor double.
"""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
HERE = ROOT / 'art-source/actors'
CONFIG = [('snail', '06'), ('mushroom', '06'), ('boar', '04'),
          ('golem', '04'), ('guardian', '04')]
STATES = [('idle', 2, 200, True), ('walk', 6, 120, True),
          ('attack', 4, 350, False), ('hurt', 2, 100, False),
          ('dead', 4, 100, False)]


def runs(values):
    changes = np.diff(np.r_[False, values, False].astype(int))
    return list(zip(np.where(changes == 1)[0], np.where(changes == -1)[0]))


def keep_main_components(a):
    """Drop only detached crop-edge fragments, keeping the real silhouette."""
    mask = a[:, :, 3] > 0
    seen = np.zeros(mask.shape, dtype=bool)
    components = []
    for y, x in zip(*np.where(mask)):
        if seen[y, x]:
            continue
        stack = [(int(y), int(x))]
        seen[y, x] = True
        part = []
        while stack:
            cy, cx = stack.pop()
            part.append((cy, cx))
            for ny, nx in [(cy-1, cx), (cy+1, cx), (cy, cx-1), (cy, cx+1)]:
                if 0 <= ny < mask.shape[0] and 0 <= nx < mask.shape[1] and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    stack.append((ny, nx))
        components.append(part)
    largest = max(map(len, components))
    for part in components:
        if len(part) < max(6, largest * .005):
            yy, xx = zip(*part)
            a[yy, xx] = 0
    return a


def extract(source, columns, rows):
    a = np.array(Image.open(source).convert('RGBA'))
    # Red/yellow matte in these sources is low alpha. Thresholding removes it
    # without recoloring the mushroom's red cap or the boar's russet fur.
    a[:, :, 3] = np.where(a[:, :, 3] >= 128, 255, 0)
    a[a[:, :, 3] == 0] = 0
    mask = a[:, :, 3] > 0
    bands = runs(mask.sum(axis=1) > 5)
    assert len(bands) == rows, (source, bands)
    row_seams = [0] + [(int(bands[i-1][1]) + int(bands[i][0])) // 2 for i in range(1, rows)] + [a.shape[0]]
    frames, bounds = [], []
    for row in range(rows):
        y0, y1 = row_seams[row:row+2]
        weights = mask[y0:y1].sum(axis=0)
        seams = [0]
        for i in range(1, columns):
            expected = round(i*a.shape[1]/columns)
            lo, hi = max(0, expected-35), min(a.shape[1], expected+36)
            minima = np.flatnonzero(weights[lo:hi] == weights[lo:hi].min()) + lo
            seams.append(int(min(minima, key=lambda x: abs(x-expected))))
        seams.append(a.shape[1])
        for col in range(columns):
            x0, x1 = seams[col:col+2]
            piece = keep_main_components(a[y0:y1, x0:x1].copy())
            yy, xx = np.where(piece[:, :, 3] > 0)
            bbox = (int(xx.min()), int(yy.min()), int(xx.max()+1), int(yy.max()+1))
            frames.append(Image.fromarray(piece).crop(bbox))
            bounds.append([x0+bbox[0], y0+bbox[1], x0+bbox[2], y0+bbox[3]])
    return frames, bounds


def export(source, destination, columns, rows, counts, mirror=False):
    raw, bounds = extract(source, columns, rows)
    active = [raw[r*columns+c] for r, count in enumerate(counts) for c in range(count)]
    scale = min(48/max(im.width for im in active), 48/max(im.height for im in active))
    logical = Image.new('RGBA', (columns*64, rows*64))
    for row, count in enumerate(counts):
        for col in range(columns):
            im = raw[row*columns+min(col, count-1)]
            if mirror:
                im = im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            resized = im.resize((max(1, round(im.width*scale)), max(1, round(im.height*scale))), Image.Resampling.NEAREST)
            logical.alpha_composite(resized, (col*64+(64-resized.width)//2, row*64+56-resized.height))
    pixels = np.array(logical)
    opaque = pixels[:, :, 3] > 0
    palette_source = Image.fromarray(pixels[:, :, :3][opaque].reshape(1, -1, 3), 'RGB')
    palette = palette_source.quantize(colors=32, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    colored = logical.convert('RGB').quantize(palette=palette, dither=Image.Dither.NONE).convert('RGBA')
    colored.putalpha(logical.getchannel('A'))
    final = colored.resize((columns*128, rows*128), Image.Resampling.NEAREST)
    final_pixels = np.array(final)
    final_pixels[final_pixels[:, :, 3] == 0] = 0
    final = Image.fromarray(final_pixels)
    destination.parent.mkdir(parents=True, exist_ok=True)
    final.save(destination, optimize=True)
    margins = []
    unique = []
    for row, count in enumerate(counts):
        hashes = []
        for col in range(columns):
            tile = final.crop((col*128, row*128, (col+1)*128, (row+1)*128))
            bbox = tile.getchannel('A').getbbox()
            sides = [bbox[0], bbox[1], 128-bbox[2], 128-bbox[3]]
            assert min(sides) >= 16, (destination, row, col, sides)
            margins.append(sides)
            if col < count:
                hashes.append(hashlib.sha256(tile.tobytes()).hexdigest())
            elif col >= count:
                previous = final.crop(((count-1)*128, row*128, count*128, (row+1)*128))
                assert tile.tobytes() == previous.tobytes()
        assert len(set(hashes)) >= min(2, count), (destination, row, 'no visible pose change')
        unique.append(len(set(hashes)))
    assert set(np.unique(final_pixels[:, :, 3])).issubset({0, 255})
    return {'source': str(source.relative_to(ROOT)).replace('\\', '/'),
            'runtime': str(destination.relative_to(ROOT)).replace('\\', '/'),
            'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
            'sha256': hashlib.sha256(destination.read_bytes()).hexdigest(),
            'dimensions': list(final.size), 'frameSize': [128, 128],
            'paletteColors': len({tuple(p[:3]) for p in final_pixels[final_pixels[:, :, 3] > 0]}),
            'sourceCropBounds': bounds, 'minimumSafeMargin': min(map(min, margins)),
            'distinctActiveFramesPerRow': unique, 'mirroredToFaceRight': mirror,
            'bytes': destination.stat().st_size}


def main():
    subset = {'version': 1, 'pack': 'actors', 'images': [], 'animations': [], 'audio': []}
    evidence = []
    for ident, attempt in CONFIG:
        source = HERE / f'monsters/{ident}/{ident}-atlas-attempt-{attempt}.png'
        dest = ROOT / f'public/assets/actors/monsters/{ident}-atlas-v2.png'
        evidence.append(export(source, dest, 6, 5, [s[1] for s in STATES], mirror=ident == 'guardian'))
        subset['images'].append({'key': f'actor:{ident}', 'url': f'assets/actors/monsters/{ident}-atlas-v2.png', 'columns': 6, 'rows': 5, 'displayWidth': 192 if ident == 'guardian' else 96, 'displayHeight': 192 if ident == 'guardian' else 96, 'pivotX': .5, 'pivotY': 1})
        for row, (state, count, ms, loop) in enumerate(STATES):
            # The single contracted boss attack animation uses the 1800 ms
            # slam. Runtime alignment of the 2100 ms wave is a T07/T14 concern.
            duration = 450 if ident == 'guardian' and state == 'attack' else ms
            subset['animations'].append({'key': f'{ident}:{state}', 'imageKey': f'actor:{ident}', 'frames': list(range(row*6, row*6+count)), 'frameMs': [duration]*count, 'loop': loop})
    source = HERE / 'npcs/merchant/merchant-idle-attempt-06.png'
    dest = ROOT / 'public/assets/actors/npcs/merchant-idle-v2.png'
    evidence.append(export(source, dest, 2, 1, [2]))
    subset['images'].append({'key': 'actor:merchant', 'url': 'assets/actors/npcs/merchant-idle-v2.png', 'columns': 2, 'rows': 1, 'displayWidth': 96, 'displayHeight': 96, 'pivotX': .5, 'pivotY': 1})
    subset['animations'].append({'key': 'npc:merchant:idle', 'imageKey': 'actor:merchant', 'frames': [0, 1], 'frameMs': [350, 350], 'loop': True})
    (HERE / 'recovery-creatures-subset.json').write_text(json.dumps(subset, indent=2)+'\n', encoding='utf-8')
    (HERE / 'recovery-creatures-evidence.json').write_text(json.dumps(evidence, indent=2)+'\n', encoding='utf-8')
    print(json.dumps([{k: e[k] for k in ['runtime', 'dimensions', 'minimumSafeMargin', 'distinctActiveFramesPerRow', 'bytes']} for e in evidence], indent=2))


if __name__ == '__main__':
    main()
