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
