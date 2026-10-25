from pathlib import Path
from PIL import Image
import numpy as np

ROOT = Path('.')
ACTORS = Path('art-source/ruins-a/actors')
TARGET = Path('public/assets/actors')

def normalize_npc(source_name: str, target_name: str) -> dict:
    src = ACTORS / 'generated' / f'{source_name}-generated-v2.png'
    image = Image.open(src).convert('RGBA')
    width, height = image.size
    if width % 2 or height == 0:
        raise ValueError(f'{src}: expected a divisible 2-column, 1-row strip, got {image.size}')
    cell_width = width // 2
    cropped = []
    boxes = []
    for column in range(2):
        cell = image.crop((column * cell_width, 0, (column + 1) * cell_width, height))
        alpha = np.asarray(cell.getchannel('A'))
        ys, xs = np.where(alpha > 8)
        if not len(xs):
            raise ValueError(f'{src}: frame {column} is empty')
        box = (max(0, int(xs.min()) - 3), max(0, int(ys.min()) - 3),
               min(cell_width, int(xs.max()) + 4), min(height, int(ys.max()) + 4))
        # Require a clear alpha gutter so no visible body part is cut at the frame seam.
        if box[0] < 8 or box[2] > cell_width - 8:
            raise ValueError(f'{src}: frame {column} reaches the cell edge: {box}')
        cropped.append(cell.crop(box))
        boxes.append(box)

    scale = min(90 / max(frame.height for frame in cropped),
                76 / max(frame.width for frame in cropped))
    sheet = Image.new('RGBA', (192, 96), (0, 0, 0, 0))
    scaled_sizes = []
    for column, frame in enumerate(cropped):
        out_width = max(1, round(frame.width * scale))
        out_height = max(1, round(frame.height * scale))
        resized = frame.resize((out_width, out_height), Image.Resampling.LANCZOS)
        x = column * 96 + (96 - out_width) // 2
        y = 96 - out_height
        sheet.alpha_composite(resized, (x, y))
        scaled_sizes.append((out_width, out_height, x, y))

    target = TARGET / target_name
    sheet.save(target, optimize=True)
    return {
        'source': str(src), 'sourceSize': image.size, 'sourceCell': (cell_width, height),
        'sourceAlphaBBoxes': boxes, 'commonScale': round(scale, 6),
        'final': str(target), 'finalSize': sheet.size, 'finalMode': sheet.mode,
        'finalAlphaExtrema': sheet.getchannel('A').getextrema(),
        'scaledFrames': scaled_sizes,
    }

for args in [
    ('npc-ruins-archivist', 'npc-ruins-archivist-v1.png'),
    ('npc-ruins-medic', 'npc-ruins-medic-v1.png'),
]:
    print(normalize_npc(*args))
