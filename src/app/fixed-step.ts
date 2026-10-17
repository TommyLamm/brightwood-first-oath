export const FIXED_STEP_MS = 1000 / 60;
export const FIXED_STEP_SECONDS = 1 / 60;
export const MAX_CATCH_UP_STEPS = 5;

export type FixedStepFrame = {
  steps: number;
  gameTimeMs: number;
  tickTimesMs: number[];
  droppedBacklog: boolean;
};

/** Converts renderer deltas into deterministic 60 Hz simulation steps. */
export class FixedStepClock {
  private accumulatorMs = 0;
  private tickCount = 0;

  get gameTimeMs(): number {
    return Math.floor(this.tickCount * 1000 / 60);
  }

  get pendingMs(): number {
    return this.accumulatorMs;
  }

  clearAccumulator(): void {
    this.accumulatorMs = 0;
  }

  reset(): void {
    this.accumulatorMs = 0;
    this.tickCount = 0;
  }

  advance(deltaMs: number, frozen: boolean): FixedStepFrame {
    if (frozen) {
      this.clearAccumulator();
      return { steps: 0, gameTimeMs: this.gameTimeMs, tickTimesMs: [], droppedBacklog: false };
    }

    if (Number.isFinite(deltaMs) && deltaMs > 0) this.accumulatorMs += deltaMs;
    const availableSteps = Math.floor((this.accumulatorMs + 1e-7) / FIXED_STEP_MS);
    const steps = Math.min(availableSteps, MAX_CATCH_UP_STEPS);
    const previousTickCount = this.tickCount;
    this.tickCount += steps;
    this.accumulatorMs -= steps * FIXED_STEP_MS;

    const droppedBacklog = availableSteps > MAX_CATCH_UP_STEPS
      || (availableSteps === MAX_CATCH_UP_STEPS && this.accumulatorMs > 1e-7);
    if (droppedBacklog) this.clearAccumulator();

    const tickTimesMs = Array.from({ length: steps }, (_, index) =>
      Math.floor((previousTickCount + index + 1) * 1000 / 60));
    return { steps, gameTimeMs: this.gameTimeMs, tickTimesMs, droppedBacklog };
  }
}
