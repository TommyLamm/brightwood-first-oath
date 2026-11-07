import { describe, expect, it } from 'vitest';
import { classActionLabel, classPortrait, classSkillNames, equipmentJobLabel, playerClassLabel } from '../src/ui/class-presentation.js';
import { createPlayer, deriveStats } from '../src/domain/progression/index.js';
import { rulesCatalog as rules } from '../src/content/rules/index.js';
import { previewApAllocation } from '../src/ui/ap-allocation-preview.js';
import { previewSkillLearning } from '../src/ui/skill-learning-preview.js';
import { previewEquipmentStats } from '../src/ui/equipment-stats-preview.js';
import { selectShopOffers } from '../src/ui/shop-offers.js';

describe('class interface rules', () => {
  it('resolves every combat slot for the selected route, including before graduation', () => {
    const bow=createPlayer('弓',rules,'archer'); const sword=createPlayer('劍',rules);
    expect(['attack','skill1','skill2','skill3'].map((action)=>classActionLabel(bow,rules,action)))
      .toEqual(['射箭','二連射','穿透箭','後撤射擊']);
    expect(classActionLabel(sword,rules,'skill3')).toBe('堅韌守護');
    expect(classSkillNames(bow,rules)).toBe('二連射、穿透箭、後撤射擊');
    expect(playerClassLabel(bow)).toContain('弓箭手訓練');
    expect(classPortrait(bow)).not.toBe(classPortrait(sword));
  });
  it('previews mastery exactly once in AP and skill learning, preserving the input', () => {
    const player={...createPlayer('弓',rules,'archer'),job:'archer' as const,level:20,sp:2,ap:5};
    const original=structuredClone(player);
    const learned=previewSkillLearning({player,rules,skillId:'archer-bow-mastery'});
    expect(learned.ok).toBe(true);
    if(learned.ok) expect(learned.value.after.attack).toBeCloseTo(learned.value.before.attack*1.01);
    const mastered={...player,skillRanks:{'archer-bow-mastery':5}};
    const dex=previewApAllocation({player:mastered,rules,stat:'dex',amount:1});
    const str=previewApAllocation({player:mastered,rules,stat:'str',amount:1});
    if(!dex.ok||!str.ok) throw Error('AP preview unexpectedly refused');
    expect(dex.value.after.attack-dex.value.before.attack).toBeCloseTo(2.1);
    expect(str.value.after.attack-str.value.before.attack).toBeCloseTo(1.05);
    expect(player).toEqual(original);
  });
  it('keeps sword gear owned but refuses its equip preview for an archer', () => {
    const player={...createPlayer('弓',rules,'archer'),level:20,bag:[{itemId:'steel-bow',quantity:1},{itemId:'steel-sword',quantity:1}]};
    const bow=previewEquipmentStats({player,rules,action:{type:'equip',bagIndex:0}});
    const sword=previewEquipmentStats({player,rules,action:{type:'equip',bagIndex:1}});
    if(!bow.ok) throw Error(bow.message);
    expect(bow.value.after.attack-deriveStats(player,rules).attack).toBe(20);
    expect(sword.ok).toBe(false);expect(player.bag).toHaveLength(2);
  });
  it('offers compatible weapons plus common armor and identifies job requirements', () => {
    const bow=createPlayer('弓',rules,'archer'), sword=createPlayer('劍',rules);
    const bowIds=selectShopOffers(rules.items,'equipment',bow).map(({id})=>id);
    expect(bowIds).toContain('steel-bow');expect(bowIds).toContain('iron-mail');expect(bowIds).not.toContain('steel-sword');
    expect(selectShopOffers(rules.items,'equipment',sword).map(({id})=>id)).not.toContain('starter-bow');
    expect(equipmentJobLabel(rules.items['steel-bow']!)).toBe('弓箭手專用');
    expect(equipmentJobLabel(rules.items['iron-mail']!)).toBe('職業共用');
  });
});
