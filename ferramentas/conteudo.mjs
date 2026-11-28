// Compara o CONTEÚDO de dois .bpmn (elementos, tipos, nomes, ligações, raias, eventos), ignorando o layout.
// Usado para preservar ajustes de layout feitos à mão no editor quando a fonte não mudou.
// Uso: node ferramentas/conteudo.mjs <a.bpmn> <b.bpmn>   (código 0 = mesmo conteúdo)
import fs from 'node:fs';
import { BpmnModdle } from 'bpmn-moddle';

async function assinatura(xml) {
  const { rootElement } = await new BpmnModdle().fromXML(xml);
  const els = [];
  const laneOf = {};
  const walk = e => {
    if (!e || typeof e !== 'object') return;
    for (const ls of e.laneSets || []) for (const l of ls.lanes || []) for (const r of l.flowNodeRef || []) laneOf[r.id] = l.id;
    if (e.id && e.$type?.startsWith('bpmn:') && !/Definitions|LaneSet/.test(e.$type)) els.push(e);
    for (const k of ['rootElements', 'flowElements', 'artifacts', 'participants', 'messageFlows', 'laneSets', 'lanes']) (e[k] || []).forEach(walk);
  };
  walk(rootElement);
  return els.map(e => [e.id, e.$type, e.name ?? e.text ?? '', e.sourceRef?.id ?? '', e.targetRef?.id ?? '', e.attachedToRef?.id ?? '',
    laneOf[e.id] ?? '', (e.eventDefinitions || []).map(d => d.$type).join(','), e.calledElement ?? '', e.processRef?.id ?? ''].join('|'))
    .sort().join('\n');
}

export async function mesmoConteudo(xmlA, xmlB) {
  return (await assinatura(xmlA)) === (await assinatura(xmlB));
}

if (process.argv[1]?.endsWith('conteudo.mjs')) {
  const ok = await mesmoConteudo(fs.readFileSync(process.argv[2], 'utf8'), fs.readFileSync(process.argv[3], 'utf8'));
  console.log(ok ? 'mesmo conteúdo' : 'conteúdo diferente');
  process.exit(ok ? 0 : 1);
}
