import type { ContentCatalog, Result } from '../contracts/index.js';
import { failure, success } from '../contracts/index.js';
import { rulesCatalog, validateRules } from '../content/rules/index.js';
import { validateWorld, worldCatalog } from '../content/world/index.js';

/** Validates both authoritative catalogs before the app exposes either one. */
export function composeContentCatalog(): Result<ContentCatalog> {
  const rules = validateRules(rulesCatalog);
  if (!rules.ok) return failure(rules.code, `Rules catalog incomplete: ${rules.message}`);

  const world = validateWorld(worldCatalog, rules.value);
  if (!world.ok) return failure(world.code, `World catalog incomplete: ${world.message}`);

  return success({ rules: rules.value, world: world.value });
}
