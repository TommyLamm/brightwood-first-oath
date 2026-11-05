"""Offline material/near-midground comparisons, not a browser gameplay capture."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = ROOT / 'output/quality-pass5-20261105'
rows = json.loads((OUT / 'map-usage.json').read_text(encoding='utf-8'))
assets = {e['key']: e for e in json.loads((ROOT / 'public/assets/environment/manifest.json').read_text(encoding='utf-8'))['images']}
old_assets = {e['key']: e for e in json.loads((HERE / 'environment-manifest-before.json').read_text(encoding='utf-8'))['images']}
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 18)

def frame(key, index=0, before=False):
    e = (old_assets if before else assets)[key]
    im = Image.open(ROOT / 'public' / e['url']).convert('RGBA')
    w, h = im.width // e['columns'], im.height // e['rows']
    return im.crop((index % e['columns'] * w, index // e['columns'] * h, (index % e['columns'] + 1) * w, (index // e['columns'] + 1) * h))

for map_id in ['camp', 'sand-glass-shore', 'sand-sunwell-basin', 'ruins-root-causeway', 'ruins-echo-gallery', 'mine-gate', 'red-ridge']:
    row = next(r for r in rows if r['id'] == map_id)
    canvases = []
    for adopted in (False, True):
        canvas = Image.new('RGB', (1200, 720), '#46515b')
        def paste(im, x, y): canvas.paste(im, (round((x - row['originX']) * 2), round((y - row['originY']) * 2)), im)
        tile = frame(row['style']['groundKey'] if adopted else 'env:tile-ground', before=not adopted).resize((256, 256), Image.Resampling.NEAREST)
        for p in row['ground']: paste(tile, p['x'], p['y'])
        # Mine/ridge already had themed platforms in beta.65; compare only their new ground here.
        themed = adopted or map_id in ('mine-gate', 'red-ridge')
        if themed:
            for pieces, key in [(row['platforms'], row['style']['platformKey']), (row['climbs'], row['style']['climbKey'])]:
                for p in pieces:
                    x, y = round(p['cropX'] * 2), round(p['cropY'] * 2)
                    im = frame(key, p['frame'], before=not adopted).crop((x, y, x + round(p['width'] * 2), y + round(p['height'] * 2)))
                    paste(im, p['x'], p['y'])
        else:
            for p in row['previousPlatforms']: paste(frame('env:tile-platform', before=True), p['x'], p['y'])
            for p in row['previousClimbs']:
                im = frame('env:ladder', before=True).resize((round(p['width'] * 2), round(p['height'] * 2)), Image.Resampling.NEAREST)
                paste(im, p['x'] - p['width'] * p['originX'], p['y'] - p['height'] * p['originY'])
        ImageDraw.Draw(canvas).text((12, 10), map_id + (' / beta.66' if adopted else ' / beta.65') + ' / OFFLINE MATERIAL CROP', font=font, fill='white')
        canvas.save(OUT / f'{map_id}-{"after" if adopted else "before"}.png')
        canvases.append(canvas)
    comparison = Image.new('RGB', (1200, 720), '#253039')
    for n, canvas in enumerate(canvases): comparison.paste(canvas.resize((600, 360), Image.Resampling.LANCZOS), (n * 600, 180))
    ImageDraw.Draw(comparison).text((12, 20), map_id + ' / BEFORE - AFTER / reduced offline material comparison', font=font, fill='white')
    comparison.save(OUT / f'{map_id}-comparison.jpg', quality=72)

for theme in ('forest', 'rock', 'frost', 'ruins-gallery', 'mine'):
    review = Image.new('RGB', (1200, 800), '#46515b')
    draw = ImageDraw.Draw(review)
    draw.text((12, 10), theme + ' / NEAR MIDGROUND DETAIL / normal 2 screen px per logical px', font=font, fill='white')
    for n, adopted in enumerate((False, True)):
        key = f'env:{"rock" if theme == "mine" and not adopted else theme}:mid'
        im = frame(key, before=not adopted)
        # Mine's distinctive entrance is on the right, all others show a left-side near detail.
        x = 1520 if theme == 'mine' else 0
        im = im.crop((x, 0, x + 400, 180)).resize((800, 360), Image.Resampling.NEAREST)
        review.paste(im, (200, 40 + n * 390), im)
        draw.text((12, 45 + n * 390), 'AFTER' if adopted else 'BEFORE', font=font, fill='white')
    review.save(OUT / f'{theme}-mid-comparison.jpg', quality=72)
print('Saved seven terrain crops and five midground detail comparisons.')
