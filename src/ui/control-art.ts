/** Decorative artwork only: command data and accessible names stay on the native button. */
const actionIcons: Record<string, string> = {
  'close-panel': 'close', 'continue': 'play', 'new-role': '@hero-portrait-chibi',
  'create-confirm': 'confirm', 'create-cancel': 'close', 'retry-save': 'retry',
  'confirm-save-upgrade': 'confirm', 'discard-save': 'warning',
  'import-legacy-save': '@icon-scroll', 'dismiss-legacy-import': 'back',
  'play-temporary': 'play', 'toggle-pause': 'pause', 'return-title': 'back',
  'respawn': 'home', 'retry-boss': 'retry', 'return-town': 'home',
  'pickup': 'pickup', 'interact': 'dialogue', 'inspect-stele': 'inspect',
  'inspect-route-marker': 'inspect', 'review-sidequest': '@icon-scroll',
  'review-npc-map': '@icon-map', 'use-item': '#item-small-red-v1',
  'equip-bag': 'equip', 'sell-bag': 'trade', 'sell-materials': 'trade',
  'unequip': 'unequip', 'allocate-ap': 'upgrade', 'learn-skill': 'upgrade',
  'accept-quest': '@icon-scroll', 'claim-quest': 'reward', 'buy': 'trade',
  'select-max-buy': 'upgrade', 'settings-rebind': 'keyboard',
  'settings-reset-bindings': 'retry', 'use-cloud-version': 'cloud',
  'toggle-key-guide': 'keyboard', 'reload-page': 'retry',
};

export function controlImage(document: Document, icon: string): HTMLImageElement {
  const image = document.createElement('img');
  image.className = 'ms-control-icon';
  image.alt = '';
  image.setAttribute('aria-hidden', 'true');
  image.draggable = false;
  const path = icon.startsWith('@') ? 'journal/' + icon.slice(1)
    : icon.startsWith('#') ? icon.slice(1) : 'controls/' + icon;
  image.src = new URL('assets/interface/' + path + '.png', document.baseURI).href;
  return image;
}

export function setControlLabel(button: HTMLButtonElement, text: string): void {
  const label = button.querySelector<HTMLElement>('.ms-control-label');
  if (label) label.textContent = text;
  else button.textContent = text;
}

export function decorateControl(button: HTMLButtonElement, label: string, action: string, iconOverride?: string): void {
  // Existing bag slots, atlas landmarks, quickbar and illustrated tabs own their artwork.
  if (!label || button.classList.contains('ms-journal-tab')) return;
  const kindIcons: Record<string, string> = {
    all: '@icon-backpack', equipment: '@icon-tunic', consumable: '#item-small-red-v1',
    material: '#item-stone-chip-v1', quest: '@icon-scroll',
  };
  const icon = iconOverride ?? (action === 'open-panel'
    ? ({ inventory: '@icon-backpack', equipment: '@icon-tunic', skills: '@icon-skillbook',
      stats: '@icon-compass', quests: '@icon-scroll', map: '@icon-map', shop: 'trade',
      dialogue: 'dialogue', settings: 'settings' } as Record<string, string>)[button.dataset.panel ?? '']
    : action === 'inventory-filter' || action === 'shop-filter' ? kindIcons[button.dataset.kind ?? 'all']
    : action === 'use-item' && button.dataset.itemId ? '#item-' + button.dataset.itemId + '-v1'
    : action === 'toggle-pause' && label.includes('繼續') ? 'play'
    : action === 'toggle-key-guide' && label.includes('收起') ? 'close'
    : action === 'settings-mute' ? label === '靜音' ? 'volume-off' : 'volume-on'
    : actionIcons[action]);
  if (!icon) return;
  button.classList.add('ms-art-control');
  const image = controlImage(button.ownerDocument, icon);
  const copy = button.ownerDocument.createElement('span');
  copy.className = 'ms-control-label';
  copy.textContent = label;
  if (action === 'close-panel' || button.classList.contains('ms-system-button')) {
    button.classList.add('ms-art-icon-only');
    if (!button.hasAttribute('aria-label')) button.setAttribute('aria-label', label);
  }
  image.addEventListener('error', () => {
    image.hidden = true;
    button.classList.add('is-art-missing');
  }, { once: true });
  button.replaceChildren(image, copy);
}

export function installControlSkins(shell: HTMLElement): void {
  shell.style.setProperty('--control-disclosure', 'url("' + new URL('assets/interface/controls/back.png', shell.ownerDocument.baseURI).href + '")');
  for (const state of ['normal', 'hover', 'pressed']) {
    shell.style.setProperty('--control-' + state,
      'url("' + new URL('assets/interface/controls/button-' + state + '.png', shell.ownerDocument.baseURI).href + '")');
  }
}
