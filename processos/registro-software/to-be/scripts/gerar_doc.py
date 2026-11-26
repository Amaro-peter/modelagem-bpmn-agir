"""Gera to-be/docs/to-be-registro-software.md a partir dos modelos TO-BE (e AS-IS, para o comparativo).

Listas de automações, atividades humanas, exceções e o comparativo vêm dos JSONs (fonte única);
as análises (gargalos, sistemas, aderência, KPIs, requisitos) são texto escrito a partir das decisões
da entrevista de 26/11/2026.
Uso: python3 -I processos/registro-software/to-be/scripts/gerar_doc.py
"""
import json
from pathlib import Path

TB = Path(__file__).resolve().parent.parent            # processos/registro-software/to-be
ASIS = TB.parent / 'fontes' / 'etapas'
src = json.loads((TB / 'fontes' / 'registro-software-tobe.json').read_text())
main = next(p for p in src['pools'] if p['id'] == 'Pool_PROPPI')
nodes = {n['id']: n for n in main['nodes']}
lanes = {l['id']: l['name'] for l in main['lanes']}
etapas = {e['n']: e for e in src['etapas']}
ACT = {'task', 'user', 'service', 'send', 'receive', 'manual', 'script', 'business', 'subprocess', 'call'}
acts = [n for n in main['nodes'] if n['type'] in ACT]
auto = [n for n in acts if n['lane'] == 'L_PLAT']
human = [n for n in acts if n['lane'] != 'L_PLAT']


def asis_count(k):
    f = sorted(ASIS.glob(f'0{k}-*.json'))[0]
    d = json.loads(f.read_text())
    p = next(p for p in d['pools'] if p['id'] == 'Pool_PROPPI')
    a = [n for n in p['nodes'] if n['type'] in ACT]
    return len(a)


L = []
w = L.append
w('# TO-BE – Registro de Programa de Computador (Software) – AGIR/UFF\n')
w('Modelo do **estado futuro** do processo, elaborado a partir do diagnóstico AS-IS e das entrevistas com o dono e os sponsors '
  'do processo (26/11/2026). Ele usa o investimento previsto do **Novo PAC** em tecnologia **sem substituir o SEI** e **sem ampliar a equipe**.\n')
w('**Legenda:**')
w('- 🟩 verde = atividade nova ou alterada em relação ao AS-IS;')
w('- sem cor = mantida igual ao AS-IS;')
w('- raia lilás = **Plataforma de Gestão de PI** (atividades automáticas);')
w('- eventos com envelope = notificações automáticas ao interessado ou à equipe;')
w('- pool azul = INPI; pool cinza = SEI (registro oficial).\n')

w('## 1. Diagramas\n')
w('| Vista | Arquivo |')
w('|---|---|')
w('| TO-BE completo | [registro-software-tobe.bpmn](../registro-software-tobe.bpmn) · [imagem](../registro-software-tobe.png) |')
w('| Macroprocesso | [00-macro.bpmn](../macro/00-macro.bpmn) · [imagem](../macro/00-macro.png) |')
for k, e in sorted(etapas.items()):
    f = f'{k:02d}-{e["slug"]}'
    w(f'| Etapa {k} – {e["nome"]} | [{f}.bpmn](../etapas/{f}.bpmn) · [imagem](../etapas/{f}.png) |')
w('\n**Participantes:**')
w('- **Interessado**, que passa a usar o portal.')
w('- **AGIR (servidores e bolsistas)**, numa raia só. A divisão "bolsista opera, servidor decide" está registrada em cada tarefa e aparece na tabela da seção 4.')
w('- **Outras unidades da UFF** cuidam dos registros patrimonial e contábil, do parecer jurídico e da assinatura da Reitoria.')
w('- **Plataforma de Gestão de PI** executa as atividades automáticas.')
w('- **Participantes externos:**')
w('  - **INPI** (e-INPI/GRU, e-Software, RPI, Busca Web, "Meus Pedidos", Fale Conosco);')
w('  - **SEI** (registro oficial: as mensagens representam a integração automática; tarefas humanas feitas no SEI trazem "(SEI)" no nome);')
w('  - **Cotitulares externos**.\n')

