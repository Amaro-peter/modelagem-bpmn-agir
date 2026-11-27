// Apresentação da aula no modelo "Mapeamento dos processos – TO-BE" (até 15 slides):
// título; resumo (processo, método de análise, heurísticas); análise qualitativa (resultados e conclusões);
// redesenho TO-BE (novo diagrama e melhorias). Conteúdo revisado pelo grupo em apresentacao/aula/conteudo.md.
// Uso: npm run aula   →   apresentacao/aula/apresentacao-aula-to-be.html e .pdf
import fs from 'node:fs';
import { RS, P, esc, diagramas, nomesEtapas, icone, marca, seta, fluxoCapa, AUTORES, htmlRestricoesSolucao, criarApresentacao } from '../comum.mjs';

const asis = { modelo: 'AS-IS', rotulo: 'Modelo completo', arquivo: `${RS}/as-is/registro-software-asis.bpmn` };
const tobe = { modelo: 'TO-BE', rotulo: 'Modelo completo', arquivo: `${RS}/to-be/registro-software-tobe.bpmn` };
const { add, slideDiagrama, slidesRecorte, gravar, total } = criarApresentacao();
const titulo = (cinza, preto, top = 48) => `<h2 class="rt at" style="top:${top}px">${cinza} <b>${preto}</b></h2>`;
const fundoPontos = '<div class="dots" style="clip-path:inset(0 0 680px 0)"></div>';

// ---------------- conteúdo (apresentacao/aula/conteudo.md) ----------------
const problemas = [
  ['Demora no atendimento inicial', 'Demora para responder ao processo aberto no SEI e para agendar a reunião inicial', 'O interessado espera e o processo começa atrasado'],
  ['Falhas na gestão dos e-mails', 'Mensagens de vários interessados se perdem na caixa de entrada, sem resposta nem encaminhamento', 'O processo para, e o controle depende da memória de cada pessoa'],
  ['Sem acompanhamento sistemático no INPI', 'A decisão leva de 7 a 10 dias, e pedidos deixam de ser acompanhados no momento certo', 'Atraso para perceber decisões e certificados disponíveis'],
  ['Interpretação das informações', 'A equipe interpreta documentos livres, o que gera sucessivas trocas de esclarecimento', 'Retrabalho, ambiguidade e dependência de interpretação individual'],
  ['Erros de preenchimento no INPI', 'Mesmo depois dos esclarecimentos, há dados inseridos incorretamente no e-Software', 'Correções posteriores, mais esforço e processo mais longo'],
  ['Demora na comunicação do andamento', 'O interessado demora a saber de atualizações, decisões e da conclusão', 'Contatos manuais para perguntar o andamento'],
  ['Certificados com erro', 'Certificados com informações incorretas levam a pedidos de correção', 'Novas atividades administrativas depois do fim do processo'],
];
// análise de valor agregado: atividades do AS-IS (sem as do INPI); o que não é VA nem NVA é BVA
const VA = ['a_analisar_ativo', 'i_zip', 'i_dados', 'a_esoft_form', 'a_enviar', 'a_certificado', 'a_email_cert', 'i_receber_cert'];
const NVA = ['i_identificar', 'a_sei_req', 'a_sei_docs', 'a_email_decisao', 'a_email_reuniao', 'a_email_orient', 'a_email_cadastro', 'a_email_742', 'i_receber_742'];
const ishikawa = {
  efeito: 'Registro de software demorado e sujeito a erros',
  cima: [
    ['Pessoas', ['Equipe sem possibilidade de ampliação', 'Controle na memória de cada pessoa', 'Muitos pedidos ao mesmo tempo']],
    ['Método', ['Sem fila nem prazos para triagem e respostas', 'Acompanhamento do INPI sem rotina', 'Conferência dos dados só depois do envio']],
    ['Sistemas', ['SEI registra, mas não controla prazos', 'e-Software sem API: redigitação manual', 'Sem ferramenta de agenda']],
  ],
  baixo: [
    ['Comunicação', ['Trocas por e-mail com vários interessados', 'Mensagens perdidas', 'Interessado sem visão do andamento']],
    ['Informação/dados', ['Dados em formato livre, interpretados pela equipe', 'Dados redigitados no e-Software', 'Dados espalhados entre e-mail, SEI e INPI']],
    ['Instituição', ['SEI obrigatório', 'Exigências do INPI (GRU, DV com ICP-Brasil)', 'Decisões só na RPI semanal']],
  ],
};
const conclusoes = [
  ['O tempo perdido está em mover informação', 'E-mails, idas ao SEI para baixar documentos, redigitação e esclarecimentos: são as atividades NVA.'],
  ['Causas em comum', 'Informação espalhada (e-mail, SEI, INPI) e controle manual de prazos, que depende das pessoas.'],
  ['A saída é tecnologia', 'Com o SEI obrigatório e sem novos servidores, não dá para resolver contratando: é preciso centralizar e automatizar.'],
  ['Manter o exigido, cortar o desperdício', 'O que a UFF e o INPI exigem (BVA) fica; o redesenho elimina as NVA e previne erros antes do protocolo.'],
];
const H = { elim: 'Eliminação de atividades', emp: 'Empoderamento', cent: 'Centralização' };
const melhorias = [
  ['Atendimento inicial', 'Solicitação no portal com registro automático, fila com prazo de triagem e autoagendamento da reunião', ['emp', 'elim']],
  ['E-mails', 'Comunicação e histórico centralizados na plataforma, com notificações automáticas', ['cent', 'elim']],
  ['Acompanhamento no INPI', 'Monitoramento de cada pedido: leitura semanal da RPI e "Meus Pedidos", alerta em 10 dias', ['cent', 'elim']],
  ['Interpretação', 'Formulário estruturado com validação automática e pendências apontadas no portal', ['elim', 'emp']],
  ['Preenchimento no INPI', 'Versão dos dados aprovada pelo interessado (aceite), ficha de preenchimento e dupla conferência', ['emp', 'elim']],
  ['Comunicação do andamento', 'Notificações a cada mudança de situação e painel no portal', ['cent', 'elim']],
  ['Certificados com erro', 'Certificado conferido com os dados aprovados; correção conforme a origem do erro', ['elim']],
];

