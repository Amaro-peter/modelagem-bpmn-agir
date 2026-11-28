// Layout próprio para diagramas COM raias e/ou várias pools (o bpmn-auto-layout não suporta).
// Entrada: pools [{ id, lanes?, nodes, flows }] + messageFlows [[de, para]].
// Saída: posições de pools, raias, nós, anotações, grupos e pontos das setas.

const SIZES = {
  start: [36, 36], end: [36, 36], catch: [36, 36], throw: [36, 36], boundary: [36, 36],
  xor: [50, 50], and: [50, 50], or: [50, 50], event: [50, 50]
};
// Atividades: largura fixa; altura cresce com o texto (~13 caracteres por linha, 15 px por linha).
const TASK_W = 120;
const ICON = new Set(['user', 'service', 'script', 'manual', 'send', 'receive', 'business']);
const sizeOf = n => SIZES[n.type] ||
  [TASK_W, Math.max(80, (Math.ceil((n.name || '').length / 13) + (ICON.has(n.type) ? 2 : n.type === 'subprocess' || n.type === 'call' ? 3 : 0)) * 15 + 20)];
const isGateway = n => ['xor', 'and', 'or', 'event'].includes(n.type);

export const COL_W = 180;
export const ROW_H = 150;
export const BAND = 30;       // faixa do título (pool e raia)
const MARGIN = 40;            // espaço entre a faixa do título e o primeiro elemento
const LANE_PAD = 20;
const POOL_GAP = 60;
const NOTE_W = 150;
const NOTE_LINE = 15;
const NOTE_CHARS = 20;        // caracteres por linha (aprox.) na largura NOTE_W

export const noteHeight = text => Math.max(30, Math.ceil(text.length / NOTE_CHARS) * NOTE_LINE + 12);

// Coluna = maior caminho a partir dos inícios, ignorando arestas de retorno (loops).
function columns(nodes, edges, extraShift = new Map()) {
  const ids = nodes.map(n => n.id);
  // dica "shift": colunas extras antes do nó (da fonte ou da otimização)
  const shiftOf = new Map(nodes.map(n => [n.id, (n.shift || 0) + (extraShift.get(n.id) || 0)]));
  const out = new Map(ids.map(id => [id, []]));
  edges.forEach(([a, b]) => out.get(a)?.push(b));
  const back = new Set();
  const state = new Map();
  const dfs = id => {
    state.set(id, 1);
    for (const nx of out.get(id)) {
      if (state.get(nx) === 1) back.add(`${id}>${nx}`);
      else if (!state.get(nx)) dfs(nx);
    }
    state.set(id, 2);
  };
  const hasIn = new Set(edges.map(e => e[1]));
  ids.filter(id => !hasIn.has(id)).forEach(id => !state.get(id) && dfs(id));
  ids.forEach(id => !state.get(id) && dfs(id));

  const forward = edges.filter(([a, b]) => !back.has(`${a}>${b}`));
  const col = new Map(ids.map(id => [id, 0]));
  for (let changed = true, guard = 0; changed && guard < ids.length + 1; guard++) {
    changed = false;
    for (const [a, b] of forward) {
      const need = col.get(a) + 1 + shiftOf.get(b);
      if (col.get(b) < need) { col.set(b, need); changed = true; }
    }
  }
  // Nós sem entrada (ex.: evento de link "catch") ficam logo antes do seu sucessor.
  for (const id of ids.filter(id => !hasIn.has(id))) {
    const succ = out.get(id).map(s => col.get(s));
    if (succ.length) col.set(id, Math.max(0, Math.min(...succ) - 1));
  }
  return { col, back };
}

// Layout com otimização local: a partir do layout básico, testa descer nós uma linha na raia ou empurrá-los
// uma coluna e mantém cada mudança que reduz cruzamentos, sobreposições e setas atravessando formas.
export function layoutDiagram(pools, messageFlows = [], opts = {}) {
  const base = { row: new Map(), shift: new Map(), alinha: new Map() };
  let best = layoutOnce(pools, messageFlows, opts, base);
  if (opts.otimizar === false) return best;
  let bestCost = custoVisual(best);
  if (bestCost.problemas === 0) return best;
  const todosNos = pools.flatMap(p => p.nodes || []);
  const byId = new Map(todosNos.map(n => [n.id, n]));
  const hostDe = new Map(todosNos.filter(n => n.type === 'boundary').map(n => [n.id, n.attachedTo]));
  const laneDe = id => byId.get(id)?.lane;
  const succ = new Map(todosNos.map(n => [n.id, []])), pred = new Map(todosNos.map(n => [n.id, []]));
  for (const p of pools) for (const [a, b] of p.flows || []) { succ.get(a)?.push(b); pred.get(b)?.push(a); }
  const vizinhos = id => new Set([...(succ.get(id) || []), ...(pred.get(id) || []).map(x => hostDe.get(x) || x)]);
  // ramos de exceção: nós alcançados só a partir de eventos de borda
  const excecao = new Set();
  for (let mudou = true; mudou;) {
    mudou = false;
    for (const n of todosNos) {
      if (excecao.has(n.id) || hostDe.has(n.id) || !pred.get(n.id).length) continue;
      if (pred.get(n.id).every(x => hostDe.has(x) || excecao.has(x))) { excecao.add(n.id); mudou = true; }
    }
  }
  // cadeia: o nó e os sucessores na mesma raia (descem juntos)
  const cadeia = id => {
    const out = [id], vis = new Set([id]);
    for (let i = 0; i < out.length; i++) for (const nx of succ.get(out[i]) || []) {
      if (!vis.has(nx) && laneDe(nx) === laneDe(id) && !hostDe.has(nx) && (best.__cols?.get(nx) ?? 0) > (best.__cols?.get(out[i]) ?? -1)) { vis.add(nx); out.push(nx); }
    }
    return out;
  };
  const otimizar = (hints, L, cost) => {
    const inicio = Date.now();
    let ultimaMelhorou = true, passouTudo = false;
    for (let rodada = 0; rodada < 12 && cost.problemas > 0; rodada++) {
      let melhorou = false;
      const focos = new Set();
      for (const id of cost.nos) { const k = hostDe.get(id) || id; if (!byId.has(k)) continue; focos.add(k); for (const v of vizinhos(k)) focos.add(v); }
      // poucos problemas restantes e nenhuma melhora na rodada anterior: tenta mexer em qualquer nó
      if (rodada > 0 && !ultimaMelhorou && cost.problemas <= 3) todosNos.forEach(n => focos.add(n.id));
      ultimaMelhorou = false;
      for (const id of [...focos].filter(id => !hostDe.has(id))) {
        if (Date.now() - inicio > (opts.tempoMax || Number(process.env.LAYOUT_TEMPO) || 150000)) break;
        // movimentos: qualquer linha da raia, a cadeia inteira uma linha abaixo, e deslocar a coluna
        const r0 = L.__rows.get(id) ?? 0;
        const maxLinha = Math.max(0, ...[...L.__rows].filter(([x]) => laneDe(x) === laneDe(id)).map(([, r]) => r)) + 1;
        const movs = [];
        for (let r = 0; r <= maxLinha; r++) if (r !== r0) movs.push(h => h.row.set(id, r));
        const cad = cadeia(id);
        if (cad.length > 1) movs.push(h => cad.forEach(x => h.row.set(x, (L.__rows.get(x) ?? 0) + 1)));
        for (const d of [1, 2]) movs.push(h => h.shift.set(id, (h.shift.get(id) || 0) + d));
        if (hints.shift.get(id) > 0) movs.push(h => h.shift.set(id, h.shift.get(id) - 1));
        // alinhar com a origem quando ela está em outra raia (ex.: primeira atividade de um evento de borda)
        for (const pr of pred.get(id) || []) {
          const origem = hostDe.get(pr) || pr;
          if (laneDe(origem) !== laneDe(id) && !hints.alinha.has(id)) movs.push(h => h.alinha.set(id, pr));
        }
        let melhorLocal = null;
        for (const mov of movs) {
          const h = { row: new Map(hints.row), shift: new Map(hints.shift), alinha: new Map(hints.alinha) };
          mov(h);
          let L2;
          try { L2 = layoutOnce(pools, messageFlows, opts, h); } catch { continue; }
          const c2 = custoVisual(L2);
          if (c2.total < (melhorLocal?.cost.total ?? cost.total) - 1e-6) melhorLocal = { L: L2, cost: c2, h };
        }
        if (melhorLocal) { L = melhorLocal.L; cost = melhorLocal.cost; hints = melhorLocal.h; melhorou = true; }
        if (cost.problemas === 0) break;
      }
      if (melhorou) ultimaMelhorou = true;
      else if (!passouTudo && cost.problemas > 0 && cost.problemas <= 3) { passouTudo = true; continue; }
      else break;
    }
    return { L, cost };
  };
  const partidas = [base];
  if (excecao.size) partidas.push({ row: new Map([...excecao].map(id => [id, 1])), shift: new Map(), alinha: new Map() });
  for (const h of partidas) {
    let L0;
    try { L0 = h === base ? best : layoutOnce(pools, messageFlows, opts, h); } catch { continue; }
    const r = otimizar(h, L0, custoVisual(L0));
    if (r.cost.total < bestCost.total) { best = r.L; bestCost = r.cost; }
  }
  return best;
}