w('## 2. Gargalos do AS-IS × melhorias do TO-BE\n')
w('| Gargalo (AS-IS) | O que muda no TO-BE | Onde está no modelo |')
w('|---|---|---|')
for g in [
    ('3.1 Demora no atendimento inicial e no agendamento da reunião',
     'O registro é automático e o interessado recebe o protocolo e a notificação na hora. A solicitação vai para uma fila com prazo de triagem; o atraso alerta a equipe e o servidor. O interessado escolhe o horário da reunião no portal, com convite e lembrete automáticos.',
     'Etapa 1 (registro, notificação, fila, evento de borda "Prazo de triagem vencido"); Etapa 2 (autoagendamento, confirmação, lembrete)'),
    ('3.2 E-mails perdidos e controle na memória das pessoas',
     'Toda comunicação passa pela plataforma (portal + e-mail automático) e fica no histórico do pedido. Pendências têm dono e prazo, com lembretes e escalonamento. Nada depende de caixa de e-mail pessoal.',
     'Raia da Plataforma (notificações, lembretes e alertas, como tarefas ou eventos de mensagem); eventos de borda de lembrete e de 30 dias'),
    ('3.3 Falta de acompanhamento sistemático no INPI',
     'Monitoramento individual de cada pedido: leitura semanal da RPI, leitura dos e-mails "Meus Pedidos", janela parametrizável (10 dias alerta o bolsista, 15 dias escala ao servidor) e registro de cada consulta.',
     'Etapa 6 (gateway de eventos "Aguardar novidade" e seus três gatilhos)'),
    ('3.4 Interpretação das informações enviadas pelo interessado',
     'Formulário estruturado com campos obrigatórios, orientações, validação automática (formatos, CPF, coerência) e hash calculado no navegador. Inconsistências voltam com apontamentos objetivos.',
     'Etapa 3 (formulário, hash e validação automática, pendências apontadas no portal)'),
    ('3.5 Erros de preenchimento no e-Software',
     'Ficha de preenchimento gerada da versão aprovada pelo interessado. O bolsista preenche e confere campo a campo, e o servidor valida antes de enviar. É uma dupla conferência que não depende de API do INPI.',
     'Etapa 3 (aceite eletrônico e versão aprovada); Etapa 5 (ficha, conferência, validação final)'),
    ('3.6 Demora na comunicação do andamento',
     'Notificações automáticas em cada mudança de situação (recebimento, agendamento, pendências, aprovação dos dados, protocolo, decisão do INPI, correção, certificado), além do painel no portal.',
     'Notificações automáticas da Plataforma (tarefas e eventos de mensagem) em todas as etapas'),
    ('3.7 Certificados com erro e correções posteriores',
     'Antes do protocolo: validação automática, conferência humana, aceite do interessado e validação final. Depois da emissão: comparação automática do certificado com a versão aprovada e validação do servidor. Em caso de divergência, a correção segue a origem do erro (serviço 747 se veio dos dados da AGIR, Fale Conosco se o erro é do INPI).',
     'Etapas 3 e 5 (prevenção); Etapa 6 ("Comparar o certificado com a versão aprovada", "Pedir a correção ao INPI")'),
]:
    w(f'| {g[0]} | {g[1]} | {g[2]} |')