// contagem VA/BVA/NVA por etapa, a partir do AS-IS (as etapas dizem a que etapa cada atividade pertence)
function valorPorEtapa() {
  const fonte = JSON.parse(fs.readFileSync(P(`${RS}/fontes/registro-software-asis.json`), 'utf8'));
  const atividades = fonte.pools.filter(p => !/INPI/.test(p.id)).flatMap(p => p.nodes || [])
    .filter(n => ['task', 'user', 'service', 'send', 'receive', 'manual', 'script', 'subprocess', 'call'].includes(n.type));
  const etapaDe = {};
  for (const f of fs.readdirSync(P(`${RS}/fontes/etapas`)).filter(f => /^0[1-9]-.*\.json$/.test(f)))
    for (const p of JSON.parse(fs.readFileSync(P(`${RS}/fontes/etapas`, f), 'utf8')).pools)
      for (const n of p.nodes || []) etapaDe[n.id] ??= Number(f.slice(0, 2));
  const faltam = [...VA, ...NVA].filter(id => !atividades.some(a => a.id === id));
  if (faltam.length) throw new Error(`atividades classificadas que não existem no AS-IS: ${faltam}`);
  const por = {};
  for (const a of atividades) {
    const k = etapaDe[a.id]; if (!k) throw new Error(`atividade sem etapa: ${a.id}`);
    por[k] ??= { VA: 0, BVA: 0, NVA: 0 };
    por[k][VA.includes(a.id) ? 'VA' : NVA.includes(a.id) ? 'NVA' : 'BVA']++;
  }
  const nomes = Object.fromEntries(atividades.map(a => [a.id, a.name]));
  return { por, nomes, total: atividades.length };
}

// ---------------- slides ----------------
// 1. Título e integrantes
add('Capa', `  ${marca()}
  <span class="kick-capa">Mapeamento dos processos · TO-BE</span>
  <h1 class="big" style="top:130px">Modelagem BPMN do processo de registro de software feita pela AGIR</h1>
  <div class="autores">
    <div class="chip">${seta}<span class="tx">${AUTORES.map(a => `<b>${a}</b>`).join('')}</span></div>
  </div>
  ${fluxoCapa}
  <div class="nit">AGIR · UFF</div>`, 'sky');

// 2. Resumo: processo escolhido e por quê
add('Resumo: processo escolhido', `  ${fundoPontos}${marca()}
  ${titulo('Resumo ·', 'processo escolhido')}
  <div class="lcard proc"><span class="kick-c">Processo AS-IS</span><h3>Registro de Programa de Computador (Software)</h3>
    <p>Na AGIR, a Agência de Inovação da UFF, o processo vai do pedido do interessado ao certificado do INPI e aos registros internos na universidade.</p></div>
  <div class="rcard porque"><h3>Por quê? Problemas relatados pelo dono e pelos sponsors do processo</h3>
    <ul class="duas">${problemas.map((p, i) => `<li><span class="n">${i + 1}</span>${p[0]}</li>`).join('')}</ul></div>`);

