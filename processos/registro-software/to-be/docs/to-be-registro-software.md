# TO-BE – Registro de Programa de Computador (Software) – AGIR/UFF

Modelo do **estado futuro** do processo, elaborado a partir do diagnóstico AS-IS e das entrevistas com o dono e os sponsors do processo (26/11/2026). Ele usa o investimento previsto do **Novo PAC** em tecnologia **sem substituir o SEI** e **sem ampliar a equipe**.

**Legenda:**
- 🟩 verde = atividade nova ou alterada em relação ao AS-IS;
- sem cor = mantida igual ao AS-IS;
- raia lilás = **Plataforma de Gestão de PI** (atividades automáticas);
- eventos com envelope = notificações automáticas ao interessado ou à equipe;
- pool azul = INPI; pool cinza = SEI (registro oficial).

## 1. Diagramas

| Vista | Arquivo |
|---|---|
| TO-BE completo | [registro-software-tobe.bpmn](../registro-software-tobe.bpmn) · [imagem](../registro-software-tobe.png) |
| Macroprocesso | [00-macro.bpmn](../macro/00-macro.bpmn) · [imagem](../macro/00-macro.png) |
| Etapa 1 – Solicitação e triagem | [01-solicitacao-triagem.bpmn](../etapas/01-solicitacao-triagem.bpmn) · [imagem](../etapas/01-solicitacao-triagem.png) |
| Etapa 2 – Reunião inicial e avaliação | [02-reuniao-avaliacao.bpmn](../etapas/02-reuniao-avaliacao.bpmn) · [imagem](../etapas/02-reuniao-avaliacao.png) |
| Etapa 3 – Coleta estruturada e validação | [03-coleta-validacao.bpmn](../etapas/03-coleta-validacao.bpmn) · [imagem](../etapas/03-coleta-validacao.png) |
| Etapa 4 – Pagamento da GRU | [04-pagamento.bpmn](../etapas/04-pagamento.bpmn) · [imagem](../etapas/04-pagamento.png) |
| Etapa 5 – Protocolo assistido no INPI | [05-protocolo.bpmn](../etapas/05-protocolo.bpmn) · [imagem](../etapas/05-protocolo.png) |
| Etapa 6 – Acompanhamento do INPI e conferência do certificado | [06-acompanhamento-certificado.bpmn](../etapas/06-acompanhamento-certificado.bpmn) · [imagem](../etapas/06-acompanhamento-certificado.png) |
| Etapa 7 – Registros internos, cotitularidade e encerramento | [07-registros-encerramento.bpmn](../etapas/07-registros-encerramento.bpmn) · [imagem](../etapas/07-registros-encerramento.png) |

**Participantes:**
- **Interessado**, que passa a usar o portal.
- **AGIR (servidores e bolsistas)**, numa raia só. A divisão "bolsista opera, servidor decide" está registrada em cada tarefa e aparece na tabela da seção 4.
- **Outras unidades da UFF** cuidam dos registros patrimonial e contábil, do parecer jurídico e da assinatura da Reitoria.
- **Plataforma de Gestão de PI** executa as atividades automáticas.
- **Participantes externos:**
  - **INPI** (e-INPI/GRU, e-Software, RPI, Busca Web, "Meus Pedidos", Fale Conosco);
  - **SEI** (registro oficial: as mensagens representam a integração automática; tarefas humanas feitas no SEI trazem "(SEI)" no nome);
  - **Cotitulares externos**.

## 2. Gargalos do AS-IS × melhorias do TO-BE

