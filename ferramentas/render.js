// Renderiza .bpmn em SVG e PNG usando o bpmn-js num Chromium headless.
// Uso: node ferramentas/render.js <arquivo.bpmn> [prefixo-de-saida]   -> gera .svg e .png (um por plano)
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';

const require = createRequire(import.meta.url);
const [, , input, outBase = input.replace(/\.bpmn$/, '')] = process.argv;
const xml = fs.readFileSync(input, 'utf8');
const dist = path.dirname(require.resolve('bpmn-js/dist/bpmn-viewer.production.min.js'));

// Procura um navegador para renderizar, em qualquer sistema:
// 1) CHROMIUM_PATH  2) Chromium do Playwright (npx playwright install chromium)
// 3) Google Chrome ou Microsoft Edge instalados  4) qualquer Chromium já baixado pelo Playwright (Linux)
async function launchBrowser() {
  if (process.env.CHROMIUM_PATH) return chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
  const attempts = [{}, { channel: 'chrome' }, { channel: 'msedge' }];
  const base = path.join(os.homedir(), '.cache/ms-playwright');
  if (fs.existsSync(base)) {
    for (const d of fs.readdirSync(base).filter(d => d.startsWith('chromium-')).sort().reverse()) {
      const p = path.join(base, d, 'chrome-linux64/chrome');
      if (fs.existsSync(p)) attempts.push({ executablePath: p });
    }
  }
  for (const opts of attempts) {
    try { return await chromium.launch(opts); } catch { /* tenta o próximo */ }
  }
  throw new Error('Nenhum navegador encontrado. Instale o Google Chrome ou rode: npx playwright install chromium (ou defina CHROMIUM_PATH).');
}

const browser = await launchBrowser();
const page = await browser.newPage({ deviceScaleFactor: 2 });
await page.setContent(`<html><head>
  <style>${fs.readFileSync(path.join(dist, 'assets/diagram-js.css'), 'utf8')}</style>
  <style>${fs.readFileSync(path.join(dist, 'assets/bpmn-js.css'), 'utf8')}</style>
  <style>html,body,#c{margin:0;width:100%;height:100%;background:#fff}</style>
</head><body><div id="c"></div></body></html>`);
await page.addScriptTag({ path: path.join(dist, 'bpmn-viewer.production.min.js') });

// Um SVG por plano: o principal e um para cada etapa (subprocesso recolhido).
const { planes, warnings } = await page.evaluate(async (xml) => {
  const viewer = new BpmnJS({ container: '#c' });
  const { warnings } = await viewer.importXML(xml);
  const canvas = viewer.get('canvas');
  const main = canvas.getRootElement();
  const roots = [main, ...canvas.getRootElements().filter(r => r !== main)];
  const planes = [];
  for (const root of roots) {
    if (root !== main && !root.children?.length) continue; // plano vazio (subprocesso sem conteúdo)
    canvas.setRootElement(root);
    const { svg } = await viewer.saveSVG();
    planes.push({ id: root === main ? null : root.businessObject.id, svg });
  }
  return { planes, warnings: warnings.map(w => w.message) };
}, xml);
if (warnings.length) console.warn('Avisos de importação:', warnings);

const written = [];
// O bpmn-js gera ids aleatórios para as pontas de seta; numeramos em ordem para saídas estáveis (diffs limpos no git).
const stable = svg => {
  const map = new Map();
  return svg.replace(/(?<=id="|#)marker-[a-z0-9]+/g, m => (map.has(m) || map.set(m, `marker-${map.size + 1}`), map.get(m)));
};
for (const { id, svg: raw } of planes) {
  const svg = stable(raw);
  const base = id ? `${outBase}-${id}` : outBase;
  fs.writeFileSync(`${base}.svg`, svg);
  await page.setContent(`<html><body style="margin:0;background:#fff">${svg}</body></html>`);
  await page.locator('svg').first().screenshot({ path: `${base}.png` });
  written.push(base);
}
await browser.close();
console.log('OK:', written.map(b => `${b}.svg/.png`).join(', '));
