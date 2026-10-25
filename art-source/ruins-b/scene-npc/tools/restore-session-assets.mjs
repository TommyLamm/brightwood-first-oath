import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const sessionFile = process.argv[2];
if (!sessionFile) throw new Error('Usage: node restore-session-assets.mjs <rollout.jsonl>');

const root = process.cwd();
const rawDir = path.join(root, 'art-source/ruins-b/scene-npc/raw');
const promptDir = path.join(root, 'art-source/ruins-b/scene-npc/prompts');
const metadataDir = path.join(root, 'art-source/ruins-b/scene-npc/metadata');
mkdirSync(promptDir, { recursive: true });
mkdirSync(metadataDir, { recursive: true });

const definitions = [
  { marker: /calm atmospheric sky\/background plate/i, file: 'ruins-gallery-sky-source.png', frameId: 'environment:ruins-gallery-sky' },
  { marker: /disconnected distant scenery for a spacious ancient echo gallery/i, file: 'ruins-gallery-far-source.png', frameId: 'environment:ruins-gallery-far' },
  { marker: /upper-edge framing layer for the Echo Gallery/i, file: 'ruins-gallery-mid-source.png', frameId: 'environment:ruins-gallery-mid' },
  { marker: /neutral idle frame of 行舟/i, file: 'ruins-pathfinder-idle-0-source.png', frameId: 'npc:ruins-pathfinder:idle-0' },
  { marker: /create frame 2 of a restrained breathing idle/i, file: 'ruins-pathfinder-idle-1-source.png', frameId: 'npc:ruins-pathfinder:idle-1' },
  { marker: /complete upright echo stele/i, file: 'ruins-stele-source.png', frameId: 'actor:ruins-stele' },
  { marker: /broken copper thread dropped by an old wooden marionette/i, file: 'broken-copper-thread-source.png', frameId: 'item:broken-copper-thread' },
  { marker: /muted fragment from a cracked ancient copper bell/i, file: 'muted-bell-fragment-source.png', frameId: 'item:muted-bell-fragment', recoverMissing: true },
];

const rows = readFileSync(sessionFile, 'utf8').trimEnd().split('\n').map((line) => JSON.parse(line));
const outputs = new Map();
for (const row of rows) {
  const payload = row.payload ?? {};
  if (payload.type === 'custom_tool_call_output') outputs.set(payload.call_id, payload.output ?? []);
}

const sha256File = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase();
const recovered = [];
const attemptsWithoutSavedImage = [];
for (const row of rows) {
  const payload = row.payload ?? {};
  if (payload.type !== 'custom_tool_call' || payload.name !== 'exec' || typeof payload.input !== 'string') continue;
  if (!payload.input.includes('tools.image_gen__imagegen({')) continue;

  const promptMatch = payload.input.match(/const prompt\s*=\s*`([\s\S]*?)`;\s*const r\s*=\s*await tools\.image_gen__imagegen/);
  const prompt = promptMatch?.[1];
  if (!prompt) continue;
  const definition = definitions.find((item) => item.marker.test(prompt));
  if (!definition) continue;

  let outputHint = null;
  let revisedPrompt = null;
  let returnedKeys = [];
  for (const item of outputs.get(payload.call_id) ?? []) {
    if (typeof item.text !== 'string') continue;
    const start = item.text.indexOf('{');
    if (start < 0) continue;
    try {
      const result = JSON.parse(item.text.slice(start));
      if (result.output_hint) {
        outputHint = result.output_hint;
        revisedPrompt = result.revisedPrompt ?? null;
        returnedKeys = result.keys ?? [];
      }
    } catch {
      // Ignore non-JSON tool status text; never copy raw tool output into this report.
    }
  }
  const savedPathMatch = outputHint?.match(/as (.+?\.png) by default/i);
  if (!savedPathMatch) {
    attemptsWithoutSavedImage.push({
      frameId: definition.frameId,
      outerExecCallId: payload.call_id,
      promptLength: prompt.length,
      status: 'not-used-no-saved-image',
      reason: 'This wrapper output had no savedPath/output_hint, so no image was available to restore or accept.',
    });
    continue;
  }
  const savedPath = savedPathMatch[1];
  if (!existsSync(savedPath)) throw new Error(`Recovered image path is missing for ${definition.frameId}`);

  const rawPath = path.join(rawDir, definition.file);
  if (!existsSync(rawPath) && definition.recoverMissing) copyFileSync(savedPath, rawPath);
  if (!existsSync(rawPath)) throw new Error(`Raw source is missing for ${definition.frameId}`);
  const sourceSha256 = sha256File(savedPath);
  const rawSha256 = sha256File(rawPath);
  if (sourceSha256 !== rawSha256) throw new Error(`Raw SHA does not match savedPath source for ${definition.frameId}`);

  const promptPath = path.join(promptDir, `${definition.file.replace(/-source\.png$/, '')}-v1.txt`);
  writeFileSync(promptPath, `${prompt.trimEnd()}\n`, 'utf8');
  const referencedPathsBlock = payload.input.match(/referenced_image_paths\s*:\s*\[([\s\S]*?)\]/)?.[1] ?? '';
  const referencedImagePaths = [...referencedPathsBlock.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  const callId = path.basename(savedPath, '.png');
  const metadata = {
    frameId: definition.frameId,
    status: 'recovered-awaiting-review',
    rawSource: path.relative(root, rawPath).replaceAll('\\', '/'),
    rawSha256,
    prompt: path.relative(root, promptPath).replaceAll('\\', '/'),
    promptSha256: createHash('sha256').update(prompt.trimEnd(), 'utf8').digest('hex').toUpperCase(),
    submittedPrompt: prompt,
    tool: 'built-in image_gen.imagegen via exec wrapper',
    sessionThreadId: path.basename(sessionFile).match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.jsonl$/i)?.[1] ?? null,
    sessionFile: sessionFile.replaceAll('\\', '/'),
    outerExecCallId: payload.call_id,
    callId,
    savedPath: savedPath.replaceAll('\\', '/'),
    savedPathSha256: sourceSha256,
    revisedPrompt,
    revisedPromptReturnedByTool: revisedPrompt !== null,
    returnedKeys,
    referencedImagePaths,
    acceptance: null,
    rejectionReason: null,
  };
  const metadataPath = path.join(metadataDir, `${definition.file.replace(/-source\.png$/, '')}-v1.metadata.json`);
  writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  recovered.push({ frameId: definition.frameId, rawSource: definition.file, rawSha256, savedPath, callId, revisedPromptReturnedByTool: revisedPrompt !== null });
}

const missing = definitions.filter((definition) => !recovered.some((item) => item.frameId === definition.frameId));
if (missing.length) throw new Error(`No session mapping recovered for: ${missing.map((item) => item.frameId).join(', ')}`);
writeFileSync(path.join(metadataDir, 'attempts.json'), `${JSON.stringify({ attemptsWithoutSavedImage }, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({ recoveredCount: recovered.length, recovered })}\n`);
