# Conteúdo da apresentação da aula (rascunho para revisão do grupo)

Modelo seguido: "Modelo de apresentação do mapeamento dos processos – TO-BE" (título; resumo; análise qualitativa; redesenho TO-BE). Até 15 slides.
Fontes: enunciado do TO-BE (gargalos 3.1 a 3.7 e restrições), `processos/registro-software/docs/relatorio-asis.md`, `processos/registro-software/to-be/docs/to-be-registro-software.md` e as atividades do modelo AS-IS.

## 1. Resumo

**Processo escolhido:** Registro de Programa de Computador (Software) da AGIR/UFF, que vai do pedido do interessado ao certificado do INPI e aos registros internos.
**Por quê:** o dono e os sponsors do processo relataram problemas concretos: demora no atendimento, e-mails perdidos, falta de acompanhamento no INPI, retrabalho na interpretação dos dados, erros de preenchimento, demora na comunicação e certificados com erro.

**Métodos de análise qualitativa (Dumas et al.):**
| Método | Por quê |
|---|---|
| Registro de problemas | Organiza os problemas relatados nas entrevistas: descrição e impacto de cada um |
| Análise de valor agregado | Mostra quais atividades geram valor para o interessado (VA), quais são exigidas pela UFF ou pelo INPI (BVA) e quais só movem informação (NVA) |
| Diagrama de Ishikawa | Liga os problemas às suas causas (pessoas, método, sistemas, comunicação, dados, instituição) |

**Heurísticas de redesenho (Reijers e Mansar):**
| Heurística | Dimensão | Por quê / onde aparece no TO-BE |
|---|---|---|
| Eliminação de atividades | Custo | Remove as atividades NVA: e-mails manuais de decisão, agendamento e orientação, baixar documentos do SEI e trocas de esclarecimento. Elas são substituídas por formulário estruturado, notificações automáticas e espelhamento no SEI |
| Empoderamento | Custo | O interessado e a equipe agem e decidem direto na plataforma: o interessado agenda a reunião, corrige os próprios dados e dá o aceite eletrônico; a equipe faz a triagem pela fila, sem esperar encaminhamentos por e-mail |
| Centralização | Flexibilidade | Uma plataforma única reúne solicitações, comunicações, dados, prazos e o acompanhamento do INPI. Servidores e bolsistas trabalham numa fila comum, e qualquer um pode assumir um pedido |

Justificativa comum: **impedir trocas de informação e movimentação de dados desnecessárias**.

## 2. Análise qualitativa: resultados

### 2.1 Registro de problemas
| # | Problema | Descrição | Impacto |
|---|---|---|---|
| 1 | Demora no atendimento inicial | Demora para responder ao processo aberto no SEI e para agendar a reunião inicial | O interessado espera e o processo começa atrasado |
| 2 | Falhas na gestão dos e-mails | Mensagens de vários interessados se perdem na caixa de entrada, sem resposta nem encaminhamento | O processo para, e o controle depende da memória de cada pessoa |
| 3 | Sem acompanhamento sistemático no INPI | A decisão leva de 7 a 10 dias, e pedidos deixam de ser acompanhados no momento certo | Atraso para perceber decisões e certificados disponíveis |
| 4 | Interpretação das informações do interessado | A equipe interpreta documentos livres, o que gera sucessivas trocas de esclarecimento | Retrabalho, ambiguidade e dependência de interpretação individual |
| 5 | Erros de preenchimento no INPI | Mesmo depois dos esclarecimentos, há dados inseridos incorretamente no e-Software | Correções posteriores, mais esforço e processo mais longo |
| 6 | Demora na comunicação do andamento | O interessado demora a saber de atualizações, decisões e da conclusão | Contatos manuais para perguntar o andamento |
| 7 | Certificados com erro | Certificados com informações incorretas levam a pedidos de correção | Novas atividades administrativas depois do fim do processo |