// 3. Resumo: métodos de análise qualitativa e por quê
add('Resumo: métodos de análise', `  ${fundoPontos}${marca()}
  ${titulo('Resumo ·', 'métodos de análise qualitativa')}
  <p class="sub at">Segundo Fundamentals of BPM (Dumas et al.): três olhares complementares sobre o AS-IS.</p>
  <div class="cards cols3 at">
    <article class="hc c3">${icone('lista')}<h3>Registro de problemas</h3><p><b>Por quê:</b> organiza os problemas relatados nas entrevistas, com a descrição e o impacto de cada um.</p></article>
    <article class="hc c3">${icone('balanca')}<h3>Análise de valor agregado</h3><p><b>Por quê:</b> separa o que gera valor para o interessado (VA), o que a UFF e o INPI exigem (BVA) e o que só move informação (NVA).</p></article>
    <article class="hc c3">${icone('peixe')}<h3>Diagrama de Ishikawa</h3><p><b>Por quê:</b> liga os problemas às causas: pessoas, método, sistemas, comunicação, dados e instituição.</p></article>
  </div>`);

// 4. Resumo: heurísticas de redesenho e por quê
add('Resumo: heurísticas de redesenho', `  ${fundoPontos}${marca()}
  ${titulo('Resumo ·', 'heurísticas de redesenho')}
  <p class="sub at">Reijers e Mansar, pelo quadrilátero do diabo. Princípio do grupo: <b>impedir trocas de informação e movimentação de dados desnecessárias.</b></p>
  <div class="cards cols3 at">
    <article class="hc c3 heur">${icone('tesoura')}<span class="dim">Custo</span><h3>Eliminação de atividades</h3><p>Remove as atividades NVA: e-mails manuais, idas ao SEI para baixar documentos e trocas de esclarecimento. No lugar: formulário, notificações automáticas e espelhamento no SEI.</p></article>
    <article class="hc c3 heur">${icone('pessoa')}<span class="dim">Custo</span><h3>Empoderamento</h3><p>O interessado agenda a reunião, corrige os próprios dados e dá o aceite eletrônico; a equipe faz a triagem pela fila, sem esperar encaminhamentos por e-mail.</p></article>
    <article class="hc c3 heur">${icone('centro')}<span class="dim flex">Flexibilidade</span><h3>Centralização</h3><p>Uma plataforma única reúne solicitações, comunicações, dados, prazos e o acompanhamento do INPI. Servidores e bolsistas trabalham numa fila comum.</p></article>
  </div>`);

// 5. Análise qualitativa: o processo AS-IS
slideDiagrama(asis, 'Análise qualitativa · o processo AS-IS');

// 6. Resultados: registro de problemas
add('Resultados: registro de problemas', `  ${marca()}
  ${titulo('Resultados ·', 'registro de problemas', 40)}
  <table class="tab prob"><thead><tr><th>#</th><th>Problema</th><th>Descrição</th><th>Impacto</th></tr></thead><tbody>
  ${problemas.map((p, i) => `<tr><td><span class="n">${i + 1}</span></td><td><b>${esc(p[0])}</b></td><td>${esc(p[1])}</td><td>${esc(p[2])}</td></tr>`).join('\n  ')}
  </tbody></table>`);

