// Gera um arquivo .bpmn (BPMN 2.0 com diagrama) a partir de uma definição JSON.
// Uso: node ferramentas/build.js <definicao.json> <saida.bpmn>
import fs from 'node:fs';
import { BpmnModdle } from 'bpmn-moddle';
import { layoutProcess } from 'bpmn-auto-layout';
import { layout as laneLayout, layoutDiagram } from './lane-layout.js';

const TYPES = {
  start: 'bpmn:StartEvent', end: 'bpmn:EndEvent',
  task: 'bpmn:Task', user: 'bpmn:UserTask', service: 'bpmn:ServiceTask',
  script: 'bpmn:ScriptTask', manual: 'bpmn:ManualTask', send: 'bpmn:SendTask',
  receive: 'bpmn:ReceiveTask', business: 'bpmn:BusinessRuleTask',
  xor: 'bpmn:ExclusiveGateway', and: 'bpmn:ParallelGateway',
  or: 'bpmn:InclusiveGateway', event: 'bpmn:EventBasedGateway',
  catch: 'bpmn:IntermediateCatchEvent', throw: 'bpmn:IntermediateThrowEvent',
  subprocess: 'bpmn:SubProcess', call: 'bpmn:CallActivity', boundary: 'bpmn:BoundaryEvent'
};

// Cores por status (original = sem cor). Gravadas em bioc: (bpmn.io) e color: (BPMN in Color).
const STATUS_COLORS = {
  nova: { fill: '#dcf2dc', stroke: '#2e7d32' },
  confirmar: { fill: '#ffe3c2', stroke: '#d35400' }
};
const COLOR_PKG = {
  name: 'BPMN in Color', uri: 'http://www.omg.org/spec/BPMN/non-normative/color/1.0', prefix: 'color',
  types: [{ name: 'ColoredLabel', extends: ['bpmndi:BPMNLabel'], properties: [{ name: 'color', isAttr: true, type: 'String' }] },
    { name: 'ColoredShape', extends: ['bpmndi:BPMNShape'], properties: [
      { name: 'background-color', isAttr: true, type: 'String' }, { name: 'border-color', isAttr: true, type: 'String' }] },
    { name: 'ColoredEdge', extends: ['bpmndi:BPMNEdge'], properties: [{ name: 'border-color', isAttr: true, type: 'String' }] }],
  enumerations: [], associations: []
};

const [, , input, output] = process.argv;
if (!input || !output) {
  console.error('Uso: node scripts/build.js <definicao.json> <saida.bpmn>');
  process.exit(1);
}
const def = JSON.parse(fs.readFileSync(input, 'utf8'));
const moddle = new BpmnModdle({ color: COLOR_PKG });

const els = {};      // id -> elemento moddle (nós, fluxos, raias, anotações...)
const specOf = {};   // id -> nó da definição

function eventDefinitions(n) {
  const kind = n.event || (n.timer ? 'timer' : n.message ? 'message' : null);
  if (!kind) return undefined;
  const expr = body => moddle.create('bpmn:FormalExpression', { body });
  switch (kind) {
    case 'message': return [moddle.create('bpmn:MessageEventDefinition', { id: `${n.id}_ed` })];
    case 'timer': return [moddle.create('bpmn:TimerEventDefinition', { id: `${n.id}_ed`,
      timeDuration: n.timer ? expr(n.timer) : undefined, timeCycle: n.cycle ? expr(n.cycle) : undefined })];
    case 'error': return [moddle.create('bpmn:ErrorEventDefinition', { id: `${n.id}_ed` })];
    case 'conditional': return [moddle.create('bpmn:ConditionalEventDefinition', { id: `${n.id}_ed`, condition: expr(n.condition || n.name) })];
    case 'link': return [moddle.create('bpmn:LinkEventDefinition', { id: `${n.id}_ed`, name: n.link || n.name })];
    case 'terminate': return [moddle.create('bpmn:TerminateEventDefinition', { id: `${n.id}_ed` })];
    case 'signal': return [moddle.create('bpmn:SignalEventDefinition', { id: `${n.id}_ed` })];
    default: throw new Error(`Evento desconhecido "${kind}" no nó ${n.id}`);
  }
}

