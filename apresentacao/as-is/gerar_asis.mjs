// Apresentação curta do AS-IS remodelado: capa, aviso da remodelagem em BPMN, AS-IS inteiro e AS-IS em partes.
// Uso: npm run apresentacao-asis   →   apresentacao/as-is/apresentacao-as-is.html e .pdf (7 slides)
import { RS, diagramas, nomesEtapas, marca, seta, fluxoCapa, AUTORES, criarApresentacao } from '../comum.mjs';

const asis = { modelo: 'AS-IS', rotulo: 'Modelo completo', titulo: 'O AS-IS inteiro', arquivo: `${RS}/as-is/registro-software-asis.bpmn` };
const { add, slideDiagrama, slidesRecorte, gravar } = criarApresentacao();

// 1. Capa com os nomes
add('Capa', `  ${marca()}
  <span class="kick-capa">Modelo AS-IS · remodelado em BPMN</span>
  <h1 class="big" style="top:130px">Modelagem BPMN do processo de registro de software feita pela AGIR</h1>
  <div class="autores">
    <div class="chip">${seta}<span class="tx">${AUTORES.map(a => `<b>${a}</b>`).join('')}</span></div>
  </div>
  ${fluxoCapa}
  <div class="nit">AGIR · UFF</div>`, 'sky');

// 2. O AS-IS foi remodelado corretamente na notação BPMN (o que o modelo atual usa da notação)
const notacao = [
  ['3 participantes (pools)', 'Cotitulares externos, PROPPI/AGIR e INPI'],
  ['Raias por ator', 'Interessado, AGIR e outras unidades da UFF'],
  ['Eventos', 'Início, intermediários (mensagem e condição) e fim, com os desfechos do INPI (730 e 742)'],
  ['Gateways', 'Exclusivos e paralelos, com as decisões rotuladas'],
  ['Tarefas tipadas', 'De usuário, de envio e de serviço'],
  ['Fluxos de mensagem', 'Trocas com o INPI e com os cotitulares externos'],
  ['Subprocesso', 'Pagamento da GRU, detalhado em um nível próprio'],
  ['Leitura clara', 'Preto e branco, sem setas cruzadas e cada etapa com uma saída nomeada'],
];
add('O AS-IS foi remodelado', `  <div class="dots" style="clip-path:inset(0 0 680px 0)"></div>${marca()}
  <h2 class="rt at" style="top:48px">O AS-IS foi <b>remodelado</b></h2>
  <div class="remod antes"><span class="kick-c">Antes</span><h3>Tínhamos modelado o AS-IS de forma equivocada.</h3><p>A primeira versão não representava o processo corretamente na notação.</p></div>
  <div class="remod agora"><span class="kick-c">Agora</span><h3>Modelamos corretamente usando a notação BPMN</h3>
    <ul>${notacao.map(([t, d]) => `<li><b>${t}</b><span>${d}</span></li>`).join('')}</ul></div>`);

// 3. AS-IS inteiro   4. AS-IS em partes (trechos do fluxo)
slideDiagrama(asis);
await slidesRecorte(asis, `${RS}/fontes/etapas`, [[1, 2], [3, 4], [5, 6], [7]], nomesEtapas(diagramas(RS, 'AS-IS')));

await gravar({ titulo: 'Modelo AS-IS remodelado em BPMN | Registro de software AGIR/UFF', html: 'apresentacao/as-is/apresentacao-as-is.html', pdf: 'apresentacao/as-is/apresentacao-as-is.pdf' });