// 7. Resultados: análise de valor agregado
const v = valorPorEtapa();
const nomesAsis = nomesEtapas(diagramas(RS, 'AS-IS'));
const tot = { VA: 0, BVA: 0, NVA: 0 };
Object.values(v.por).forEach(c => { tot.VA += c.VA; tot.BVA += c.BVA; tot.NVA += c.NVA; });
const MAXB = Math.max(...Object.values(v.por).map(c => c.VA + c.BVA + c.NVA));
const barras = Object.keys(v.por).sort((a, b) => a - b).map(k => {
  const c = v.por[k], seg = (n, cl) => n ? `<i class="${cl}" style="width:${(n / MAXB) * 100}%">${n}</i>` : '';
  return `<div class="vrow"><span class="vlab"><b>Etapa ${k}</b> ${esc(nomesAsis[k])}</span><span class="vbar">${seg(c.VA, 'va')}${seg(c.BVA, 'bva')}${seg(c.NVA, 'nva')}</span></div>`;
}).join('');
add('Resultados: valor agregado', `  ${marca()}
  ${titulo('Resultados ·', 'análise de valor agregado', 40)}
  <div class="vcard"><div class="vleg"><span><i class="va"></i>VA ${tot.VA}</span><span><i class="bva"></i>BVA ${tot.BVA}</span><span><i class="nva"></i>NVA ${tot.NVA}</span><em>${v.total} atividades do AS-IS (sem as do INPI)</em></div>${barras}</div>
  <div class="ncard"><span class="kick-c">NVA: só movem informação</span><ul>${NVA.map(id => `<li>${esc(v.nomes[id])}</li>`).join('')}<li class="esp">Espera sem rotina pela publicação na RPI</li></ul></div>`);

// 8. Resultados: diagrama de Ishikawa
function espinha() {
  const W = 1368, cx = [200, 560, 920], yS = 360, cardH = 200, OFF = 120;
  const ossos = [...ishikawa.cima.map((c, i) => ({ c, x: cx[i], cima: true })), ...ishikawa.baixo.map((c, i) => ({ c, x: cx[i], cima: false }))];
  const linhas = ossos.map(o => `<path d="M${o.x} ${o.cima ? yS - OFF : yS + OFF} L${o.x + 110} ${yS}"/>`).join('');
  const cards = ossos.map(o => `<div class="ibox" style="left:${o.x - 175}px;top:${o.cima ? yS - OFF - cardH : yS + OFF}px;height:${cardH}px"><h4>${esc(o.c[0])}</h4><ul>${o.c[1].map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>`).join('');
  return `<div class="ishi"><svg viewBox="0 0 ${W} 720" aria-hidden="true"><g fill="none" stroke="#16160C" stroke-width="5" stroke-linecap="round"><path d="M40 ${yS} H1090"/>${linhas}</g><path d="M1080 ${yS - 18} L1104 ${yS} L1080 ${yS + 18} Z" fill="#16160C"/></svg>
    ${cards}<div class="ihead" style="top:${yS - 85}px"><span class="kick-c">Efeito</span>${esc(ishikawa.efeito)}</div></div>`;
}
add('Resultados: diagrama de Ishikawa', `  ${marca()}
  ${titulo('Resultados ·', 'diagrama de Ishikawa', 28)}
  ${espinha()}`);

// 9. Conclusões
add('Conclusões', `  ${fundoPontos}${marca()}
  ${titulo('Análise qualitativa ·', 'conclusões')}
  <div class="cards concl">${conclusoes.map((c, i) => `<article class="hc"><span class="num">${i + 1}</span><h3>${esc(c[0])}</h3><p>${esc(c[1])}</p></article>`).join('')}</div>`);

// 10. Redesenho: restrições e solução
add('Redesenho: restrições e solução', htmlRestricoesSolucao('Redesenho · <b>restrições e solução</b>'));

// 11. Novo diagrama TO-BE   12–14. por trechos
slideDiagrama(tobe, 'Redesenho · o novo processo TO-BE');
await slidesRecorte(tobe, `${RS}/to-be/fontes/etapas`, [[1, 2], [3, 4], [5, 6, 7]], nomesEtapas(diagramas(`${RS}/to-be`, 'TO-BE')));

// 15. Principais melhorias e justificativas
add('Principais melhorias e justificativas', `  ${marca()}
  ${titulo('Redesenho ·', 'principais melhorias e justificativas', 40)}
  <table class="tab melh"><thead><tr><th>Problema (AS-IS)</th><th>Melhoria no TO-BE</th><th>Heurística</th></tr></thead><tbody>
  ${melhorias.map((m, i) => `<tr><td><span class="n">${i + 1}</span><b>${esc(m[0])}</b></td><td>${esc(m[1])}</td><td>${m[2].map(h => `<span class="hpill ${h}">${H[h]}</span>`).join('')}</td></tr>`).join('\n  ')}
  </tbody></table>`);

if (total() > 15) throw new Error(`a apresentação da aula tem ${total()} slides (máximo 15)`);
await gravar({ titulo: 'Mapeamento dos processos – TO-BE | Registro de software AGIR/UFF', html: 'apresentacao/aula/apresentacao-aula-to-be.html', pdf: 'apresentacao/aula/apresentacao-aula-to-be.pdf' });
