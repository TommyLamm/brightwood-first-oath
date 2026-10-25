import { describe, expect, it } from 'vitest';
import { acceptQuest, getQuestView, recordQuestEvent } from '../src/domain/quests/index.js';
import { activeBSave, beforeBSave, ruinsBCatalog } from './ruins-b-fixtures.js';

describe('ruins inspect objective', () => {
  it('does not record inspections before acceptance, then caps each stele at one', () => {
    const hiddenProgress = recordQuestEvent({}, { type: 'inspected', targetId: 'ruins-stele-west' }, ruinsBCatalog.world);
    expect(hiddenProgress).toEqual({});

    const accepted = acceptQuest(beforeBSave(), 'q17', ruinsBCatalog);
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;
    expect(accepted.value.quests.q17?.counters).toEqual({
      'ruins-stele-west': 0,
      'ruins-stele-east': 0,
      'ruins-string-puppet': 0,
    });

    const west = recordQuestEvent(accepted.value.quests, { type: 'inspected', targetId: 'ruins-stele-west' }, ruinsBCatalog.world);
    const westAgain = recordQuestEvent(west, { type: 'inspected', targetId: 'ruins-stele-west' }, ruinsBCatalog.world);
    expect(westAgain.q17?.counters['ruins-stele-west']).toBe(1);
    expect(westAgain.q17?.counters['ruins-stele-east']).toBe(0);
    expect(accepted.value.quests.q17?.counters['ruins-stele-west']).toBe(0);

    const both = recordQuestEvent(westAgain, { type: 'inspected', targetId: 'ruins-stele-east' }, ruinsBCatalog.world);
    expect(getQuestView({ ...accepted.value, quests: both }, 'q17', ruinsBCatalog).objectives.slice(0, 2))
      .toMatchObject([{ current: 1, required: 1 }, { current: 1, required: 1 }]);
  });

  it('keeps q17 and q20 progress independent', () => {
    const data = activeBSave();
    const acceptedQ20 = acceptQuest(data, 'q20', ruinsBCatalog);
    expect(acceptedQ20.ok).toBe(true);
    if (!acceptedQ20.ok) return;

    const inspected = recordQuestEvent(acceptedQ20.value.quests, { type: 'inspected', targetId: 'ruins-stele-west' }, ruinsBCatalog.world);
    expect(inspected.q17?.counters['ruins-stele-west']).toBe(1);
    expect(inspected.q20?.counters).not.toHaveProperty('ruins-stele-west');
    expect(inspected.q20?.counters['ruins-bell-prowler']).toBe(0);
  });
});
