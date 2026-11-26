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

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = path.join(os.homedir(), '.cache/ms-playwright');
  const dirs = fs.readdirSync(base).filter(d => d.startsWith('chromium-')).sort().reverse();
  for (const d of dirs) {
    const p = path.join(base, d, 'chrome-linux64/chrome');
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Chromium não encontrado; defina CHROMIUM_PATH');
}

const browser = await chromium.launch({ executablePath: findChromium() });
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
for (const { id, svg } of planes) {
  const base = id ? `${outBase}-${id}` : outBase;
  fs.writeFileSync(`${base}.svg`, svg);
  await page.setContent(`<html><body style="margin:0;background:#fff">${svg}</body></html>`);
  await page.locator('svg').first().screenshot({ path: `${base}.png` });
  written.push(base);
}
await browser.close();
console.log('OK:', written.map(b => `${b}.svg/.png`).join(', '));
