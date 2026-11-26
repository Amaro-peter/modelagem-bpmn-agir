// Valida todos os modelos do repositório: bpmnlint em cada .bpmn e check.js em cada definição JSON.
// Uso: npm run validar   (funciona em Windows, macOS e Linux)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const files = walk(path.join(root, 'processos'));
const bpmn = files.filter(f => f.endsWith('.bpmn'));
const json = files.filter(f => f.endsWith('.json') && f.includes(`${path.sep}fontes${path.sep}`));
const lint = path.join(root, 'node_modules', 'bpmnlint', 'bin', 'bpmnlint.js');

let falhas = 0;
const run = (args, label) => {
  try {
    const out = execFileSync(process.execPath, args, { cwd: root, encoding: 'utf8' }).trim();
    console.log(`✔ ${label}${out && !out.startsWith('✔') ? '\n' + out : ''}`);
  } catch (e) {
    falhas++;
    console.log(`✖ ${label}\n${(e.stdout || '') + (e.stderr || '')}`.trim());
  }
};
for (const f of bpmn) run([lint, f], `lint      ${path.relative(root, f)}`);
for (const f of json) run([path.join(root, 'ferramentas', 'check.js'), f], `consist.  ${path.relative(root, f)}`);
console.log(falhas ? `\n✖ ${falhas} falha(s)` : `\n✔ tudo válido (${bpmn.length} modelos BPMN, ${json.length} definições)`);
process.exit(falhas ? 1 : 0);
