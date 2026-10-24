import type { AssetManifest, AssetPack, AudioLayer } from '../../src/contracts/asset-manifest.js';
import { requiredAssetKeys } from '../../src/app/assets.js';
import type { HeroAnchorFrame, HeroAnchorManifest, HeroAnchorPose } from '../../src/contracts/hero-anchors.js';

function createFrames(count: number): HeroAnchorFrame[] {
  return Array.from({ length: count }, () => ({
    hand: { x: 60, y: 60, rotationDeg: -15 },
    head: { x: 48, y: 32 },
  }));
}

function createOutfit(): Record<HeroAnchorPose, HeroAnchorFrame[]> {
  return {
    idle: createFrames(4),
    walk: createFrames(6),
    jump: createFrames(2),
    climb: createFrames(4),
    attack: createFrames(6),
    hurt: createFrames(2),
    dead: createFrames(4),
    buff: createFrames(4),
  };
}

export function createHeroAnchorFixture(): HeroAnchorManifest {
  return {
    version: 1,
    coordinateSpace: {
      width: 96,
      height: 96,
      origin: 'frame-top-left',
      facing: 'right',
      sourceFramePixels: 128,
    },
    heroes: {
      cloth: createOutfit(),
      leather: createOutfit(),
      iron: createOutfit(),
    },
  };
}

/** A minimal valid manifest for each pack, built from the loader's own required keys. */
export function createManifestFixture(pack: AssetPack): AssetManifest {
  if (pack === 'audio') {
    return {
      version: 1,
      pack,
      images: [],
      animations: [],
      audio: requiredAssetKeys('audio').map((key) => {
        const [group, layer] = key.split(':') as [string, AudioLayer | undefined];
        const music = (key.startsWith('theme-') || key.startsWith('boss-')) && key !== 'boss-win' && key !== 'boss-phase';
        return music
          ? { key, url: `assets/audio/${key.replace(':', '-')}.ogg`, fallbackUrl: `assets/audio/${key.replace(':', '-')}.m4a`, kind: 'music' as const, loop: true, group, layer: layer ?? 'base' }
          : { key, url: `assets/audio/${key}.wav`, kind: 'sfx' as const, loop: false };
      }),
    };
  }
  return {
    version: 1,
    pack,
    images: requiredAssetKeys(pack).map((key, index) => ({
      key,
      url: `assets/${pack}/${index}.png`,
      columns: 1,
      rows: 1,
      displayWidth: 64,
      displayHeight: 64,
      pivotX: 0.5,
      pivotY: 0.5,
    })),
    animations: [],
    audio: [],
  };
}
