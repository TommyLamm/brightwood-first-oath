"""Composite exported pixels using production piece coordinates; no generated/drawn art."""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT/'output/terrain-biomes-20261105'
manifest = json.loads((ROOT/'public/assets/environment/manifest.json').read_text(encoding='utf-8'))
assets = {a['key']: a for a in manifest['images']}
examples = json.loads((OUT/'preview-layout.json').read_text(encoding='utf-8'))
row_heights = [40+round(max(p['y']+p['height'] for p in e['platforms']+e['climbs'])*2)+24 for e in examples]
board = Image.new('RGB', (1180, 40+sum(row_heights)), (26, 29, 28))
assert max(board.size) <= 1280
draw = ImageDraw.Draw(board)
font = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 19)
small = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 15)
draw.text((20, 8), 'Biome materials - production atlas pieces (offline preview, not a gameplay screenshot)', font=small, fill='#d2d8cf')
names = ['Forest: mossy timber + leafy vine', 'Red Ridge: sandstone + knotted rope', 'Mineshaft: iron-bound timber + miner ladder']
top = 40
for row, example in enumerate(examples):
    color = [(36, 53, 39), (65, 42, 34), (44, 40, 35)][row]
    draw.rectangle((10, top, 1170, top+row_heights[row]-12), fill=color)
    draw.text((24, top+8), names[row], font=font, fill='#fff0cf')
    for field, key in [('platforms', example['style']['platformKey']), ('climbs', example['style']['climbKey'])]:
        asset = assets[key]
        image = Image.open(ROOT/'public'/asset['url']).convert('RGBA')
        cell = image.width//asset['columns']
        for piece in example[field]:
            x = round(piece['frame']*cell+piece['cropX']*2)
            y = round(piece['cropY']*2)
            tile = image.crop((x, y, x+round(piece['width']*2), y+round(piece['height']*2)))
            board.paste(tile, (24+round(piece['x']*2), top+40+round(piece['y']*2)), tile)
    top += row_heights[row]
board.save(OUT/'materials-preview.jpg', quality=75)
print(f'Saved materials-preview.jpg ({board.width}x{board.height}, JPEG 75).')
