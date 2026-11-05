"""Material-only world crop using production coordinates, not a game screenshot."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/quality-pass4-20261105'
row = json.loads((OUT / 'terrain-layout.json').read_text(encoding='utf-8'))
assets = {a['key']: a for a in json.loads((ROOT / 'public/assets/environment/manifest.json').read_text(encoding='utf-8'))['images']}
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 18)

def frame(key, index=0):
    a = assets[key]
    image = Image.open(ROOT / 'public' / a['url']).convert('RGBA')
    w, h = image.width // a['columns'], image.height // a['rows']
    return image.crop((index % a['columns'] * w, index // a['columns'] * h, (index % a['columns'] + 1) * w, (index // a['columns'] + 1) * h))

canvases = []
for adopted in (False, True):
    canvas = Image.new('RGB', (1200, 720), '#36434b')
    def paste(image, x, y):
        canvas.paste(image, (round((x - row['originX']) * 2), round((y - row['originY']) * 2)), image)
    tile = frame(row['style']['groundKey'] if adopted else 'env:tile-ground').resize((256, 256), Image.Resampling.NEAREST)
    for ground in row['ground']: paste(tile, ground['x'], ground['y'])
    if adopted:
        for pieces, key in [(row['platforms'], row['style']['platformKey']), (row['climbs'], row['style']['climbKey'])]:
            for piece in pieces:
                x, y = round(piece['cropX'] * 2), round(piece['cropY'] * 2)
                tile = frame(key, piece['frame']).crop((x, y, x + round(piece['width'] * 2), y + round(piece['height'] * 2)))
                paste(tile, piece['x'], piece['y'])
    else:
        for platform in row['previousPlatforms']: paste(frame('env:tile-platform'), platform['x'], platform['y'])
        for ladder in row['previousClimbs']:
            tile = frame('env:ladder').resize((round(ladder['width'] * 2), round(ladder['height'] * 2)), Image.Resampling.NEAREST)
            paste(tile, ladder['x'] - ladder['width'] * ladder['originX'], ladder['y'] - ladder['height'] * ladder['originY'])
    ImageDraw.Draw(canvas).text((10, 10), 'frost-tide-cavern / ' + ('adopted ice materials' if adopted else 'beta.64 common materials') + ' / OFFLINE CROP', font=font, fill='white')
    canvas.save(OUT / ('cave-after.png' if adopted else 'cave-before.png'))
    canvases.append(canvas)
comparison = Image.new('RGB', (1200, 720), '#253039')
for index, canvas in enumerate(canvases): comparison.paste(canvas.resize((600, 360), Image.Resampling.LANCZOS), (index * 600, 180))
ImageDraw.Draw(comparison).text((12, 20), 'BEFORE / AFTER - material-only crop, reduced for handoff; not live gameplay', font=font, fill='white')
comparison.save(OUT / 'cave-material-comparison.jpg', quality=72)
print('Saved cave before/after offline crop.')
