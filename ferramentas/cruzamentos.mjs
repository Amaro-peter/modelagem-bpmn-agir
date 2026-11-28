// Qualidade visual e de ligação de um diagrama BPMN (critérios de revisão da modelagem):
//  - setas (sequência e mensagem) que se cruzam, se tocam fora dos nós, se sobrepõem ou atravessam formas;
//  - rótulos de setas em cima de outra seta;
//  - elementos soltos: nó sem entrada/saída, tarefa de envio ou evento de mensagem sem fluxo de mensagem,
//    anotação sem associação;
//  - cores (o diagrama deve ser só preto e branco).
// Uso: node ferramentas/cruzamentos.mjs <arquivo.bpmn>...   (código de saída 1 se houver problema)
import fs from 'node:fs';
import { BpmnModdle } from 'bpmn-moddle';

export async function analisar(xml) {
  const { rootElement } = await new BpmnModdle().fromXML(xml);
  const els = {};
  const walk = e => {
    if (!e || typeof e !== 'object') return;
    if (e.id && e.$type) els[e.id] = e;
    for (const k of ['rootElements', 'flowElements', 'artifacts', 'participants', 'messageFlows']) (e[k] || []).forEach(walk);
  };
  walk(rootElement);
  const todos = Object.values(els);
  const inc = {}, out = {}, msg = new Set(), assoc = new Set();
  for (const s of todos.filter(e => e.$type === 'bpmn:SequenceFlow')) { out[s.sourceRef.id] = 1; inc[s.targetRef.id] = 1; }
  for (const m of todos.filter(e => e.$type === 'bpmn:MessageFlow')) { msg.add(m.sourceRef.id); msg.add(m.targetRef.id); }
  for (const a of todos.filter(e => e.$type === 'bpmn:Association')) { assoc.add(a.sourceRef.id); assoc.add(a.targetRef.id); }
  const soltos = [];
  const nome = e => `${e.$type.slice(5)} ${JSON.stringify(e.name ?? e.text ?? e.id)}`;
  for (const e of todos) {
    const t = e.$type.slice(5);
    if (t === 'TextAnnotation') { if (!assoc.has(e.id)) soltos.push(`anotação sem associação: ${nome(e)}`); continue; }
    if (!/Task$|Event$|Gateway$|^SubProcess$|^CallActivity$/.test(t)) continue;
    const evSub = e.$parent?.triggeredByEvent;
    if (!['StartEvent', 'BoundaryEvent'].includes(t) && !inc[e.id] && !evSub) soltos.push(`sem entrada: ${nome(e)}`);
    if (t !== 'EndEvent' && !out[e.id]) soltos.push(`sem saída: ${nome(e)}`);
    const ehMsg = (e.eventDefinitions || []).some(d => d.$type === 'bpmn:MessageEventDefinition') || /^(Send|Receive)Task$/.test(t);
    if (ehMsg && !msg.has(e.id)) soltos.push(`mensagem sem fluxo de mensagem: ${nome(e)}`);
    if ((e.eventDefinitions || []).some(d => d.$type === 'bpmn:LinkEventDefinition')) soltos.push(`evento de link (parece solto): ${nome(e)}`);
  }

  const resultado = { cruzamentos: [], sobreposicoes: [], atravessam: [], soltos, cores: 0, rotulos: [], compartilhados: [] };
  for (const d of rootElement.diagrams || []) {
    const segs = [], formas = [], rotulosSeta = [];
    for (const pe of d.plane.planeElement || []) {
      if (Object.keys(pe.$attrs || {}).some(k => /^(bioc|color):/.test(k)) || pe.get?.('bioc:fill') || pe.get?.('color:background-color')) resultado.cores++;
      if (pe.waypoint) {
        const w = pe.waypoint;
        if (pe.label?.bounds && (pe.bpmnElement.name || '').trim()) rotulosSeta.push({ id: pe.bpmnElement.id, nome: pe.bpmnElement.name, b: pe.label.bounds });
        for (let i = 0; i < w.length - 1; i++) segs.push({ id: pe.bpmnElement.id, a: w[i], b: w[i + 1] });
      } else if (pe.bounds && /Task|SubProcess|CallActivity|Gateway|Event/.test(pe.bpmnElement.$type)) {
        formas.push({ id: pe.bpmnElement.id, b: pe.bounds });
      }
    }
    const lado = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
    const cruza = (s, t) => {
      const d1 = lado(s.a, s.b, t.a), d2 = lado(s.a, s.b, t.b), d3 = lado(t.a, t.b, s.a), d4 = lado(t.a, t.b, s.b);
      return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
    };
    const faixa = (u1, u2, v1, v2) => Math.min(Math.max(u1, u2), Math.max(v1, v2)) - Math.max(Math.min(u1, u2), Math.min(v1, v2));
    const sobre = (s, t) => {
      if (Math.abs(s.a.y - s.b.y) < 1 && Math.abs(t.a.y - t.b.y) < 1 && Math.abs(s.a.y - t.a.y) < 1) return faixa(s.a.x, s.b.x, t.a.x, t.b.x) > 2;
      if (Math.abs(s.a.x - s.b.x) < 1 && Math.abs(t.a.x - t.b.x) < 1 && Math.abs(s.a.x - t.a.x) < 1) return faixa(s.a.y, s.b.y, t.a.y, t.b.y) > 2;
      return false;
    };
    // setas que saem da mesma origem ou chegam ao mesmo destino podem compartilhar o trecho junto ao nó
    const mesmoNo = (s, t) => {
      const es = els[s.id], et = els[t.id];
      return es.sourceRef?.id === et.sourceRef?.id || es.targetRef?.id === et.targetRef?.id;
    };
    const naForma = q => formas.some(({ b }) => q.x >= b.x - 4 && q.x <= b.x + b.width + 4 && q.y >= b.y - 4 && q.y <= b.y + b.height + 4);
    const pontoSobre = (q, u, v) => (Math.abs(u.x - v.x) < 1 && Math.abs(q.x - u.x) < 1 && q.y >= Math.min(u.y, v.y) - 1 && q.y <= Math.max(u.y, v.y) + 1)
      || (Math.abs(u.y - v.y) < 1 && Math.abs(q.y - u.y) < 1 && q.x >= Math.min(u.x, v.x) - 1 && q.x <= Math.max(u.x, v.x) + 1);
    const toca = (s, t) => [s.a, s.b].some(q => pontoSobre(q, t.a, t.b) && !naForma(q)) || [t.a, t.b].some(q => pontoSobre(q, s.a, s.b) && !naForma(q));
    const vistos = new Set();
    for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) {
      const s = segs[i], t = segs[j];
      if (s.id === t.id) continue;
      const par = [s.id, t.id].sort().join(' × ');
      if (cruza(s, t)) { if (!vistos.has('c' + par)) { vistos.add('c' + par); resultado.cruzamentos.push(par); } }
      else if (toca(s, t)) {
        // setas de sequência com a mesma origem ou o mesmo destino que compartilham o trecho junto ao nó
        // (divisão/junção), e mensagens que se juntam antes do mesmo destino, são aviso;
        // toque de mensagem com outra seta, ou entre setas sem nada em comum, é erro
        const es = els[s.id], et = els[t.id];
        const msg = es.$type === 'bpmn:MessageFlow' || et.$type === 'bpmn:MessageFlow';
        const comum = es.sourceRef?.id === et.sourceRef?.id || es.targetRef?.id === et.targetRef?.id;
        const juncaoMsg = es.$type === 'bpmn:MessageFlow' && et.$type === 'bpmn:MessageFlow' && es.targetRef?.id === et.targetRef?.id;
        if ((!msg && comum) || juncaoMsg) { if (!vistos.has('j' + par)) { vistos.add('j' + par); resultado.compartilhados.push(par); } }
        else if (!vistos.has('c' + par)) { vistos.add('c' + par); resultado.cruzamentos.push(par); }
      }
      else if (sobre(s, t) && !mesmoNo(s, t)) { if (!vistos.has('s' + par)) { vistos.add('s' + par); resultado.sobreposicoes.push(par); } }
    }
    // rótulo de seta em cima de outra seta (ou de outra forma)
    for (const r of rotulosSeta) {
      const b = r.b;
      const em = segs.filter(s => s.id !== r.id && Math.max(s.a.x, s.b.x) >= b.x && Math.min(s.a.x, s.b.x) <= b.x + b.width
        && Math.max(s.a.y, s.b.y) >= b.y && Math.min(s.a.y, s.b.y) <= b.y + b.height);
      if (em.length) resultado.rotulos.push(`${JSON.stringify(r.nome)} (${r.id}) sobre ${[...new Set(em.map(s => s.id))].join(', ')}`);
    }
    const M = 4;
    for (const s of segs) {
      const e = els[s.id];
      for (const f of formas) {
        if (f.id === e.sourceRef?.id || f.id === e.targetRef?.id) continue;
        const b = f.b;
        const h = Math.abs(s.a.y - s.b.y) < 1, v = Math.abs(s.a.x - s.b.x) < 1;
        const dentroY = y => y > b.y + M && y < b.y + b.height - M, dentroX = x => x > b.x + M && x < b.x + b.width - M;
        if (h && dentroY(s.a.y) && Math.min(s.a.x, s.b.x) < b.x + b.width - M && Math.max(s.a.x, s.b.x) > b.x + M) resultado.atravessam.push(`${s.id} → ${f.id}`);
        if (v && dentroX(s.a.x) && Math.min(s.a.y, s.b.y) < b.y + b.height - M && Math.max(s.a.y, s.b.y) > b.y + M) resultado.atravessam.push(`${s.id} → ${f.id}`);
      }
    }
  }
  resultado.atravessam = [...new Set(resultado.atravessam)];
  return resultado;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('cruzamentos.mjs')) {
  let falhas = 0;
  for (const f of process.argv.slice(2)) {
    const r = await analisar(fs.readFileSync(f, 'utf8'));
    const n = r.cruzamentos.length + r.sobreposicoes.length + r.atravessam.length + r.soltos.length + r.cores + r.rotulos.length;
    const aviso = r.compartilhados.length ? ` (aviso: ${r.compartilhados.length} divisão/junção com trecho compartilhado)` : '';
    if (!n) { console.log(`✔ ${f}${aviso}`); continue; }
    falhas++;
    console.log(`✖ ${f}: ${r.cruzamentos.length} cruzamento(s), ${r.sobreposicoes.length} sobreposição(ões), ${r.atravessam.length} seta(s) atravessando formas, ${r.soltos.length} elemento(s) solto(s), ${r.cores} elemento(s) com cor, ${r.rotulos.length} rótulo(s) sobre setas`);
    for (const c of r.cruzamentos) console.log(`   cruza: ${c}`);
    for (const c of r.sobreposicoes) console.log(`   sobrepõe: ${c}`);
    for (const c of r.atravessam) console.log(`   atravessa: ${c}`);
    for (const c of r.soltos) console.log(`   ${c}`);
    for (const c of r.rotulos) console.log(`   rótulo: ${c}`);
  }
  process.exit(falhas ? 1 : 0);
}
