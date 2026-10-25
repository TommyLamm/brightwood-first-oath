from pathlib import Path
import sys
import numpy as np
from PIL import Image

source = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('art-source/ruins-a/ruins-moss-carapace-atlas-generated-v3.png')
im = np.array(Image.open(source).convert('RGBA'))
a = im[:, :, 3] > 8
height, width = a.shape
columns, rows = 6, 5
cell_width, cell_height = width // columns, height // rows
cells = []
empty = 0
for row in range(rows):
    for column in range(columns):
        cell = a[row * cell_height:(row + 1) * cell_height,
                 column * cell_width:(column + 1) * cell_width]
        ys, xs = np.where(cell)
        if len(xs) == 0:
            empty += 1
            continue
        cells.append((int(xs.min()), int(cell_width - 1 - xs.max()),
                      int(ys.min()), int(cell_height - 1 - ys.max())))
vertical_edge_pixels = sum(int(a[:, edge - 2:edge + 2].sum())
                           for edge in range(cell_width, width, cell_width))
horizontal_edge_pixels = sum(int(a[edge - 2:edge + 2, :].sum())
                             for edge in range(cell_height, height, cell_height))
print({
    'source': str(source),
    'source_size': (width, height),
    'grid_cell': (cell_width, cell_height),
    'divisible': width % columns == 0 and height % rows == 0,
    'empty_cells': empty,
    'min_cell_margins': [min(cell[axis] for cell in cells) for axis in range(4)] if cells else None,
    'alpha_pixels_near_internal_grid_edges': {
        'vertical': vertical_edge_pixels,
        'horizontal': horizontal_edge_pixels,
    },
})
