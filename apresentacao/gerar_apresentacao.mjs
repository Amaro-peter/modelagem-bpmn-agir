// Gera a apresentação (HTML único, funciona offline) da modelagem BPMN do registro de software da AGIR.
// Os diagramas são os .bpmn do projeto, desenhados pelo bpmn-js (vetor, com zoom e arraste).
// Também gera a versão em PDF, com os diagramas como imagens estáticas (os SVG exportados de cada .bpmn).
// Uso: npm run apresentacao   →   apresentacao/apresentacao-bpmn-agir.html e .pdf
import { RS, diagramas, nomesEtapas, icone, marca, seta, fluxoCapa, AUTORES, htmlRestricoesSolucao, criarApresentacao } from './comum.mjs';

const asis = { modelo: 'AS-IS', rotulo: 'Modelo completo', titulo: 'Modelo AS-IS remodelado', arquivo: `${RS}/as-is/registro-software-asis.bpmn` };
const tobe = { modelo: 'TO-BE', rotulo: 'Modelo completo', titulo: 'Modelo TO-BE', arquivo: `${RS}/to-be/registro-software-tobe.bpmn` };
const etapasAsis = diagramas(RS, 'AS-IS');
const etapasTobe = diagramas(`${RS}/to-be`, 'TO-BE');

const { add, slideDiagrama, slidesRecorte, gravar } = criarApresentacao();

// 1. Capa
add('Capa', `  ${marca()}
  <h1 class="big">Modelagem BPMN do processo de registro de software feita pela AGIR</h1>
  <div class="autores">
    <div class="chip">${seta}<span class="tx">${AUTORES.map(a => `<b>${a}</b>`).join('')}</span></div>
  </div>
  ${fluxoCapa}
  <div class="nit">AGIR · UFF</div>`, 'sky');

// 2. AS-IS completo e seus recortes   3. macro + etapas AS-IS
slideDiagrama(asis);
await slidesRecorte(asis, `${RS}/fontes/etapas`, [[1, 2], [3, 4], [5, 6], [7]], nomesEtapas(etapasAsis));
etapasAsis.forEach(d => slideDiagrama(d));

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
add('Restrições e solução', htmlRestricoesSolucao());

// 7. TO-BE completo e seus recortes (sem macroprocesso e etapas do TO-BE, a pedido)
slideDiagrama(tobe);
await slidesRecorte(tobe, `${RS}/to-be/fontes/etapas`, [[1, 2], [3, 4], [5, 6, 7]], nomesEtapas(etapasTobe));

await gravar({ titulo: 'Modelagem BPMN do registro de software | AGIR/UFF', html: 'apresentacao/apresentacao-bpmn-agir.html', pdf: 'apresentacao/apresentacao-bpmn-agir.pdf' });
