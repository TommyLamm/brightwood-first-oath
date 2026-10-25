from pathlib import Path
from PIL import Image

source = Path('art-source/ruins-a/ruins-moss-carapace-atlas-generated.png')
target = Path('art-source/ruins-a/review/candidate-runtime-v1-not-accepted.png')
image = Image.open(source).convert('RGBA')
columns, rows = 6, 5
assert image.width % columns == 0 and image.height % rows == 0
cell_width, cell_height = image.width // columns, image.height // rows
assert cell_width == cell_height == 229, (image.size, cell_width, cell_height)
frames = [[
    image.crop((column * cell_width, row * cell_height,
                (column + 1) * cell_width, (row + 1) * cell_height))
        .convert('RGBa').resize((96, 96), Image.Resampling.LANCZOS).convert('RGBA')
    for column in range(columns)
] for row in range(rows)]
# Pad the unused positions as required; this candidate is not approved for runtime use.
for row, source_column, target_columns in [
    (0, 1, range(2, 6)),
    (2, 3, range(4, 6)),
    (3, 1, range(2, 6)),
    (4, 3, range(4, 6)),
]:
    for column in target_columns:
        frames[row][column] = frames[row][source_column].copy()
atlas = Image.new('RGBA', (columns * 96, rows * 96), (0, 0, 0, 0))
for row in range(rows):
    for column in range(columns):
        atlas.alpha_composite(frames[row][column], (column * 96, row * 96))
target.parent.mkdir(parents=True, exist_ok=True)
atlas.save(target, optimize=True)
print({'source': str(source), 'sourceSize': image.size, 'sourceCell': (cell_width, cell_height),
       'candidate': str(target), 'candidateSize': atlas.size, 'mode': atlas.mode,
       'alphaExtrema': atlas.getchannel('A').getextrema(), 'status': 'not accepted'})
