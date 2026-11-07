import type { CommandDraft, UiSnapshot } from '../contracts/index.js';
import { MAX_CHARACTER_SLOTS, WAREHOUSE_CAPACITY } from '../persistence/profile.js';
import type { ProfileAction } from '../persistence/profile-actions.js';
const expanded = new Set<string>();

export function buildRosterManager(document: Document, view: UiSnapshot, dispatch: (draft: CommandDraft) => void): HTMLElement {
  const root = document.createElement('details'); root.className = 'ms-roster-manager';
  root.open = expanded.has('root'); root.addEventListener('toggle', () => root.open ? expanded.add('root') : expanded.delete('root'));
  const summary = document.createElement('summary'); summary.textContent = '管理角色與共享倉庫'; root.append(summary);
  const profile = view.profile!;
  const blocked = view.characterBusy === true || ['saving', 'saveError', 'conflict', 'localConflict'].includes(view.saveStatus);
  const button = (label: string, action: () => ProfileAction, parent: HTMLElement, disabled = false): void => {
    const node = document.createElement('button'); node.type = 'button'; node.className = 'ms-button ms-button--secondary';
    node.textContent = label; node.disabled = blocked || disabled;
    node.addEventListener('click', () => dispatch({ type: 'manageProfile', payload: action() })); parent.append(node);
  };
  const input = (label: string, parent: HTMLElement, initial = ''): HTMLInputElement => {
    const wrap = document.createElement('label'); wrap.textContent = label;
    const field = document.createElement('input'); field.type = 'text'; field.maxLength = 16; field.value = initial;
    wrap.append(field); parent.append(wrap); return field;
  };
  const description = document.createElement('p'); description.textContent = '四欄可擴至六欄。刪除會保留一名角色供恢復；共享倉庫只收背包物品，任務專用物品除外。'; root.append(description);
  if (view.saveMessage) { const message = document.createElement('p'); message.className = 'ms-warning'; message.textContent = view.saveMessage; message.setAttribute('role', 'status'); root.append(message); }
  button(`增加角色欄位（${profile.slots.length}/${MAX_CHARACTER_SLOTS}）`, () => ({ type: 'expand' }), root, profile.slots.length >= MAX_CHARACTER_SLOTS);
  for (const character of Object.values(profile.characters)) {
    const group = document.createElement('details');
    group.open = expanded.has(character.characterId); group.addEventListener('toggle', () => group.open ? expanded.add(character.characterId) : expanded.delete(character.characterId));
    const heading = document.createElement('summary'); heading.textContent = character.player.name + '・角色管理／物品轉移'; group.append(heading);
    const name = input('新名稱 ', group, character.player.name);
    button('儲存新名稱', () => ({ type: 'rename', characterId: character.characterId, name: name.value }), group);
    const confirm = input('刪除前輸入目前完整名稱 ', group);
    button('刪除角色並保留恢復備份', () => ({ type: 'delete', characterId: character.characterId, confirmation: confirm.value }), group, !!profile.deletedCharacter);
    const list = (from: 'bag' | 'warehouse'): void => {
      const stacks = from === 'bag' ? character.player.bag : profile.warehouse ?? [];
      const title = document.createElement('h4'); title.textContent = from === 'bag' ? `${character.player.name}的背包（${stacks.length}/32）` : `共享倉庫（${stacks.length}/${WAREHOUSE_CAPACITY}）`; group.append(title);
      if (!stacks.length) { const empty = document.createElement('p'); empty.textContent = '目前沒有物品'; group.append(empty); }
      stacks.forEach((stack, index) => {
        const item = view.catalog.rules.items[stack.itemId]!;
        const row = document.createElement('div'); row.className = 'ms-roster-item';
        const label = document.createElement('span'); label.textContent = item.name + ' ×' + stack.quantity; row.append(label);
        for (const quantity of stack.quantity > 1 ? [1, stack.quantity] : [1]) button(
          (from === 'bag' ? '存入 ' : '取回 ') + quantity,
          () => ({ type: 'transfer', from, characterId: character.characterId, index, itemId: stack.itemId, quantity }), row, item.kind === 'quest');
        group.append(row);
      });
    };
    list('bag'); list('warehouse'); root.append(group);
  }
  if (profile.deletedCharacter) {
    const group = document.createElement('details');
    const heading = document.createElement('summary'); heading.textContent = '已刪角色：' + profile.deletedCharacter.player.name; group.append(heading);
    button('恢復到空欄位', () => ({ type: 'restore' }), group, profile.slots.every((slot) => slot.characterId !== null));
    const warning = document.createElement('p'); warning.textContent = '永久清除會移除這名角色的恢復備份，之後無法在遊戲內恢復。'; group.append(warning);
    const confirm = input('永久清除前輸入完整角色名稱 ', group);
    button('永久清除恢復備份', () => ({ type: 'purge', confirmation: confirm.value }), group); root.append(group);
  }
  return root;
}