// Custo visual de um layout: problemas (cruzamentos, sobreposições, setas atravessando formas) dominam;
// a área desempata, para não espalhar o diagrama à toa.
function custoVisual(L) {
  const arestas = [...Object.entries(L.edges).map(([k, pts]) => ({ id: k, pts, de: L.__ends[k]?.[0], para: L.__ends[k]?.[1] })),
    ...L.msgEdges.map((pts, i) => ({ id: `m${i}`, pts, de: L.__msgEnds[i][0], para: L.__msgEnds[i][1] })), ...L.__assoc];
  const segs = [];
  for (const e of arestas) for (let i = 0; i < e.pts.length - 1; i++) segs.push({ e, a: e.pts[i], b: e.pts[i + 1] });
  const lado = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  const faixa = (u1, u2, v1, v2) => Math.min(Math.max(u1, u2), Math.max(v1, v2)) - Math.max(Math.min(u1, u2), Math.min(v1, v2));
  let cruz = 0, sobre = 0, atrav = 0;
  const nos = new Set();
  const marca = (...es) => es.forEach(e => { nos.add(e.de); nos.add(e.para); });
  for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) {
    const s = segs[i], t = segs[j];
    if (s.e === t.e) continue;
    if (lado(s.a, s.b, t.a) * lado(s.a, s.b, t.b) < 0 && lado(t.a, t.b, s.a) * lado(t.a, t.b, s.b) < 0) { cruz++; marca(s.e, t.e); continue; }
    // toque: ponta de um trecho sobre o outro, fora da borda dos nós
    const sobre = (q, u, v) => (u.x === v.x && Math.abs(q.x - u.x) < 1 && q.y >= Math.min(u.y, v.y) - 1 && q.y <= Math.max(u.y, v.y) + 1)
      || (u.y === v.y && Math.abs(q.y - u.y) < 1 && q.x >= Math.min(u.x, v.x) - 1 && q.x <= Math.max(u.x, v.x) + 1);
    const naForma = q => Object.values(L.__formas).some(b => q.x >= b.x - 4 && q.x <= b.x + b.width + 4 && q.y >= b.y - 4 && q.y <= b.y + b.height + 4);
    const ehMsg = e => /^m\d+$/.test(String(e.id));
    const comum = s.e.de === t.e.de || s.e.para === t.e.para;
    if ((ehMsg(s.e) || ehMsg(t.e) || !comum) && ([s.a, s.b].some(q => sobre(q, t.a, t.b) && !naForma(q)) || [t.a, t.b].some(q => sobre(q, s.a, s.b) && !naForma(q)))) { cruz++; marca(s.e, t.e); continue; }
    if (s.e.de === t.e.de || s.e.para === t.e.para) continue;
    const hs = s.a.y === s.b.y, ht = t.a.y === t.b.y, vs = s.a.x === s.b.x, vt = t.a.x === t.b.x;
    if (hs && ht && s.a.y === t.a.y && faixa(s.a.x, s.b.x, t.a.x, t.b.x) > 2) { sobre++; marca(s.e, t.e); }
    else if (vs && vt && s.a.x === t.a.x && faixa(s.a.y, s.b.y, t.a.y, t.b.y) > 2) { sobre++; marca(s.e, t.e); }
  }
  const M = 4;
  for (const sg of segs) for (const [id, b] of Object.entries(L.__formas)) {
    if (id === sg.e.de || id === sg.e.para) continue;
    const h = sg.a.y === sg.b.y, v = sg.a.x === sg.b.x;
    if (h && sg.a.y > b.y + M && sg.a.y < b.y + b.height - M && Math.min(sg.a.x, sg.b.x) < b.x + b.width - M && Math.max(sg.a.x, sg.b.x) > b.x + M) { atrav++; marca(sg.e); nos.add(id); }
    else if (v && sg.a.x > b.x + M && sg.a.x < b.x + b.width - M && Math.min(sg.a.y, sg.b.y) < b.y + b.height - M && Math.max(sg.a.y, sg.b.y) > b.y + M) { atrav++; marca(sg.e); nos.add(id); }
  }
  const problemas = cruz + sobre + atrav;
  return { problemas, total: problemas * 1e6 + L.width * L.height / 1e3, nos };
}

