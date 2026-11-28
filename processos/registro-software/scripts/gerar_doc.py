"""Gera docs/macroprocesso-registro-software.md (arquitetura, mapa, SIPOC, RACI).

As listas de atividades vêm dos JSONs das etapas (fonte única); os textos de SIPOC/RACI
foram montados a partir do modelo e das respostas da entrevista de 26/11/2026.
Uso: python3 -I processos/registro-software/scripts/gerar_doc.py
"""
import json
from pathlib import Path

PROC = Path(__file__).resolve().parent.parent   # processos/registro-software
SRC = PROC / 'fontes/etapas'
ACTIVITY = {'task', 'user', 'service', 'send', 'receive', 'manual', 'script', 'business', 'subprocess', 'call'}
STATUS = {'nova': ' 🟩', 'confirmar': ' 🟧'}

stages = []
for f in sorted(SRC.glob('0[1-7]-*.json')):
    d = json.loads(f.read_text())
    main = next(p for p in d['pools'] if p['id'] == 'Pool_PROPPI')
    lanes = {l['id']: l['name'] for l in main['lanes']}
    nodes = main['nodes']
    acts = [n for n in nodes if n['type'] in ACTIVITY]
    starts = [n['name'] for n in nodes if n['type'] == 'start']
    ends = [n['name'] for n in nodes if n['type'] == 'end']
    others = [p['name'] for p in d['pools'] if p['id'] != 'Pool_PROPPI']
    stages.append(dict(file=f.stem, name=d['name'], lanes=lanes, acts=acts, starts=starts, ends=ends, others=others))

OBJ = [
    'Formalizar o interesse e abrir o processo com o Requerimento de Avaliação do ativo.',
    'Decidir se o ativo atende aos requisitos e se o processo continua.',
    'Reunir e validar a documentação do software (pacote, hash e dados exigidos pelo INPI).',
    'Emitir e pagar a GRU do serviço 730 e comprovar o pagamento no processo.',
    'Preparar a DV e o formulário e-Software e depositar o pedido de registro no INPI.',
    'Obter o resultado do INPI (730 ou 742), registrá-lo no SEI e comunicar o interessado.',
    'Fazer os registros patrimonial e contábil e, havendo cotitularidade, formalizar o Contrato de Ajuste.',
]

SIPOC = [
    ('Interessado (usuário externo ou servidor UFF)',
     'Interesse em registrar o software; dados do ativo',
     'Processo aberto no SEI com o Requerimento de Avaliação do ativo',
     'AGIR'),
    ('Interessado',
     'Requerimento de Avaliação do ativo (SEI)',
     'Ativo aprovado para continuidade **ou** processo encerrado com despacho e e-mail ao interessado',
     'AGIR (Etapa 3); Interessado'),
    ('Interessado; AGIR',
     'Orientações gerais; arquivos-fonte do programa; dados de titularidade, autoria e características',
     'Documentação aprovada no SEI (pacote, resumo hash SHA-512 e documento com os dados exigidos pelo INPI)',
     'AGIR (Etapas 4 e 5)'),
    ('AGIR; sistemas do INPI (e-INPI/GRU)',
     'Documentação aprovada; cadastro da UFF no e-INPI; recursos da AGIR para o pagamento',
     'GRU 730 paga e comprovante anexado ao SEI',
     'AGIR (Etapa 5); INPI (retribuição)'),
    ('AGIR; Interessado (hash e dados da Etapa 3); INPI (DV e e-Software)',
     'GRU paga; resumo hash; documento de dados do programa; e-CNPJ da UFF com procuração',
     'Pedido depositado no e-Software; recibo com o número do pedido anexado ao SEI',
     'INPI; AGIR (Etapa 6)'),
    ('INPI',
     'Pedido depositado; publicações na RPI (despachos 730 e 742)',
     '730: certificado anexado ao SEI e enviado ao interessado, processo encaminhado • 742: processo encerrado e interessado comunicado',
     'Interessado; Outras unidades da UFF (Etapa 7)'),
    ('AGIR; Outras unidades da UFF (incl. Reitoria e PROGER); Cotitulares externos',
     'Processo com o certificado de registro; minuta do Contrato de Ajuste (quando há cotitularidade)',
     'Bem registrado (patrimonial e contábil); Contrato de Ajuste assinado por AGIR, Reitoria e cotitulares; processo encerrado',
     'UFF; Cotitulares externos'),
]

# R = executa, A = aprova (sempre AGIR, conforme a entrevista), C = consultado, I = informado
ACTORS = ['Interessado', 'AGIR', 'Outras unidades da UFF', 'INPI', 'Cotitulares externos']
RACI = [
    ['R', 'A', '–', '–', '–'],
    ['C, I', 'R, A', '–', '–', '–'],
    ['R', 'R, A', '–', '–', '–'],
    ['–', 'R, A', '–', 'I', '–'],
    ['C', 'R, A', '–', 'I', '–'],
    ['I', 'R, A', 'I', 'R', '–'],
    ['–', 'R, A', 'R', '–', 'R, I'],
]

L = []
w = L.append
w('# Macroprocesso – Registro de Programa de Computador (Software) – AGIR/UFF (AS-IS)\n')
w('**Escopo:** estado atual (AS-IS), sem TO-BE e sem melhorias. Os diagramas e este documento derivam do mesmo '
  'modelo (`fontes/registro-software-asis.json`) e das respostas da entrevista de 26/11/2026.\n')
w('**Representação:** diagramas em preto e branco. Cada etapa termina numa única saída de continuidade '
  '("Saída → Etapa N: resultado"), e a etapa seguinte começa pela entrada de mesmo nome ("Entrada ← Etapa M: resultado"). '
  'As atividades novas em relação ao modelo original (PROPPI v08) estão marcadas como "nova" na fonte.\n')