### 2.2 Análise de valor agregado (atividades da AGIR, do interessado e das outras unidades da UFF; as do INPI ficam fora)
- **VA** (geram diretamente o registro que o interessado quer): analisar o ativo; reunir os arquivos-fonte (ZIP); preencher os dados do programa; preencher o formulário e-Software; enviar o pedido ao INPI; baixar o certificado; enviar o certificado ao interessado; receber o certificado.
- **BVA** (exigidas pela UFF, pelo INPI ou pela lei): peticionamentos e requerimentos no SEI; gerar o hash; análise documental; e-INPI, GRU e pagamento; Declaração de Veracidade (baixar e assinar); acessar o e-Software e anexar a DV; anexar recibo e comprovantes ao SEI; despachos; registros patrimonial e contábil; parecer jurídico; contrato de ajuste e suas assinaturas; registro do não conhecimento (742).
- **NVA** (só movem informação ou servem para descobrir o que fazer):
  - Identificar o procedimento de abertura (o interessado precisa descobrir como começar)
  - Acessar o SEI e baixar o requerimento
  - Acessar o SEI e baixar os documentos
  - Enviar e-mail informando a decisão
  - Enviar e-mail agendando a reunião
  - Enviar e-mail com orientações gerais
  - Enviar e-mail com orientações sobre o cadastro de usuários externos
  - Enviar e-mail informando o não conhecimento
  - Receber a comunicação de não conhecimento
  - Espera: acompanhamento da RPI sem rotina definida (é um evento, não uma atividade)

### 2.3 Ishikawa: efeito "Registro de software demorado e sujeito a erros"
| Categoria | Causas |
|---|---|
| Pessoas | Equipe sem possibilidade de ampliação; controle na memória de cada pessoa; muitos pedidos ao mesmo tempo |
| Método | Sem fila nem prazos para a triagem e as respostas; acompanhamento do INPI sem rotina; conferência dos dados só depois do envio |
| Sistemas | O SEI registra, mas não controla prazos; e-Software sem API (redigitação manual); sem ferramenta de agenda |
| Comunicação | Trocas por e-mail com vários interessados; mensagens perdidas; interessado sem visão do andamento |
| Informação/dados | Dados enviados em formato livre e interpretados pela equipe; dados redigitados no e-Software; dados espalhados entre e-mail, SEI e INPI |
| Instituição | SEI obrigatório; exigências do INPI (GRU, DV com ICP-Brasil); decisões publicadas só na RPI semanal |

## 3. Conclusões
1. O tempo perdido está em mover informação: e-mails, idas ao SEI para baixar documentos, redigitação e esclarecimentos. Essas são as atividades NVA.
2. As causas convergem para informação espalhada (e-mail, SEI, INPI) e para o controle manual de prazos, que depende das pessoas.
3. Com o SEI obrigatório e sem novos servidores, a saída não é contratar gente: é tecnologia que centralize e automatize.
4. As atividades exigidas pela UFF e pelo INPI (BVA) ficam. O redesenho elimina as NVA e previne erros antes do protocolo.

## 4. Redesenho: principais melhorias e justificativas
| Problema | Melhoria no TO-BE | Heurística |
|---|---|---|
| 1 Atendimento inicial | Solicitação no portal com registro automático, fila com prazo de triagem e autoagendamento da reunião | Empoderamento, Eliminação |
| 2 E-mails | Comunicação e histórico centralizados na plataforma, com notificações automáticas | Centralização, Eliminação |
| 3 INPI | Monitoramento de cada pedido (leitura semanal da RPI e "Meus Pedidos", alerta em 10 dias) | Centralização, Eliminação |
| 4 Interpretação | Formulário estruturado com validação automática e pendências apontadas no portal | Eliminação, Empoderamento |
| 5 Preenchimento | Versão dos dados aprovada pelo interessado (aceite), ficha de preenchimento e dupla conferência | Empoderamento, Eliminação |
| 6 Comunicação | Notificações a cada mudança de situação e painel no portal | Centralização, Eliminação |
| 7 Certificados | Certificado conferido com os dados aprovados; correção conforme a origem do erro | Eliminação |
