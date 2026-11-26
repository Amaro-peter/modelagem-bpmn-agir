// Regera todos os artefatos do processo "Registro de software" a partir das fontes JSON.
// Uso (na raiz do repositório): npm run registro-software   (Windows, macOS e Linux; requer Python 3)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const P = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(P, '..', '..');
const tool = name => path.join(root, 'ferramentas', name);
const node = (...args) => execFileSync(process.execPath, args, { cwd: root, stdio: 'inherit' });

// Python: "python3" (macOS/Linux) ou "python"/"py" (Windows)
const python = ['python3', 'python', 'py'].find(cmd => spawnSync(cmd, ['--version']).status === 0);
if (!python) { console.error('Python 3 não encontrado (necessário para gerar etapas e documentação).'); process.exit(1); }
const py = script => execFileSync(python, ['-I', path.join(P, 'scripts', script)], { cwd: root, stdio: 'inherit' });

py('gerar_etapas.py');                                    // fontes/etapas/*.json a partir do AS-IS
node(tool('build.js'), path.join(P, 'fontes', 'registro-software-asis.json'), path.join(P, 'as-is', 'registro-software-asis.bpmn'));
node(tool('build.js'), path.join(P, 'fontes', 'etapas', '00-macro.json'), path.join(P, 'macro', '00-macro.bpmn'));
for (const f of fs.readdirSync(path.join(P, 'fontes', 'etapas')).filter(f => /^0[1-7]-.*\.json$/.test(f))) {
  node(tool('build.js'), path.join(P, 'fontes', 'etapas', f), path.join(P, 'etapas', f.replace(/\.json$/, '.bpmn')));
}
for (const dir of ['as-is', 'macro', 'etapas']) {
  for (const f of fs.readdirSync(path.join(P, dir)).filter(f => f.endsWith('.bpmn'))) {
    execFileSync(process.execPath, [tool('render.js'), path.join(P, dir, f)], { cwd: root, stdio: 'ignore' });
  }
}
py('gerar_doc.py');                                       // docs/macroprocesso-registro-software.md

// ---------------- TO-BE ----------------
const TB = path.join(P, 'to-be');
execFileSync(python, ['-I', tool('dividir_etapas.py'), path.join(TB, 'fontes', 'registro-software-tobe.json'),
  path.join(TB, 'fontes', 'etapas')], { cwd: root, stdio: 'inherit' });
// O TO-BE completo tem ajustes de layout feitos à mão no editor: se já existe, não é reconstruído (só as imagens).
// Para regerá-lo do zero: npm run build -- <fonte> <saida> (e reaplicar os ajustes no editor).
const tobeCompleto = path.join(TB, 'registro-software-tobe.bpmn');
if (!fs.existsSync(tobeCompleto)) node(tool('build.js'), path.join(TB, 'fontes', 'registro-software-tobe.json'), tobeCompleto);
for (const f of fs.readdirSync(path.join(TB, 'fontes', 'etapas')).filter(f => f.endsWith('.json'))) {
  const dest = f.startsWith('00-') ? 'macro' : 'etapas';
  node(tool('build.js'), path.join(TB, 'fontes', 'etapas', f), path.join(TB, dest, f.replace(/\.json$/, '.bpmn')));
}
for (const dir of ['.', 'macro', 'etapas']) {
  for (const f of fs.readdirSync(path.join(TB, dir)).filter(f => f.endsWith('.bpmn'))) {
    execFileSync(process.execPath, [tool('render.js'), path.join(TB, dir, f)], { cwd: root, stdio: 'ignore' });
  }
}
py(path.join('..', 'to-be', 'scripts', 'gerar_doc.py'));  // to-be/docs/to-be-registro-software.md
console.log(`ok: artefatos regerados em ${path.relative(root, P)} (AS-IS e TO-BE)`);
