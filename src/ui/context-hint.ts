import type { UiSnapshot } from '../contracts/ports.js';

type MovementKey = 'climbUp' | 'climbDown' | 'jump';
type HintPart = string | { key: string } | { iconKey: string } | { questStatus: 'available' | 'ready' };
type ContextHint = { targetKey: string; parts: HintPart[]; text: string; secondaryPickupKey?: string };
type MovementHint = NonNullable<UiSnapshot['movementHint']>;

function movementParts(hint: MovementHint, key: (action: MovementKey) => HintPart): HintPart[] {
  if (hint.kind === 'drop') return [key('climbDown'), ' + ', key('jump'), ' 向下跳落'];
  const parts: HintPart[] = hint.direction === 'both'
    ? [key('climbUp'), ' / ', key('climbDown'), ' 攀爬']
    : [key(hint.direction === 'up' ? 'climbUp' : 'climbDown'), ' 攀爬'];
  if (hint.attached) parts.push('｜', key('jump'), ' 跳離');
  return parts;
}

function makeHint(targetKey: string, parts: HintPart[]) {
  return { targetKey, parts, text: parts.map((part) => typeof part === 'string' ? part : 'key' in part ? part.key : '').join('') };
}

function pickupParts(pickup: NonNullable<UiSnapshot['pickupHint']>, key: HintPart, suffix = ''): HintPart[] {
  const label = pickup.label + suffix;
  if (!pickup.iconKey) return [key, ' 拾取：' + label];
  return [key, ' 拾取：', { iconKey: pickup.iconKey }, label];
}

export function contextHint(
  view: Pick<UiSnapshot, 'interactionHint' | 'movementHint' | 'pickupHint'>,
  keyText: (action: MovementKey | 'interact' | 'pickup' | 'attack' | 'skill1') => string,
): ContextHint | null {
  const key = (action: Parameters<typeof keyText>[0]) => {
    const label = keyText(action);
    return { key: label === '左／右 Ctrl' ? 'Ctrl' : label };
  };
  const interaction = view.interactionHint;
  const pickup = view.pickupHint;
  const movement = view.movementHint;
  const canCollectBeforeTravel = interaction?.kind === 'portal' && interaction.blockedMessage
    && pickup && !pickup.blockedMessage;
  if (interaction && !canCollectBeforeTravel) {
    const trial = interaction.trialAttack;
    const parts: HintPart[] = trial ? [
      key(trial.action), ' ' + trial.label + '：' + interaction.label,
      '｜', key('interact'), ' 查看說明',
    ] : [
      key('interact'),
      ' ' + (interaction.actionLabel ?? (interaction.kind === 'portal' ? '前往' : '互動')) + '：' + interaction.label
        + (interaction.blockedMessage ? '｜' + interaction.blockedMessage : ''),
    ];
    if (interaction.questStatus) parts.push('｜', { questStatus: interaction.questStatus },
      interaction.questStatus === 'ready' ? '可交付' : '可接取');
    if (!interaction.blockedMessage && pickup && !pickup.blockedMessage) {
      parts.push('\n', ...pickupParts(pickup, key('pickup')));
      return { ...makeHint(interaction.targetKey, parts), secondaryPickupKey: pickup.targetKey };
    }
    if (!interaction.blockedMessage && movement) {
      parts.push('\n', ...movementParts(movement, key));
    }
    return makeHint(interaction.targetKey, parts);
  }
  if (pickup) return makeHint(pickup.targetKey,
    pickupParts(pickup, key('pickup'), '｜' + (pickup.blockedMessage ?? '按住連續拾取')));
  if (!movement) return null;
  return makeHint(movement.targetKey, movementParts(movement, key));
}
