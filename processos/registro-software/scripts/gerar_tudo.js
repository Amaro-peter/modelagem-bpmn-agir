// Regera todos os artefatos do processo "Registro de software" a partir das fontes JSON.
// Uso (na raiz do repositório): npm run registro-software   (Windows, macOS e Linux; requer Python 3)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const P = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(P, '..', '..');
const tool = name => path.join(root, 'ferramentas', name);
const node = (...args) => execFileSync(process.execPath, args, { cwd: root, stdio: 'inherit' });

// Python: "python3" (macOS/Linux) ou "python"/"py" (Windows)
const python = ['python3', 'python', 'py'].find(cmd => spawnSync(cmd, ['--version']).status === 0);
if (!python) { console.error('Python 3 não encontrado (necessário para gerar etapas e documentação).'); process.exit(1); }
const py = script => execFileSync(python, ['-I', path.join(P, 'scripts', script)], { cwd: root, stdio: 'inherit' });

// Gera um diagrama a partir da fonte, preservando ajustes feitos à mão no editor:
//  - arquivo nunca editado (igual ao que o gerador produziu da última vez; hash em .gerados.json): é atualizado;
//  - arquivo editado à mão com o MESMO conteúdo da fonte (só layout mudou): é mantido;
//  - conteúdo diferente da fonte: é gerado de novo e a versão anterior vai para .historico/
//    (ajustes de conteúdo feitos no editor devem ser levados à fonte JSON antes).
const { mesmoConteudo } = await import(pathToFileURL(tool('conteudo.mjs')).href);
const { createHash } = await import('node:crypto');
const historico = path.join(root, '.historico');
const registro = path.join(P, '.gerados.json');
const gerados = fs.existsSync(registro) ? JSON.parse(fs.readFileSync(registro, 'utf8')) : {};
const hash = t => createHash('sha1').update(t).digest('hex');
const pendentes = [];
function gerar(fonte, destino) {
  fs.mkdirSync(historico, { recursive: true });
  const novo = path.join(historico, `gerado-${path.basename(destino)}`);
  node(tool('build.js'), fonte, novo);
  pendentes.push({ novo, destino });
}
async function concluir() {
  for (const { novo, destino } of pendentes.splice(0)) {
    const rel = path.relative(root, destino).split(path.sep).join('/');
    const atual = fs.existsSync(destino) ? fs.readFileSync(destino, 'utf8') : null;
    const gerado = fs.readFileSync(novo, 'utf8');
    const editadoAMao = atual !== null && gerados[rel] && hash(atual) !== gerados[rel];
    if (editadoAMao && await mesmoConteudo(atual, gerado)) {
      console.log(`${rel}: ajustado à mão no editor, conteúdo igual ao da fonte; layout manual mantido`);
      fs.rmSync(novo);
      continue;
    }
    if (editadoAMao) {
      const bak = path.join(historico, `layout-anterior-${Date.now()}-${path.basename(destino)}`);
      fs.copyFileSync(destino, bak);
      console.log(`${rel}: conteúdo mudou; gerado de novo (versão anterior em ${path.relative(root, bak)})`);
    }
    fs.renameSync(novo, destino);
    gerados[rel] = hash(gerado);
  }
  fs.writeFileSync(registro, JSON.stringify(gerados, null, 2) + '\n');
}

gerar(path.join(P, 'fontes', 'registro-software-asis.json'), path.join(P, 'as-is', 'registro-software-asis.bpmn'));
gerar(path.join(P, 'fontes', 'etapas', '00-macro.json'), path.join(P, 'macro', '00-macro.bpmn'));
for (const f of fs.readdirSync(path.join(P, 'fontes', 'etapas')).filter(f => /^0[1-7]-.*\.json$/.test(f))) {
  gerar(path.join(P, 'fontes', 'etapas', f), path.join(P, 'etapas', f.replace(/\.json$/, '.bpmn')));
}
await concluir();
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
gerar(path.join(TB, 'fontes', 'registro-software-tobe.json'), path.join(TB, 'registro-software-tobe.bpmn'));
for (const f of fs.readdirSync(path.join(TB, 'fontes', 'etapas')).filter(f => f.endsWith('.json'))) {
  const dest = f.startsWith('00-') ? 'macro' : 'etapas';
  gerar(path.join(TB, 'fontes', 'etapas', f), path.join(TB, dest, f.replace(/\.json$/, '.bpmn')));
}
await concluir();
for (const dir of ['.', 'macro', 'etapas']) {
  for (const f of fs.readdirSync(path.join(TB, dir)).filter(f => f.endsWith('.bpmn'))) {
    execFileSync(process.execPath, [tool('render.js'), path.join(TB, dir, f)], { cwd: root, stdio: 'ignore' });
  }
}
py(path.join('..', 'to-be', 'scripts', 'gerar_doc.py'));  // to-be/docs/to-be-registro-software.md
console.log(`ok: artefatos regerados em ${path.relative(root, P)} (AS-IS e TO-BE)`);
