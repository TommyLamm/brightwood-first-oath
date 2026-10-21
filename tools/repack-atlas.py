"""Re-slice a misaligned sprite atlas into a clean columns x rows grid.
Each sprite is found as a group of connected alpha components inside its column,
then bottom-aligned in its cell while keeping its horizontal placement."""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

src, dst, cols, rows = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
pad = int(sys.argv[5]) if len(sys.argv) > 5 else 5
DIL = int(sys.argv[6]) if len(sys.argv) > 6 else 3
im = Image.open(src).convert('RGBA')
a = np.array(im)
H, W = a.shape[:2]
cw, ch = W // cols, H // rows
CELL = int(sys.argv[7]) if len(sys.argv) > 7 else ch
out = np.zeros((CELL * rows, max(cw, CELL) * cols, 4), dtype=a.dtype)
OX = (max(cw, CELL) - cw) // 2
alpha = a[:, :, 3] > 8
for c in range(cols):
    x0, x1 = c * cw, (c + 1) * cw
    strip = alpha[:, x0:x1]
    # merge nearby fragments (sweat drops, sword tips) with a small dilation
    lab, n = ndimage.label(ndimage.binary_dilation(strip, iterations=DIL))
    objs = ndimage.find_objects(lab)
    comps = []
    for i, sl in enumerate(objs):
        mask = (lab[sl] == i + 1) & strip[sl]
        area = int(mask.sum())
        if area == 0: continue
        comps.append({'sl': sl, 'id': i + 1, 'area': area, 'cy': (sl[0].start + sl[0].stop) / 2})
    big = sorted([k for k in comps if k['area'] > 2000], key=lambda k: k['cy'])
    if len(big) != rows:
        raise SystemExit(f'column {c}: expected {rows} sprites, found {len(big)} (areas {[k["area"] for k in big]})')
    groups = [[k] for k in big]
    for k in comps:
        if k in big: continue
        def gap(b):
            ys, ye = k['sl'][0].start, k['sl'][0].stop; bs, be = b['sl'][0].start, b['sl'][0].stop
            return max(0, bs - ye, ys - be)
        j = min(range(rows), key=lambda r: (gap(big[r]), abs(big[r]['cy'] - k['cy'])))
        groups[j].append(k)
    for r, g in enumerate(groups):
        y0 = min(k['sl'][0].start for k in g); y1 = max(k['sl'][0].stop for k in g)
        if y1 - y0 + pad > CELL:
            raise SystemExit(f'cell {c},{r}: sprite height {y1 - y0} exceeds cell {CELL}')
        shift = (r + 1) * CELL - pad - y1
        for k in g:
            sl = k['sl']; m = (lab[sl] == k['id']) & strip[sl]
            ys, xs = np.nonzero(m)
            ys_abs = ys + sl[0].start; xs_abs = xs + sl[1].start + x0
            out[ys_abs + shift, xs_abs + c * (max(cw, CELL) - cw) + OX] = a[ys_abs, xs_abs]
Image.fromarray(out).save(dst, optimize=True)
print('ok', src, '->', dst)
