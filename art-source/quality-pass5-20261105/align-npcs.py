"""Register idle feet with integer translations; retain the authored gesture pixels."""
import hashlib
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
PUBLIC = ROOT / 'public'
OUT = ROOT / 'output/quality-pass5-20261105'
before = json.loads((HERE / 'actors-manifest-before.json').read_text(encoding='utf-8'))
manifest_path = PUBLIC / 'assets/actors/manifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
ids = ['guide', 'mentor', 'healer', 'keeper', 'merchant', 'frost-guide', 'sands-guide',
       'ruins-archivist', 'ruins-medic', 'ruins-pathfinder']
records = []
review = Image.new('RGB', (1200, 1000), '#46515b')
draw = ImageDraw.Draw(review)

def best_shift(first, second, start_y):
    a = np.asarray(first.getchannel('A'))[start_y:] >= 128
    b = np.asarray(second.getchannel('A'))[start_y:] >= 128
    width = first.width
    scores = []
    for dx in range(-width // 3, width // 3 + 1):
        shifted = np.zeros_like(b)
        if dx >= 0: shifted[:, dx:] = b[:, :width-dx]
        else: shifted[:, :dx] = b[:, -dx:]
        scores.append((np.count_nonzero(a ^ shifted), abs(dx), dx))
    return min(scores)[2]

for index, npc_id in enumerate(ids):
    entry = next(e for e in before['images'] if e['key'] == 'actor:' + npc_id)
    source_path = PUBLIC / entry['url']
    original_bytes = source_path.read_bytes()
    atlas = Image.open(source_path).convert('RGBA')
    assert entry['columns'] == 2 and entry['rows'] == 1
    width, height = atlas.width // 2, atlas.height
    first = atlas.crop((0, 0, width, height))
    second = atlas.crop((width, 0, width * 2, height))
    bounds = first.getchannel('A').point(lambda a: 255 if a >= 128 else 0).getbbox()
    foot_y = int(bounds[3] - 1 - (bounds[3] - 1 - bounds[1]) * .15)
    measured_dx = best_shift(first, second, foot_y)
    logical_dx = measured_dx * entry['displayWidth'] / width
    # Do not remove sub-pixel natural breathing/stance variation in the three later NPCs.
    dx = measured_dx if abs(logical_dx) >= 1 else 0
    shifted = Image.new('RGBA', (width, height))
    shifted.paste(second, (dx, 0))
    assert np.count_nonzero(np.asarray(shifted.getchannel('A')) >= 8) == np.count_nonzero(np.asarray(second.getchannel('A')) >= 8)
    output_entry = dict(entry)
    if dx:
        assert best_shift(first, shifted, foot_y) == 0
        result = atlas.copy()
        result.paste(shifted, (width, 0))
        assert result.crop((0, 0, width, height)).tobytes() == first.tobytes()
        assert shifted.getchannel('A').getbbox()[3] == second.getchannel('A').getbbox()[3]
        output_path = source_path.with_name(source_path.stem + '-aligned-v1.png')
        result.save(output_path, optimize=True)
        output_entry['url'] = output_path.relative_to(PUBLIC).as_posix()
        next(e for e in manifest['images'] if e['key'] == entry['key'])['url'] = output_entry['url']
    else:
        result = atlas
        output_path = source_path
    assert source_path.read_bytes() == original_bytes
    record = dict(key=entry['key'], previousUrl=entry['url'], url=output_entry['url'], sourceSha256=hashlib.sha256(original_bytes).hexdigest(),
                  outputSha256=hashlib.sha256(output_path.read_bytes()).hexdigest(), pixels=list(result.size),
                  measuredSecondFrameShiftPx=measured_dx, appliedSecondFrameShiftPx=dx,
                  eliminatedDriftLogicalPx=abs(dx * entry['displayWidth'] / width), footBandStartY=foot_y,
                  residualRegistrationLogicalPx=abs(best_shift(first, shifted, foot_y) * entry['displayWidth'] / width),
                  addedCompressedBytes=output_path.stat().st_size if dx else 0, previousBytes=source_path.stat().st_size,
                  baseRgbaBytes=result.width * result.height * 4)
    records.append(record)
    x, y = index % 5 * 240, index // 5 * 500
    draw.text((x + 5, y + 5), npc_id + (' / aligned' if dx else ' / retained'), fill='white')
    previews = []
    for n in range(2):
        cell = result.crop((n * width, 0, (n + 1) * width, height))
        cell.thumbnail((230, 230), Image.Resampling.LANCZOS)
        review.paste(cell, (x + 5, y + 25 + n * 235), cell)
        live = result.crop((n * width, 0, (n + 1) * width, height)).resize((entry['displayWidth'] * 2, entry['displayHeight'] * 2), Image.Resampling.NEAREST)
        preview = Image.new('RGB', live.size, '#46515b'); preview.paste(live, (0, 0), live)
        previews.append(preview)
    previews[0].save(OUT / f'npc-{npc_id}-idle.gif', save_all=True, append_images=previews[1:], duration=350, loop=0)

expected = json.loads(json.dumps(before))
for record in records: next(e for e in expected['images'] if e['key'] == record['key'])['url'] = record['url']
assert manifest == expected
assert manifest['animations'] == before['animations']
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
review.save(OUT / 'npc-aligned-review.jpg', quality=72)
(HERE / 'npc-alignment-report.json').write_text(json.dumps(dict(method='Integer horizontal translation using bottom 15% opaque-foot registration; first frame and all timings unchanged', records=records), indent=2), encoding='utf-8')
print('Aligned', sum(bool(r['appliedSecondFrameShiftPx']) for r in records), 'NPCs; retained three with less than one logical pixel of stance variation. No artwork regenerated.')
