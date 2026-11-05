import type { UiSnapshot } from '../contracts/ports.js';

type MovementKey = 'climbUp' | 'climbDown' | 'jump';

function movementHintText(
  hint: NonNullable<UiSnapshot['movementHint']>,
  keyText: (action: MovementKey) => string,
): string {
  if (hint.kind === 'drop') return keyText('climbDown') + ' + ' + keyText('jump') + ' 向下跳落';
  return keyText('climbUp') + ' / ' + keyText('climbDown') + ' 攀爬'
    + (hint.attached ? '｜' + keyText('jump') + ' 跳離' : '');
}

export function contextHint(
  view: Pick<UiSnapshot, 'interactionHint' | 'movementHint' | 'pickupHint'>,
  keyText: (action: MovementKey | 'interact' | 'pickup') => string,
): { targetKey: string; text: string } | null {
  const interaction = view.interactionHint;
  if (interaction) return {
    targetKey: interaction.targetKey,
    text: keyText('interact') + ' ' + (interaction.kind === 'portal' ? '前往' : '互動') + '：' + interaction.label
      + (interaction.blockedMessage ? '｜' + interaction.blockedMessage : ''),
  };
  const pickup = view.pickupHint;
  if (pickup) return {
    targetKey: pickup.targetKey,
    text: keyText('pickup') + ' 拾取：' + pickup.label + '｜' + (pickup.blockedMessage ?? '按住連續拾取'),
  };
  const movement = view.movementHint;
  return movement ? { targetKey: movement.targetKey, text: movementHintText(movement, keyText) } : null;
}