w('\n## 3. Sistemas envolvidos\n')
w('### Existentes (mantidos)')
w('| Sistema | Papel no TO-BE | Viabilidade |')
w('|---|---|---|')
w('| **SEI** | Continua sendo o registro oficial: processo, despachos, documentos, comprovantes, recibo e certificado | Obrigatório. A integração automática usa os Web Services do SEI (`gerarProcedimento`, `incluirDocumento`), que dependem de **cadastro do sistema pela administração do SEI/STI**. Enquanto não houver aprovação, ou se a integração falhar, o bolsista faz o lançamento manual (contingência modelada) |')
w('| **e-INPI / GRU** | Emissão da GRU 730 com o cadastro da UFF | Uso manual pelo bolsista; se estiver fora do ar, há nova tentativa com timer |')
w('| **e-Software** | Pedido de registro | **Sem API pública confirmada.** Por isso o preenchimento é assistido (ficha + conferência), e não automatizado |')
w('| **RPI** (Revista da Propriedade Industrial) | Fonte das decisões (730/742) | Publicada semanalmente (terças), com a seção de Programas de Computador em PDF. A leitura automática de PDF é viável; se o formato mudar, o prazo de 10 dias aciona a consulta manual |')
w('| **"Meus Pedidos"** (INPI) | Aviso por e-mail a cada despacho | Previsto no Manual do INPI. Exige cadastrar cada pedido com o login da UFF e direcionar os e-mails para uma caixa institucional lida pela plataforma |')
w('| **Busca Web** (INPI) | Consulta do pedido e download do certificado | Uso manual pelo bolsista (exige login) |')
w('| **E-mail institucional** | Canal de saída das notificações automáticas | A plataforma envia por um remetente institucional (não pessoal) |')
w('\n### Nova solução: Plataforma de Gestão de PI da AGIR (sob medida, Novo PAC)')
w('| Módulo | Funções | Gargalos |')
w('|---|---|---|')
for m in [
    ('Portal do interessado', 'Solicitação e formulário estruturados, anexos, aceite eletrônico, painel de acompanhamento', '3.1, 3.4, 3.6'),
    ('Formulários e validação', 'Campos obrigatórios, orientações, validação de CPF e formatos, coerência entre autores, titulares e documentos, hash SHA-512 no navegador (Web Crypto)', '3.4, 3.5, 3.7'),
    ('Fila, prazos e tarefas', 'Distribuição, prazos parametrizáveis, lembretes, escalonamento, regra de inatividade (5 e 10 dias úteis; 30 dias)', '3.1, 3.2'),
    ('Agenda', 'Oferta de horários livres da equipe, autoagendamento, convite e lembrete na véspera', '3.1, 3.2'),
    ('Notificações e histórico', 'Mensagens automáticas (portal + e-mail) e histórico único por pedido', '3.2, 3.6'),
    ('Integração com o SEI', 'Abertura de processo e inclusão de documentos via Web Services, com fila de contingência manual', 'continuidade administrativa'),
    ('Apoio ao protocolo', 'Versão aprovada (congelada) dos dados, ficha de preenchimento do e-Software, checklist de conferência dupla', '3.5, 3.7'),
    ('Monitoramento do INPI', 'Número e data de cada pedido, leitura da RPI semanal, leitura dos e-mails "Meus Pedidos", janelas 10/15 dias, registro de consultas', '3.3, 3.6'),
    ('Conferência do certificado', 'Extração dos dados do certificado (PDF) e comparação com a versão aprovada', '3.7'),
    ('Painel e indicadores', 'Situação dos pedidos, pendências e KPIs da seção 8', 'todos'),
]:
    w(f'| {m[0]} | {m[1]} | {m[2]} |')

w('\n## 4. Automação × atividades humanas\n')
w(f'O TO-BE tem **{len(acts)} atividades**: **{len(auto)} automáticas** (Plataforma) e **{len(human)} humanas**.\n')
w('### Atividades automatizadas (raia da Plataforma)')
w('| Etapa | Atividade | Tipo |')
w('|---|---|---|')
for n in auto:
    w(f'| {n["etapa"]} | {n["name"]} | {"envio (send)" if n["type"] == "send" else "serviço (service)"} |')
w('\n**Por que essas atividades foram automatizadas:**')
w('- Todas são repetitivas e baseadas em regras: registrar, notificar, lembrar, controlar prazos, validar formatos e coerência, gerar documentos, ler publicações e comparar dados.')
w('- Hoje elas dependem da memória e da caixa de e-mail de cada pessoa, que é a origem dos gargalos 3.1 a 3.3 e 3.6.')
w('- Nenhuma delas toma decisão administrativa.\n')
w('### Atividades mantidas sob responsabilidade humana')
for role in ['L_INT', 'L_UFF']:
    items = [n for n in human if n['lane'] == role]
    if items:
        w(f'**{lanes[role]}** ({len(items)}): ' + '; '.join(dict.fromkeys(n['name'] for n in items)) + '.\n')
