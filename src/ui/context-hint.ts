import type { UiSnapshot } from '../contracts/ports.js';

type MovementKey = 'climbUp' | 'climbDown' | 'jump';
type HintPart = string | { key: string };

function makeHint(targetKey: string, parts: HintPart[]) {
  return { targetKey, parts, text: parts.map((part) => typeof part === 'string' ? part : part.key).join('') };
}

export function contextHint(
  view: Pick<UiSnapshot, 'interactionHint' | 'movementHint' | 'pickupHint'>,
  keyText: (action: MovementKey | 'interact' | 'pickup') => string,
) {
  const key = (action: Parameters<typeof keyText>[0]) => ({ key: keyText(action) });
  const interaction = view.interactionHint;
  const pickup = view.pickupHint;
  const canCollectBeforeTravel = interaction?.kind === 'portal' && interaction.blockedMessage
    && pickup && !pickup.blockedMessage;
  if (interaction && !canCollectBeforeTravel) return makeHint(interaction.targetKey, [
    key('interact'),
    ' ' + (interaction.kind === 'portal' ? '前往' : '互動') + '：' + interaction.label
      + (interaction.blockedMessage ? '｜' + interaction.blockedMessage : ''),
  ]);
  if (pickup) return makeHint(pickup.targetKey, [
    key('pickup'), ' 拾取：' + pickup.label + '｜' + (pickup.blockedMessage ?? '按住連續拾取'),
  ]);
  const movement = view.movementHint;
  if (!movement) return null;
  if (movement.kind === 'drop') return makeHint(movement.targetKey, [key('climbDown'), ' + ', key('jump'), ' 向下跳落']);
  const parts: HintPart[] = [key('climbUp'), ' / ', key('climbDown'), ' 攀爬'];
  if (movement.attached) parts.push('｜', key('jump'), ' 跳離');
  return makeHint(movement.targetKey, parts);
}
