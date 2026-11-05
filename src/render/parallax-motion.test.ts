import { describe, expect, it } from 'vitest';
import { ParallaxMotion } from './parallax-motion.js';
import { tileSpriteParallaxTilePositionX } from './parallax.js';

const source = { displayFrame: { width: 1920, height: 540 }, width: 960, tileScaleX: 1 };
function phase(motion: ParallaxMotion, cameraScrollX: number, viewportWidth = 960) {
  return tileSpriteParallaxTilePositionX({ ...source, width: viewportWidth }, {
    cameraScrollX: motion.scrollX(cameraScrollX), maxCameraScrollX: 1000, factor: .5, cameraZoom: 2,
  });
}
describe('optional stationary scenery', () => {
  it('freezes the current phase across camera movement and repeated setting synchronization', () => {
    const motion = new ParallaxMotion();
    expect(phase(motion, 200)).toBe(100);
    motion.setEnabled(false, 200);
    expect(phase(motion, 800)).toBe(100);
    motion.setEnabled(false, 800);
    expect(phase(motion, 0)).toBe(100);
    motion.setEnabled(true, 0);
    expect(phase(motion, 800)).toBe(400);
  });
  it('keeps the existing non-repeating source clamp when the viewport becomes wider', () => {
    const motion = new ParallaxMotion(); motion.setEnabled(false, 800);
    expect(phase(motion, 100, 1800)).toBe(120);
    expect(phase(motion, 100, 2000)).toBe(0);
  });
  it('starts stationary scenery at the new map edge without re-enabling motion', () => {
    const motion = new ParallaxMotion(); motion.setEnabled(false, 800);
    motion.resetForMap();
    expect(motion.enabled).toBe(false); expect(phase(motion, 600)).toBe(0);
    motion.setEnabled(true, 600); motion.resetForMap();
    expect(motion.enabled).toBe(true); expect(phase(motion, 600)).toBe(300);
  });
});
