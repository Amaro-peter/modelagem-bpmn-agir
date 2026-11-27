// Gera a apresentação (HTML único, funciona offline) da modelagem BPMN do registro de software da AGIR.
// Os diagramas são os .bpmn do projeto, desenhados pelo bpmn-js (vetor, com zoom e arraste).
// Também gera a versão em PDF, com os diagramas como imagens estáticas (os SVG exportados de cada .bpmn).
// Uso: npm run apresentacao   →   apresentacao/apresentacao-bpmn-agir.html e .pdf
import fs from 'node:fs';
import { abrirNavegador } from '../ferramentas/navegador.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = (...p) => path.join(ROOT, ...p);
const read = (...p) => fs.readFileSync(P(...p), 'utf8');
const RS = 'processos/registro-software';
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------- diagramas ----------
const etapaNome = json => JSON.parse(read(json)).name.replace(/^.*Etapa (\d+) – /, '');
function diagramas(base, modelo) {
  const lista = [];
  const fontes = fs.readdirSync(P(base, 'fontes/etapas')).filter(f => /^0[1-9]-.*\.json$/.test(f)).sort();
  lista.push({ modelo, rotulo: 'Macroprocesso', titulo: 'Macroprocesso', arquivo: path.join(base, 'macro/00-macro.bpmn') });
  for (const f of fontes) {
    const n = Number(f.slice(0, 2));
    const bpmn = path.join(base, 'etapas', f.replace(/\.json$/, '.bpmn'));
    if (!fs.existsSync(P(bpmn))) throw new Error(`falta ${bpmn} (rode npm run registro-software)`);
    lista.push({ modelo, rotulo: `Etapa ${n}`, titulo: etapaNome(path.join(base, 'fontes/etapas', f)), arquivo: bpmn });
  }
  return lista;
}
const asis = { modelo: 'AS-IS', rotulo: 'Modelo completo', titulo: 'Modelo AS-IS remodelado', arquivo: `${RS}/as-is/registro-software-asis.bpmn` };
const tobe = { modelo: 'TO-BE', rotulo: 'Modelo completo', titulo: 'Modelo TO-BE', arquivo: `${RS}/to-be/registro-software-tobe.bpmn` };
const etapasAsis = diagramas(RS, 'AS-IS');
const etapasTobe = diagramas(`${RS}/to-be`, 'TO-BE');

// ---------- ícones (traço, no estilo dos cards da referência) ----------
const ico = {
  lupa: '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><circle cx="33" cy="33" r="24"/><path d="M51 51 L74 74"/></g>',
  predio: '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="miter"><path d="M8 74 H72 M14 74 V30 L40 10 L66 30 V74"/><path d="M26 74 V46 M40 74 V46 M54 74 V46 M20 40 H60"/></g>',
  alvo: '<g fill="none" stroke="currentColor" stroke-width="5"><circle cx="40" cy="40" r="34"/><circle cx="40" cy="40" r="20"/><circle cx="40" cy="40" r="6" fill="currentColor"/></g>',
};
const icone = k => `<div class="ico"><svg viewBox="0 0 80 80" aria-hidden="true">${ico[k]}</svg></div>`;
// marca do canto: losango (gateway) em vez da cruz da referência
const marca = (w = '') => `<svg class="mark${w}" viewBox="0 0 26 26" aria-hidden="true"><path d="M13 1 L25 13 L13 25 L1 13 Z" fill="currentColor"/></svg>`;
const seta = '<span class="sq"><svg viewBox="0 0 76 76" aria-hidden="true"><path d="M17 59 L57 19 M25 18 H58 V51" fill="none" stroke="#16160C" stroke-width="4.2" stroke-linecap="square"/></svg></span>';

// ---------- slides ----------
// slides: versão interativa (HTML); slidesPdf: versão estática (PDF). Só os slides de diagrama diferem.
const slides = [], slidesPdf = [];
const secao = (label, html, cls) => `<section class="slide ${cls}" aria-label="${esc(label)}">\n${html}\n</section>`;
const add = (label, html, cls = '', htmlPdf = html) => { slides.push(secao(label, html, cls)); slidesPdf.push(secao(label, htmlPdf, cls)); };

// imagem estática do diagrama: o SVG exportado pelo projeto (sem a marca d'água do visualizador)
function imagemSvg(bpmn) {
  const svg = read(bpmn.replace(/\.bpmn$/, '.svg')).replace(/<!--[\s\S]*?-->/g, '');
  const [, w, h] = svg.match(/<svg[^>]*\swidth="([\d.]+)"[^>]*\sheight="([\d.]+)"/);
  // diagramas pequenos não passam de 1,5× o tamanho natural (como na versão interativa)
  return `<img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" alt="" style="max-width:${Math.round(w * 1.5)}px;max-height:${Math.round(h * 1.5)}px">`;
}

