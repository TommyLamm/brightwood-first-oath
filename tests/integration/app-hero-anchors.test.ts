import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadRequiredHeroAnchors } from '../../src/app/assets.js';

const committedAnchors: unknown = JSON.parse(readFileSync(
  new URL('../../public/assets/actors/anchors.json', import.meta.url),
  'utf8',
));

describe('hero anchor asset loader', () => {
  it('loads the committed anchor file through an entry-relative version path', async () => {
    const requested: string[] = [];
    const anchors = await loadRequiredHeroAnchors('./versions/1.0.0/', async (url) => {
      requested.push(url);
      return { ok: true, status: 200, json: async () => committedAnchors };
    });

    expect(requested).toEqual(['./versions/1.0.0/assets/actors/anchors.json']);
    expect(anchors.coordinateSpace).toEqual({
      width: 96,
      height: 96,
      origin: 'frame-top-left',
      facing: 'right',
      sourceFramePixels: 128,
    });
    expect(Object.values(anchors.heroes).flatMap((outfit) => Object.values(outfit)).flat())
      .toHaveLength(96);
  });
});
