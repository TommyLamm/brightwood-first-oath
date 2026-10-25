import { describe, expect, it } from 'vitest';
import {
  parallaxTilePositionX,
  tileSpriteBottomAnchoredTilePositionY,
  tileSpriteParallaxTilePositionX,
  tileSpriteSourceDisplayWidth,
} from './parallax.js';

const fakeTileSprite = (sourceWidth: number, sourceHeight = 540, tileScaleX = 1, tileScaleY = 1) => ({
  frame: { width: 960, height: 540 },
  displayFrame: { width: sourceWidth, height: sourceHeight },
  width: 960,
  height: 540,
  tileScaleX,
  tileScaleY,
});

const baseOffset = {
  maxCameraScrollX: 1000,
  factor: 0.5,
  tileScaleX: 1,
  frameWidth: 1920,
  viewportWidth: 960,
  cameraZoom: 1,
};

describe('renderer background parallax geometry', () => {
  it('keeps the texture at its left edge and rounds the visible offset to a screen pixel', () => {
    expect(parallaxTilePositionX({ ...baseOffset, cameraScrollX: 0 })).toBe(0);
    expect(parallaxTilePositionX({ ...baseOffset, cameraScrollX: 5.2 })).toBe(3);
  });

  it('clamps at both the map end and the last non-repeating texture window', () => {
    expect(parallaxTilePositionX({ ...baseOffset, cameraScrollX: 1400 })).toBe(500);
    expect(parallaxTilePositionX({
      ...baseOffset,
      cameraScrollX: 1000,
      factor: 1,
      frameWidth: 1440,
    })).toBe(480);
  });

  it.each([
    ['sky', 0, 960, 0],
    ['far', 0.2, 1440, 368],
    ['mid', 0.5, 1920, 920],
  ] as const)('uses the %s displayFrame at the widest Sunwell map end', (_layer, factor, sourceWidth, expected) => {
    const sprite = fakeTileSprite(sourceWidth);
    expect(sprite.frame.width).toBe(960);
    expect(tileSpriteSourceDisplayWidth(sprite)).toBe(sourceWidth);
    expect(tileSpriteParallaxTilePositionX(sprite, {
      cameraScrollX: 1840,
      maxCameraScrollX: 1840,
      factor,
      cameraZoom: 1,
    })).toBe(expected);
  });

  it('converts a rounded screen-pixel offset through zoom and tile scale', () => {
    expect(parallaxTilePositionX({
      ...baseOffset,
      cameraScrollX: 7,
      factor: 0.5,
      tileScaleX: 2,
      frameWidth: 1920,
      cameraZoom: 2,
    })).toBe(1.75);
  });

  it('keeps an over-wide viewport at the source edge instead of wrapping', () => {
    expect(parallaxTilePositionX({
      ...baseOffset,
      cameraScrollX: 1000,
      viewportWidth: 2000,
    })).toBe(0);
  });

  it('preserves the Sunwell far layer bottom anchor', () => {
    const sunwellFar = { ...fakeTileSprite(1440, 540, 1, 1.6), frame: { width: 960, height: 960 } };
    expect(sunwellFar.displayFrame.height).toBe(540);
    expect(tileSpriteBottomAnchoredTilePositionY(sunwellFar, 540)).toBe(202.5);
  });
});
