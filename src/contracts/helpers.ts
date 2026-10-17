import type { EntityId, ErrorCode, RandomSource, Result } from './types.js';

export type EntityIdSequence = {
  sessionPrefix: string;
  nextValue: number;
};

export type EntityIdAllocation = {
  id: EntityId;
  next: EntityIdSequence;
};

export function nextEntityId(sequence: EntityIdSequence): EntityIdAllocation {
  if (sequence.sessionPrefix.trim().length === 0) {
    throw new RangeError('Entity ID session prefix must not be empty.');
  }
  if (!Number.isSafeInteger(sequence.nextValue) || sequence.nextValue < 0) {
    throw new RangeError('Entity ID sequence must be a non-negative safe integer.');
  }

  return {
    id: `${sequence.sessionPrefix}:${sequence.nextValue}`,
    next: {
      sessionPrefix: sequence.sessionPrefix,
      nextValue: sequence.nextValue + 1,
    },
  };
}

export function createNextEntityId(
  sessionPrefix: string,
  initialValue = 0,
): () => EntityId {
  let sequence: EntityIdSequence = { sessionPrefix, nextValue: initialValue };
  return () => {
    const allocation = nextEntityId(sequence);
    sequence = allocation.next;
    return allocation.id;
  };
}

export function createSeededRandom(seed: number): RandomSource {
  if (!Number.isSafeInteger(seed)) {
    throw new RangeError('Random seed must be a safe integer.');
  }

  let state = seed >>> 0;
  return {
    next(): number {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
    },
  };
}

export function success<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function failure<T = never>(code: ErrorCode, message: string): Result<T> {
  return { ok: false, code, message };
}
