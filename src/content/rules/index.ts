import type { RulesCatalog } from '../../contracts/index.js';
import { items } from './items.js';
import { maxLevel, expToNext, movement } from './progression.js';
import { monsters } from './monsters.js';
import { skills } from './skills.js';

export { items } from './items.js';
export { maxLevel, expToNext, movement } from './progression.js';
export { monsters, questDropByQuest } from './monsters.js';
export { playerLearnableIds, playerSkillIds, skills } from './skills.js';
export { validateRules } from './validate.js';

export const rulesCatalog: RulesCatalog = {
  items,
  skills,
  monsters,
  progression: { maxLevel, expToNext },
  movement,
};