| Gargalo (AS-IS) | O que muda no TO-BE | Onde está no modelo |
|---|---|---|
| 3.1 Demora no atendimento inicial e no agendamento da reunião | O registro é automático e o interessado recebe o protocolo e a notificação na hora. A solicitação vai para uma fila com prazo de triagem; o atraso alerta a equipe e o servidor. O interessado escolhe o horário da reunião no portal, com convite e lembrete automáticos. | Etapa 1 (registro, notificação, fila, evento de borda "Prazo de triagem vencido"); Etapa 2 (autoagendamento, confirmação, lembrete) |
| 3.2 E-mails perdidos e controle na memória das pessoas | Toda comunicação passa pela plataforma (portal + e-mail automático) e fica no histórico do pedido. Pendências têm dono e prazo, com lembretes e escalonamento. Nada depende de caixa de e-mail pessoal. | Raia da Plataforma (notificações, lembretes e alertas, como tarefas ou eventos de mensagem); eventos de borda de lembrete e de 30 dias |
| 3.3 Falta de acompanhamento sistemático no INPI | Monitoramento individual de cada pedido: leitura semanal da RPI, leitura dos e-mails "Meus Pedidos", janela parametrizável (10 dias alerta o bolsista, 15 dias escala ao servidor) e registro de cada consulta. | Etapa 6 (gateway de eventos "Aguardar novidade" e seus três gatilhos) |
| 3.4 Interpretação das informações enviadas pelo interessado | Formulário estruturado com campos obrigatórios, orientações, validação automática (formatos, CPF, coerência) e hash calculado no navegador. Inconsistências voltam com apontamentos objetivos. | Etapa 3 (formulário, hash e validação automática, pendências apontadas no portal) |
| 3.5 Erros de preenchimento no e-Software | Ficha de preenchimento gerada da versão aprovada pelo interessado. O bolsista preenche e confere campo a campo, e o servidor valida antes de enviar. É uma dupla conferência que não depende de API do INPI. | Etapa 3 (aceite eletrônico e versão aprovada); Etapa 5 (ficha, conferência, validação final) |
| 3.6 Demora na comunicação do andamento | Notificações automáticas em cada mudança de situação (recebimento, agendamento, pendências, aprovação dos dados, protocolo, decisão do INPI, correção, certificado), além do painel no portal. | Notificações automáticas da Plataforma (tarefas e eventos de mensagem) em todas as etapas |
| 3.7 Certificados com erro e correções posteriores | Antes do protocolo: validação automática, conferência humana, aceite do interessado e validação final. Depois da emissão: comparação automática do certificado com a versão aprovada e validação do servidor. Em caso de divergência, a correção segue a origem do erro (serviço 747 se veio dos dados da AGIR, Fale Conosco se o erro é do INPI). | Etapas 3 e 5 (prevenção); Etapa 6 ("Comparar o certificado com a versão aprovada", "Pedir a correção ao INPI") |

## 3. Sistemas envolvidos

### Existentes (mantidos)
| Sistema | Papel no TO-BE | Viabilidade |
|---|---|---|
| **SEI** | Continua sendo o registro oficial: processo, despachos, documentos, comprovantes, recibo e certificado | Obrigatório. A integração automática usa os Web Services do SEI (`gerarProcedimento`, `incluirDocumento`), que dependem de **cadastro do sistema pela administração do SEI/STI**. Enquanto não houver aprovação, ou se a integração falhar, o bolsista faz o lançamento manual (contingência modelada) |
| **e-INPI / GRU** | Emissão da GRU 730 com o cadastro da UFF | Uso manual pelo bolsista; se estiver fora do ar, há nova tentativa com timer |
| **e-Software** | Pedido de registro | **Sem API pública confirmada.** Por isso o preenchimento é assistido (ficha + conferência), e não automatizado |
| **RPI** (Revista da Propriedade Industrial) | Fonte das decisões (730/742) | Publicada semanalmente (terças), com a seção de Programas de Computador em PDF. A leitura automática de PDF é viável; se o formato mudar, o prazo de 10 dias aciona a consulta manual |
| **"Meus Pedidos"** (INPI) | Aviso por e-mail a cada despacho | Previsto no Manual do INPI. Exige cadastrar cada pedido com o login da UFF e direcionar os e-mails para uma caixa institucional lida pela plataforma |
| **Busca Web** (INPI) | Consulta do pedido e download do certificado | Uso manual pelo bolsista (exige login) |
| **E-mail institucional** | Canal de saída das notificações automáticas | A plataforma envia por um remetente institucional (não pessoal) |

