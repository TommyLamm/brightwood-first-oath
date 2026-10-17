import type { EquipmentSlot, Id, Settings } from './types.js';

export type PanelId =
  | 'inventory'
  | 'equipment'
  | 'skills'
  | 'stats'
  | 'quests'
  | 'map'
  | 'shop'
  | 'dialogue'
  | 'settings';

export type CommandDraft =
  | { type: 'newGame'; payload: { name: string } }
  | { type: 'continue'; payload: Record<string, never> }
  | { type: 'attack'; payload: { skillId: Id } }
  | { type: 'pickup'; payload: Record<string, never> }
  | { type: 'interact'; payload: Record<string, never> }
  | { type: 'acceptQuest'; payload: { questId: Id } }
  | { type: 'claimQuest'; payload: { questId: Id } }
  | { type: 'buy'; payload: { itemId: Id; quantity: number } }
  | { type: 'sell'; payload: { bagIndex: number; quantity: number } }
  | { type: 'equip'; payload: { bagIndex: number } }
  | { type: 'unequip'; payload: { slot: EquipmentSlot } }
  | { type: 'useItem'; payload: { itemId: Id } }
  | { type: 'allocateAp'; payload: { stat: 'str' | 'dex'; amount: number } }
  | { type: 'learnSkill'; payload: { skillId: Id } }
  | { type: 'returnTown'; payload: Record<string, never> }
  | { type: 'retryBoss'; payload: Record<string, never> }
  | { type: 'respawn'; payload: Record<string, never> }
  | { type: 'togglePause'; payload: Record<string, never> }
  | { type: 'setPanel'; payload: { panel: PanelId | null } }
  | { type: 'closePanel'; payload: Record<string, never> }
  | { type: 'setSettings'; payload: { settings: Settings } }
  | { type: 'retrySave'; payload: Record<string, never> }
  | { type: 'useCloudVersion'; payload: Record<string, never> }
  | { type: 'playTemporary'; payload: Record<string, never> }
  | { type: 'returnTitle'; payload: Record<string, never> };

type AddSequence<T> = T extends CommandDraft ? T & { seq: number } : never;

export type GameCommand = AddSequence<CommandDraft>;
