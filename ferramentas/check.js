// Checagem de consistência de uma definição JSON (complementa o bpmnlint).
// Uso: node ferramentas/check.js <definicao.json>
import fs from 'node:fs';
import path from 'node:path';

const def = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const pools = def.pools || [{ id: def.id, lanes: def.lanes, nodes: def.nodes, flows: def.flows }];
const problems = [];
const poolOf = {};

function checkContainer(where, { nodes = [], flows = [], lanes }) {
  const ids = new Set(nodes.map(n => n.id));
  const out = new Map(nodes.map(n => [n.id, []]));
  const inc = new Map(nodes.map(n => [n.id, 0]));
  for (const [a, b, label] of flows) {
    if (!ids.has(a) || !ids.has(b)) { problems.push(`${where}: fluxo com nó inexistente ${a} -> ${b}`); continue; }
    out.get(a).push({ b, label });
    inc.set(b, inc.get(b) + 1);
  }
  const msgIn = new Set((def.messageFlows || []).map(m => m[1]));
  const laneOf = n => n.type === 'boundary' ? (n.lane || nodes.find(h => h.id === n.attachedTo)?.lane) : n.lane;
  for (const n of nodes) {
    if (n.type === 'boundary' && !ids.has(n.attachedTo)) problems.push(`${where}: evento de borda ${n.id} preso a nó inexistente`);
    if (lanes?.length && !lanes.some(l => l.id === laneOf(n))) problems.push(`${where}: ${n.id} sem raia válida`);
    const isStart = n.type === 'start' || n.type === 'boundary' || (n.type === 'catch' && n.event === 'link');
    const isEnd = n.type === 'end' || (n.type === 'throw' && n.event === 'link');
    if (!isStart && inc.get(n.id) === 0 && !msgIn.has(n.id)) problems.push(`${where}: ${n.id} sem entrada`);
    if (!isEnd && out.get(n.id).length === 0) problems.push(`${where}: ${n.id} sem saída`);
    if (n.type === 'xor' && out.get(n.id).length > 1) {
      for (const o of out.get(n.id)) if (!o.label) problems.push(`${where}: saída ${n.id} -> ${o.b} sem rótulo`);
    }
    if (n.type === 'subprocess' && n.nodes?.length) checkContainer(`${where}/${n.id}`, n);
  }
  // todo início alcança um fim
  const starts = nodes.filter(n => n.type === 'start' || n.type === 'boundary' || (n.type === 'catch' && n.event === 'link'));
  for (const s of starts) {
    const seen = new Set([s.id]);
    const stack = [s.id];
    let reachesEnd = false;
    while (stack.length) {
      const id = stack.pop();
      const node = nodes.find(n => n.id === id);
      if (node.type === 'end' || (node.type === 'throw' && node.event === 'link')) reachesEnd = true;
      for (const { b } of out.get(id)) if (!seen.has(b)) { seen.add(b); stack.push(b); }
    }
    if (!reachesEnd) problems.push(`${where}: início ${s.id} não alcança um fim`);
  }
  // links: cada throw tem um catch com o mesmo nome
  const linkName = n => n.link || n.name;
  for (const t of nodes.filter(n => n.type === 'throw' && n.event === 'link')) {
    if (!nodes.some(c => c.type === 'catch' && c.event === 'link' && linkName(c) === linkName(t))) problems.push(`${where}: link ${t.id} sem destino`);
  }
}

for (const p of pools) {
  poolOf[p.id] = p.id;   // a própria pool pode ser origem/destino de mensagem (caixa-preta)
  for (const n of p.nodes || []) poolOf[n.id] = p.id;
  if (!p.blackbox) checkContainer(p.id, p);
}
// call activities: o processo chamado deve existir num JSON da mesma pasta ou em outra pasta de "processos/"
const calls = pools.flatMap(p => (p.nodes || []).filter(n => n.type === 'call'));
if (calls.length) {
  let base = path.resolve(path.dirname(process.argv[2]));
  while (path.basename(base) !== 'processos' && path.dirname(base) !== base) base = path.dirname(base);
  if (path.basename(base) !== 'processos') base = path.resolve(path.dirname(process.argv[2]));
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.json') ? [path.join(dir, e.name)] : []);
  const known = new Set(walk(base).flatMap(f => {
    const d = JSON.parse(fs.readFileSync(f, 'utf8'));
    return (d.pools || []).map(p => p.processId).filter(Boolean);
  }));
  for (const n of calls) if (!known.has(n.calls)) problems.push(`${n.id}: chama processo inexistente "${n.calls}"`);
}
for (const [a, b] of def.messageFlows || []) {
  if (!poolOf[a] || !poolOf[b]) problems.push(`mensagem ${a} -> ${b}: nó inexistente`);
  else if (poolOf[a] === poolOf[b]) problems.push(`mensagem ${a} -> ${b}: liga a mesma pool`);
}

const count = pools.reduce((s, p) => s + (p.nodes || []).length, 0);
if (problems.length) {
  console.log(`✖ ${problems.length} problema(s):\n  ` + problems.join('\n  '));
  process.exit(1);
}
console.log(`✔ consistente: ${pools.length} pool(s), ${count} nós no nível principal, ${(def.messageFlows || []).length} mensagens`);
