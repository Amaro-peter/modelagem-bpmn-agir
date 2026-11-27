// Recortes do modelo completo por trechos do fluxo (grupos de etapas), para dar foco a cada parte.
// Lê o .bpmn plano (layout ajustado à mão) e as fontes das etapas (quais nós pertencem a cada etapa)
// e devolve, para cada trecho, a área a mostrar em coordenadas do diagrama e as raias/pools visíveis.
import fs from 'node:fs';
import path from 'node:path';
import { BpmnModdle } from 'bpmn-moddle';

const FOLGA = 40;          // margem em volta do trecho
const CABECALHO = 60;      // colunas de rótulo da pool (30) e da raia (30): ficam fora do recorte

export async function calcularRecortes(arquivoBpmn, pastaEtapas, grupos) {
  const { rootElement } = await new BpmnModdle().fromXML(fs.readFileSync(arquivoBpmn, 'utf8'));
  const sh = {}, ed = [];
  for (const pe of rootElement.diagrams[0].plane.planeElement) {
    if (pe.bounds) sh[pe.bpmnElement.id] = { b: pe.bounds, l: pe.label?.bounds, el: pe.bpmnElement };
    if (pe.waypoint) ed.push({ w: pe.waypoint, l: pe.label?.bounds, el: pe.bpmnElement });
  }
  // etapa de cada nó, pelas fontes das etapas (mesmos ids do modelo plano)
  const etapa = {};
  for (const f of fs.readdirSync(pastaEtapas).filter(f => /^0[1-9]-.*\.json$/.test(f))) {
    const k = Number(f.slice(0, 2));
    for (const p of JSON.parse(fs.readFileSync(path.join(pastaEtapas, f), 'utf8')).pools)
      for (const n of p.nodes || []) if (sh[n.id] && !(n.id in etapa)) etapa[n.id] = k;
  }
  // faixas horizontais com nome: raias (folhas) e pools sem raias
  const faixas = [];
  for (const [id, s] of Object.entries(sh)) {
    const t = s.el.$type;
    if (t === 'bpmn:Lane' && !s.el.childLaneSet?.lanes?.length) faixas.push({ nome: s.el.name, y0: s.b.y, y1: s.b.y + s.b.height });
    if (t === 'bpmn:Participant') {
      const temRaias = (s.el.processRef?.laneSets || []).some(ls => ls.lanes?.length);
      if (!temRaias) faixas.push({ nome: s.el.name.split(' – ')[0], y0: s.b.y, y1: s.b.y + s.b.height, pool: id });
    }
  }
  const pools = Object.values(sh).filter(s => s.el.$type === 'bpmn:Participant');
  const xMax = Math.max(...pools.map(p => p.b.x + p.b.width));

  const partes = grupos.map(grupo => {
    const ids = new Set(Object.keys(etapa).filter(id => grupo.includes(etapa[id])));
    for (const [id, s] of Object.entries(sh)) if (s.el.attachedToRef && ids.has(s.el.attachedToRef.id)) ids.add(id);
    const xs = [], ys = [];
    const ponto = (x, y) => { xs.push(x); ys.push(y); };
    const caixa = b => { if (b) { ponto(b.x, b.y); ponto(b.x + b.width, b.y + b.height); } };
    for (const id of ids) { caixa(sh[id].b); caixa(sh[id].l); }
    for (const { w, l, el } of ed) {
      const s = el.sourceRef?.id, t = el.targetRef?.id;
      if (ids.has(s) && ids.has(t)) { w.forEach(p => ponto(p.x, p.y)); caixa(l); }
      // anotações de texto ligadas a nós do trecho
      else if (el.$type === 'bpmn:Association' && (ids.has(s) || ids.has(t))) {
        const outro = ids.has(s) ? t : s;
        if (sh[outro]?.el.$type === 'bpmn:TextAnnotation') { caixa(sh[outro].b); w.forEach(p => ponto(p.x, p.y)); }
      }
      // mensagens com participantes externos: inclui a faixa do participante para a seta não ficar cortada
      else if (el.$type === 'bpmn:MessageFlow' && (ids.has(s) || ids.has(t))) {
        const outro = ids.has(s) ? t : s;
        const pool = sh[outro]?.el.$type === 'bpmn:Participant' ? sh[outro].b : null;
        if (pool) { ys.push(pool.y, pool.y + pool.height); } else w.forEach(p => ys.push(p.y));
        caixa(l);
      }
    }
    const x0 = Math.max(CABECALHO, Math.min(...xs) - FOLGA), x1 = Math.min(xMax, Math.max(...xs) + FOLGA);
    const y0 = Math.min(...ys) - FOLGA, y1 = Math.max(...ys) + FOLGA;
    const recorte = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    const visiveis = faixas
      .map(f => ({ nome: f.nome, y0: Math.max(f.y0, y0), y1: Math.min(f.y1, y1) }))
      .filter(f => f.y1 - f.y0 > 30)
      .sort((a, b) => a.y0 - b.y0);
    // o fluxo continua além do recorte (há modelo antes/depois dele)
    const continua = { esq: x0 > CABECALHO + 1, dir: x1 < xMax - 1 };
    return { etapas: grupo, recorte, faixas: visiveis, continua };
  });
  return partes;
}