agir = [n for n in human if n['lane'] == 'L_AGIR']
w(f'**{lanes["L_AGIR"]}** ({len(agir)}). Quem faz o quê:\n')
w('| Etapa | Atividade | Papel |')
w('|---|---|---|')
for n in agir:
    w(f'| {n["etapa"]} | {n["name"]} | {n.get("papel", "–")} |')
w('')
w('**Por que essas atividades continuam com pessoas:**')
w('- Decisões institucionais (triagem, avaliação do ativo, arquivamento, validação final do pedido e do certificado), atos oficiais no SEI, assinatura da DV com certificado ICP-Brasil e o pagamento exigem responsabilidade de servidor.')
w('- O envio ao INPI continua humano: não há API, e a responsabilidade é da AGIR.')
w('- O interessado mantém o que só ele pode fazer: fornecer os dados e confirmá-los.')
w('- **Nenhuma decisão foi transferida para a plataforma:** os gateways de decisão humana ("Atende aos requisitos?", "Avaliação positiva?", "Arquivar?", "Preenchimento correto?") ficam na raia da AGIR, e a origem de um erro no certificado é avaliada pela equipe em "Pedir a correção ao INPI". Os gateways da plataforma só verificam fatos objetivos (validação de formato, integração ok, publicação encontrada, divergência encontrada).\n')

w('## 5. Tratamento de exceções\n')
w('| Exceção | Mecanismo no modelo | Recuperação |')
w('|---|---|---|')
for x in [
    ('Interessado não responde (horário, formulário, aceite)', 'Eventos de borda: lembretes automáticos (5 e 10 dias úteis, não interruptivo) e "30 dias sem resposta" (interruptivo). No aceite, a mesma regra vem indicada em anotação', 'O servidor decide **arquivar** (despacho no SEI + notificação) ou **prorrogar** (volta à mesma atividade)'),
    ('Interessado não comparece à reunião', 'Gateway "Interessado compareceu?" + link "Oferecer novos horários"', 'Novos horários são oferecidos'),
    ('Documentação incompleta ou inconsistente', 'Validação automática ("Dados consistentes?") e conferência do bolsista ("Conferência ok?")', 'Pendências apontadas no portal e volta ao formulário'),
    ('Dados não confirmados pelo interessado', 'Gateway "Dados confirmados?"', 'Volta ao formulário para ajuste'),
    ('Erro de preenchimento no e-Software', 'Validação final do servidor ("Preenchimento correto?")', 'Devolução ao bolsista com apontamentos, antes de enviar'),
    ('SEI indisponível ou integração não aprovada', 'Evento de borda de erro "Falha na integração com o SEI" (Etapa 1); vale a mesma regra nas demais inclusões no SEI', 'Contingência: o bolsista lança no SEI e vincula o número na plataforma'),
    ('e-INPI indisponível', 'Evento de borda de erro "e-INPI indisponível" + timer "Nova tentativa"', 'Novas tentativas em intervalo parametrizável'),
    ('Triagem atrasada', 'Evento de borda "Prazo de triagem vencido" (não interruptivo)', 'Alerta à equipe e ao servidor'),
    ('INPI sem novidade no prazo', 'Timer "10 dias sem novidade (15: escala)" no gateway de eventos', 'Com 10 dias, consulta do bolsista no Busca Web; com 15 dias, escala ao servidor'),
    ('Pedido não conhecido (742)', 'Ramo "742" do gateway "Despacho"', 'Encerramento com despacho e comunicação ao interessado (conforme o AS-IS confirmado)'),
    ('Certificado com divergência', 'Comparação automática + "Pedir a correção ao INPI"', 'Serviço 747 (dados da AGIR) ou Fale Conosco (erro do INPI). O interessado é notificado e o acompanhamento continua até o certificado corrigido'),
]:
    w(f'| {x[0]} | {x[1]} | {x[2]} |')

