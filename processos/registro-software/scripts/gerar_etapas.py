"""Gera os JSONs das 7 etapas + macro a partir do AS-IS plano (fonte única).

Uso: python3 -I processos/registro-software/scripts/gerar_etapas.py
Cada etapa reaproveita os nós do AS-IS (mesmos ids, nomes, tipos, status e notas),
inclui os fluxos internos e acrescenta eventos de início/fim que ligam as etapas.
"""
import copy
import json
from pathlib import Path

PROC = Path(__file__).resolve().parent.parent   # processos/registro-software
asis = json.loads((PROC / 'fontes/registro-software-asis.json').read_text())
pools = {p['id']: p for p in asis['pools']}
PROPPI, INPI = pools['Pool_PROPPI'], pools['Pool_INPI']
NODES = {n['id']: n for n in PROPPI['nodes']}
LANES = {l['id']: l for l in PROPPI['lanes']}
OUT = PROC / 'fontes/etapas'
OUT.mkdir(parents=True, exist_ok=True)
POOL_NAME = 'PROPPI – Registro de Programa de Computador (Software)'
INPI_BOX = {'id': 'Pool_INPI', 'name': INPI['name'], 'blackbox': True}
COTIT_BOX = {'id': 'Pool_COTIT', 'name': 'Cotitulares externos', 'blackbox': True}


def node(nid, **override):
    n = copy.deepcopy(NODES[nid])
    n.pop('shift', None)          # dicas de layout do AS-IS plano não valem na etapa
    n.update(override)
    return n


def internal_flows(ids):
    return [copy.deepcopy(f) for f in PROPPI['flows'] if f[0] in ids and f[1] in ids]


def stage(num, slug, title, lanes, ids, extra_nodes, extra_flows, *, before=(), after=(), messages=(), extra_pools_ids=()):
    nodes = [node(i) for i in ids] + extra_nodes
    proc_id = f'Etapa{num}_{slug}'
    main = {
        'id': 'Pool_PROPPI', 'name': f'PROPPI – Etapa {num}: {title}', 'processId': proc_id,
        'lanes': [LANES[l] for l in lanes], 'nodes': nodes,
        'flows': internal_flows(set(ids)) + extra_flows,
    }
    groups = [g for g in PROPPI.get('groups', []) if set(g['nodes']) <= set(ids)]
    if groups:
        main['groups'] = groups
    d = {'id': proc_id, 'name': f'Etapa {num} – {title}', 'pools': [*before, main, *after],
         'messageFlows': list(messages)}
    (OUT / f'{num:02d}-{slug.lower()}.json').write_text(json.dumps(d, ensure_ascii=False, indent=2))
    return proc_id


def start(nid, name, lane):
    return {'id': nid, 'type': 'start', 'name': name, 'lane': lane}


def end(nid, name, lane):
    return {'id': nid, 'type': 'end', 'name': name, 'lane': lane}


# Modularização: cada etapa tem uma única saída de continuidade, nomeada pelo resultado,
# e a etapa seguinte começa por uma entrada com o mesmo nome.
SAIDA = {1: 'Requerimento enviado', 2: 'Ativo aprovado', 3: 'Documentação aprovada', 4: 'Pagamento comprovado',
         5: 'Pedido depositado', 6: 'Registro concedido'}


def saida(k, lane):
    return end(f'e{k}_fim', f'Saída → Etapa {k + 1}: {SAIDA[k]}', lane)


def entrada(k, lane):
    return start(f'e{k}_ini', f'Entrada ← Etapa {k - 1}: {SAIDA[k - 1]}', lane)


# 1. Abertura do pedido
e1 = stage(1, 'Abertura', 'Abertura do pedido', ['L_INT'],
           ['i_inicio', 'i_identificar', 'i_gw_tipo', 'i_petic_proc', 'i_incluir_req', 'i_preencher_req', 'i_join_tipo'],
           [saida(1, 'L_INT')],
           [['i_join_tipo', 'e1_fim']])

