import type { Id, NpcDef } from '../../contracts/index.js';

export const npcs: Record<Id, NpcDef> = {
  guide: { id: 'guide', name: '森芽', role: 'scout', dialogueId: 'guide-intro', actorKey: 'actor:guide' },
  mentor: { id: 'mentor', name: '岩嶺教官', role: 'mentor', dialogueId: 'mentor-intro', actorKey: 'actor:mentor' },
  merchant: { id: 'merchant', name: '木葉商人', role: 'merchant', dialogueId: 'merchant-intro', actorKey: 'actor:merchant' },
  healer: { id: 'healer', name: '晨露', role: 'healer', dialogueId: 'healer-intro', actorKey: 'actor:healer' },
  keeper: { id: 'keeper', name: '礦道守望者', role: 'keeper', dialogueId: 'keeper-intro', actorKey: 'actor:keeper' },
};
