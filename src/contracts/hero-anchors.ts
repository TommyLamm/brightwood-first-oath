export type HeroAnchorOutfit = 'cloth' | 'leather' | 'iron';

export type HeroAnchorPose = 'idle' | 'walk' | 'jump' | 'climb' | 'attack' | 'hurt' | 'dead' | 'buff';

export type HeroAnchorFrame = {
  hand: { x: number; y: number; rotationDeg: number };
  head: { x: number; y: number };
};

export type HeroAnchorCoordinateSpace = {
  width: 96;
  height: 96;
  origin: 'frame-top-left';
  facing: 'right';
  sourceFramePixels: 128;
};

/** Separate runtime data for the 96×96 hero render frames; it is not an asset-pack manifest. */
export type HeroAnchorManifest = {
  version: 1;
  coordinateSpace: HeroAnchorCoordinateSpace;
  heroes: Record<HeroAnchorOutfit, Record<HeroAnchorPose, HeroAnchorFrame[]>>;
};