// Preenche um container (processo ou subprocesso) com nós, fluxos, raias e anotações; recursivo para etapas.
function fill(container, { nodes = [], flows = [], lanes = null } = {}) {
  container.flowElements = [];
  const byId = {};
  // eventos de borda ficam na raia da atividade a que estão presos
  const specById = Object.fromEntries(nodes.map(n => [n.id, n]));
  for (const n of nodes) if (n.type === 'boundary' && !n.lane) n.lane = specById[n.attachedTo]?.lane;
  const artifacts = [];
  for (const n of nodes) {
    const type = TYPES[n.type];
    if (!type) throw new Error(`Tipo desconhecido "${n.type}" no nó ${n.id}`);
    const el = moddle.create(type, { id: n.id, name: n.name });
    if (n.type === 'call') el.calledElement = n.calls;   // processo chamado (definido em outro arquivo)
    const ed = eventDefinitions(n);
    if (ed) el.eventDefinitions = ed;
    if (n.type === 'subprocess') {
      if (n.expanded) el.isExpanded = true;
      fill(el, n);
    }
    byId[n.id] = els[n.id] = el;
    specOf[n.id] = n;
    container.flowElements.push(el);
    if (n.note) {
      const ann = moddle.create('bpmn:TextAnnotation', { id: `${n.id}_note`, text: n.note });
      const asc = moddle.create('bpmn:Association', { id: `${n.id}_assoc`, sourceRef: el, targetRef: ann });
      els[ann.id] = ann; els[asc.id] = asc;
      artifacts.push(ann, asc);
    }
  }
  for (const n of nodes.filter(n => n.type === 'boundary')) {
    const host = byId[n.attachedTo];
    if (!host) throw new Error(`Evento de borda ${n.id} preso a nó inexistente ${n.attachedTo}`);
    byId[n.id].attachedToRef = host;
    byId[n.id].cancelActivity = n.interrupting !== false;   // padrão BPMN: interruptivo
  }
  flows.forEach(([from, to, name], i) => {
    const s = byId[from], t = byId[to];
    if (!s || !t) throw new Error(`Fluxo inválido em ${container.id}: ${from} -> ${to}`);
    const f = moddle.create('bpmn:SequenceFlow', { id: `${container.id}_f${i + 1}`, name, sourceRef: s, targetRef: t });
    (s.outgoing ||= []).push(f);
    (t.incoming ||= []).push(f);
    container.flowElements.push(f);
    els[f.id] = f;
  });
  if (lanes?.length) {
    container.laneSets = [moddle.create('bpmn:LaneSet', {
      id: `${container.id}_lanes`,
      lanes: lanes.map(l => {
        const lane = moddle.create('bpmn:Lane', {
          id: l.id, name: l.name,
          flowNodeRef: nodes.filter(n => n.lane === l.id).map(n => byId[n.id])
        });
        els[l.id] = lane;
        return lane;
      })
    })];
  }
  if (artifacts.length) container.artifacts = artifacts;
}

const usesLanes = spec => !!spec.pools || !!spec.lanes?.length ||
  (spec.nodes || []).some(n => n.type === 'subprocess' && usesLanes(n));

