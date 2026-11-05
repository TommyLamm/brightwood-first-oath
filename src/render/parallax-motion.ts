/** Freezes the current view instead of snapping the scenery to the map's left edge. */
export class ParallaxMotion {
  private frozenScrollX: number | null = null;
  get enabled(): boolean { return this.frozenScrollX === null; }
  setEnabled(enabled: boolean, currentScrollX: number): void {
    if (enabled) this.frozenScrollX = null;
    else this.frozenScrollX ??= Number.isFinite(currentScrollX) ? Math.max(0, currentScrollX) : 0;
  }
  scrollX(currentScrollX: number): number { return this.frozenScrollX ?? currentScrollX; }
  resetForMap(): void { if (this.frozenScrollX !== null) this.frozenScrollX = 0; }
}