let nDiag = 0;
const xmls = [];
function slideDiagrama(d) {
  const id = `d${nDiag++}`;
  xmls.push(`<script type="text/xml" id="${id}-xml">${read(d.arquivo)}</script>`);
  const titulo = d.rotulo === 'Modelo completo' ? d.titulo : `${d.rotulo}${d.rotulo === 'Macroprocesso' ? '' : ' – ' + d.titulo}`;
  const tag = `<span class="tag ${d.modelo === 'TO-BE' ? 'tobe' : ''}">${d.modelo}</span>`;
  const pdf = `  ${marca()}
  <header class="dhead">${tag}<h2>${esc(titulo)}</h2></header>
  <div class="dpanel"><div class="dinner estatico">${imagemSvg(d.arquivo)}</div></div>`;
  add(`${d.modelo} · ${titulo}`, `  ${marca()}
  <header class="dhead">${tag}<h2>${esc(titulo)}</h2>
    <div class="dctl" data-for="${id}"><span class="dhint">Roda do mouse: zoom<br>Arraste: mover</span><button data-z="-1" aria-label="Diminuir zoom">−</button><button data-z="1" aria-label="Aumentar zoom">+</button><button data-z="0" aria-label="Ajustar ao painel">Ajustar</button></div></header>
  <div class="dpanel" data-diag="${id}" data-file="${esc(d.arquivo)}">
    <div class="dinner"><div class="dhost"></div></div>
  </div>`, '', pdf);
}

// 1. Capa
add('Capa', `  ${marca()}
  <h1 class="big">Modelagem BPMN do processo de registro de software feita pela AGIR</h1>
  <div class="autores">
    <div class="chip">${seta}<span class="tx"><b>Pedro Henrique Ferreira Amaro</b><b>Ismael Firmiano Mesquita Calixto</b><b>Raphael Mendes Miranda Fernandes</b></span></div>
  </div>
  <svg class="fluxo" viewBox="0 0 400 260" aria-hidden="true">
    <circle cx="34" cy="130" r="30" fill="none" stroke="#16160C" stroke-width="9"/>
    <path d="M66 130 H104" stroke="#16160C" stroke-width="9"/>
    <rect x="104" y="80" width="130" height="100" rx="14" fill="#16160C"/>
    <path d="M234 130 H268" stroke="#16160C" stroke-width="9"/>
    <path d="M318 80 L368 130 L318 180 L268 130 Z" fill="#16160C"/>
  </svg>
  <div class="nit">AGIR · UFF</div>`, 'sky');

// 2. AS-IS completo   3. macro + etapas AS-IS
slideDiagrama(asis);
etapasAsis.forEach(slideDiagrama);

// 4. Contexto do TO-BE
add('Contexto do TO-BE', `  <div class="dots" style="clip-path:inset(0 0 470px 0)"></div>${marca()}
  <h2 class="hd">Por que um <span class="gr">TO-BE?</span></h2>
  <p class="sub">Um novo desenho do processo para resolver os gargalos do AS-IS com investimento em tecnologia.</p>
  <div class="cards cols3">
    <article class="hc c3">${icone('lupa')}<h3>Diagnóstico</h3><p>Partiu do modelo AS-IS e de entrevistas com o dono e os sponsors do processo, que apontaram os gargalos.</p></article>
    <article class="hc c3">${icone('predio')}<h3>Novo PAC</h3><p>A AGIR receberá recursos federais, a maior parte para a sede própria no campus. Uma parcela pode ir para modernizar processos e tecnologia.</p></article>
    <article class="hc c3">${icone('alvo')}<h3>Objetivo</h3><p>Um fluxo mais eficiente, ágil, rastreável e menos sujeito a falhas operacionais.</p></article>
  </div>`);

// 5. Gargalos
const gargalos = [
  'Demora no atendimento inicial e no agendamento da reunião',
  'E-mails perdidos e controle na memória das pessoas',
  'Falta de acompanhamento sistemático dos pedidos no INPI',
  'Interpretação demorada das informações do interessado',
  'Erros de preenchimento no sistema do INPI',
  'Demora na comunicação do andamento ao interessado',
  'Certificados com erro e correções posteriores',
];
add('Gargalos identificados', `  <div class="dots" style="clip-path:inset(0 0 600px 0)"></div>${marca()}
  <h2 class="rt" style="top:70px">Gargalos <b>identificados</b></h2>
  <div class="rcard" style="top:220px;height:565px"><ul class="duas">${gargalos.map((g, i) => `<li><span class="n">${i + 1}</span>${g}</li>`).join('')}</ul></div>`);