### Nova solução: Plataforma de Gestão de PI da AGIR (sob medida, Novo PAC)
| Módulo | Funções | Gargalos |
|---|---|---|
| Portal do interessado | Solicitação e formulário estruturados, anexos, aceite eletrônico, painel de acompanhamento | 3.1, 3.4, 3.6 |
| Formulários e validação | Campos obrigatórios, orientações, validação de CPF e formatos, coerência entre autores, titulares e documentos, hash SHA-512 no navegador (Web Crypto) | 3.4, 3.5, 3.7 |
| Fila, prazos e tarefas | Distribuição, prazos parametrizáveis, lembretes, escalonamento, regra de inatividade (5 e 10 dias úteis; 30 dias) | 3.1, 3.2 |
| Agenda | Oferta de horários livres da equipe, autoagendamento, convite e lembrete na véspera | 3.1, 3.2 |
| Notificações e histórico | Mensagens automáticas (portal + e-mail) e histórico único por pedido | 3.2, 3.6 |
| Integração com o SEI | Abertura de processo e inclusão de documentos via Web Services, com fila de contingência manual | continuidade administrativa |
| Apoio ao protocolo | Versão aprovada (congelada) dos dados, ficha de preenchimento do e-Software, checklist de conferência dupla | 3.5, 3.7 |
| Monitoramento do INPI | Número e data de cada pedido, leitura da RPI semanal, leitura dos e-mails "Meus Pedidos", janelas 10/15 dias, registro de consultas | 3.3, 3.6 |
| Conferência do certificado | Extração dos dados do certificado (PDF) e comparação com a versão aprovada | 3.7 |
| Painel e indicadores | Situação dos pedidos, pendências e KPIs da seção 8 | todos |

## 4. Automação × atividades humanas

O TO-BE tem **48 atividades**: **13 automáticas** (Plataforma) e **35 humanas**.

### Atividades automatizadas (raia da Plataforma)
| Etapa | Atividade | Tipo |
|---|---|---|
| 1 | Registrar a solicitação, abrir o processo no SEI e notificar o interessado | serviço (service) |
| 2 | Oferecer ao interessado os horários livres da equipe | envio (send) |
| 2 | Confirmar a reunião (convite e lembrete na véspera) | serviço (service) |
| 3 | Liberar o formulário de registro ao interessado | envio (send) |
| 3 | Calcular o hash SHA-512 no navegador e validar os dados | serviço (service) |
| 3 | Incluir o formulário no SEI e pedir o aceite ao interessado | serviço (service) |
| 3 | Congelar a versão aprovada dos dados e notificar | serviço (service) |
| 4 | Anexar o comprovante de pagamento ao SEI | serviço (service) |
| 5 | Gerar a ficha de preenchimento do e-Software | serviço (service) |
| 5 | Anexar o recibo ao SEI, iniciar o acompanhamento e notificar | serviço (service) |
| 6 | Ler a RPI ou o e-mail e registrar o despacho | serviço (service) |
| 6 | Comparar o certificado com a versão aprovada | serviço (service) |
| 6 | Anexar o certificado ao SEI e enviá-lo ao interessado | serviço (service) |

**Por que essas atividades foram automatizadas:**
- Todas são repetitivas e baseadas em regras: registrar, notificar, lembrar, controlar prazos, validar formatos e coerência, gerar documentos, ler publicações e comparar dados.
- Hoje elas dependem da memória e da caixa de e-mail de cada pessoa, que é a origem dos gargalos 3.1 a 3.3 e 3.6.
- Nenhuma delas toma decisão administrativa.

### Atividades mantidas sob responsabilidade humana
**INTERESSADO (portal)** (4): Enviar a solicitação pelo portal (formulário estruturado); Escolher o horário da reunião no portal; Preencher o formulário de registro e anexar os documentos; Revisar os dados e dar o aceite eletrônico.

**Outras unidades da UFF** (3): Realizar os registros patrimonial e contábil para devolver à AGIR; Emitir parecer jurídico sobre o Contrato de Ajuste e devolver à AGIR; Assinar o Contrato de Ajuste (Reitoria).

**AGIR (servidores e bolsistas)** (28). Quem faz o quê:

