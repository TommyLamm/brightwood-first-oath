import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AssetPack } from '../../src/contracts/asset-manifest.js';
import type { StorageLike } from '../../src/contracts/ports.js';
import { GameApp } from '../../src/app/app.js';
import { createHeroAnchorFixture, createManifestFixture } from './asset-fixtures.js';

const fetcher = async (url: string) => ({ ok: true, status: 200, json: async () => url.endsWith('/anchors.json')
  ? createHeroAnchorFixture() : createManifestFixture(url.split('/').at(-2) as AssetPack) });
const tick = 1000 / 60;
afterEach(() => vi.restoreAllMocks());
async function setup() {
  const commands: { at: number; skill: string }[] = [];
  const seen = new Set<string>(); const attacks: string[] = [];
  const app = new GameApp({ baseUrl: './', fetcher, seed: 77, sessionPrefix: 'held-basic', onFixedStep: step => {
    for (const command of step.commands) if (command.type === 'attack') commands.push({ at: step.gameTimeMs, skill: command.payload.skillId });
    for (const attack of app.state.gameplay?.combat.attacks ?? []) {
      if (attack.sourceId === app.state.gameplay?.playerEntityId && !seen.has(attack.id)) { seen.add(attack.id); attacks.push(attack.skillId); }
    }
  } });
  expect((await app.initialize()).ready).toBe(true);
  app.dispatch({ type: 'playTemporary', payload: {} }); app.update(0);
  app.state.gameplay!.monsters = [];
  let held = true;
  vi.spyOn(app, 'isActionHeld').mockImplementation(action => held && action === 'attack');
  const run = (count: number) => { for (let n = 0; n < count; n++) app.update(tick); };
  const enable = () => { app.dispatch({ type: 'setHoldAttack', payload: { enabled: true } }); app.update(0); };
  return { app, commands, attacks, run, enable, release: () => { held = false; } };
}

describe('optional held basic attack', () => {
  it('defaults to single press, repeats only at the original action/cooldown rate, and stops on release', async () => {
    const q = await setup(); q.run(35);
    expect(q.commands).toHaveLength(0);
    q.enable(); q.run(100);
    expect(q.commands.length).toBeGreaterThanOrEqual(2);
    const skill = q.app.state.catalog!.rules.skills.basic!;
    const interval = Math.max(skill.cooldownMs, skill.windupMs + skill.activeMs + skill.recoveryMs);
    for (let n = 1; n < q.commands.length; n++) expect(q.commands[n]!.at - q.commands[n - 1]!.at).toBeGreaterThanOrEqual(interval);
    expect(q.commands.every(command => command.skill === 'basic')).toBe(true);
    const count = q.commands.length; q.release(); q.run(80);
    expect(q.commands).toHaveLength(count);
    q.app.dispose();
  });

  it('lets a manually queued skill chain after the current swing before another held basic attack', async () => {
    const q = await setup();
    const player = q.app.state.gameplay!.saveData.player;
    player.level = 10; player.job = 'swordsman'; player.skillRanks['heavy-strike'] = 1;
    q.enable(); q.run(26);
    q.app.dispatch({ type: 'attack', payload: { skillId: 'heavy-strike' } }); q.run(20);
    expect(q.attacks.slice(0, 2)).toEqual(['basic', 'heavy-strike']);
    q.app.dispose();
  });

  it('does not repeat through panels, pause, focus loss, visual loading, climbing, knockback or death', async () => {
    const cases = ['panel', 'pause', 'focus', 'loading', 'climb', 'knockback', 'dead'];
    for (const kind of cases) {
      const q = await setup(); q.enable();
      const gameplay = q.app.state.gameplay!;
      if (kind === 'panel') { q.app.dispatch({ type: 'setPanel', payload: { panel: 'inventory' } }); q.app.update(0); }
      if (kind === 'pause') q.app.setScreen('paused');
      if (kind === 'focus') q.app.setWindowFocused(false);
      if (kind === 'loading') q.app.beginMapVisualLoad(q.app.state.catalog!.world.maps.camp!);
      if (kind === 'climb') {
        const route = q.app.state.catalog!.world.maps.camp!.ladders[0]!;
        gameplay.movement = { ...gameplay.movement, mode: 'climbing', ladderId: route.id, position: { x: route.x, y: (route.topY + route.bottomY) / 2 } };
      }
      if (kind === 'knockback') gameplay.movement.knockbackUntilMs = 100_000;
      if (kind === 'dead') gameplay.saveData.player.hp = 0;
      q.run(5);
      expect(q.commands, kind).toHaveLength(0);
      q.app.dispose();
    }
  });

  it('stores an isolated device preference and keeps blocked-storage choices usable for the session', () => {
    const values = new Map([['hold-test:save:v1', 'original save']]);
    const storage: StorageLike = { getItem: key => values.get(key) ?? null,
      setItem: (key, value) => { values.set(key, value); }, removeItem: key => { values.delete(key); } };
    const app = new GameApp({ baseUrl: './', fetcher, gameId: 'hold-test', storage });
    app.dispatch({ type: 'setHoldAttack', payload: { enabled: true } }); app.update(0);
    expect(new GameApp({ baseUrl: './', fetcher, gameId: 'hold-test', storage }).state.holdBasicAttack).toBe(true);
    expect(new GameApp({ baseUrl: './', fetcher, gameId: 'other-game', storage }).state.holdBasicAttack).toBe(false);
    expect(values.get('hold-test:save:v1')).toBe('original save');
    const blocked = () => { throw Error('blocked'); };
    const session = new GameApp({ baseUrl: './', fetcher, storage: { getItem: blocked, setItem: blocked, removeItem: blocked } });
    session.dispatch({ type: 'setHoldAttack', payload: { enabled: true } }); session.update(0);
    expect(session.state.holdBasicAttack).toBe(true);
    app.dispose(); session.dispose();
  });
});
