import type { Id, NpcDef } from '../../contracts/index.js';

export const npcs: Record<Id, NpcDef> = {
  guide: { id: 'guide', name: '森芽', role: 'scout', dialogueId: 'guide-intro', actorKey: 'actor:guide' },
  mentor: { id: 'mentor', name: '岩嶺教官', role: 'mentor', dialogueId: 'mentor-intro', actorKey: 'actor:mentor' },
  merchant: { id: 'merchant', name: '木葉商人', role: 'merchant', dialogueId: 'merchant-intro', actorKey: 'actor:merchant' },
  healer: { id: 'healer', name: '晨露', role: 'healer', dialogueId: 'healer-intro', actorKey: 'actor:healer' },
  keeper: { id: 'keeper', name: '礦道守望者', role: 'keeper', dialogueId: 'keeper-intro', actorKey: 'actor:keeper' },
  'frost-guide': { id: 'frost-guide', name: '雪芽', role: 'scout', dialogueId: 'frost-guide-intro', actorKey: 'actor:frost-guide' },
  'sands-guide': { id: 'sands-guide', name: '琉砂', role: 'scout', dialogueId: 'sands-guide-intro', actorKey: 'actor:sands-guide' },
  'ruins-archivist': { id: 'ruins-archivist', name: '芷衡', role: 'keeper', dialogueId: 'ruins-archivist-intro', actorKey: 'actor:ruins-archivist' },
  'ruins-medic': { id: 'ruins-medic', name: '青禾', role: 'healer', dialogueId: 'ruins-medic-intro', actorKey: 'actor:ruins-medic' },
  'ruins-pathfinder': { id: 'ruins-pathfinder', name: '行舟', role: 'scout', dialogueId: 'ruins-pathfinder-intro', actorKey: 'actor:ruins-pathfinder' },
  'ruins-stele-west': { id: 'ruins-stele-west', name: '西回聲碑', role: 'keeper', dialogueId: 'ruins-stele-west-intro', actorKey: 'actor:ruins-stele' },
  'ruins-stele-east': { id: 'ruins-stele-east', name: '東回聲碑', role: 'keeper', dialogueId: 'ruins-stele-east-intro', actorKey: 'actor:ruins-stele' },
  'frost-route-marker': { id: 'frost-route-marker', name: '霜松航標', role: 'keeper', dialogueId: 'frost-route-marker-intro', actorKey: 'actor:ruins-stele' },
};
