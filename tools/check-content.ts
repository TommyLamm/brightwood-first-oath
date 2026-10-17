import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type {
  Result,
  RulesCatalog,
  WorldCatalog,
  RulesValidator,
  WorldValidator,
} from '../src/contracts/index.js';

type ExportModule = Record<string, unknown>;

type ContentModule<TCatalog, TValidator> = {
  catalog: TCatalog;
  validate: TValidator;
};

function isRecord(value: unknown): value is ExportModule {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getModuleExport<T>(module: ExportModule, name: string): T {
  if (!(name in module)) {
    throw new Error(`Expected export "${name}" was not found.`);
  }
  return module[name] as T;
}

function isResult<T>(value: unknown): value is Result<T> {
  if (!isRecord(value) || typeof value.ok !== 'boolean') {
    return false;
  }
  return value.ok
    ? 'value' in value
    : typeof value.code === 'string' && typeof value.message === 'string';
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadContentModule<TCatalog, TValidator>(
  filePath: string,
  catalogName: string,
  validatorName: string,
): Promise<ContentModule<TCatalog, TValidator>> {
  const imported: unknown = await import(pathToFileURL(filePath).href);
  if (!isRecord(imported)) {
    throw new Error(`Module at ${filePath} did not provide named exports.`);
  }
  return {
    catalog: getModuleExport<TCatalog>(imported, catalogName),
    validate: getModuleExport<TValidator>(imported, validatorName),
  };
}

function reportResult<T>(label: string, result: unknown): result is Result<T> {
  if (!isResult<T>(result)) {
    console.error(`✗ ${label}: validator returned a value outside the Result contract.`);
    return false;
  }
  if (!result.ok) {
    console.error(`✗ ${label}: ${result.code} — ${result.message}`);
    return false;
  }
  console.info(`✓ ${label}`);
  return true;
}

async function main(): Promise<void> {
  const rulesPath = resolve(process.cwd(), 'src/content/rules/index.ts');
  const worldPath = resolve(process.cwd(), 'src/content/world/index.ts');
  const missing: string[] = [];

  if (!(await fileExists(rulesPath))) {
    missing.push('src/content/rules/index.ts (T01 rulesCatalog / validateRules)');
  }
  if (!(await fileExists(worldPath))) {
    missing.push('src/content/world/index.ts (T05 worldCatalog / validateWorld)');
  }

  if (missing.length > 0) {
    console.error('內容檢查未執行：正式內容模組尚未交付。');
    for (const path of missing) {
      console.error(`- 缺少 ${path}`);
    }
    process.exitCode = 1;
    return;
  }

  let rulesModule: ContentModule<RulesCatalog, RulesValidator>;
  let worldModule: ContentModule<WorldCatalog, WorldValidator>;
  try {
    [rulesModule, worldModule] = await Promise.all([
      loadContentModule<RulesCatalog, RulesValidator>(rulesPath, 'rulesCatalog', 'validateRules'),
      loadContentModule<WorldCatalog, WorldValidator>(worldPath, 'worldCatalog', 'validateWorld'),
    ]);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`內容檢查載入失敗：${message}`);
    process.exitCode = 1;
    return;
  }

  if (typeof rulesModule.validate !== 'function' || typeof worldModule.validate !== 'function') {
    console.error('內容檢查載入失敗：rules/world validator 必須是函式。');
    process.exitCode = 1;
    return;
  }

  const rulesResult: unknown = rulesModule.validate(rulesModule.catalog);
  const rulesValid = reportResult<RulesCatalog>('rulesCatalog', rulesResult);
  const worldResult: unknown = worldModule.validate(worldModule.catalog, rulesModule.catalog);
  const worldValid = reportResult<WorldCatalog>('worldCatalog + cross-reference validation', worldResult);

  if (!rulesValid || !worldValid) {
    process.exitCode = 1;
    return;
  }

  console.info('內容檢查完成：rules 與 world 跨表驗證通過。');
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`內容檢查發生未預期錯誤：${message}`);
  process.exitCode = 1;
});