// ---- modo com raias / várias pools: layout próprio + DI montado à mão ------
async function buildWithLanes() {
  const pools = def.pools || [{ id: def.id || 'Process_1', name: def.pool || def.name, lanes: def.lanes, nodes: def.nodes, flows: def.flows, groups: def.groups }];
  const multi = !!def.pools || !!def.lanes?.length;
  const bounds = b => moddle.create('dc:Bounds', { x: Math.round(b.x), y: Math.round(b.y), width: Math.round(b.width), height: Math.round(b.height) });
  const shape = (id, el, b, extra = {}, labelBounds = null) => {
    const s = moddle.create('bpmndi:BPMNShape', { id: `${id}_di`, bpmnElement: el, bounds: bounds(b), ...extra });
    if (labelBounds) s.label = moddle.create('bpmndi:BPMNLabel', { bounds: bounds(labelBounds) });
    const c = STATUS_COLORS[specOf[id]?.status];
    if (c) {
      s.set('bioc:fill', c.fill); s.set('bioc:stroke', c.stroke);
      s.set('color:background-color', c.fill); s.set('color:border-color', c.stroke);
    }
    return s;
  };
  const edge = (id, el, pts) => moddle.create('bpmndi:BPMNEdge', {
    id: `${id}_di`, bpmnElement: el, waypoint: pts.map(p => moddle.create('dc:Point', p))
  });

  // processos (um por pool)
  const processes = pools.map(p => {
    if (p.blackbox) return null;   // pool caixa-preta: participante sem processo
    const proc = moddle.create('bpmn:Process', { id: p.processId || (def.pools ? `Process_${p.id}` : p.id), name: p.name, isExecutable: false });
    fill(proc, p);
    return proc;
  });
  // grupos (artefatos do processo, com categoria para o rótulo)
  const categories = [];
  pools.forEach((p, i) => (p.groups || []).forEach(g => {
    const cv = moddle.create('bpmn:CategoryValue', { id: `${g.id}_cv`, value: g.name });
    categories.push(moddle.create('bpmn:Category', { id: `${g.id}_cat`, categoryValue: [cv] }));
    const grp = moddle.create('bpmn:Group', { id: g.id, categoryValueRef: cv });
    els[g.id] = grp;
    (processes[i].artifacts ||= []).push(grp);
  }));

  let collab = null;
  const participants = [];
  if (multi) {
    pools.forEach((p, i) => {
      const part = moddle.create('bpmn:Participant', { id: def.pools ? p.id : `Pool_${processes[i].id}`, name: p.name, processRef: processes[i] || undefined });
      els[part.id] = part;
      participants.push(part);
    });
    collab = moddle.create('bpmn:Collaboration', { id: `Collab_${def.id || 'Main'}`, participants });
    if (def.messageFlows?.length) {
      collab.messageFlows = def.messageFlows.map(([from, to, name], i) => {
        if (!els[from] || !els[to]) throw new Error(`Fluxo de mensagem inválido: ${from} -> ${to}`);
        const mf = moddle.create('bpmn:MessageFlow', { id: `Msg_${i + 1}`, name, sourceRef: els[from], targetRef: els[to] });
        els[mf.id] = mf;
        return mf;
      });
    }
  }

  const diagrams = [];
  // plano principal
  {
    const L = layoutDiagram(pools, def.messageFlows || [], { poolBand: multi, groups: pools.flatMap(p => p.groups || []) });
    const pe = [];
    pools.forEach((p, i) => {
      if (multi) {
        const ps = shape(participants[i].id, participants[i], L.pools[p.id], { isHorizontal: true });
        if (p.color) {   // destaque da pool inteira (ex.: participante externo)
          ps.set('bioc:fill', p.color.fill); ps.set('bioc:stroke', p.color.stroke);
          ps.set('color:background-color', p.color.fill); ps.set('color:border-color', p.color.stroke);
        }
        pe.push(ps);
      }
      for (const l of p.lanes || []) {
        const ls = shape(l.id, els[l.id], L.lanes[l.id], { isHorizontal: true });
        if (l.color) {   // destaque da raia (ex.: raia de sistema)
          ls.set('bioc:fill', l.color.fill); ls.set('bioc:stroke', l.color.stroke);
          ls.set('color:background-color', l.color.fill); ls.set('color:border-color', l.color.stroke);
        }
        pe.push(ls);
      }
      for (const g of p.groups || []) pe.push(shape(g.id, els[g.id], L.groups[g.id]));
      for (const n of p.nodes || []) {
        if (n.type === 'subprocess' && n.expanded) throw new Error(`Subprocesso expandido (${n.id}) não suportado no modo com raias; use recolhido (drill-down).`);
        pe.push(shape(n.id, els[n.id], L.shapes[n.id], n.type === 'xor' ? { isMarkerVisible: true } : {}, L.labels[n.id]));
        if (n.note) {
          pe.push(shape(`${n.id}_note`, els[`${n.id}_note`], L.notes[n.id]));
          pe.push(edge(`${n.id}_assoc`, els[`${n.id}_assoc`], L.assoc[n.id]));
        }
      }
      (p.flows || []).forEach((f, j) => {
        const fid = `${processes[i].id}_f${j + 1}`;
        pe.push(edge(fid, els[fid], L.edges[`${p.id}|${j}`]));
      });
    });
    (def.messageFlows || []).forEach((_, i) => {
      const e = edge(`Msg_${i + 1}`, els[`Msg_${i + 1}`], L.msgEdges[i]);
      if (L.msgLabels[i]) e.label = moddle.create('bpmndi:BPMNLabel', { bounds: bounds(L.msgLabels[i]) });
      pe.push(e);
    });
    const root = collab || processes[0];
    diagrams.push(moddle.create('bpmndi:BPMNDiagram', {
      id: `BPMNDiagram_${root.id}`,
      plane: moddle.create('bpmndi:BPMNPlane', { id: `BPMNPlane_${root.id}`, bpmnElement: root, planeElement: pe })
    }));
  }

  // planos de drill-down (subprocessos recolhidos, em qualquer nível)
  const subPlanes = nodes => {
    for (const n of nodes || []) {
      if (n.type !== 'subprocess' || !n.nodes?.length) continue; // sem conteúdo conhecido: sem drill-down
      const L = laneLayout(n, { pool: false });
      const pe = [];
      for (const l of n.lanes || []) pe.push(shape(l.id, els[l.id], L.lanes[l.id], { isHorizontal: true }));
      for (const c of n.nodes) {
        pe.push(shape(c.id, els[c.id], L.shapes[c.id], c.type === 'xor' ? { isMarkerVisible: true } : {}, L.labels[c.id]));
        if (c.note) {
          pe.push(shape(`${c.id}_note`, els[`${c.id}_note`], L.notes[c.id]));
          pe.push(edge(`${c.id}_assoc`, els[`${c.id}_assoc`], L.assoc[c.id]));
        }
      }
      (n.flows || []).forEach((_, j) => pe.push(edge(`${n.id}_f${j + 1}`, els[`${n.id}_f${j + 1}`], L.edges[j])));
      diagrams.push(moddle.create('bpmndi:BPMNDiagram', {
        id: `BPMNDiagram_${n.id}`,
        plane: moddle.create('bpmndi:BPMNPlane', { id: `BPMNPlane_${n.id}`, bpmnElement: els[n.id], planeElement: pe })
      }));
      subPlanes(n.nodes);
    }
  };
  pools.forEach(p => subPlanes(p.nodes || []));

  const definitions = moddle.create('bpmn:Definitions', {
    id: 'Definitions_1', targetNamespace: 'http://bpmn.io/schema/bpmn',
    rootElements: [...(collab ? [collab] : []), ...processes.filter(Boolean), ...categories], diagrams
  });
  return (await moddle.toXML(definitions, { format: true })).xml;
}

