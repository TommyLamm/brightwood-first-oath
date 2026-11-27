import type { UiSnapshot } from '../contracts/ports.js';

type MovementKey = 'climbUp' | 'climbDown' | 'jump';
type HintPart = string | { key: string };
type ContextHint = { targetKey: string; parts: HintPart[]; text: string; secondaryPickupKey?: string };
type ClimbHint = Extract<NonNullable<UiSnapshot['movementHint']>, { kind: 'climb' }>;

function climbParts(hint: ClimbHint, key: (action: MovementKey) => HintPart): HintPart[] {
  const parts: HintPart[] = hint.direction === 'both'
    ? [key('climbUp'), ' / ', key('climbDown'), ' 攀爬']
    : [key(hint.direction === 'up' ? 'climbUp' : 'climbDown'), ' 攀爬'];
  if (hint.attached) parts.push('｜', key('jump'), ' 跳離');
  return parts;
}

function makeHint(targetKey: string, parts: HintPart[]) {
  return { targetKey, parts, text: parts.map((part) => typeof part === 'string' ? part : part.key).join('') };
}

export function contextHint(
  view: Pick<UiSnapshot, 'interactionHint' | 'movementHint' | 'pickupHint'>,
  keyText: (action: MovementKey | 'interact' | 'pickup') => string,
): ContextHint | null {
  const key = (action: Parameters<typeof keyText>[0]) => ({ key: keyText(action) });
  const interaction = view.interactionHint;
  const pickup = view.pickupHint;
  const movement = view.movementHint;
  const canCollectBeforeTravel = interaction?.kind === 'portal' && interaction.blockedMessage
    && pickup && !pickup.blockedMessage;
  if (interaction && !canCollectBeforeTravel) {
    const parts: HintPart[] = [
      key('interact'),
      ' ' + (interaction.actionLabel ?? (interaction.kind === 'portal' ? '前往' : '互動')) + '：' + interaction.label
        + (interaction.blockedMessage ? '｜' + interaction.blockedMessage : ''),
    ];
    if (!interaction.blockedMessage && pickup && !pickup.blockedMessage) {
      parts.push('\n', key('pickup'), ' 拾取：' + pickup.label);
      return { ...makeHint(interaction.targetKey, parts), secondaryPickupKey: pickup.targetKey };
    }
    if (!interaction.blockedMessage && movement?.kind === 'climb') {
      parts.push('\n', ...climbParts(movement, key));
    }
    return makeHint(interaction.targetKey, parts);
  }
  if (pickup) return makeHint(pickup.targetKey, [
    key('pickup'), ' 拾取：' + pickup.label + '｜' + (pickup.blockedMessage ?? '按住連續拾取'),
  ]);
  if (!movement) return null;
  if (movement.kind === 'drop') return makeHint(movement.targetKey, [key('climbDown'), ' + ', key('jump'), ' 向下跳落']);
  return makeHint(movement.targetKey, climbParts(movement, key));
}