| Etapa | Atividade | Papel |
|---|---|---|
| 1 | Abrir o processo no SEI manualmente e vincular (contingência) | bolsista |
| 1 | Fazer a triagem (requisitos iniciais) | bolsista |
| 1 | Assinar o despacho de encerramento (SEI) | servidor |
| 2 | Conduzir a reunião, avaliar o ativo e registrar a ata | servidor (ata: bolsista) |
| 2 | Assinar o despacho de encerramento (SEI) | servidor |
| 2 | Decidir: arquivar (despacho no SEI) ou prorrogar | servidor |
| 3 | Conferir o formulário com os documentos | bolsista |
| 3 | Decidir: arquivar (despacho no SEI) ou prorrogar | servidor |
| 4 | Emitir a GRU 730 no e-INPI (cadastro da UFF) | bolsista |
| 4 | Efetuar o pagamento da GRU | servidor |
| 5 | Baixar e assinar a DV (ICP-Brasil) | bolsista baixa; servidor assina |
| 5 | Preencher o e-Software pela ficha e conferir campo a campo | bolsista |
| 5 | Validar o preenchimento final | servidor |
| 5 | Enviar o pedido ao INPI e registrar o número | servidor |
| 6 | Consultar o pedido no Busca Web e registrar | bolsista (servidor após 15 dias) |
| 6 | Assinar o despacho de encerramento (SEI) | servidor |
| 6 | Baixar o certificado no portal do INPI | bolsista |
| 6 | Pedir a correção ao INPI | bolsista; servidor no serviço 747 |
| 6 | Validar o certificado | servidor |
| 6 | Elaborar despacho de encaminhamento | servidor |
| 7 | Elaborar despacho de encerramento | servidor |
| 7 | Anexar minuta do Contrato de Ajuste de Propriedade Intelectual | servidor |
| 7 | Elaborar despacho de encaminhamento | servidor |
| 7 | Incluir o Contrato de Ajuste de Propriedade Intelectual, de acordo com parecer da PROGER | servidor |
| 7 | Enviar e-mail com orientações sobre o cadastro de usuários externos | servidor |
| 7 | Disponibilizar Contrato de Ajuste de Propriedade Intelectual para assinaturas externas | servidor |
| 7 | Assinar o Contrato de Ajuste (AGIR) | servidor |
| 7 | Elaborar despacho de encerramento | servidor |

**Por que essas atividades continuam com pessoas:**
- Decisões institucionais (triagem, avaliação do ativo, arquivamento, validação final do pedido e do certificado), atos oficiais no SEI, assinatura da DV com certificado ICP-Brasil e o pagamento exigem responsabilidade de servidor.
- O envio ao INPI continua humano: não há API, e a responsabilidade é da AGIR.
- O interessado mantém o que só ele pode fazer: fornecer os dados e confirmá-los.
- **Nenhuma decisão foi transferida para a plataforma:** os gateways de decisão humana ("Atende aos requisitos?", "Avaliação positiva?", "Arquivar?", "Preenchimento correto?") ficam na raia da AGIR, e a origem de um erro no certificado é avaliada pela equipe em "Pedir a correção ao INPI". Os gateways da plataforma só verificam fatos objetivos (validação de formato, integração ok, publicação encontrada, divergência encontrada).

## 5. Tratamento de exceções

| Exceção | Mecanismo no modelo | Recuperação |
|---|---|---|
| Interessado não responde (horário, formulário, aceite) | Eventos de borda: lembretes automáticos (5 e 10 dias úteis, não interruptivo) e "30 dias sem resposta" (interruptivo). No aceite, a mesma regra vem indicada em anotação | O servidor decide **arquivar** (despacho no SEI + notificação) ou **prorrogar** (volta à mesma atividade) |
| Interessado não comparece à reunião | Gateway "Interessado compareceu?" + link "Oferecer novos horários" | Novos horários são oferecidos |
| Documentação incompleta ou inconsistente | Validação automática ("Dados consistentes?") e conferência do bolsista ("Conferência ok?") | Pendências apontadas no portal e volta ao formulário |
| Dados não confirmados pelo interessado | Gateway "Dados confirmados?" | Volta ao formulário para ajuste |
| Erro de preenchimento no e-Software | Validação final do servidor ("Preenchimento correto?") | Devolução ao bolsista com apontamentos, antes de enviar |
| SEI indisponível ou integração não aprovada | Evento de borda de erro "Falha na integração com o SEI" (Etapa 1); vale a mesma regra nas demais inclusões no SEI | Contingência: o bolsista lança no SEI e vincula o número na plataforma |
| e-INPI indisponível | Evento de borda de erro "e-INPI indisponível" + timer "Nova tentativa" | Novas tentativas em intervalo parametrizável |
| Triagem atrasada | Evento de borda "Prazo de triagem vencido" (não interruptivo) | Alerta à equipe e ao servidor |
| INPI sem novidade no prazo | Timer "10 dias sem novidade (15: escala)" no gateway de eventos | Com 10 dias, consulta do bolsista no Busca Web; com 15 dias, escala ao servidor |
| Pedido não conhecido (742) | Ramo "742" do gateway "Despacho" | Encerramento com despacho e comunicação ao interessado (conforme o AS-IS confirmado) |
| Certificado com divergência | Comparação automática + "Pedir a correção ao INPI" | Serviço 747 (dados da AGIR) ou Fale Conosco (erro do INPI). O interessado é notificado e o acompanhamento continua até o certificado corrigido |

