"""Offline before/after crops at current world scale, not Phaser/browser screenshots."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/quality-pass3-20261105'
manifest = json.loads((ROOT / 'public/assets/environment/manifest.json').read_text(encoding='utf-8'))
assets = {entry['key']: entry for entry in manifest['images']}
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 18)

def frame(key, index=0):
    entry = assets[key]
    image = Image.open(ROOT / 'public' / entry['url']).convert('RGBA')
    width, height = image.width // entry['columns'], image.height // entry['rows']
    return image.crop((index % entry['columns'] * width, index // entry['columns'] * height,
                       (index % entry['columns'] + 1) * width, (index // entry['columns'] + 1) * height))

for row in json.loads((OUT / 'preview-layout.json').read_text(encoding='utf-8')):
    # 600x360 logical world crop, keeping 2 screen pixels per logical pixel.
    canvases = []
    for adopted in (False, True):
        canvas = Image.new('RGB', (1200, 720), '#36434b')
        def paste(image, x, y):
            canvas.paste(image, (round((x - row['originX']) * 2), round((y - row['originY']) * 2)), image)
        ground_key = row['style']['groundKey'] if adopted else 'env:tile-ground'
        tile = frame(ground_key).resize((256, 256), Image.Resampling.NEAREST)
        for ground in row['ground']: paste(tile, ground['x'], ground['y'])
        if adopted:
            for pieces, key in ((row['platforms'], row['style']['platformKey']), (row['climbs'], row['style']['climbKey'])):
                for piece in pieces:
                    source = frame(key, piece['frame'])
                    box = tuple(round(piece[name] * 2) for name in ('cropX', 'cropY'))
                    source = source.crop((box[0], box[1], box[0] + round(piece['width'] * 2), box[1] + round(piece['height'] * 2)))
                    paste(source, piece['x'], piece['y'])
        else:
            tile = frame('env:tile-platform')
            for platform in row['previousPlatforms']: paste(tile, platform['x'], platform['y'])
            for ladder in row['previousClimbs']:
                tile = frame('env:ladder').resize((round(ladder['width'] * 2), round(ladder['height'] * 2)), Image.Resampling.NEAREST)
                paste(tile, ladder['x'] - ladder['width'] * ladder['originX'], ladder['y'] - ladder['height'] * ladder['originY'])
        ImageDraw.Draw(canvas).text((10, 10), row['id'] + (' / adopted winter materials' if adopted else ' / previous common materials') + ' / OFFLINE WORLD CROP', font=font, fill='white')
        canvas.save(OUT / (row['id'] + ('-after.png' if adopted else '-before.png')))
        canvases.append(canvas)
    # Compact handoff image. Full scale crops above remain available separately.
    comparison = Image.new('RGB', (1200, 720))
    for index, canvas in enumerate(canvases):
        comparison.paste(canvas.resize((600, 360), Image.Resampling.LANCZOS), (index * 600, 180))
    draw = ImageDraw.Draw(comparison)
    draw.text((12, 20), 'BEFORE / AFTER - offline material comparison; display reduced to half for handoff', font=font, fill='white')
    comparison.save(OUT / (row['id'] + '-comparison.jpg'), quality=72)
print('Saved before/after terrain crops; not live game screenshots.')
