import type { PlayerProgress, UiSnapshot } from '../contracts/index.js';
import { specializationMentors, specializations } from '../content/rules/specializations.js';
import { visualActor, visualButton, visualIcon, visualNode } from './illustrated-panels.js';
import { resolveNpcMapTarget } from './npc-map-target.js';

export function specializationPanel(
  document: Document, player: PlayerProgress, view: UiSnapshot, shortcuts: ReadonlyMap<string, string>,
): HTMLElement | null {
  if (player.job === 'beginner') return null;

  const root = visualNode(document, 'section', 'ms-specializations');
  if (player.specialization) {
    const branch = specializations[player.specialization];
    const skill = view.catalog.rules.skills[branch.skill]!;
    const card = visualNode(document, 'div', 'ms-skill-card');
    const heading = visualNode(document, 'div', 'ms-skill-card__head');
    const icon = visualIcon(document, view, 'skill:' + skill.id, skill.name);
    icon.setAttribute('aria-hidden', 'true');
    heading.append(icon, visualNode(document, 'h3', '', '二轉 · ' + branch.name));
    const shortcut = shortcuts.get(skill.id);
    if (shortcut) heading.append(visualNode(document, 'kbd', 'ms-skill-card__key', shortcut));
    card.append(
      heading,
      visualNode(document, 'p', 'ms-detail-copy', branch.description),
      visualNode(document, 'p', 'ms-panel-note', 'MP ' + skill.mpCost + ' · 冷卻 ' + skill.cooldownMs / 1000
        + ' 秒。每點 LUK 增加 0.2% 暴擊率，仍受職業上限限制。'),
      visualButton(document, player.advancedSkillEquipped ? '技能 3 切回原職業技能' : '技能 3 裝備' + skill.name,
        'toggle-advanced-skill'),
    );
    root.append(card);
    return root;
  }

  const heading = visualNode(document, 'h3', '', 'Lv.20 二轉分支');
  heading.tabIndex = -1;
  heading.dataset.focus = 'specialization-heading';
  root.append(heading);
  const mentorId = specializationMentors[player.job];
  const mentor = view.catalog.world.npcs[mentorId];
  const location = resolveNpcMapTarget(view.catalog.world, mentorId);
  const ready = view.nearSpecializationMentor === true;
  if (mentor && location) {
    const contact = visualNode(document, 'div', 'ms-specializations__mentor');
    contact.classList.toggle('is-ready', ready);
    const portrait = visualActor(document, view, mentor.actorKey, mentor.name);
    portrait.setAttribute('aria-hidden', 'true');
    const info = visualNode(document, 'div', 'ms-specializations__contact');
    info.append(
      visualNode(document, 'strong', '', mentor.name),
      visualNode(document, 'span', '', location.mapName + ' · 職業導師'),
      visualNode(document, 'span', 'ms-specializations__status', ready ? '✓ 可選擇分支'
        : player.level < 20 ? 'Lv.' + player.level + ' / 20' : '前往導師附近'),
    );
    const map = visualButton(document, '查看導師位置', 'review-npc-map', { npcId: mentorId }, 'ms-button ms-button--secondary');
    map.setAttribute('aria-label', '查看導師位置 · ' + mentor.name + ' · ' + location.mapName);
    contact.append(portrait, info, map);
    root.append(contact);
  }

  const branches = visualNode(document, 'div', 'ms-specializations__branches');
  for (const [id, branch] of Object.entries(specializations)) {
    if (branch.job !== player.job) continue;
    const card = visualNode(document, 'article', 'ms-skill-card');
    const heading = visualNode(document, 'div', 'ms-skill-card__head');
    const icon = visualIcon(document, view, 'skill:' + branch.skill, branch.name);
    icon.setAttribute('aria-hidden', 'true');
    heading.append(icon, visualNode(document, 'h4', '', branch.name));
    const button = visualButton(document, '選擇' + branch.name, 'advance-specialization', { specialization: id }, 'ms-button ms-button--primary');
    button.disabled = !ready;
    card.append(heading, visualNode(document, 'p', 'ms-detail-copy', branch.description), button);
    branches.append(card);
  }
  root.append(branches, visualNode(document, 'p', 'ms-panel-note', '每個角色可選擇一次。原技能與 AP／SP 保留，分支技能可替換快捷列的技能 3。'));
  return root;
}
