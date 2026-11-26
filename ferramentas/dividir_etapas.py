"""Divide uma definição BPMN (JSON) em diagramas por etapa e gera o macroprocesso.

Uso: python3 -I ferramentas/dividir_etapas.py <fonte.json> <pasta-de-saida>

A fonte precisa de:
- "etapas": [{"n": 1, "nome": "...", "slug": "...", "dono": "<id da raia>"}, ...]
- "etapa": N em cada nó (eventos de borda herdam a etapa da atividade).
- "desfecho": true nos eventos de fim que encerram o processo (vão para o macro).
- (opcional) "nomeCurto" na pool principal: usado no nome da pool das vistas por etapa.
- (opcional) "compacto": true no topo: repassado às etapas e ao macro (colunas com largura adaptável).

Saída: <pasta>/00-macro.json e <pasta>/NN-<slug>.json.
- Fluxo que cruza etapas vira um fim "→ Etapa N – nome" na origem e um início "(Etapa M – nome)" no destino.
- Pools e raias externas só entram onde são usadas.
- No macro, cada etapa é uma call activity. Depois das etapas com encerramentos próprios entra um gateway
  com os desfechos. As mensagens com participantes externos são agregadas por etapa.
"""
import copy
import json
import sys
from pathlib import Path

src, out = Path(sys.argv[1]), Path(sys.argv[2])
d = json.loads(src.read_text())
out.mkdir(parents=True, exist_ok=True)
main = next(p for p in d['pools'] if not p.get('blackbox'))
externals = {p['id']: p for p in d['pools'] if p.get('blackbox')}
nodes = {n['id']: n for n in main['nodes']}
for n in nodes.values():                       # bordas herdam a etapa da atividade
    if n['type'] == 'boundary':
        n['etapa'] = nodes[n['attachedTo']]['etapa']
etapas = {e['n']: e for e in d['etapas']}
lanes = {l['id']: l for l in main['lanes']}
stage_of = {i: n['etapa'] for i, n in nodes.items()}
title = lambda k: f'Etapa {k} – {etapas[k]["nome"]}'
lane_of = lambda n: n.get('lane') or nodes[n['attachedTo']]['lane']


def proc_id(k):
    return f'{d["id"]}_Etapa{k}'


files = {}
for k in sorted(etapas):
    ids = [i for i, s in stage_of.items() if s == k]
    snodes = [copy.deepcopy(nodes[i]) for i in ids]
    sflows, extra = [], {}
    for f in main['flows']:
        a, b = f[0], f[1]
        sa, sb = stage_of[a], stage_of[b]
        if sa == k and sb == k:
            sflows.append(copy.deepcopy(f))
        elif sa == k:                                  # sai da etapa
            eid = f'fim_{a}_e{sb}'
            if eid not in extra:
                extra[eid] = {'id': eid, 'type': 'end', 'name': f'→ {title(sb)}', 'lane': lane_of(nodes[a])}
            sflows.append([a, eid] + f[2:])
        elif sb == k:                                  # entra na etapa
            sid = f'ini_{b}_e{sa}'
            if sid not in extra:
                extra[sid] = {'id': sid, 'type': 'start', 'name': f'({title(sa)})', 'lane': lane_of(nodes[b])}
                sflows.append([sid, b])
    snodes += list(extra.values())
    for n in snodes:
        n.pop('etapa', None)
        n.pop('desfecho', None)
    used_lanes = {lane_of(n) if n['type'] != 'boundary' else lane_of(nodes[n['attachedTo']]) for n in snodes}
    msgs = [m for m in d.get('messageFlows', []) if m[0] in ids or m[1] in ids]
    ext_ids = {x for m in msgs for x in m[:2] if x in externals}
    smain = {'id': main['id'], 'name': f'{main.get("nomeCurto", main["name"])} – {title(k)}', 'processId': proc_id(k),
             'lanes': [copy.deepcopy(l) for l in main['lanes'] if l['id'] in used_lanes],
             'nodes': snodes, 'flows': sflows}
    groups = [g for g in main.get('groups', []) if set(g['nodes']) <= set(ids)]
    if groups:
        smain['groups'] = groups
    pools = [copy.deepcopy(p) for p in d['pools'] if p['id'] in ext_ids and d['pools'].index(p) < d['pools'].index(main)]
    pools += [smain]
    pools += [copy.deepcopy(p) for p in d['pools'] if p['id'] in ext_ids and d['pools'].index(p) > d['pools'].index(main)]
    sd = {'id': proc_id(k), 'name': f'{d["name"]} – {title(k)}', 'pools': pools, 'messageFlows': msgs}
    if d.get('compacto'):
        sd['compacto'] = True
    fname = f'{k:02d}-{etapas[k]["slug"]}.json'
    (out / fname).write_text(json.dumps(sd, ensure_ascii=False, indent=2))
    files[k] = fname

