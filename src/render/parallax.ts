export type ParallaxTilePositionXInput = Readonly<{
  cameraScrollX: number;
  maxCameraScrollX: number;
  factor: number;
  tileScaleX: number;
  frameWidth: number;
  viewportWidth: number;
  cameraZoom: number;
}>;

export type TileSpriteSourceGeometry = Readonly<{
  displayFrame: Readonly<{ width: number; height: number }>;
  width: number;
  height: number;
  tileScaleX: number;
  tileScaleY: number;
}>;

export type TileSpriteParallaxInput = Omit<ParallaxTilePositionXInput, 'frameWidth' | 'viewportWidth' | 'tileScaleX'>;

/**
 * Converts the final camera scroll into a TileSprite texture offset. Rounding happens in
 * screen pixels before the offset is converted back through camera zoom and tile scale.
 */
export function parallaxTilePositionX({
  cameraScrollX,
  maxCameraScrollX,
  factor,
  tileScaleX,
  frameWidth,
  viewportWidth,
  cameraZoom,
}: ParallaxTilePositionXInput): number {
  if (
    !Number.isFinite(cameraScrollX)
    || !Number.isFinite(maxCameraScrollX)
    || !Number.isFinite(factor)
    || !Number.isFinite(tileScaleX)
    || !Number.isFinite(frameWidth)
    || !Number.isFinite(viewportWidth)
    || !Number.isFinite(cameraZoom)
    || factor <= 0
    || tileScaleX <= 0
    || frameWidth <= 0
    || viewportWidth <= 0
    || cameraZoom <= 0
  ) {
    return 0;
  }

  const clampedCameraScrollX = Math.min(Math.max(cameraScrollX, 0), Math.max(maxCameraScrollX, 0));
  const sourceDisplayWidth = frameWidth * tileScaleX;
  const availableDisplayPixels = Math.floor(Math.max(0, (sourceDisplayWidth - viewportWidth) * cameraZoom));
  const roundedDisplayOffset = Math.round(clampedCameraScrollX * factor * cameraZoom);
  const displayOffset = Math.min(roundedDisplayOffset, availableDisplayPixels);

  return displayOffset / (cameraZoom * tileScaleX);
}

/** TileSprite.frame describes its internal canvas; displayFrame describes the sampled source image. */
export function tileSpriteSourceDisplayWidth(sprite: Pick<TileSpriteSourceGeometry, 'displayFrame' | 'tileScaleX'>): number {
  return sprite.displayFrame.width * sprite.tileScaleX;
}

/** Uses the source image dimensions rather than TileSprite.frame's internal viewport canvas. */
export function tileSpriteParallaxTilePositionX(
  sprite: Pick<TileSpriteSourceGeometry, 'displayFrame' | 'width' | 'tileScaleX'>,
  input: TileSpriteParallaxInput,
): number {
  return parallaxTilePositionX({
    ...input,
    tileScaleX: sprite.tileScaleX,
    frameWidth: sprite.displayFrame.width,
    viewportWidth: sprite.width,
  });
}

/** Keeps an enlarged vertical layer aligned to the texture's bottom edge. */
export function bottomAnchoredTilePositionY(frameHeight: number, viewportHeight: number, tileScaleY: number): number {
  if (!Number.isFinite(frameHeight) || !Number.isFinite(viewportHeight) || !Number.isFinite(tileScaleY) || tileScaleY <= 0) {
    return 0;
  }

  return frameHeight - viewportHeight / tileScaleY;
}

export function tileSpriteBottomAnchoredTilePositionY(
  sprite: Pick<TileSpriteSourceGeometry, 'displayFrame' | 'tileScaleY'>,
  viewportHeight: number,
): number {
  return bottomAnchoredTilePositionY(sprite.displayFrame.height, viewportHeight, sprite.tileScaleY);
}