# 2. Avaliação do ativo
e2 = stage(2, 'Avaliacao', 'Avaliação do ativo', ['L_INT', 'L_AGIR'],
           ['a_sei_req', 'a_analisar_ativo', 'a_gw_requisitos', 'a_email_decisao', 'i_receber_decisao', 'a_desp_enc_req',
            'a_fim_req', 'a_email_reuniao', 'i_receber_convite', 'a_aguarda_reuniao', 'a_gw_avaliacao', 'a_desp_enc_aval',
            'a_fim_aval'],
           [entrada(2, 'L_AGIR'), saida(2, 'L_AGIR')],
           [['e2_ini', 'a_sei_req'], ['a_gw_avaliacao', 'e2_fim', 'Sim']])

# 3. Instrução documental (inclui o laço de pendências: "Documentos ok? Não" volta às orientações)
e3 = stage(3, 'Instrucao', 'Instrução documental', ['L_INT', 'L_AGIR'],
           ['a_join_orient', 'a_email_orient', 'i_zip', 'i_hash', 'i_dados', 'i_gw_interessado',
            'i_petic_docs', 'i_preencher_docs', 'i_join_interessado', 'a_sei_docs', 'a_analisar_doc', 'a_gw_docs'],
           [entrada(3, 'L_AGIR'), saida(3, 'L_AGIR')],
           [['e3_ini', 'a_join_orient'], ['a_gw_docs', 'e3_fim', 'Sim']])

# 4. Pagamento da GRU (pagamento em si permanece caixa-preta)
e4 = stage(4, 'Pagamento', 'Pagamento da GRU', ['L_AGIR'],
           ['a_einpi', 'a_gru', 'a_pagamento', 'a_aguarda_pag', 'a_anexar_pag'],
           [entrada(4, 'L_AGIR'), saida(4, 'L_AGIR')],
           [['e4_ini', 'a_einpi'], ['a_anexar_pag', 'e4_fim']])

# 5. Depósito do pedido no INPI
e5 = stage(5, 'Deposito', 'Depósito do pedido no INPI', ['L_AGIR'],
           ['a_dv_baixar', 'a_dv_assinar', 'a_esoft', 'a_esoft_form', 'a_esoft_anexar', 'a_enviar', 'a_protocolo'],
           [entrada(5, 'L_AGIR'), saida(5, 'L_AGIR')],
           [['e5_ini', 'a_dv_baixar'], ['a_protocolo', 'e5_fim']],
           after=[INPI_BOX], messages=[['a_enviar', 'Pool_INPI', 'Pedido de registro (e-Software)']])

# 6. Resultado do INPI (INPI expandido). O pedido foi enviado na Etapa 5: aqui o início do INPI é uma entrada
# comum, para não haver evento de mensagem sem fluxo de mensagem.
INPI_E6 = copy.deepcopy(INPI)
INPI_E6.pop('color', None)
for n in INPI_E6['nodes']:
    if n['id'] == 'n_recebido':
        n.pop('event', None)
        n['name'] = 'Entrada ← Etapa 5: pedido recebido pelo e-Software'
# 6. Resultado do INPI (INPI expandido)
e6_ids = ['a_rpi', 'a_gw_desp', 'a_certificado', 'a_anexar_reg', 'a_and_reg', 'a_email_cert',
          'i_receber_cert', 'i_fim_ok', 'a_desp_encam_reg', 'a_anexar_742', 'a_desp_742', 'a_email_742',
          'i_receber_742', 'i_fim_742']
e6 = stage(6, 'Resultado', 'Resultado do INPI', ['L_INT', 'L_AGIR'], e6_ids,
           [entrada(6, 'L_AGIR'), saida(6, 'L_AGIR')],
           [['e6_ini', 'a_rpi'], ['a_desp_encam_reg', 'e6_fim']],
           after=[INPI_E6],
           messages=[m for m in asis['messageFlows'] if m[0] in ('n_pub_730', 'n_pub_742')])

# 7. Registros internos e formalização da cotitularidade
e7_ids = ['uff_registros', 'a_gw_cotitular', 'a_desp_enc_sem_cot', 'a_fim_sem_cot', 'a_minuta', 'a_desp_encam_proger',
          'uff_parecer', 'a_contrato', 'a_email_cadastro', 'a_disp_contrato', 'a_and_assinaturas', 'a_assinar_contrato',
          'uff_assinar_contrato', 'a_ass_externas', 'a_and_assinaturas_fim', 'a_desp_enc_cot', 'a_fim_cot']