w('\n## 6. Aderência às restrições institucionais\n')
w('| Restrição | Como o TO-BE atende |')
w('|---|---|')
w('| SEI obrigatório | O SEI continua como registro oficial em todas as etapas: abertura, documentos, comprovante, recibo, certificado e despachos. A plataforma **espelha** no SEI e não o substitui; se a integração falhar, há caminho manual |')
w('| Sem ampliação da equipe | A AGIR atua com os mesmos servidores e bolsistas de hoje. As tarefas de controle (prazos, lembretes, notificações, consultas periódicas, conferências mecânicas) passam para a plataforma, liberando a equipe para as decisões |')
w('| Investimento em tecnologia | Plataforma sob medida financiada pelo Novo PAC (seção 3), com módulos ligados a cada gargalo |')
w('| Exigências legais e do INPI preservadas | Nenhuma etapa obrigatória foi removida: GRU paga antes do pedido, DV assinada com ICP-Brasil (e-CNPJ da UFF com procuração), protocolo no e-Software, despachos no SEI, registros patrimonial e contábil, parecer jurídico e assinaturas do Contrato de Ajuste (Etapa 7 igual ao AS-IS) |')
w('| Responsabilidade da AGIR | Decisões e validações ficam nas raias de servidor e bolsista (seção 4) |')
w('| Sem integrações presumidas | Sem API do INPI e sem robô no e-Software. A integração com o SEI vem marcada como dependente da STI e tem contingência. A RPI e o "Meus Pedidos" são canais públicos e documentados |')

w('\n## 7. Comparativo AS-IS × TO-BE por etapa\n')
w('| Etapa TO-BE | Etapa AS-IS correspondente | Atividades AS-IS | Atividades TO-BE | Automáticas no TO-BE |')
w('|---|---|---|---|---|')
asis_names = ['Abertura do pedido', 'Avaliação do ativo', 'Instrução documental', 'Pagamento da GRU',
              'Depósito do pedido no INPI', 'Resultado do INPI', 'Registros internos e cotitularidade']
for k, e in sorted(etapas.items()):
    ta = [n for n in acts if n['etapa'] == k]
    au = [n for n in ta if n['lane'] == 'L_PLAT']
    w(f'| {k}. {e["nome"]} | {k}. {asis_names[k - 1]} | {asis_count(k)} | {len(ta)} | {len(au)} |')
tot_asis = sum(asis_count(k) for k in etapas)
w(f'\n**Total:** {tot_asis} atividades no AS-IS, todas manuais, contra {len(acts)} no TO-BE, das quais **{len(human)} humanas** '
  f'e **{len(auto)} automáticas**. As notificações automáticas aparecem como eventos de mensagem e não entram na contagem. '
  'O TO-BE fica praticamente do mesmo tamanho do AS-IS e ganha controles que hoje não existem: prazos, lembretes, '
  'validação automática, aceite do interessado, conferência do certificado e acompanhamento do INPI. '
  'Para a equipe, o ganho está em deixar de controlar prazos, e-mails e consultas manualmente, e em ter menos retrabalho '
  '(correções de dados e de certificados).\n')

w('## 8. Indicadores de desempenho (sem metas)\n')
w('As metas ficam a cargo da AGIR. Todos os indicadores podem ser medidos pela plataforma a partir do histórico de cada pedido.\n')
w('| Indicador | Gargalo |')
w('|---|---|')
for kpi in [
    ('Tempo entre a solicitação e o primeiro contato (notificação + triagem concluída)', '3.1'),
    ('Tempo entre a triagem e a reunião inicial realizada', '3.1'),
    ('Solicitações e pendências com prazo vencido (sem tratamento)', '3.2'),
    ('Ciclos de correção por pedido (pendências apontadas + pedidos de correção)', '3.4'),
    ('Pedidos devolvidos na validação final antes do envio', '3.5'),
    ('Tempo entre o protocolo e a decisão do INPI; pedidos acima de 10 e 15 dias sem atualização', '3.3'),
    ('Tempo entre a publicação na RPI e a comunicação ao interessado', '3.6'),
    ('Certificados com divergência e tipo de correção (747 ou Fale Conosco)', '3.7'),
    ('Taxa de arquivamento por falta de resposta', '3.2'),
    ('Taxa de uso da contingência manual do SEI (falhas de integração)', 'continuidade'),
]:
    w(f'| {kpi[0]} | {kpi[1]} |')