# ---------------- macroprocesso ----------------
first = min(etapas)
start_lane = lane_of(next(n for n in nodes.values() if n['type'] == 'start' and stage_of[n['id']] == first))
mnodes = [{'id': 'm_ini', 'type': 'start', 'name': next(n['name'] for n in nodes.values()
                                                          if n['type'] == 'start' and stage_of[n['id']] == first),
           'lane': start_lane}]
mflows, prev = [], 'm_ini'
for k in sorted(etapas):
    cid = f'm_e{k}'
    mnodes.append({'id': cid, 'type': 'call', 'calls': proc_id(k), 'name': title(k), 'lane': etapas[k]['dono']})
    mflows.append([prev, cid])
    prev = cid
    outcomes = sorted({n['name'] for n in nodes.values() if n.get('desfecho') and stage_of[n['id']] == k})
    if k == max(etapas):
        mnodes.append({'id': 'm_fim', 'type': 'end', 'name': 'Processo concluído', 'lane': etapas[k]['dono']})
        mflows.append([cid, 'm_fim'])
    elif outcomes:
        gid = f'm_gw{k}'
        mnodes.append({'id': gid, 'type': 'xor', 'name': f'Resultado da Etapa {k}', 'lane': etapas[k]['dono']})
        mflows.append([cid, gid])
        for j, o in enumerate(outcomes):
            eid = f'm_fim{k}_{j}'
            mnodes.append({'id': eid, 'type': 'end', 'name': o, 'lane': etapas[k]['dono']})
            mflows.append([gid, eid, o.split()[0].rstrip(':')])   # rótulo curto; o evento de fim traz o nome completo
        prev = gid
        mflows.append([None, None, 'Segue'])          # marcador: o próximo fluxo sai do gateway com rótulo
# aplica o rótulo "Segue" no fluxo que sai de cada gateway para a etapa seguinte
fixed = []
for f in mflows:
    if f[0] is None:
        continue
    fixed.append(f)
for f in fixed:
    if f[0].startswith('m_gw') and f[1].startswith('m_e'):
        f.append('Segue')
mlanes = []
for n in mnodes:
    if n['lane'] not in mlanes:
        mlanes.append(n['lane'])
# mensagens agregadas por etapa e participante externo
seen, mmsgs = set(), []
for m in d.get('messageFlows', []):
    a, b, *lab = m
    ka = f'm_e{stage_of[a]}' if a in nodes else a
    kb = f'm_e{stage_of[b]}' if b in nodes else b
    if (ka, kb) not in seen:
        seen.add((ka, kb))
        mmsgs.append([ka, kb])
ext_used = {x for m in mmsgs for x in m if x in externals}
order = [l['id'] for l in main['lanes']]
macro_main = {'id': main['id'], 'name': main['name'], 'processId': f'{d["id"]}_Macro',
              'lanes': [copy.deepcopy(lanes[l]) for l in order if l in mlanes], 'nodes': mnodes, 'flows': fixed}
mpools = [copy.deepcopy(p) for p in d['pools'] if p['id'] in ext_used and d['pools'].index(p) < d['pools'].index(main)]
mpools += [macro_main]
mpools += [copy.deepcopy(p) for p in d['pools'] if p['id'] in ext_used and d['pools'].index(p) > d['pools'].index(main)]
macro = {'id': f'{d["id"]}_Macro', 'name': f'Macroprocesso – {d["name"]}', 'pools': mpools, 'messageFlows': mmsgs}
if d.get('compacto'):
    macro['compacto'] = True
(out / '00-macro.json').write_text(json.dumps(macro, ensure_ascii=False, indent=2))
print('etapas:', ', '.join(files[k] for k in sorted(files)), '+ 00-macro.json')