// 6. Restrições e solução
const restricoes = ['SEI continua obrigatório', 'Sem novos servidores ou bolsistas', 'Investimento possível em tecnologia', 'Exigências da UFF, legais e do INPI mantidas', 'A AGIR segue responsável pelo processo'];
const modulos = ['Portal do interessado', 'Formulários e validação', 'Fila, prazos e lembretes', 'Agenda e autoagendamento', 'Notificações e histórico', 'Integração com o SEI', 'Apoio ao protocolo no INPI', 'Monitoramento do INPI', 'Conferência do certificado', 'Painel e indicadores'];
add('Restrições e solução', `  ${marca()}
  <h2 class="rt" style="top:56px">Restrições e <b>solução</b></h2>
  <div class="lcard restr"><h3>Restrições</h3><ul class="lvl">${restricoes.map(r => `<li>${r}</li>`).join('')}</ul></div>
  <div class="solucao">
    <span class="kick">Solução proposta</span>
    <h3>Plataforma de Gestão de PI da AGIR</h3>
    <p>Sistema sob medida, financiado pelo Novo PAC. Espelha tudo no SEI, sem substituí-lo, e tira da equipe o controle manual de prazos, e-mails e consultas.</p>
    <ul class="mods">${modulos.map(m => `<li>${m}</li>`).join('')}</ul>
  </div>`);

// 7. TO-BE completo   8. macro + etapas TO-BE
slideDiagrama(tobe);
etapasTobe.forEach(slideDiagrama);

// ---------- montagem ----------
const fonte = fs.readFileSync(P('apresentacao/recursos/Inter.woff2')).toString('base64');
const css = read('apresentacao/recursos/estilo.css').replace('INTER_WOFF2', fonte);
const bpmnCss = ['node_modules/bpmn-js/dist/assets/diagram-js.css', 'node_modules/bpmn-js/dist/assets/bpmn-js.css',
  'node_modules/bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'].map(f => read(f)).join('\n');
const viewer = read('node_modules/bpmn-js/dist/bpmn-navigated-viewer.production.min.js').replace(/<\/script/gi, '<\\/script');
const app = read('apresentacao/recursos/app.js');

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Modelagem BPMN do registro de software | AGIR/UFF</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='18' fill='%238ADFFF'/%3E%3Cpath d='M50 18 L82 50 L50 82 L18 50 Z' fill='%2316160C'/%3E%3C/svg%3E">
<style>
${bpmnCss}
</style>
<style>
${css}
</style>
</head>
<body>
<main class="viewport" id="vp">
  <div class="stage" id="stage">
${slides.join('\n')}
  </div>
</main>
<nav class="bar" aria-label="Navegação dos slides">
  <button id="prev" aria-label="Slide anterior">&larr;</button>
  <span class="count" id="count" aria-live="polite">1 / 1</span>
  <button id="next" aria-label="Próximo slide">&rarr;</button>
  <span class="name" id="name"></span>
  <button id="fs" aria-label="Tela cheia">Tela cheia</button>
</nav>
${xmls.join('\n')}
<script>${viewer}</script>
<script>
${app}
</script>
</body>
</html>
`;
const saida = P('apresentacao/apresentacao-bpmn-agir.html');
fs.writeFileSync(saida, html);
console.log(`✔ ${path.relative(ROOT, saida)}: ${slides.length} slides, ${nDiag} diagramas interativos, ${(html.length / 1024 / 1024).toFixed(1)} MB`);

// ---------- versão em PDF: sem partes interativas, diagramas como imagens ----------
const htmlPdf = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Modelagem BPMN do registro de software | AGIR/UFF</title>
<style>
${css}
</style>
</head>
<body>
<main class="viewport"><div class="stage">
${slidesPdf.join('\n')}
</div></main>
</body>
</html>
`;
const browser = await abrirNavegador();
const page = await browser.newPage({ viewport: { width: 1456, height: 819 } });
await page.setContent(htmlPdf, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
// títulos dos diagramas numa linha: reduz a fonte até caber (mesma regra da versão interativa)
await page.emulateMedia({ media: 'print' });
await page.evaluate(() => {
  for (const el of document.querySelectorAll('.dhead h2')) {
    let f = parseFloat(getComputedStyle(el).fontSize);
    while (el.scrollWidth > el.clientWidth + 1 && f > 26) { f -= 1; el.style.fontSize = f + 'px'; }
  }
});
const saidaPdf = P('apresentacao/apresentacao-bpmn-agir.pdf');
await page.pdf({ path: saidaPdf, preferCSSPageSize: true, printBackground: true });
await browser.close();
console.log(`✔ ${path.relative(ROOT, saidaPdf)}: ${slidesPdf.length} páginas, ${(fs.statSync(saidaPdf).size / 1024 / 1024).toFixed(1)} MB`);