e7 = stage(7, 'Registros', 'Registros internos e formalização da cotitularidade', ['L_AGIR', 'L_UFF'], e7_ids,
           [entrada(7, 'L_UFF')],
           [['e7_ini', 'uff_registros']],
           before=[COTIT_BOX], messages=[m for m in asis['messageFlows'] if 'Pool_COTIT' in m[:2]])

# 0. Macroprocesso: etapas como call activities apontando para os processos acima
calls = [(e1, 'L_INT', 'Etapa 1 – Abertura do pedido'), (e2, 'L_AGIR', 'Etapa 2 – Avaliação do ativo'),
         (e3, 'L_AGIR', 'Etapa 3 – Instrução documental'), (e4, 'L_AGIR', 'Etapa 4 – Pagamento da GRU'),
         (e5, 'L_AGIR', 'Etapa 5 – Depósito do pedido no INPI'), (e6, 'L_AGIR', 'Etapa 6 – Resultado do INPI'),
         (e7, 'L_AGIR', 'Etapa 7 – Registros internos e formalização da cotitularidade')]
mnodes = [start('m_ini', 'Interesse em registrar o software', 'L_INT')]
mnodes += [{'id': f'm_e{i}', 'type': 'call', 'calls': pid, 'name': name, 'lane': lane}
           for i, (pid, lane, name) in enumerate(calls, 1)]
mnodes += [{'id': 'm_gw_apto', 'type': 'xor', 'name': 'Ativo apto?', 'lane': 'L_AGIR'},
           end('m_fim_aval', 'Encerrado na avaliação', 'L_AGIR'),
           {'id': 'm_gw_inpi', 'type': 'xor', 'name': 'Resultado do INPI', 'lane': 'L_AGIR'},
           end('m_fim_742', 'Encerrado: pedido não conhecido', 'L_AGIR'),
           end('m_fim', 'Processo concluído', 'L_AGIR')]
# a seta entre as etapas leva o nome da saída da etapa anterior
mflows = [['m_ini', 'm_e1'], ['m_e1', 'm_e2', SAIDA[1]], ['m_e2', 'm_gw_apto'], ['m_gw_apto', 'm_fim_aval', 'Não'],
          ['m_gw_apto', 'm_e3', f'Sim: {SAIDA[2].lower()}'], ['m_e3', 'm_e4', SAIDA[3]], ['m_e4', 'm_e5', SAIDA[4]],
          ['m_e5', 'm_e6', SAIDA[5]], ['m_e6', 'm_gw_inpi'], ['m_gw_inpi', 'm_fim_742', '742 – não conhecido'],
          ['m_gw_inpi', 'm_e7', f'730: {SAIDA[6].lower()}'], ['m_e7', 'm_fim']]
macro = {'id': 'Macro_Registro_Software', 'name': 'Macroprocesso – Registro de Programa de Computador (AS-IS)',
         'pools': [{'id': 'Pool_PROPPI', 'name': POOL_NAME, 'processId': 'Macro_Registro_Software',
                    'lanes': [LANES['L_INT'], LANES['L_AGIR']], 'nodes': mnodes, 'flows': mflows}, INPI_BOX],
         'messageFlows': [['m_e5', 'Pool_INPI', 'Pedido de registro'], ['Pool_INPI', 'm_e6', 'Publicação na RPI (730/742)']]}
(OUT / '00-macro.json').write_text(json.dumps(macro, ensure_ascii=False, indent=2))

# conferência: todo nó do AS-IS plano está em exatamente uma etapa
used = [i for f in sorted(OUT.glob('0[1-7]-*.json')) for p in json.loads(f.read_text())['pools'] for i in
        (n['id'] for n in p.get('nodes', [])) if i in NODES]
missing = sorted(set(NODES) - set(used))
dup = sorted({i for i in used if used.count(i) > 1})
print('etapas geradas em', OUT)
print('nós do AS-IS fora de qualquer etapa:', missing or 'nenhum')
print('nós repetidos entre etapas:', dup or 'nenhum')