## 6. Aderência às restrições institucionais

| Restrição | Como o TO-BE atende |
|---|---|
| SEI obrigatório | O SEI continua como registro oficial em todas as etapas: abertura, documentos, comprovante, recibo, certificado e despachos. A plataforma **espelha** no SEI e não o substitui; se a integração falhar, há caminho manual |
| Sem ampliação da equipe | A AGIR atua com os mesmos servidores e bolsistas de hoje. As tarefas de controle (prazos, lembretes, notificações, consultas periódicas, conferências mecânicas) passam para a plataforma, liberando a equipe para as decisões |
| Investimento em tecnologia | Plataforma sob medida financiada pelo Novo PAC (seção 3), com módulos ligados a cada gargalo |
| Exigências legais e do INPI preservadas | Nenhuma etapa obrigatória foi removida: GRU paga antes do pedido, DV assinada com ICP-Brasil (e-CNPJ da UFF com procuração), protocolo no e-Software, despachos no SEI, registros patrimonial e contábil, parecer jurídico e assinaturas do Contrato de Ajuste (Etapa 7 igual ao AS-IS) |
| Responsabilidade da AGIR | Decisões e validações ficam nas raias de servidor e bolsista (seção 4) |
| Sem integrações presumidas | Sem API do INPI e sem robô no e-Software. A integração com o SEI vem marcada como dependente da STI e tem contingência. A RPI e o "Meus Pedidos" são canais públicos e documentados |

## 7. Comparativo AS-IS × TO-BE por etapa

| Etapa TO-BE | Etapa AS-IS correspondente | Atividades AS-IS | Atividades TO-BE | Automáticas no TO-BE |
|---|---|---|---|---|
| 1. Solicitação e triagem | 1. Abertura do pedido | 4 | 5 | 1 |
| 2. Reunião inicial e avaliação | 2. Avaliação do ativo | 6 | 6 | 2 |
| 3. Coleta estruturada e validação | 3. Instrução documental | 8 | 8 | 4 |
| 4. Pagamento da GRU | 4. Pagamento da GRU | 4 | 3 | 1 |
| 5. Protocolo assistido no INPI | 5. Depósito do pedido no INPI | 7 | 6 | 2 |
| 6. Acompanhamento do INPI e conferência do certificado | 6. Resultado do INPI | 9 | 9 | 3 |
| 7. Registros internos, cotitularidade e encerramento | 7. Registros internos e cotitularidade | 11 | 11 | 0 |

**Total:** 49 atividades no AS-IS, todas manuais, contra 48 no TO-BE, das quais **35 humanas** e **13 automáticas**. As notificações automáticas aparecem como eventos de mensagem e não entram na contagem. O TO-BE fica praticamente do mesmo tamanho do AS-IS e ganha controles que hoje não existem: prazos, lembretes, validação automática, aceite do interessado, conferência do certificado e acompanhamento do INPI. Para a equipe, o ganho está em deixar de controlar prazos, e-mails e consultas manualmente, e em ter menos retrabalho (correções de dados e de certificados).

## 8. Indicadores de desempenho (sem metas)

As metas ficam a cargo da AGIR. Todos os indicadores podem ser medidos pela plataforma a partir do histórico de cada pedido.

