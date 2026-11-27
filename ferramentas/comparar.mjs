// Compara dois arquivos .bpmn: elementos removidos, adicionados e alterados (tipo, nome, ligação, contêiner)
// e formas movidas no diagrama. Útil para levar à fonte JSON o que foi editado no editor.
// Uso: node ferramentas/comparar.mjs <antes.bpmn> <depois.bpmn>
import fs from 'node:fs';
import { BpmnModdle } from 'bpmn-moddle';

const moddle = new BpmnModdle();

async function load(file) {
  const { rootElement } = await moddle.fromXML(fs.readFileSync(file, 'utf8'));
  const els = {}, di = {}, lab = {}, way = {};
  const walk = (e, parent) => {
    if (!e || typeof e !== 'object') return;
    if (e.id && e.$type?.startsWith('bpmn:')) {
      els[e.id] = {
        type: e.$type.slice(5),
        name: e.name ?? e.text ?? e.categoryValueRef?.value,
        parent, src: e.sourceRef?.id, tgt: e.targetRef?.id,
        host: e.attachedToRef?.id,
        ev: (e.eventDefinitions || []).map(x => x.$type.slice(5)).join(',')
      };
    }
    for (const k of ['rootElements', 'flowElements', 'artifacts', 'participants', 'messageFlows', 'laneSets', 'lanes'])
      (e[k] || []).forEach(c => walk(c, e.id || parent));
  };
  walk(rootElement);
  // raia de cada nó
  const laneOf = {};
  const walkLanes = e => {
    for (const ls of e.laneSets || []) for (const l of ls.lanes || []) for (const r of l.flowNodeRef || []) laneOf[r.id] = l.id;
    for (const c of e.flowElements || []) walkLanes(c);
  };
  for (const r of rootElement.rootElements || []) walkLanes(r);
  for (const [id, v] of Object.entries(els)) v.lane = laneOf[id];
  for (const d of rootElement.diagrams || []) for (const pe of d.plane.planeElement || []) {
    const id = pe.bpmnElement?.id;
    if (pe.bounds) di[id] = [pe.bounds.x, pe.bounds.y, pe.bounds.width, pe.bounds.height].map(Math.round);
    const lb = pe.label?.bounds;
    lab[id] = lb ? [lb.x, lb.y, lb.width, lb.height].map(Math.round).join(',') : '';
    if (pe.waypoint) way[id] = pe.waypoint.map(w => `${Math.round(w.x)},${Math.round(w.y)}`).join(' ');
  }
  return { els, di, lab, way };
}

const [A, B] = await Promise.all([load(process.argv[2]), load(process.argv[3])]);
const show = v => `${v.type}${v.ev ? `[${v.ev}]` : ''} ${JSON.stringify(v.name ?? '')}` +
  (v.src ? ` ${v.src} -> ${v.tgt}` : '') + (v.lane ? ` (raia ${v.lane})` : '') + (v.host ? ` (borda de ${v.host})` : '');
const rem = Object.keys(A.els).filter(id => !B.els[id]);
const add = Object.keys(B.els).filter(id => !A.els[id]);
console.log(`== REMOVIDOS (${rem.length})`); rem.forEach(id => console.log(' -', id, show(A.els[id])));
console.log(`== ADICIONADOS (${add.length})`); add.forEach(id => console.log(' +', id, show(B.els[id])));
console.log('== ALTERADOS');
for (const id of Object.keys(A.els)) {
  const a = A.els[id], b = B.els[id];
  if (!b) continue;
  const ch = [];
  for (const k of ['type', 'name', 'src', 'tgt', 'parent', 'lane', 'host', 'ev']) {
    if ((a[k] ?? '') !== (b[k] ?? '')) ch.push(`${k}: ${JSON.stringify(a[k])} -> ${JSON.stringify(b[k])}`);
  }
  if (ch.length) console.log(' ~', id, ch.join(' | '));
}
const moved = Object.keys(B.di).filter(id => A.di[id] && JSON.stringify(A.di[id]) !== JSON.stringify(B.di[id]));
const labels = Object.keys(B.lab).filter(id => id in A.lab && A.lab[id] !== B.lab[id]);
const edges = Object.keys(B.way).filter(id => A.way[id] && A.way[id] !== B.way[id]);
const nome = id => B.els[id]?.name ? ` ${JSON.stringify(B.els[id].name)}` : '';
console.log(`== DIAGRAMA: ${moved.length} formas movidas/redimensionadas, ${labels.length} rótulos movidos, ${edges.length} setas redesenhadas`);
moved.forEach(id => console.log('   forma :', id + nome(id)));
labels.forEach(id => console.log('   rótulo:', id + nome(id)));
edges.forEach(id => console.log('   seta  :', id + nome(id)));
