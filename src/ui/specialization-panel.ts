import type { PlayerProgress, UiSnapshot } from '../contracts/index.js';
import { specializations } from '../content/rules/specializations.js';

export function specializationPanel(document: Document, player: PlayerProgress, view: UiSnapshot): HTMLElement {
  const root = document.createElement('section'); root.className = 'ms-specializations';
  const title = document.createElement('h3'); title.textContent = player.specialization ? '二轉：' + specializations[player.specialization].name : 'Lv20・選擇二轉分支'; root.append(title);
  const note = document.createElement('p'); note.className = 'ms-panel-note';
  note.textContent = '靠近木葉鎮本職業導師後選擇一次；原技能與AP／SP全部保留。分支技能自動解鎖，可替換技能3，隨時切回原技能。'; root.append(note);
  if (player.specialization) {
    const branch = specializations[player.specialization];
    const detail = document.createElement('p'); detail.textContent = branch.description + '（LUK每點增加0.2%暴擊率，仍受本職業上限限制。）'; root.append(detail);
    const skill = view.catalog.rules.skills[branch.skill]!;
    const stats = document.createElement('p'); stats.textContent = skill.name + '｜MP ' + skill.mpCost + '｜冷卻 ' + skill.cooldownMs / 1000 + '秒'; root.append(stats);
    const button = document.createElement('button'); button.type = 'button'; button.className = 'ms-button';
    button.dataset.uiAction = 'toggle-advanced-skill'; button.textContent = player.advancedSkillEquipped ? '技能3切回原職業技能' : '技能3裝備' + skill.name; root.append(button);
  } else {
    for (const [id, branch] of Object.entries(specializations)) {
      if (branch.job !== player.job) continue;
      const card = document.createElement('article'); card.className = 'ms-skill-card';
      const copy = document.createElement('p'); copy.textContent = branch.name + '｜' + branch.description; card.append(copy);
      const button = document.createElement('button'); button.type = 'button'; button.className = 'ms-button';
      button.dataset.uiAction = 'advance-specialization'; button.dataset.specialization = id;
      button.textContent = '選擇' + branch.name; button.disabled = player.level < 20 || view.saveData?.location.mapId !== 'town';
      if (button.disabled) button.title = '需要Lv20並回到木葉鎮本職業導師附近。';
      card.append(button); root.append(card);
    }
  }
  return root;
}
