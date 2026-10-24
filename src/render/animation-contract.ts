import type { AssetAnimation } from '../contracts/asset-manifest.js';

export function animationConformsToUse(imageKey: string, state: string, animation: AssetAnimation): boolean {
  const animationState = state.split(':').at(-1) ?? state;
  const frameCounts: Record<string, number> = imageKey.startsWith('actor:hero-')
    ? { idle: 4, walk: 6, jump: 2, climb: 4, attack: 6, hurt: 2, dead: 4, buff: 4 }
    : imageKey.startsWith('actor:') && state.startsWith('npc:')
      ? { idle: 2 }
      : imageKey.startsWith('actor:')
        ? imageKey === 'actor:sand-scorpion' || imageKey === 'actor:sunwell-beetle'
          ? { idle: 2, walk: 4, attack: 4, hurt: 2, dead: 4 }
          : { idle: 2, walk: 6, attack: 4, hurt: 2, dead: 4 }
        : { [animationState]: 6 };
  const expectedFrameCount = frameCounts[animationState];
  if (animation.frames.length !== expectedFrameCount) return false;

  const expectedFrameMs: Record<string, number> = imageKey.startsWith('actor:hero-')
    ? { idle: 180, walk: 100, climb: 120, hurt: 100, dead: 120, buff: 100 }
    : imageKey.startsWith('actor:') && state.startsWith('npc:')
      ? { idle: 350 }
      : imageKey.startsWith('actor:')
        ? { idle: 200, walk: 120, hurt: 100, dead: 100 }
        : { [animationState]: 60 };
  const frameMs = expectedFrameMs[animationState];
  if (frameMs !== undefined && animation.frameMs.some((value) => value !== frameMs)) return false;
  const expectedLoop = imageKey.startsWith('actor:hero-')
    ? animationState === 'idle' || animationState === 'walk' || animationState === 'climb'
      ? true
      : ['attack', 'hurt', 'dead'].includes(animationState) ? false : undefined
    : imageKey.startsWith('actor:') && state.startsWith('npc:')
      ? true
      : imageKey.startsWith('actor:')
        ? animationState === 'idle' || animationState === 'walk'
        : false;
  if (expectedLoop !== undefined && animation.loop !== expectedLoop) return false;
  return true;
}