| Indicador | Gargalo |
|---|---|
| Tempo entre a solicitação e o primeiro contato (notificação + triagem concluída) | 3.1 |
| Tempo entre a triagem e a reunião inicial realizada | 3.1 |
| Solicitações e pendências com prazo vencido (sem tratamento) | 3.2 |
| Ciclos de correção por pedido (pendências apontadas + pedidos de correção) | 3.4 |
| Pedidos devolvidos na validação final antes do envio | 3.5 |
| Tempo entre o protocolo e a decisão do INPI; pedidos acima de 10 e 15 dias sem atualização | 3.3 |
| Tempo entre a publicação na RPI e a comunicação ao interessado | 3.6 |
| Certificados com divergência e tipo de correção (747 ou Fale Conosco) | 3.7 |
| Taxa de arquivamento por falta de resposta | 3.2 |
| Taxa de uso da contingência manual do SEI (falhas de integração) | continuidade |

## 9. Requisitos de referência para a especificação da plataforma

1. Portal com autenticação do interessado, formulários estruturados (campos obrigatórios, orientações contextuais, padronização de autoria e titularidade) e painel de acompanhamento.
2. Validação automática de CPF, formatos, documentos anexados e coerência entre autores, titulares e documentos.
3. Cálculo do hash SHA-512 no navegador do interessado, sem envio do código-fonte, com registro do hash e do algoritmo.
4. Aceite eletrônico dos dados pelo interessado e versionamento, com congelamento da versão aprovada.
5. Fila de solicitações com prazos parametrizáveis, distribuição, alertas e escalonamento ao servidor.
6. Regras de inatividade parametrizáveis (lembretes em dias úteis e prazo de arquivamento com decisão humana).
7. Agenda integrada à da equipe, com autoagendamento, convite de calendário e lembretes.
8. Notificações automáticas (portal + e-mail institucional) com modelos padronizados e registro no histórico.
9. Integração com o SEI por Web Services (gerar processo e incluir documentos), com fila de contingência manual e registro do número do processo.
10. Geração da ficha de preenchimento do e-Software e checklist de conferência campo a campo, com validação final do servidor.
11. Registro do número e da data do pedido, com janelas de acompanhamento parametrizáveis (padrão: 10 e 15 dias).
12. Leitura automática da RPI semanal (seção Programa de Computador) e dos e-mails "Meus Pedidos" de uma caixa institucional.
13. Extração dos dados do certificado (PDF) e comparação com a versão aprovada, destacando as divergências.
14. Trilha de auditoria de todas as ações (quem, quando, o quê) e painel de indicadores.
15. Requisitos não funcionais: LGPD (dados pessoais de autores e titulares), controle de acesso por papel (interessado, bolsista, servidor), disponibilidade e backup.

## 10. Pontos que dependem de validação antes da implantação

1. **Web Services do SEI**: aprovação e cadastro do sistema pela administração do SEI/STI da UFF. Sem isso, a contingência manual vira o caminho padrão.
2. **Leitura da RPI**: confirmar a estabilidade do formato da seção de Programas de Computador (PDF semanal).
3. **"Meus Pedidos"**: cadastrar os pedidos com o login da UFF e direcionar os e-mails para a caixa institucional lida pela plataforma.
4. **Integração com a agenda** da equipe: depende da ferramenta de calendário institucional.
5. **Prazos e parâmetros**: os valores de 2 dias (triagem), 5 e 10 dias úteis (lembretes), 30 dias (inatividade), 24 h (compensação) e 10/15 dias (INPI) são padrões ajustáveis. O prazo de triagem de 2 dias é uma sugestão inicial a ser calibrada pela AGIR.

## 11. Checklist de qualidade (seção 8 do enunciado)

- [x] Os sete gargalos estão endereçados (seção 2).
- [x] A dependência de e-mails individuais e controles manuais foi reduzida: as comunicações e os prazos estão na plataforma.
- [x] Nenhuma solicitação fica sem responsável ou acompanhamento: fila com prazo, lembretes, inatividade com decisão do servidor.
- [x] Os prazos do INPI são controlados sistematicamente (Etapa 6).
- [x] As informações são estruturadas e validadas antes do protocolo (Etapas 3 e 5).
- [x] Há mecanismos contra erros de preenchimento e de certificado (Etapas 3, 5 e 6).
- [x] O interessado recebe atualizações tempestivas (notificações em cada mudança de situação).
- [x] O SEI continua integrado como instrumento oficial (seção 6).
- [x] As soluções tecnológicas são compatíveis com as restrições (seções 3 e 6).
- [x] O modelo BPMN passa no bpmnlint sem problemas e na checagem de consistência (início alcança fim, raias, rótulos, mensagens).