w('\n## 9. Requisitos de referência para a especificação da plataforma\n')
reqs = [
    'Portal com autenticação do interessado, formulários estruturados (campos obrigatórios, orientações contextuais, padronização de autoria e titularidade) e painel de acompanhamento.',
    'Validação automática de CPF, formatos, documentos anexados e coerência entre autores, titulares e documentos.',
    'Cálculo do hash SHA-512 no navegador do interessado, sem envio do código-fonte, com registro do hash e do algoritmo.',
    'Aceite eletrônico dos dados pelo interessado e versionamento, com congelamento da versão aprovada.',
    'Fila de solicitações com prazos parametrizáveis, distribuição, alertas e escalonamento ao servidor.',
    'Regras de inatividade parametrizáveis (lembretes em dias úteis e prazo de arquivamento com decisão humana).',
    'Agenda integrada à da equipe, com autoagendamento, convite de calendário e lembretes.',
    'Notificações automáticas (portal + e-mail institucional) com modelos padronizados e registro no histórico.',
    'Integração com o SEI por Web Services (gerar processo e incluir documentos), com fila de contingência manual e registro do número do processo.',
    'Geração da ficha de preenchimento do e-Software e checklist de conferência campo a campo, com validação final do servidor.',
    'Registro do número e da data do pedido, com janelas de acompanhamento parametrizáveis (padrão: 10 e 15 dias).',
    'Leitura automática da RPI semanal (seção Programa de Computador) e dos e-mails "Meus Pedidos" de uma caixa institucional.',
    'Extração dos dados do certificado (PDF) e comparação com a versão aprovada, destacando as divergências.',
    'Trilha de auditoria de todas as ações (quem, quando, o quê) e painel de indicadores.',
    'Requisitos não funcionais: LGPD (dados pessoais de autores e titulares), controle de acesso por papel (interessado, bolsista, servidor), disponibilidade e backup.',
]
for i, r in enumerate(reqs, 1):
    w(f'{i}. {r}')

w('\n## 10. Pontos que dependem de validação antes da implantação\n')
w('1. **Web Services do SEI**: aprovação e cadastro do sistema pela administração do SEI/STI da UFF. Sem isso, a contingência manual vira o caminho padrão.')
w('2. **Leitura da RPI**: confirmar a estabilidade do formato da seção de Programas de Computador (PDF semanal).')
w('3. **"Meus Pedidos"**: cadastrar os pedidos com o login da UFF e direcionar os e-mails para a caixa institucional lida pela plataforma.')
w('4. **Integração com a agenda** da equipe: depende da ferramenta de calendário institucional.')
w('5. **Prazos e parâmetros**: os valores de 2 dias (triagem), 5 e 10 dias úteis (lembretes), 30 dias (inatividade), 24 h (compensação) e 10/15 dias (INPI) são padrões ajustáveis. O prazo de triagem de 2 dias é uma sugestão inicial a ser calibrada pela AGIR.')

w('\n## 11. Checklist de qualidade (seção 8 do enunciado)\n')
for c in [
    'Os sete gargalos estão endereçados (seção 2).',
    'A dependência de e-mails individuais e controles manuais foi reduzida: as comunicações e os prazos estão na plataforma.',
    'Nenhuma solicitação fica sem responsável ou acompanhamento: fila com prazo, lembretes, inatividade com decisão do servidor.',
    'Os prazos do INPI são controlados sistematicamente (Etapa 6).',
    'As informações são estruturadas e validadas antes do protocolo (Etapas 3 e 5).',
    'Há mecanismos contra erros de preenchimento e de certificado (Etapas 3, 5 e 6).',
    'O interessado recebe atualizações tempestivas (notificações em cada mudança de situação).',
    'O SEI continua integrado como instrumento oficial (seção 6).',
    'As soluções tecnológicas são compatíveis com as restrições (seções 3 e 6).',
    'O modelo BPMN passa no bpmnlint sem problemas e na checagem de consistência (início alcança fim, raias, rótulos, mensagens).',
]:
    w(f'- [x] {c}')

out = TB / 'docs' / 'to-be-registro-software.md'
out.write_text('\n'.join(L) + '\n')
print('ok:', out)