// ---- modo sem raias: bpmn-auto-layout --------------------------------------
async function toXML(rootProcess) {
  const definitions = moddle.create('bpmn:Definitions', {
    id: 'Definitions_1', targetNamespace: 'http://bpmn.io/schema/bpmn', rootElements: [rootProcess]
  });
  return (await moddle.toXML(definitions, { format: true })).xml;
}

// O bpmn-auto-layout 1.x não desenha o interior de subprocessos recolhidos.
// Contorno: cada etapa recolhida é diagramada como processo próprio (mesmo id) e o
// diagrama resultante vira um plano de drill-down no documento final.
async function subprocessDiagrams(nodes = []) {
  const blocks = [];
  for (const n of nodes) {
    if (n.type !== 'subprocess') continue;
    if (!n.expanded) {
      const tmp = moddle.create('bpmn:Process', { id: n.id, isExecutable: false });
      fill(tmp, n);
      const xml = await layoutProcess(await toXML(tmp));
      blocks.push(xml.match(/<bpmndi:BPMNDiagram[\s\S]*<\/bpmndi:BPMNDiagram>/)[0]);
    }
    blocks.push(...await subprocessDiagrams(n.nodes));
  }
  return blocks;
}

async function buildAutoLayout() {
  const proc = moddle.create('bpmn:Process', { id: def.id || 'Process_1', name: def.name, isExecutable: false });
  fill(proc, def);
  let laidOut = await layoutProcess(await toXML(proc));
  const extra = await subprocessDiagrams(def.nodes);
  if (extra.length) {
    // remove do plano raiz o conteúdo das etapas recolhidas (o layout o desenha ali, sobreposto)
    const parsed = await moddle.fromXML(laidOut);
    const insideCollapsed = el => {
      for (let p = el.$parent; p; p = p.$parent) {
        if (p.$type === 'bpmn:SubProcess' && !p.isExpanded) return true;
      }
      return false;
    };
    for (const d of parsed.rootElement.diagrams) {
      d.plane.planeElement = d.plane.planeElement.filter(pe => !insideCollapsed(pe.bpmnElement));
    }
    laidOut = (await moddle.toXML(parsed.rootElement, { format: true })).xml;
    laidOut = laidOut.replace('</bpmn:definitions>', extra.join('\n') + '\n</bpmn:definitions>');
  }
  return laidOut;
}

const lanesMode = usesLanes(def);
let xml = lanesMode ? await buildWithLanes() : await buildAutoLayout();
// reparse para validar referências e reformatar
const { rootElement, warnings } = await moddle.fromXML(xml);
if (warnings.length) throw new Error('Diagrama inválido: ' + warnings.map(w => w.message).join('; '));
xml = (await moddle.toXML(rootElement, { format: true })).xml;
fs.writeFileSync(output, xml);
console.log(`OK${lanesMode ? ' (raias)' : ''}: ${output}`);
