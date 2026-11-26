// Layout próprio para diagramas COM raias e/ou várias pools (o bpmn-auto-layout não suporta).
// Entrada: pools [{ id, lanes?, nodes, flows }] + messageFlows [[de, para]].
// Saída: posições de pools, raias, nós, anotações, grupos e pontos das setas.

const SIZES = {
  start: [36, 36], end: [36, 36], catch: [36, 36], throw: [36, 36],
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
function columns(nodes, edges) {
  const ids = nodes.map(n => n.id);
  const shiftOf = new Map(nodes.map(n => [n.id, n.shift || 0]));   // dica "shift": colunas extras antes do nó
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

export function layoutDiagram(pools, messageFlows = [], { poolBand = true, groups = [] } = {}) {
  const allNodes = pools.flatMap(p => p.nodes || []);
  const byId = new Map(allNodes.map(n => [n.id, n]));
  const blackbox = new Set(pools.filter(p => p.blackbox).map(p => p.id));
  const allEdges = [
    ...pools.flatMap(p => (p.flows || []).map(f => [f[0], f[1]])),
    ...messageFlows.filter(f => !blackbox.has(f[0]) && !blackbox.has(f[1])).map(f => [f[0], f[1]])
  ];
  const { col } = columns(allNodes, allEdges);
  // dica de posição: "under": "<id>" coloca o nó na mesma coluna, logo abaixo do nó indicado
  for (const n of allNodes) if (n.under) col.set(n.id, col.get(n.under));
  const nCols = Math.max(...allNodes.map(n => col.get(n.id))) + 1;

  const shapes = {}, lanes = {}, poolBounds = {}, notes = {};
  let y = 0;
  let width = 0;
  for (const p of pools) {
    const hasLanes = !!p.lanes?.length;
    const band = p.band ?? poolBand;
    const left = (band ? BAND : 0) + (hasLanes ? BAND : 0);
    width = Math.max(width, left + MARGIN + nCols * COL_W + MARGIN / 2);
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
    const laneOf = n => (hasLanes ? n.lane : `__${p.id}`);
    for (const n of nodes) {
      if (!laneList.some(l => l.id === laneOf(n))) throw new Error(`Nó "${n.id}" sem raia válida (lane="${n.lane}")`);
    }
    const preds = new Map(nodes.map(n => [n.id, []]));
    (p.flows || []).forEach(([a, b]) => preds.get(b).push(a));

    // Linha dentro da raia: herda a linha do predecessor na mesma raia (mantém setas retas).
    const row = new Map();
    const taken = new Set();
    const order = [...nodes].sort((a, b) => col.get(a.id) - col.get(b.id) || (a.under ? 1 : 0) - (b.under ? 1 : 0));
    for (const n of order) {
      const pr = preds.get(n.id).find(q => row.has(q) && laneOf(byId.get(q)) === laneOf(n));
      let r = n.under && row.has(n.under) ? row.get(n.under) + 1 : pr ? row.get(pr) : 0;
      while (taken.has(`${laneOf(n)}|${r}|${col.get(n.id)}`)) r++;
      taken.add(`${laneOf(n)}|${r}|${col.get(n.id)}`);
      row.set(n.id, r);
    }

    const left = (band ? BAND : 0) + (hasLanes ? BAND : 0);
    const poolTop = y;
    for (const l of laneList) {
      const members = nodes.filter(n => laneOf(n) === l.id);
      const rows = members.length ? Math.max(...members.map(n => row.get(n.id))) + 1 : 1;
      // faixa de anotações no topo da raia
      const noted = members.filter(n => n.note);
      const strip = noted.length ? Math.max(...noted.map(n => noteHeight(n.note))) + 20 : 0;
      const h = strip + rows * ROW_H + 2 * LANE_PAD;
      if (hasLanes) lanes[l.id] = { x: band ? BAND : 0, y, width: width - (band ? BAND : 0), height: h };
      for (const n of members) {
        const [w, hh] = sizeOf(n);
        const cx = left + MARGIN + col.get(n.id) * COL_W + TASK_W / 2;
        const cy = y + strip + LANE_PAD + row.get(n.id) * ROW_H + ROW_H / 2;
        shapes[n.id] = { x: cx - w / 2, y: cy - hh / 2, width: w, height: hh };
        if (n.note) {
          notes[n.id] = { x: cx - 55, y: y + 10, width: NOTE_W, height: noteHeight(n.note) };
        }
      }
      y += h;
    }
    poolBounds[p.id] = { x: 0, y: poolTop, width, height: y - poolTop };
    y += POOL_GAP;
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
  const used = [];   // segmentos já traçados, para evitar setas sobrepostas
  const edges = {};
  for (const p of pools) {
    (p.flows || []).forEach(([a, b], i) => {
      edges[`${p.id}|${i}`] = pick(route(a, b, byId, obstacles, col), obstacles, [a, b], used);
    });
  }
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
      for (const dx of [toPool ? -12 : 12, toPool ? 12 : -12, 0, 25, -25]) cands.push([P(cx + dx, yEl), P(cx + dx, yPool)]);
      // corredor entre colunas (a meia coluna do centro do elemento), saindo pela lateral
      const off = toPool ? -14 : 14;
      for (const side of [1, -1]) for (const k of [0, 12, -12]) {
        const corrX = cx + side * (COL_W / 2 + k);
        cands.push([P(side > 0 ? el.x + el.width : el.x, cy + off), P(corrX, cy + off), P(corrX, yPool)]);
      }
      const pts = pick(cands.map(c => toPool ? c : [...c].reverse()), obstacles, [id], used);
      const pe = toPool ? pts[pts.length - 1] : pts[0];   // ponta na pool: rótulo logo ao lado
      msgLabels[i] = { x: pe.x + 6, y: below ? pe.y - 34 : pe.y + 6, width: 110, height: 28 };
      return pts;
    }
    return pick(routeMessage(shapes[a], shapes[b]), obstacles, [a, b], used);
  });
  const assoc = {};
  for (const [id, nb] of Object.entries(notes)) {
    const s = shapes[id];
    const x = nb.x + 30;
    const direct = [P(x, nb.y + nb.height), P(x, s.y)];
    // se a linha reta atravessar outro elemento, desce por um corredor entre colunas
    const corrX = s.x + s.width + (COL_W - TASK_W) / 2;
    const detour = [P(corrX, nb.y + nb.height), P(corrX, s.y - 15), P(s.x + s.width / 2, s.y - 15), P(s.x + s.width / 2, s.y)];
    assoc[id] = !hits(direct, obstacles, [id]) ? direct : detour;
  }
  const labels = placeLabels(allNodes, shapes, [...Object.values(edges), ...msgEdges]);
  return { shapes, lanes, pools: poolBounds, notes, assoc, groups: groupBounds, edges, msgEdges, msgLabels, labels, width, height: y - POOL_GAP };
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

function hits(points, shapes, skip) {
  for (let i = 0; i < points.length - 1; i++) {
    const [p, q] = [points[i], points[i + 1]];
    const minX = Math.min(p.x, q.x), maxX = Math.max(p.x, q.x);
    const minY = Math.min(p.y, q.y), maxY = Math.max(p.y, q.y);
    for (const [id, s] of Object.entries(shapes)) {
      if (skip.includes(id)) continue;
      if (maxX > s.x - 4 && minX < s.x + s.width + 4 && maxY > s.y - 4 && minY < s.y + s.height + 4) return true;
    }
  }
  return false;
}

function route(a, b, byId, shapes, col) {
  const s = shapes[a], t = shapes[b];
  const sc = c(s), tc = c(t);
  const candidates = [];
  if (col.get(b) === col.get(a) && Math.abs(sc.x - tc.x) < 1) {
    const up = tc.y < sc.y;
    candidates.push([P(sc.x, up ? s.y : s.y + s.height), P(tc.x, up ? t.y + t.height : t.y)]);
  } else if (col.get(b) > col.get(a)) {
    if (Math.abs(sc.y - tc.y) < 1) {
      candidates.push([P(s.x + s.width, sc.y), P(t.x, tc.y)]);
    }
    const down = tc.y > sc.y;
    const sOut = P(sc.x, down ? s.y + s.height : s.y);
    const tIn = P(tc.x, down ? t.y : t.y + t.height);
    if (Math.abs(sc.y - tc.y) >= 1) {
      if (isGateway(byId.get(a))) candidates.push([sOut, P(sc.x, tc.y), P(t.x, tc.y)]);
      if (isGateway(byId.get(b))) candidates.push([P(s.x + s.width, sc.y), P(tc.x, sc.y), tIn]);
      candidates.push([sOut, P(sc.x, tc.y), P(t.x, tc.y)]);
      candidates.push([P(s.x + s.width, sc.y), P(tc.x, sc.y), tIn]);
      // dobra num corredor entre colunas (perto do alvo, depois perto da origem)
      for (let k = 0; ; k++) {
        const nearT = t.x - (COL_W - TASK_W) / 2 - 5 - k * COL_W;
        if (nearT <= s.x + s.width) break;
        for (const off of [0, -15, 15, -25]) {   // várias posições no corredor, para não sobrepor setas
          const x = nearT + off;
          if (x > s.x + s.width + 5 && x < t.x - 5) candidates.push([P(s.x + s.width, sc.y), P(x, sc.y), P(x, tc.y), P(t.x, tc.y)]);
        }
      }
    }
    // contorno por cima/por baixo quando a linha reta está bloqueada
    for (const dy of [-70, 70, -130, 130]) {
      const yy = (dy < 0 ? Math.min(s.y, t.y) : Math.max(s.y + s.height, t.y + t.height)) + dy / 2;
      candidates.push([P(sc.x, dy < 0 ? s.y : s.y + s.height), P(sc.x, yy), P(tc.x, yy), P(tc.x, dy < 0 ? t.y : t.y + t.height)]);
    }
  } else {
    // retorno (loop): passa por baixo de tudo
    const bottom = Math.max(...Object.values(shapes).map(v => v.y + v.height)) + 25;
    candidates.push([P(sc.x, s.y + s.height), P(sc.x, bottom), P(tc.x, bottom), P(tc.x, t.y + t.height)]);
  }
  return candidates;
}

// Escolhe o primeiro candidato sem atravessar elementos e sem sobrepor setas já traçadas.
function pick(candidates, shapes, skip, used) {
  const best = candidates.find(pts => !hits(pts, shapes, skip) && !overlaps(pts, used))
    || candidates.find(pts => !hits(pts, shapes, skip))
    || candidates[0];
  for (let i = 0; i < best.length - 1; i++) used.push([best[i], best[i + 1]]);
  return best;
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

// Rótulos externos (eventos e gateways): abaixo; se houver seta chegando/saindo por baixo, acima;
// se também por cima, à direita.
export function placeLabels(nodes, shapes, allEdges) {
  const labels = {};
  const EXT = new Set(['start', 'end', 'catch', 'throw', 'xor', 'and', 'or', 'event']);
  for (const n of nodes) {
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