function layoutOnce(pools, messageFlows, { poolBand = true, groups = [], compact = false } = {}, hints = { row: new Map(), shift: new Map(), alinha: new Map() }) {
  const allNodes = pools.flatMap(p => p.nodes || []);
  const byId = new Map(allNodes.map(n => [n.id, n]));
  const blackbox = new Set(pools.filter(p => p.blackbox).map(p => p.id));
  // eventos de borda: ficam presos à atividade; para o cálculo de colunas, os fluxos que saem deles contam como saindo da atividade
  const hostOf = new Map(allNodes.filter(n => n.type === 'boundary').map(n => [n.id, n.attachedTo]));
  for (const [b, h] of hostOf) if (!byId.has(h)) throw new Error(`Evento de borda "${b}" preso a nó inexistente "${h}"`);
  const viaHost = id => hostOf.get(id) || id;
  const allEdges = [
    ...pools.flatMap(p => (p.flows || []).map(f => [viaHost(f[0]), f[1]])),
    ...messageFlows.filter(f => !blackbox.has(f[0]) && !blackbox.has(f[1])).map(f => [viaHost(f[0]), viaHost(f[1])])
  ];
  const { col } = columns(allNodes.filter(n => !hostOf.has(n.id)), allEdges, hints.shift);
  for (const [b, h] of hostOf) col.set(b, col.get(h));
  // dica de posição: "under": "<id>" coloca o nó na mesma coluna, logo abaixo do nó indicado
  for (const n of allNodes) if (n.under) col.set(n.id, col.get(n.under));
  // otimização "alinhar": o nó fica na mesma coluna da origem (outra raia), e quem vem depois respeita a ordem
  if (hints.alinha?.size) {
    for (const [id, ref] of hints.alinha) col.set(id, col.get(viaHost(ref)));
    for (let mudou = true, g = 0; mudou && g < allNodes.length; g++) {
      mudou = false;
      for (const p of pools) for (const [a, b] of p.flows || []) {
        const ca = col.get(viaHost(a)), cb = col.get(b);
        if (hints.alinha.has(b) || hostOf.has(b)) continue;
        if (hints.alinha.has(viaHost(a)) && cb <= ca) { col.set(b, ca + 1); mudou = true; }
      }
    }
  }
  const nCols = Math.max(...allNodes.map(n => col.get(n.id))) + 1;
  // largura das colunas: fixa (padrão) ou, no modo compacto, ajustada ao maior elemento da coluna + vão de 60 px
  const colW = Array(nCols).fill(COL_W);
  if (compact) {
    colW.fill(0);
    for (const n of allNodes) if (!hostOf.has(n.id)) colW[col.get(n.id)] = Math.max(colW[col.get(n.id)], sizeOf(n)[0] + 60);
    for (let i = 0; i < nCols; i++) colW[i] = Math.max(colW[i], 96);
  }
  const colX = [];
  colW.reduce((acc, w, i) => (colX[i] = acc, acc + w), 0);
  const totalW = colW.reduce((a, b) => a + b, 0);

  const shapes = {}, lanes = {}, poolBounds = {}, notes = {};
  const __rows = new Map();
  let y = 0;
  let width = 0;
  for (const p of pools) {
    const hasLanes = !!p.lanes?.length;
    const band = p.band ?? poolBand;
    const left = (band ? BAND : 0) + (hasLanes ? BAND : 0);
    width = Math.max(width, left + MARGIN + totalW + MARGIN / 2);
  }

  for (const p of pools) {
    if (p.blackbox) {   // pool caixa-preta: faixa fina, sem conteúdo
      poolBounds[p.id] = { x: 0, y, width, height: 80 };
      y += 80 + POOL_GAP;
      continue;
    }
    const nodes = p.nodes || [];
    const hasLanes = !!p.lanes?.length;
    const band = p.band ?? poolBand;
    const laneList = hasLanes ? p.lanes : [{ id: `__${p.id}` }];
    const laneOf = n => (hasLanes ? (n.type === 'boundary' ? byId.get(n.attachedTo).lane : n.lane) : `__${p.id}`);
    for (const n of nodes) {
      if (!laneList.some(l => l.id === laneOf(n))) throw new Error(`Nó "${n.id}" sem raia válida (lane="${n.lane}")`);
    }
    const preds = new Map(nodes.map(n => [n.id, []]));
    (p.flows || []).forEach(([a, b]) => preds.get(b).push(viaHost(a)));

    // Linha dentro da raia: herda a linha do predecessor na mesma raia (mantém setas retas).
    const row = new Map();
    const taken = new Set();
    const order = [...nodes].sort((a, b) => col.get(a.id) - col.get(b.id) || (a.under ? 1 : 0) - (b.under ? 1 : 0));
    for (const n of order) {
      if (hostOf.has(n.id)) continue;   // evento de borda: posicionado junto à atividade, mais abaixo
      const pr = preds.get(n.id).find(q => row.has(q) && laneOf(byId.get(q)) === laneOf(n));
      let r = n.under && row.has(n.under) ? row.get(n.under) + 1 : pr ? row.get(pr) : 0;
      if (hints.row.has(n.id)) r = Math.max(hints.row.get(n.id), n.under && row.has(n.under) ? row.get(n.under) + 1 : 0);
      while (taken.has(`${laneOf(n)}|${r}|${col.get(n.id)}`)) r++;
      taken.add(`${laneOf(n)}|${r}|${col.get(n.id)}`);
      row.set(n.id, r);
      __rows.set(n.id, r);
    }

    const left = (band ? BAND : 0) + (hasLanes ? BAND : 0);
    const poolTop = y;
    for (const l of laneList) {
      const members = nodes.filter(n => laneOf(n) === l.id && !hostOf.has(n.id));
      const rows = members.length ? Math.max(...members.map(n => row.get(n.id))) + 1 : 1;
      // faixa de anotações no topo da raia
      const noted = members.filter(n => n.note);
      const strip = noted.length ? Math.max(...noted.map(n => noteHeight(n.note))) + 40 : 0;   // + canal livre acima das notas
      const h = strip + rows * ROW_H + 2 * LANE_PAD;
      if (hasLanes) lanes[l.id] = { x: band ? BAND : 0, y, width: width - (band ? BAND : 0), height: h };
      for (const n of members) {
        if (hostOf.has(n.id)) continue;
        const [w, hh] = sizeOf(n);
        const cx = left + MARGIN + colX[col.get(n.id)] + (compact ? colW[col.get(n.id)] / 2 : TASK_W / 2);
        const cy = y + strip + LANE_PAD + row.get(n.id) * ROW_H + ROW_H / 2;
        shapes[n.id] = { x: cx - w / 2, y: cy - hh / 2, width: w, height: hh };
        if (n.note) {
          notes[n.id] = { x: cx - 55, y: y + 30, width: NOTE_W, height: noteHeight(n.note) };
        }
      }
      y += h;
    }
    poolBounds[p.id] = { x: 0, y: poolTop, width, height: y - poolTop };
    y += POOL_GAP;
  }

  // eventos de borda: na borda inferior da atividade, da direita para a esquerda
  const perHost = new Map();
  const alvoY = b => {
    const f = pools.flatMap(p => p.flows || []).find(f => f[0] === b);
    return f && shapes[f[1]] ? shapes[f[1]].y + shapes[f[1]].height / 2 : 0;
  };
  const ordemBordas = [...hostOf].sort((x, y) => x[1] === y[1] ? alvoY(x[0]) - alvoY(y[0]) : 0);
  for (const [b, h] of ordemBordas) {
    const k = perHost.get(h) || 0; perHost.set(h, k + 1);
    const hs = shapes[h];
    shapes[b] = { x: hs.x + hs.width - 50 - k * 44, y: hs.y + hs.height - 18, width: 36, height: 36 };
    byId.get(b).__boundaryIndex = k;   // 0 = mais à direita (rótulo à direita); demais, rótulo à esquerda
  }

  // grupos: caixa que envolve os membros
  const groupBounds = {};
  for (const g of groups) {
    const ms = g.nodes.map(id => shapes[id]);
    const x1 = Math.min(...ms.map(s => s.x)) - 15, y1 = Math.min(...ms.map(s => s.y)) - 28;
    const x2 = Math.max(...ms.map(s => s.x + s.width)) + 15, y2 = Math.max(...ms.map(s => s.y + s.height)) + 15;
    groupBounds[g.id] = { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
  }

  const obstacles = { ...shapes };
  for (const [id, nb] of Object.entries(notes)) obstacles[`nota|${id}`] = nb;   // as setas também desviam das anotações
  const used = [];   // segmentos já traçados: a escolha evita cruzar ou sobrepor setas
  const assoc = {};
  for (const [id, nb] of Object.entries(notes)) {
    const s = shapes[id];
    const x = nb.x + 30;
    const direct = [P(x, nb.y + nb.height), P(x, s.y)];
    // se a linha reta atravessar outro elemento, desce por um corredor entre colunas
    const corrX = s.x + s.width + (COL_W - TASK_W) / 2;
    const detour = [P(corrX, nb.y + nb.height), P(corrX, s.y - 15), P(s.x + s.width / 2, s.y - 15), P(s.x + s.width / 2, s.y)];
    assoc[id] = !hits(direct, obstacles, [id, `nota|${id}`]) ? direct : detour;
    for (let k = 0; k < assoc[id].length - 1; k++) used.push([assoc[id][k], assoc[id][k + 1]]);
  }

  const edges = {};
  // corredores verticais: o vão livre entre colunas vizinhas (a partir das formas reais)
  const xMin = Object.values(shapes).length ? Math.min(...Object.values(shapes).map(v => v.x)) : 0;
  const colRight = Array(nCols).fill(-Infinity), colLeft = Array(nCols).fill(Infinity);
  for (const n of allNodes) {
    if (hostOf.has(n.id)) continue;
    const sh = shapes[n.id]; if (!sh) continue;
    const k = col.get(n.id);
    colRight[k] = Math.max(colRight[k], sh.x + sh.width); colLeft[k] = Math.min(colLeft[k], sh.x);
  }
  const gaps = [];   // gaps[k]: vão entre a coluna k e a k+1 -> { lo, hi }
  for (let k = 0; k < nCols; k++) {
    let lo = colRight[k], hi = Infinity;
    for (let j = k + 1; j < nCols; j++) if (colLeft[j] < Infinity) { hi = colLeft[j]; break; }
    if (lo === -Infinity) lo = (k > 0 && gaps[k - 1]) ? gaps[k - 1].hi : xMin - 40;
    if (hi === Infinity) hi = lo + 80;
    gaps[k] = { lo, hi };
  }
  gaps[-1] = { lo: Math.max(0, xMin - 46), hi: xMin };
  // canais horizontais: entre linhas de cada raia e junto às bordas das raias
  const levels = new Set();
  for (const l of Object.values(lanes)) { levels.add(l.y + 12); levels.add(l.y + l.height - 12); }
  for (const p of pools) {
    if (p.blackbox) continue;
    const pb = poolBounds[p.id];
    levels.add(pb.y + 12); levels.add(pb.y + pb.height - 12);
  }
  for (const v of Object.values(shapes)) { levels.add(v.y - 16); levels.add(v.y + v.height + 16); }
  const ctx = { col, gaps, levels: [...levels].sort((p, q) => p - q), nCols };
  // ordem: setas curtas primeiro, longas depois, retornos por último
  const todas = [];
  for (const p of pools) (p.flows || []).forEach(([a, b], i) => todas.push({ key: `${p.id}|${i}`, a, b }));
  const span = e => {
    const ca = col.get(viaHost(e.a)), cb = col.get(e.b);
    return cb < ca ? 1000 + ca - cb : (cb - ca) + (Math.abs(c(shapes[e.a]).y - c(shapes[e.b]).y) > 1 ? 0.5 : 0);
  };
  todas.sort((x, y) => span(x) - span(y));
  for (const e of todas.filter(e => span(e) < 1000)) edges[e.key] = pick(route(e.a, e.b, byId, obstacles, ctx), obstacles, [e.a, e.b], used, { de: e.a, para: e.b });
  const msgLabels = {};
  const msgEdges = messageFlows.map(([a, b], i) => {
    // mensagem de/para pool caixa-preta: sai/chega na vertical junto ao elemento do outro lado,
    // desviando de outros elementos por um corredor entre colunas quando preciso
    if (blackbox.has(a) || blackbox.has(b)) {
      const toPool = blackbox.has(b);
      const id = toPool ? a : b, el = shapes[id], pb = poolBounds[toPool ? b : a];
      const below = pb.y > el.y;
      const yEl = below ? el.y + el.height : el.y, yPool = below ? pb.y : pb.y + pb.height;
      const cx = el.x + el.width / 2, cy = el.y + el.height / 2;
      const cands = [];
      const d = el.width > 60 ? 20 : 12;   // em atividades, afasta mais do centro (onde costumam passar as setas de sequência)
      for (const dx of [toPool ? -d : d, toPool ? d : -d, 0, 25, -25]) cands.push([P(cx + dx, yEl), P(cx + dx, yPool)]);
      // corredor entre colunas, saindo pela lateral
      const off = toPool ? -14 : 14;
      const k0 = col.get(id);
      for (const g of [gaps[k0], gaps[k0 - 1]]) {
        if (!g) continue;
        for (const x of corridorXs(g)) {
          const side = x > cx ? 1 : -1;
          cands.push([P(side > 0 ? el.x + el.width : el.x, cy + off), P(x, cy + off), P(x, yPool)]);
        }
      }
      const pts = pick(cands.map(c => toPool ? c : [...c].reverse()), obstacles, [id], used, { de: a, para: b, msg: true });
      const pe = toPool ? pts[pts.length - 1] : pts[0];   // ponta na pool: rótulo logo ao lado
      msgLabels[i] = { x: pe.x + 6, y: below ? pe.y - 34 : pe.y + 6, width: 110, height: 28 };
      return pts;
    }
    const cands = routeMessage(shapes[a], shapes[b]);
    const s = shapes[a], t = shapes[b], sc = c(s), tc = c(t);
    const down = tc.y > sc.y, sy = down ? s.y + s.height : s.y;
    const g = gaps[col.get(b) - 1], g2 = gaps[col.get(b)];
    for (const [gg, lado] of [[g, 'esq'], [g2, 'dir']]) if (gg) for (const x of corridorXs(gg)) for (const L of ctx.levels) {
      if (down ? !(L > sy && L < t.y) : !(L < sy && L > t.y + t.height)) continue;
      cands.push([P(sc.x, sy), P(sc.x, L), P(x, L), P(x, tc.y), P(lado === 'esq' ? t.x : t.x + t.width, tc.y)]);
    }
    // sobe (ou desce) por um corredor próximo e entra no alvo pelo lado de baixo (ou de cima), por um canal junto ao alvo.
    // Vários pontos de entrada na borda: duas mensagens para o mesmo alvo chegam em linhas independentes.
    const L2 = down ? t.y - 16 : t.y + t.height + 16, yBorda = down ? t.y : t.y + t.height;
    const offs = t.width <= 40 ? [0, -9, 9] : [0, -22, 22, -40, 40];
    for (const [io, o] of offs.entries()) {
      const tx = tc.x + o;
      const L2 = (down ? t.y - 16 : t.y + t.height + 16) + (down ? -1 : 1) * io * 14;   // cada ponto de entrada no seu nível
      const yb = t.width <= 40 ? (down ? tc.y - Math.sqrt(Math.max(0, 18 * 18 - o * o)) : tc.y + Math.sqrt(Math.max(0, 18 * 18 - o * o))) : yBorda;
      cands.push([P(sc.x, sy), P(sc.x, L2), P(tx, L2), P(tx, yb)]);
      for (let k = col.get(b) - 3; k <= col.get(b) + 2; k++) if (gaps[k]) for (const x of corridorXs(gaps[k])) for (const L of ctx.levels) {
        if (down ? !(L > sy && L < L2) : !(L < sy && L > L2)) continue;
        cands.push([P(sc.x, sy), P(sc.x, L), P(x, L), P(x, L2), P(tx, L2), P(tx, yb)]);
      }
    }
    return pick(cands, obstacles, [a, b], used, { de: a, para: b, msg: true });
  });
  for (const e of todas.filter(e => span(e) >= 1000)) edges[e.key] = pick(route(e.a, e.b, byId, obstacles, ctx), obstacles, [e.a, e.b], used, { de: e.a, para: e.b });
  // rótulos das mensagens de/para pools recolhidas: ao lado da ponta na pool, no lado que não encosta em setas
  {
    const segsTodos = [];
    for (const pts of [...Object.values(edges), ...msgEdges, ...Object.values(assoc)]) for (let i = 0; i < pts.length - 1; i++) segsTodos.push([pts[i], pts[i + 1]]);
    const encosta = r => segsTodos.filter(([u, v]) => Math.max(u.x, v.x) >= r.x - 2 && Math.min(u.x, v.x) <= r.x + r.width + 2
      && Math.max(u.y, v.y) >= r.y - 2 && Math.min(u.y, v.y) <= r.y + r.height + 2).length;
    for (const [k, r0] of Object.entries(msgLabels)) {
      const pts = msgEdges[k];
      const [a, b] = messageFlows[k];
      const pe = blackbox.has(b) ? pts[pts.length - 1] : pts[0];
      const acima = r0.y < pe.y;
      const cands = [r0, { ...r0, x: pe.x - 6 - r0.width }, { ...r0, y: acima ? pe.y - 70 : pe.y + 40 }, { ...r0, x: pe.x - 6 - r0.width, y: acima ? pe.y - 70 : pe.y + 40 }];
      msgLabels[k] = cands.reduce((m, r) => encosta(r) < encosta(m) ? r : m, cands[0]);
    }
  }
  const labels = placeLabels(allNodes, shapes, [...Object.values(edges), ...msgEdges]);
  // mensagens entre pools expandidas com nome: rótulo ao lado do primeiro trecho, como nas setas de sequência
  {
    const msgPool = { id: '__msg', flows: messageFlows.map(([x, y, nome], i) => (!blackbox.has(x) && !blackbox.has(y) && nome) ? [x, y, nome] : [x, y]) };
    const msgEdgesMap = Object.fromEntries(msgEdges.map((pts, i) => [`__msg|${i}`, pts]));
    const rot = placeFlowLabels([msgPool], msgEdgesMap, shapes, notes, [...Object.values(labels), ...Object.values(msgLabels)], [...Object.values(edges), ...msgEdges, ...Object.values(assoc)]);
    for (const [k, r] of Object.entries(rot)) msgLabels[Number(k.split('|')[1])] = r;
  }
  const flowLabels = placeFlowLabels(pools, edges, shapes, notes, [...Object.values(labels), ...Object.values(msgLabels)], [...Object.values(edges), ...msgEdges, ...Object.values(assoc)]);
  // dados para a otimização: pontas das setas, formas (inclui anotações) e linha de cada nó
  const __ends = {};
  for (const p of pools) (p.flows || []).forEach(([a, b], i) => { __ends[`${p.id}|${i}`] = [a, b]; });
  const __msgEnds = messageFlows.map(([a, b]) => [a, b]);
  const __assoc = Object.entries(assoc).map(([id, pts]) => ({ id: `assoc|${id}`, pts, de: id, para: `nota|${id}` }));
  const __formas = { ...shapes };
  for (const [id, nb] of Object.entries(notes)) __formas[`nota|${id}`] = nb;
  return { shapes, lanes, pools: poolBounds, notes, assoc, groups: groupBounds, edges, msgEdges, msgLabels, labels, flowLabels, width, height: y - POOL_GAP,
    __ends, __msgEnds, __formas, __rows, __assoc, __cols: col };
}

// Compatibilidade: um único container (processo ou subprocesso).
export function layout(spec, { pool = false } = {}) {
  const L = layoutDiagram([{ id: spec.id || '__root', lanes: spec.lanes, nodes: spec.nodes, flows: spec.flows, band: pool }], [], { groups: spec.groups || [] });
  const pid = spec.id || '__root';
  return { ...L, edges: (spec.flows || []).map((_, i) => L.edges[`${pid}|${i}`]), pool: pool ? L.pools[pid] : null };
}

// --- roteamento ortogonal --------------------------------------------------
const c = s => ({ x: s.x + s.width / 2, y: s.y + s.height / 2 });
const P = (x, y) => ({ x: Math.round(x), y: Math.round(y) });

const cacheFormas = new WeakMap();
function hits(points, shapes, skip) {
  let lista = cacheFormas.get(shapes);
  if (!lista) { lista = Object.entries(shapes).map(([id, v]) => [id, v.x - 4, v.y - 4, v.x + v.width + 4, v.y + v.height + 4]); cacheFormas.set(shapes, lista); }
  for (let i = 0; i < points.length - 1; i++) {
    const p = points[i], q = points[i + 1];
    const minX = p.x < q.x ? p.x : q.x, maxX = p.x < q.x ? q.x : p.x;
    const minY = p.y < q.y ? p.y : q.y, maxY = p.y < q.y ? q.y : p.y;
    for (let k = 0; k < lista.length; k++) {
      const f = lista[k];
      if (maxX > f[1] && minX < f[3] && maxY > f[2] && minY < f[4] && !skip.includes(f[0])) return true;
    }
  }
  return false;
}

// posições possíveis dentro de um corredor vertical (centro e deslocamentos, sem encostar nas formas)
function corridorXs(g) {
  const mid = (g.lo + g.hi) / 2, half = (g.hi - g.lo) / 2 - 8;
  const xs = [mid];
  for (const d of [10, 20, 30]) if (d <= half) xs.push(mid - d, mid + d);
  return xs;
}

function route(a, b, byId, shapes, ctx) {
  const { col, gaps, levels } = ctx;
  const s = shapes[a], t = shapes[b];
  const sc = c(s), tc = c(t);
  const candidates = [];
  const ca = col.get(byId.get(a).type === 'boundary' ? byId.get(a).attachedTo : a), cb = col.get(b);
  const sRight = P(s.x + s.width, sc.y), tLeft = P(t.x, tc.y);
  const perto = (y, y1, y2) => y > Math.min(y1, y2) - 700 && y < Math.max(y1, y2) + 700;
  const canais = levels.filter(y => perto(y, sc.y, tc.y));
  // desvio por um canal horizontal: sai pela direita até o corredor depois da origem, segue no canal
  // até o corredor antes do destino e entra pela esquerda
  const viaCanal = (g1, g2, saida = 'lado') => {
    if (!g1 || !g2) return;
    for (const L of canais) for (const x1 of corridorXs(g1).slice(0, 3)) for (const x2 of corridorXs(g2).slice(0, 3)) {
      if (saida === 'lado') candidates.push([sRight, P(x1, sc.y), P(x1, L), P(x2, L), P(x2, tc.y), tLeft]);
      else {
        const sy = L < sc.y ? s.y : s.y + s.height;
        candidates.push([P(sc.x, sy), P(sc.x, L), P(x2, L), P(x2, tc.y), tLeft]);
      }
    }
  };
  if (byId.get(a).type === 'boundary') {
    // sai sempre por baixo do evento de borda
    const yb = s.y + s.height;
    const enter = tc.x >= sc.x ? t.x : t.x + t.width;
    if (tc.y > yb + 10) {
      candidates.push([P(sc.x, yb), P(sc.x, tc.y), P(enter, tc.y)]);
      candidates.push([P(sc.x, yb), P(sc.x, t.y - 20), P(tc.x, t.y - 20), P(tc.x, t.y)]);
      for (const g of [gaps[cb - 1], gaps[cb - 2]]) if (g && cb > ca) for (const x of corridorXs(g)) {
        for (const L of canais.filter(y => y > yb)) candidates.push([P(sc.x, yb), P(sc.x, L), P(x, L), P(x, tc.y), tLeft]);
      }
    }
    if (tc.y < yb && cb > ca) {   // destino acima (raia superior): desce, contorna e sobe por um corredor
      for (const g of [gaps[cb - 1], gaps[ca]]) if (g) for (const x of corridorXs(g)) {
        for (const L of canais.filter(y => y > yb)) candidates.push([P(sc.x, yb), P(sc.x, L), P(x, L), P(x, tc.y), tLeft]);
      }
    }
    for (const k of [25, 40, 55, 70]) {   // volta (ex.: prorrogar → mesma atividade): passa por baixo
      const by = Math.max(yb, t.y + t.height) + k;
      candidates.push([P(sc.x, yb), P(sc.x, by), P(tc.x, by), P(tc.x, t.y + t.height)]);
    }
    candidates.basicos = candidates.length;
    for (const g of [gaps[cb - 1]]) if (g) for (const x of corridorXs(g)) {
      for (const L of canais.filter(y => y > yb)) candidates.push([P(sc.x, yb), P(sc.x, L), P(x, L), P(x, tc.y), tLeft]);
    }
    return candidates;
  }
  if (cb === ca && Math.abs(sc.x - tc.x) < 1) {
    const up = tc.y < sc.y;
    candidates.push([P(sc.x, up ? s.y : s.y + s.height), P(tc.x, up ? t.y + t.height : t.y)]);
    // desvio lateral quando a linha reta está bloqueada
    for (const g of [gaps[ca], gaps[ca - 1]]) if (g) for (const x of corridorXs(g)) {
      const sx = x > sc.x ? s.x + s.width : s.x, tx = x > tc.x ? t.x + t.width : t.x;
      candidates.push([P(sx, sc.y), P(x, sc.y), P(x, tc.y), P(tx, tc.y)]);
    }
  } else if (cb > ca) {
    if (Math.abs(sc.y - tc.y) < 1) candidates.push([sRight, tLeft]);
    const down = tc.y > sc.y;
    const sOut = P(sc.x, down ? s.y + s.height : s.y);
    const tIn = P(tc.x, down ? t.y : t.y + t.height);
    if (Math.abs(sc.y - tc.y) >= 1) {
      if (isGateway(byId.get(a))) candidates.push([sOut, P(sc.x, tc.y), tLeft]);
      if (isGateway(byId.get(b))) candidates.push([sRight, P(tc.x, sc.y), tIn]);
      candidates.push([sOut, P(sc.x, tc.y), tLeft]);
      candidates.push([sRight, P(tc.x, sc.y), tIn]);
      // saída por baixo/cima à esquerda da atividade (longe dos eventos de borda) e entrada à esquerda do destino
      const ativ = x => !isGateway(byId.get(x)) && !['start', 'end', 'catch', 'throw'].includes(byId.get(x).type);
      if (ativ(a) && t.x > s.x + 24) candidates.push([P(s.x + 16, sOut.y), P(s.x + 16, tc.y), tLeft]);
      if (ativ(b) && t.x + 16 > s.x + s.width) candidates.push([sRight, P(t.x + 16, sc.y), P(t.x + 16, tIn.y)]);
      // dobra num corredor entre colunas (do mais perto do destino ao mais perto da origem)
      for (let k = cb - 1; k >= ca; k--) for (const x of corridorXs(gaps[k])) {
        if (x > s.x + s.width + 4 && x < t.x - 4) candidates.push([sRight, P(x, sc.y), P(x, tc.y), tLeft]);
      }
    }
    candidates.basicos = candidates.length;
    // contorno por canais horizontais
    viaCanal(gaps[ca], gaps[cb - 1]);
    viaCanal(gaps[ca], gaps[cb - 1], 'vertical');
    for (const dy of [-70, 70, -130, 130]) {
      const yy = (dy < 0 ? Math.min(s.y, t.y) : Math.max(s.y + s.height, t.y + t.height)) + dy / 2;
      candidates.push([P(sc.x, dy < 0 ? s.y : s.y + s.height), P(sc.x, yy), P(tc.x, yy), P(tc.x, dy < 0 ? t.y : t.y + t.height)]);
    }
  } else {
    // retorno (loop): por cima ou por baixo dos dois elementos
    for (const k of [25, 40, 55]) {
      const above = Math.min(s.y, t.y) - k;
      candidates.push([P(sc.x, s.y), P(sc.x, above), P(tc.x, above), P(tc.x, t.y)]);
      const below = Math.max(s.y + s.height, t.y + t.height) + k;
      candidates.push([P(sc.x, s.y + s.height), P(sc.x, below), P(tc.x, below), P(tc.x, t.y + t.height)]);
    }
    candidates.basicos = candidates.length;
    // por um canal, descendo/subindo no corredor logo antes do destino e entrando pela lateral esquerda
    for (const L of canais) for (const x of corridorXs(gaps[cb - 1] || gaps[-1])) {
      const sy = L < sc.y ? s.y : s.y + s.height;
      candidates.push([P(sc.x, sy), P(sc.x, L), P(x, L), P(x, tc.y), tLeft]);
    }
    viaCanal(gaps[ca], gaps[cb - 1] || gaps[-1]);
    // entrando no destino por baixo (ou por cima), vindo de um canal entre a origem e o destino
    for (const L of canais) {
      const tEntra = L > tc.y ? P(tc.x, t.y + t.height) : P(tc.x, t.y);
      const sy = L < sc.y ? s.y : s.y + s.height;
      candidates.push([P(sc.x, sy), P(sc.x, L), P(tc.x, L), tEntra]);
      for (const x1 of corridorXs(gaps[ca] || gaps[-1]).slice(0, 3)) candidates.push([sRight, P(x1, sc.y), P(x1, L), P(tc.x, L), tEntra]);
    }
    const bottom = Math.max(...Object.values(shapes).map(v => v.y + v.height)) + 25;
    candidates.push([P(sc.x, s.y + s.height), P(sc.x, bottom), P(tc.x, bottom), P(tc.x, t.y + t.height)]);
  }
  return candidates;
}

// Escolhe o candidato de menor custo: atravessar formas ≫ cruzar/sobrepor setas já traçadas ≫ dobras ≫ comprimento.
function pick(candidates, shapes, skip, used, meta = {}) {
  let best = null, bestCost = Infinity;
  const limite = candidates.basicos ?? candidates.length;
  candidates.forEach((pts, i) => {
    if (i === limite && bestCost < 1e4) return;   // já há caminho simples sem problemas: dispensa os desvios
    if (i > limite && bestCost < 1e4) return;
    const pts2 = pts.filter((p, k) => k === 0 || p.x !== pts[k - 1].x || p.y !== pts[k - 1].y);
    if (pts2.length < 2) return;
    let len = 0;
    for (let k = 0; k < pts2.length - 1; k++) len += Math.abs(pts2[k].x - pts2[k + 1].x) + Math.abs(pts2[k].y - pts2[k + 1].y);
    const cost = (hits(pts2, shapes, skip) ? 1e7 : 0) + (crossings(pts2, used) + toques(pts2, used, shapes, meta)) * 1e4 + overlapCount(pts2, used) * 1e4
      + (pts2.length - 2) * 60 + len * 0.05 + i * 0.01;
    if (cost < bestCost) { bestCost = cost; best = pts2; }
  });
  best = best || candidates[0];
  for (let i = 0; i < best.length - 1; i++) used.push([best[i], best[i + 1], meta]);
  return best;
}

// cruzamentos próprios (os segmentos se atravessam; encostar na ponta não conta)
function crossings(points, used) {
  let n = 0;
  const lado = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  for (let i = 0; i < points.length - 1; i++) {
    const [p, q] = [points[i], points[i + 1]];
    for (const [u, v] of used) {
      if (lado(p, q, u) * lado(p, q, v) < 0 && lado(u, v, p) * lado(u, v, q) < 0) n++;
    }
  }
  return n;
}

// toques: uma seta encosta em outra (ponta sobre o meio da outra, ou trechos colineares que se emendam)
// fora da borda de um nó. Encontros na borda de um nó (ex.: várias setas chegando a uma junção) são normais.
function toques(points, used, shapes, meta = {}) {
  let lista = cacheFormas.get(shapes);
  if (!lista) { lista = Object.entries(shapes).map(([id, v]) => [id, v.x - 4, v.y - 4, v.x + v.width + 4, v.y + v.height + 4]); cacheFormas.set(shapes, lista); }
  const naForma = q => lista.some(f => q.x >= f[1] && q.x <= f[3] && q.y >= f[2] && q.y <= f[4]);
  const sobre = (q, u, v) => (u.x === v.x && Math.abs(q.x - u.x) < 1 && q.y >= Math.min(u.y, v.y) - 1 && q.y <= Math.max(u.y, v.y) + 1)
    || (u.y === v.y && Math.abs(q.y - u.y) < 1 && q.x >= Math.min(u.x, v.x) - 1 && q.x <= Math.max(u.x, v.x) + 1);
  // divisão/junção de setas de sequência (mesma origem ou mesmo destino) pode compartilhar o trecho junto ao nó
  const relevante = m => !m || meta.msg || m.msg || (m.de !== meta.de && m.para !== meta.para);
  let n = 0;
  for (let i = 0; i < points.length; i++) {
    const q = points[i];
    for (const [u, v, m] of used) {
      if (relevante(m) && sobre(q, u, v) && !naForma(q)) n++;
    }
  }
  for (const [u, v, m] of used) if (relevante(m)) for (const q of [u, v]) {
    for (let i = 0; i < points.length - 1; i++) if (sobre(q, points[i], points[i + 1]) && !naForma(q)) { n++; break; }
  }
  return n;
}

function overlapCount(points, used) {
  let n = 0;
  for (let i = 0; i < points.length - 1; i++) n += overlaps([points[i], points[i + 1]], used) ? 1 : 0;
  return n;
}

function overlaps(points, used) {
  for (let i = 0; i < points.length - 1; i++) {
    const [p, q] = [points[i], points[i + 1]];
    for (const [u, v] of used) {
      if (p.x === q.x && u.x === v.x && Math.abs(p.x - u.x) < 10) {
        const lo = Math.max(Math.min(p.y, q.y), Math.min(u.y, v.y)), hi = Math.min(Math.max(p.y, q.y), Math.max(u.y, v.y));
        if (hi - lo > 6) return true;
      }
      if (p.y === q.y && u.y === v.y && Math.abs(p.y - u.y) < 10) {
        const lo = Math.max(Math.min(p.x, q.x), Math.min(u.x, v.x)), hi = Math.min(Math.max(p.x, q.x), Math.max(u.x, v.x));
        if (hi - lo > 6) return true;
      }
    }
  }
  return false;
}

function routeMessage(s, t) {
  const sc = c(s), tc = c(t);
  const down = tc.y > sc.y;
  const sy = down ? s.y + s.height : s.y;
  const ty = down ? t.y : t.y + t.height;
  const midY = down ? t.y - 30 : t.y + t.height + 30;
  const candidates = [];
  const straight = (x) => {
    const pts = [P(x, sy), P(x, midY), P(tc.x, midY), P(tc.x, ty)];
    if (pts[0].x === pts[3].x) pts.splice(1, 2);
    return pts;
  };
  for (const dx of [0, 25, -25, 40, -40]) candidates.push(straight(sc.x + dx));
  // sai por cima/baixo, desvia no vão entre linhas até um corredor entre colunas
  const gapY = down ? s.y + s.height + 20 : s.y - 20;
  for (const dx of [30, -30]) {
    for (const k of [30, 20, 40]) {
      const corrX = dx > 0 ? s.x + s.width + k : s.x - k;
      candidates.push([P(sc.x + dx, sy), P(sc.x + dx, gapY), P(corrX, gapY), P(corrX, midY), P(tc.x, midY), P(tc.x, ty)]);
    }
  }
  // sai pela lateral até um corredor entre colunas e então segue na vertical
  for (const side of [1, -1]) {
    for (const k of [30, 20, 40]) {
      const corrX = side > 0 ? s.x + s.width + k : s.x - k;
      const sx = side > 0 ? s.x + s.width : s.x;
      candidates.push([P(sx, sc.y), P(corrX, sc.y), P(corrX, midY), P(tc.x, midY), P(tc.x, ty)]);
    }
  }
  return candidates;
}

// Rótulos das setas de sequência (ex.: "Sim", "Servidor UFF"): ao lado do primeiro trecho, perto da origem,
// na posição que não encosta em setas, formas nem outros rótulos.
export function placeFlowLabels(pools, edges, shapes, notes, outrosRotulos, todasSetas) {
  const out = {};
  const caixas = [...Object.values(shapes), ...Object.values(notes)];
  const ocupados = [...outrosRotulos];
  const segs = [];
  for (const pts of todasSetas) for (let i = 0; i < pts.length - 1; i++) segs.push([pts[i], pts[i + 1]]);
  const cruzaSeg = (r, [u, v]) => {
    const x1 = Math.min(u.x, v.x), x2 = Math.max(u.x, v.x), y1 = Math.min(u.y, v.y), y2 = Math.max(u.y, v.y);
    return x2 >= r.x - 2 && x1 <= r.x + r.width + 2 && y2 >= r.y - 2 && y1 <= r.y + r.height + 2;
  };
  const inter = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  for (const p of pools) (p.flows || []).forEach(([, , texto], j) => {
    if (!texto) return;
    const pts = edges[`${p.id}|${j}`];
    if (!pts || pts.length < 2) return;
    const CH = 6.4;
    const w = Math.min(130, Math.max(24, texto.length * CH + 6));
    const h = Math.ceil((texto.length * CH + 6) / w) * 14;
    const cands = [];
    for (let k = 0; k < Math.min(2, pts.length - 1); k++) {
      const a = pts[k], b = pts[k + 1];
      const dx = Math.sign(b.x - a.x), dy = Math.sign(b.y - a.y);
      const len = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
      for (const t of [10, 24, 40]) {
        if (t > len - 8) continue;
        if (dy === 0) {          // trecho horizontal: acima ou abaixo da linha
          const x = dx > 0 ? a.x + t : a.x - t - w;
          cands.push({ x, y: a.y - h - 4, width: w, height: h }, { x, y: a.y + 4, width: w, height: h });
        } else {                 // trecho vertical: à direita ou à esquerda da linha
          const y = dy > 0 ? a.y + t : a.y - t - h;
          cands.push({ x: a.x + 5, y, width: w, height: h }, { x: a.x - w - 5, y, width: w, height: h });
        }
      }
    }
    let melhor = null, menor = Infinity;
    cands.forEach((r, i) => {
      const custo = segs.filter(sg => cruzaSeg(r, sg)).length * 100 + caixas.filter(c => inter(r, c)).length * 100
        + ocupados.filter(c => inter(r, c)).length * 50 + i;
      if (custo < menor) { menor = custo; melhor = r; }
    });
    if (melhor) { out[`${p.id}|${j}`] = melhor; ocupados.push(melhor); }
  });
  return out;
}

// Rótulos externos (eventos e gateways): abaixo; se houver seta chegando/saindo por baixo, acima;
// se também por cima, à direita.
export function placeLabels(nodes, shapes, allEdges) {
  const labels = {};
  const EXT = new Set(['start', 'end', 'catch', 'throw', 'xor', 'and', 'or', 'event']);
  for (const n of nodes) {
    if (n.type === 'boundary' && n.name) {   // rótulo à direita do evento, abaixo da atividade
      const s = shapes[n.id];
      const w = Math.min(110, Math.max(50, n.name.length * 7 + 10));
      const right = !n.__boundaryIndex;
      labels[n.id] = { x: right ? s.x + s.width + 2 : s.x - w - 2, y: s.y + s.height - 4, width: w, height: Math.ceil((n.name.length * 7 + 10) / w) * 14 };
      continue;
    }
    if (!EXT.has(n.type) || !n.name) continue;
    const s = shapes[n.id];
    const cx = s.x + s.width / 2;
    let bottom = false, top = false;
    for (const e of allEdges) {
      for (const p of [e[0], e[e.length - 1]]) {
        if (Math.abs(p.x - cx) > 1) continue;
        if (Math.abs(p.y - (s.y + s.height)) <= 1) bottom = true;
        if (Math.abs(p.y - s.y) <= 1) top = true;
      }
    }
    const CH = 7; // largura média de um caractere (fonte 11px)
    const w = Math.min(130, Math.max(50, n.name.length * CH + 10));
    const lines = Math.ceil((n.name.length * CH + 10) / w);
    const h = lines * 14;
    let b;
    if (!bottom) b = { x: cx - w / 2, y: s.y + s.height + 4, width: w, height: h };
    else if (!top) b = { x: cx - w / 2, y: s.y - h - 4, width: w, height: h };
    else b = { x: s.x + s.width + 4, y: s.y - h, width: w, height: h };
    labels[n.id] = b;
  }
  return labels;
}
