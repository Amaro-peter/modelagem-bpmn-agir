// Peças comuns das apresentações (layout, slides de diagrama, recortes, montagem do HTML e do PDF).
// Usado por apresentacao/gerar_apresentacao.mjs e apresentacao/aula/gerar_aula.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { abrirNavegador } from '../ferramentas/navegador.js';
import { calcularRecortes } from './recortes.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const P = (...p) => path.join(ROOT, ...p);
export const read = (...p) => fs.readFileSync(P(...p), 'utf8');
export const RS = 'processos/registro-software';
export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------- diagramas do processo ----------
const etapaNome = json => JSON.parse(read(json)).name.replace(/^.*Etapa (\d+) – /, '');
export function diagramas(base, modelo) {
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
export const nomesEtapas = lista => Object.fromEntries(lista.filter(d => d.rotulo.startsWith('Etapa ')).map(d => [Number(d.rotulo.slice(6)), d.titulo]));

// ---------- ícones e marcas (traço, no estilo dos cards da referência) ----------
const ico = {
  lupa: '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><circle cx="33" cy="33" r="24"/><path d="M51 51 L74 74"/></g>',
  predio: '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="miter"><path d="M8 74 H72 M14 74 V30 L40 10 L66 30 V74"/><path d="M26 74 V46 M40 74 V46 M54 74 V46 M20 40 H60"/></g>',
  alvo: '<g fill="none" stroke="currentColor" stroke-width="5"><circle cx="40" cy="40" r="34"/><circle cx="40" cy="40" r="20"/><circle cx="40" cy="40" r="6" fill="currentColor"/></g>',
  lista: '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><rect x="10" y="8" width="60" height="64" rx="8"/><path d="M24 28 H56 M24 42 H56 M24 56 H44"/></g>',
  balanca: '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M40 10 V70 M22 70 H58 M14 22 H66"/><path d="M14 22 L4 46 H24 Z M66 22 L56 46 H76 Z"/></g>',
  peixe: '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 40 H62"/><path d="M62 26 L76 40 L62 54 Z"/><path d="M18 40 L10 22 M36 40 L28 22 M18 40 L10 58 M36 40 L28 58"/></g>',
  tesoura: '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><circle cx="20" cy="58" r="11"/><circle cx="20" cy="22" r="11"/><path d="M29 51 L72 16 M29 29 L72 64"/></g>',
  pessoa: '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><circle cx="40" cy="24" r="14"/><path d="M12 72 C14 52 26 44 40 44 C54 44 66 52 68 72"/></g>',
  centro: '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><circle cx="40" cy="40" r="12"/><circle cx="12" cy="14" r="7"/><circle cx="68" cy="14" r="7"/><circle cx="12" cy="66" r="7"/><circle cx="68" cy="66" r="7"/><path d="M18 19 L31 31 M62 19 L49 31 M18 61 L31 49 M62 61 L49 49"/></g>',
  alerta: '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"><path d="M40 8 L76 70 H4 Z"/><path d="M40 30 V48 M40 58 V60"/></g>',
};
export const icone = k => `<div class="ico"><svg viewBox="0 0 80 80" aria-hidden="true">${ico[k]}</svg></div>`;
// marca do canto: losango (gateway) em vez da cruz da referência
export const marca = (w = '') => `<svg class="mark${w}" viewBox="0 0 26 26" aria-hidden="true"><path d="M13 1 L25 13 L13 25 L1 13 Z" fill="currentColor"/></svg>`;
export const seta = '<span class="sq"><svg viewBox="0 0 76 76" aria-hidden="true"><path d="M17 59 L57 19 M25 18 H58 V51" fill="none" stroke="#16160C" stroke-width="4.2" stroke-linecap="square"/></svg></span>';
export const fluxoCapa = `<svg class="fluxo" viewBox="0 0 400 260" aria-hidden="true">
    <circle cx="34" cy="130" r="30" fill="none" stroke="#16160C" stroke-width="9"/>
    <path d="M66 130 H104" stroke="#16160C" stroke-width="9"/>
    <rect x="104" y="80" width="130" height="100" rx="14" fill="#16160C"/>
    <path d="M234 130 H268" stroke="#16160C" stroke-width="9"/>
    <path d="M318 80 L368 130 L318 180 L268 130 Z" fill="#16160C"/>
  </svg>`;
export const AUTORES = ['Pedro Henrique Ferreira Amaro', 'Ismael Firmiano Mesquita Calixto', 'Raphael Mendes Miranda Fernandes'];

// slide "Restrições e solução" (restrições do enunciado e a Plataforma de Gestão de PI)
const RESTRICOES = ['SEI continua obrigatório', 'Sem novos servidores ou bolsistas', 'Investimento possível em tecnologia', 'Exigências da UFF, legais e do INPI mantidas', 'A AGIR segue responsável pelo processo'];
const MODULOS = ['Portal do interessado', 'Formulários e validação', 'Fila, prazos e lembretes', 'Agenda e autoagendamento', 'Notificações e histórico', 'Integração com o SEI', 'Apoio ao protocolo no INPI', 'Monitoramento do INPI', 'Conferência do certificado', 'Painel e indicadores'];
export const htmlRestricoesSolucao = (titulo = 'Restrições e <b>solução</b>') => `  ${marca()}
  <h2 class="rt" style="top:56px">${titulo}</h2>
  <div class="lcard restr"><h3>Restrições</h3><ul class="lvl">${RESTRICOES.map(r => `<li>${r}</li>`).join('')}</ul></div>
  <div class="solucao">
    <span class="kick">Solução proposta</span>
    <h3>Plataforma de Gestão de PI da AGIR</h3>
    <p>Sistema sob medida, financiado pelo Novo PAC. Espelha tudo no SEI, sem substituí-lo, e tira da equipe o controle manual de prazos, e-mails e consultas.</p>
    <ul class="mods">${MODULOS.map(m => `<li>${m}</li>`).join('')}</ul>
  </div>`;

// imagem estática do diagrama: o SVG exportado pelo projeto (sem a marca d'água do visualizador)
function imagemSvg(bpmn) {
  const svg = read(bpmn.replace(/\.bpmn$/, '.svg')).replace(/<!--[\s\S]*?-->/g, '');
  const [, w, h] = svg.match(/<svg[^>]*\swidth="([\d.]+)"[^>]*\sheight="([\d.]+)"/);
  // diagramas pequenos não passam de 1,5× o tamanho natural (como na versão interativa)
  return `<img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" alt="" style="max-width:${Math.round(w * 1.5)}px;max-height:${Math.round(h * 1.5)}px">`;
}

// ---------- uma apresentação: slides (HTML interativo) e slidesPdf (PDF estático) ----------
export function criarApresentacao() {
  const slides = [], slidesPdf = [], xmls = [], fundos = [];
  let nDiag = 0;
  const secao = (label, html, cls) => `<section class="slide ${cls}" aria-label="${esc(label)}">\n${html}\n</section>`;
  const add = (label, html, cls = '', htmlPdf = html) => { slides.push(secao(label, html, cls)); slidesPdf.push(secao(label, htmlPdf, cls)); };

  // diagrama: interativo (bpmn-js) no HTML, imagem no PDF. `titulo` opcional substitui o título padrão.
  function slideDiagrama(d, titulo = d.rotulo === 'Modelo completo' ? d.titulo : `${d.rotulo}${d.rotulo === 'Macroprocesso' ? '' : ' – ' + d.titulo}`) {
    const id = `d${nDiag++}`;
    xmls.push(`<script type="text/xml" id="${id}-xml">${read(d.arquivo)}</script>`);
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

  // recortes do modelo completo por trechos do fluxo: o SVG completo entra uma vez (variável CSS)
  // e cada recorte o enquadra com background-size/position (vetor nítido na tela e no PDF).
  const AREA = { w: 1352, h: 677 };            // área branca do painel (ver .dpanel/.dinner no CSS)
  const FAIXA = 104, PAD = 16, GAP = 8;        // coluna com os nomes das raias à esquerda do recorte
  async function slidesRecorte(d, pastaEtapas, grupos, nomes) {
    const svg = read(d.arquivo.replace(/\.bpmn$/, '.svg')).replace(/<!--[\s\S]*?-->/g, '');
    const [vx, vy, vw, vh] = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
    const nomeVar = `--svg-${d.modelo.toLowerCase().replace(/[^a-z]/g, '')}`;
    fundos.push(`${nomeVar}:url("data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}");`);
    const partes = await calcularRecortes(P(d.arquivo), P(pastaEtapas), grupos);
    const MINI_W = 280, mini = MINI_W / vw;
    partes.forEach((pt, k) => {
      const { x, y, w, h } = pt.recorte;
      const aw = AREA.w - 2 * PAD - FAIXA - GAP, ah = AREA.h - 2 * PAD;
      const s = Math.min(aw / w, ah / h, 1.5);
      const bw = w * s, bh = h * s;
      const left = PAD + FAIXA + GAP + (aw - bw) / 2, top = PAD + (ah - bh) / 2;
      const px = v => `${Math.round(v * 100) / 100}px`;
      const faixas = pt.faixas.map(f => `<div class="rfaixa" style="left:${px(left - GAP - FAIXA)};top:${px(top + (f.y0 - y) * s)};height:${px((f.y1 - f.y0) * s)}"><span>${esc(f.nome)}</span></div>`).join('');
      const e = pt.etapas;
      const titulo = e.length === 1 ? `Etapa ${e[0]}` : e.length === 2 ? `Etapas ${e[0]} e ${e[1]}` : `Etapas ${e[0]} a ${e[e.length - 1]}`;
      const sub = e.map(n => nomes[n]).join(' → ');
      const html = `  ${marca()}
  <header class="dhead rhead"><span class="tag ${d.modelo === 'TO-BE' ? 'tobe' : ''}">${d.modelo}</span>
    <div class="rtit"><h2>${titulo} <span class="rpart">· parte ${k + 1} de ${partes.length}</span></h2><p>${esc(sub)}</p></div>
    <div class="rmini" style="width:${MINI_W}px;height:${px(vh * mini)};background-image:var(${nomeVar})" title="Posição no modelo completo"><i style="left:${px((x - vx) * mini)};top:${px((y - vy) * mini)};width:${px(w * mini)};height:${px(h * mini)}"></i></div></header>
  <div class="dpanel"><div class="dinner rec">${faixas}<div class="rimg${pt.continua.esq ? ' c-esq' : ''}${pt.continua.dir ? ' c-dir' : ''}" style="left:${px(left)};top:${px(top)};width:${px(bw)};height:${px(bh)};background-image:var(${nomeVar});background-size:${px(vw * s)} ${px(vh * s)};background-position:${px(-(x - vx) * s)} ${px(-(y - vy) * s)}"></div></div></div>`;
      add(`${d.modelo} · Modelo completo · Parte ${k + 1} de ${partes.length}`, html);
    });
  }

  // grava o HTML interativo e o PDF estático
  async function gravar({ titulo, html: saidaHtml, pdf: saidaPdf }) {
    const fonte = fs.readFileSync(P('apresentacao/recursos/Inter.woff2')).toString('base64');
    const css = read('apresentacao/recursos/estilo.css').replace('INTER_WOFF2', fonte) + `\n:root{ ${fundos.join(' ')} }\n`;
    const bpmnCss = ['node_modules/bpmn-js/dist/assets/diagram-js.css', 'node_modules/bpmn-js/dist/assets/bpmn-js.css',
      'node_modules/bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'].map(f => read(f)).join('\n');
    const viewer = read('node_modules/bpmn-js/dist/bpmn-navigated-viewer.production.min.js').replace(/<\/script/gi, '<\\/script');
    const app = read('apresentacao/recursos/app.js');

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(titulo)}</title>
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
    fs.mkdirSync(path.dirname(P(saidaHtml)), { recursive: true });
    fs.writeFileSync(P(saidaHtml), html);
    console.log(`✔ ${saidaHtml}: ${slides.length} slides, ${nDiag} diagramas interativos, ${(html.length / 1024 / 1024).toFixed(1)} MB`);

    // versão em PDF: sem partes interativas, diagramas como imagens
    const htmlPdf = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${esc(titulo)}</title>
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
      for (const el of document.querySelectorAll('.dhead h2, .rtit p')) {
        let f = parseFloat(getComputedStyle(el).fontSize);
        const min = el.tagName === 'P' ? 12 : 26;
        while (el.scrollWidth > el.clientWidth + 1 && f > min) { f -= 1; el.style.fontSize = f + 'px'; }
      }
    });
    await page.pdf({ path: P(saidaPdf), preferCSSPageSize: true, printBackground: true });
    await browser.close();
    console.log(`✔ ${saidaPdf}: ${slidesPdf.length} páginas, ${(fs.statSync(P(saidaPdf)).size / 1024 / 1024).toFixed(1)} MB`);
  }

  return { add, slideDiagrama, slidesRecorte, gravar, total: () => slides.length };
}
