// Nota de um parágrafo que acompanha os slides: AS-IS corrigido em BPMN e modelagem do TO-BE.
// Uso: npm run nota   →   apresentacao/nota/nota-entrega.pdf
import fs from 'node:fs';
import { P, AUTORES, esc } from '../comum.mjs';
import { abrirNavegador } from '../../ferramentas/navegador.js';

const paragrafo = 'Estes slides apresentam a modelagem do processo de Registro de Programa de Computador (Software) da Agência de Inovação da UFF (AGIR). '
  + 'Eles trazem a modelagem correta do AS-IS, refeita com a notação BPMN para corrigir os erros da entrega anterior: participantes e raias por ator, eventos com os desfechos do INPI, gateways, tarefas tipadas, fluxos de mensagem e o subprocesso de pagamento. '
  + 'Trazem também a modelagem do TO-BE, o estado futuro do processo, que usa a Plataforma de Gestão de PI da AGIR para resolver os gargalos levantados com o dono e os sponsors do processo, mantendo o SEI como registro oficial e a mesma equipe.';

const fonte = fs.readFileSync(P('apresentacao/recursos/Inter.woff2')).toString('base64');
const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Nota da entrega</title><style>
@font-face{ font-family:"Inter"; font-weight:100 900; src:url(data:font/woff2;base64,${fonte}) format("woff2"); }
@page{ size:A4; margin:28mm 24mm; }
body{ margin:0; font-family:"Inter",Arial,sans-serif; color:#16160C; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.kick{ display:inline-block; background:#1D8FB9; color:#fff; font-size:9pt; font-weight:700; letter-spacing:.06em; text-transform:uppercase; padding:3pt 8pt; border-radius:4pt; }
h1{ margin:12pt 0 18pt; font-size:20pt; line-height:1.2; letter-spacing:-.01em; }
p{ margin:0; font-size:12pt; line-height:1.65; text-align:justify; hyphens:auto; }
.autores{ margin-top:22pt; padding-top:12pt; border-top:2pt solid #8ADFFF; font-size:10pt; line-height:1.5; color:#3a3a32; }
</style></head><body>
<span class="kick">Modelagem BPMN · AGIR/UFF</span>
<h1>Registro de Programa de Computador (Software): AS-IS corrigido e TO-BE</h1>
<p>${esc(paragrafo)}</p>
<div class="autores">${AUTORES.map(esc).join('<br>')}</div>
</body></html>`;

const browser = await abrirNavegador();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const saida = 'apresentacao/nota/nota-entrega.pdf';
await page.pdf({ path: P(saida), preferCSSPageSize: true, printBackground: true });
await browser.close();
console.log(`✔ ${saida}`);