w('## 1. Arquitetura de processos\n')
w('```')
w('Nível 1 – Macroprocesso: Gestão da Propriedade Intelectual (AGIR / PROPPI)')
w('└── Nível 2 – Processo: Registro de Propriedade Intelectual')
w('    │        (patentes, marcas, desenhos industriais e programas de computador – modelo PROPPI v08)')
w('    └── Nível 3 – Subprocesso: Registro de Programa de Computador (Software)   → macro/00-macro.bpmn')
for i, s in enumerate(stages, 1):
    branch = '└──' if i == len(stages) else '├──'
    w(f'        {branch} Nível 4 – {s["name"]}   → etapas/{s["file"]}.bpmn')
w('```')
w('Os demais tipos de ativo do Nível 2 (patentes, marcas e desenhos industriais) estão **fora do escopo** deste trabalho.\n')
w('### Nível 5 – Atividades por etapa\n')
for s in stages:
    w(f'**{s["name"]}**')
    for a in s['acts']:
        lane = s['lanes'].get(a.get('lane'), '')
        w(f'- {a["name"]} — *{lane}*{STATUS.get(a.get("status"), "")}')
    w('')

w('## 2. Mapa das etapas\n')
w('| Etapa | Objetivo | Evento de início | Eventos de fim | Participantes | Diagrama |')
w('|---|---|---|---|---|---|')
for s, obj in zip(stages, OBJ):
    parts = ', '.join(list(s['lanes'].values()) + s['others'])
    w(f'| {s["name"]} | {obj} | {"; ".join(s["starts"])} | {"; ".join(s["ends"])} | {parts} | [{s["file"]}.bpmn](../etapas/{s["file"]}.bpmn) |')
w('\nNo **macroprocesso** ([00-macro.bpmn](../macro/00-macro.bpmn)), cada etapa é uma *call activity* que chama o processo da etapa. '
  'Há dois pontos de decisão: **"Ativo apto?"** após a Etapa 2 (encerramento na avaliação) e **"Resultado do INPI"** '
  'após a Etapa 6 (730 segue para a Etapa 7; 742 encerra o processo). O INPI aparece como pool caixa-preta, '
  'que recebe o pedido (Etapa 5) e publica o resultado na RPI (Etapa 6).\n')

w('## 3. SIPOC por etapa\n')
for s, (sup, inp, out, cli) in zip(stages, SIPOC):
    w(f'### {s["name"]}\n')
    w('| S – Fornecedores | I – Entradas | P – Atividades principais | O – Saídas | C – Clientes |')
    w('|---|---|---|---|---|')
    proc = '<br>'.join(f'{i}. {a["name"]}' for i, a in enumerate(s['acts'], 1))
    w(f'| {sup} | {inp} | {proc} | {out} | {cli} |\n')

w('## 4. Matriz RACI\n')
w('R = executa • A = aprova/responde pelo resultado (sempre a AGIR, conforme a entrevista) • C = consultado • I = informado\n')
w('| Etapa | ' + ' | '.join(ACTORS) + ' |')
w('|---|' + '---|' * len(ACTORS))
for s, row in zip(stages, RACI):
    w(f'| {s["name"]} | ' + ' | '.join(row) + ' |')
w('\n**Observações:**')
w('- Etapa 2: o interessado é consultado na reunião de avaliação e informado da decisão por e-mail.')
w('- Etapa 4: o pagamento da GRU é feito internamente pela própria AGIR (dentro do "Subprocesso de Pagamento de Despesa com Registro e Manutenção de PI").')
w('- Etapa 6: o INPI executa a validação automática e as publicações na RPI.')
w('- Etapa 7: "Outras unidades da UFF" reúne CAP/SAEP e DAC/CCONT (registros), PROGER (parecer jurídico) e Reitoria (assinatura). Os cotitulares externos assinam o contrato e são orientados sobre o cadastro no SEI.\n')

w('## 5. Decisões da entrevista (26/11/2026)\n')
for item in [
    'Formato: um diagrama por etapa (7) + diagrama macro com raias por responsável e o INPI como participante externo.',
    'Arquitetura: Gestão da PI → Registro de PI → Registro de programa de computador → etapas → atividades.',
    'Aprovação (A) dos despachos e decisões: a própria AGIR.',
    'Pagamento da GRU: feito internamente pela própria AGIR (definido em 26/11, após a entrevista; antes estava como caixa-preta).',
    'Comunicação ao interessado: ocorre nos dois desfechos (730 e 742).',
    'Após o despacho 742: a AGIR encerra o processo.',
    'Declaração de Veracidade: baixada e assinada depois do pagamento, por representante da AGIR com e-CNPJ da UFF e procuração.',
    'e-INPI/e-Software: acesso com o cadastro da UFF.',
    'Contrato de Ajuste: assinam AGIR, Reitoria e cotitulares externos (usuários externos do SEI); a AGIR encerra só depois de todas as assinaturas.',
]:
    w(f'- {item}')
w('\n## 6. Lacunas restantes\n')
w('Nenhuma. O último ponto em aberto (quem paga a GRU) foi definido: a própria AGIR, internamente. '
  'Os passos internos do pagamento (meio de pagamento, autorização etc.) não foram descritos e, por isso, o subprocesso '
  'contém uma única atividade, "Efetuar o pagamento da GRU". Se houver passos relevantes, eles podem ser detalhados ali.')

(PROC / 'docs/macroprocesso-registro-software.md').write_text('\n'.join(L) + '\n')
print('ok:', PROC / 'docs/macroprocesso-registro-software.md')
