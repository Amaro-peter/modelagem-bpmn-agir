# AS-IS – Registro de Programa de Computador (Software) – AGIR/UFF

**Escopo:** só o estado atual (AS-IS). Não há TO-BE, melhorias nem simplificações.
**Base:** recorte do modelo "PROPPI – Registro de Patentes, Marcas, Desenhos Industriais e Programas de Computador" (v08), complementado com as atividades pedidas, as respostas do solicitante e as normas oficiais do INPI.

## 1. Arquivos

| Arquivo | Conteúdo |
|---|---|
| [`as-is/registro-software-asis.bpmn`](../as-is/registro-software-asis.bpmn) | Modelo BPMN 2.0. Abre no bpmn.io, Camunda Modeler, Bizagi etc. |
| [`as-is/registro-software-asis.png`](../as-is/registro-software-asis.png) / `.svg` | Diagrama completo (imagem) |
| [`fontes/registro-software-asis.json`](../fontes/registro-software-asis.json) | Fonte editável do modelo, da qual o `.bpmn` é gerado |
| [`macroprocesso-registro-software.md`](macroprocesso-registro-software.md) | Macroprocesso em 7 etapas: arquitetura, SIPOC e RACI |

Os ajustes que o solicitante fez no editor (25 e 26/11) foram incorporados à fonte JSON.

**Representação:** os diagramas são em preto e branco (revisão de 27/11, por orientação do professor). As atividades **novas** em relação ao modelo original, fundamentadas na solicitação, nas respostas do solicitante ou em norma do INPI, estão marcadas como `"status": "nova"` na fonte JSON e descritas neste relatório.

**Estrutura (v2, 26/11):**
- Pool **PROPPI**, com as raias **INTERESSADO**, **AGIR** e **Outras unidades da UFF**. A última é um ator genérico, logo abaixo da AGIR, que substitui as raias CAP/SAEP, DAC/CCONT e PROGER do original.
- Pool **INPI – Instituto Nacional da Propriedade Industrial**, separada, porque o INPI é um participante externo.
- As duas pools se comunicam por fluxos de mensagem.
- O eixo principal é INTERESSADO → AGIR → INPI → AGIR → INTERESSADO, com desfecho positivo (concessão) ou negativo (petição não conhecida).

## 2. Atividades originais preservadas

As atividades, gateways, eventos e rótulos do recorte original foram mantidos com o mesmo texto, a mesma raia e a mesma ordem. A exceção são CAP/SAEP, DAC/CCONT e PROGER, generalizados a pedido do solicitante:

- **Abertura:** Identificar procedimento de abertura; gateway "Tipo de abertura" (Usuário externo / Servidor UFF); Realizar o peticionamento do processo; Incluir Requerimento de Avaliação do ativo; Preencher Requerimento de Avaliação do ativo.
- **Avaliação do ativo:** Analisar o ativo; "Preenche os requisitos iniciais?"; e-mails ao interessado (decisão e agendamento de reunião); evento condicional "Aguarda a realização da reunião"; "Avaliação positiva para a continuidade do processo?"; despachos de encerramento.
- **Documentação:** eventos de link "Envio de orientações"; Enviar e-mail com orientações gerais; gateway "Interessado"; Realizar o peticionamento dos documentos; Preencher documentos solicitados; Analisar documentação; "Documentos ok?".
- **Pagamento e registro:** Gerar GRU; Subprocesso de Pagamento de Despesa com Registro e Manutenção de Propriedade Intelectual; evento condicional "Aguardar pagamento"; Anexar o comprovante de pagamento; Anexar comprovante de registro; Elaborar despacho de encaminhamento.
- **CAP/SAEP, DAC/CCONT e PROGER:** foram generalizados a pedido do solicitante (ver tabela abaixo).
- **Encerramento:** "O ativo possui cotitularidade?"; minuta e Contrato de Ajuste de PI; e-mail sobre cadastro de usuários externos; disponibilização para assinaturas externas; despachos de encerramento. A anotação original "Documento assinado por AGIR e RE?" foi respondida na entrevista (assinam AGIR, Reitoria e cotitulares externos) e retirada do diagrama pelo solicitante.

### Ajustes de forma no original (sem mudar o comportamento)

| Ajuste | Motivo |
|---|---|
| Nomes nos eventos de início e de fim (ex.: "Encerrado: avaliação negativa") | O original não tinha rótulos. Eles são exigidos pela validação BPMN e deixam claro qual desfecho cada fim representa. |
| Gateway de junção antes de "Enviar e-mail com orientações gerais" | No original, o "Sim" da avaliação e o link "Envio de orientações" chegavam direto na tarefa. A junção explícita é a forma correta em BPMN e não altera o fluxo. |
| "Realizar registro junto ao INPI" virou um **grupo** com esse mesmo rótulo | O grupo envolve as atividades detalhadas no e-Software (item 3.2), e o nome original continua visível. |
| As três raias CAP/SAEP, DAC/CCONT e PROGER viraram uma só, **"Outras unidades da UFF"**. Cada trecho original virou uma atividade genérica: "Realizar os registros patrimonial (SISAP) e contábil (SIAFI) e devolver à AGIR" substitui as 6 atividades de CAP/SAEP e DAC/CCONT; "Emitir parecer jurídico sobre o Contrato de Ajuste e devolver à AGIR" substitui as 4 atividades da PROGER e o evento "Aguardar resposta". | Decisão do solicitante (26/11), por organização. Os pontos de entrada e saída na AGIR são os mesmos do original. |

## 3. Atividades novas

| # | Atividade | Raia | Status | Fundamento |
|---|---|---|---|---|
| 1 | Acessar o processo no SEI e baixar o requerimento | AGIR | Nova | Itens 3.1.1 e 3.1.2 |
| 2 | Reunir os arquivos-fonte e compactar em pacote digital (ZIP) | INTERESSADO | Nova | Item 3.2-A. O solicitante confirmou que o interessado gera o hash. O INPI aceita um arquivo ZIP/RAR. |
| 3 | Gerar o resumo digital (hash SHA-512) do pacote | INTERESSADO | Nova | Item 3.2-A. O Manual do INPI recomenda SHA-512 "ou algoritmo mais recente". |
| 5 | Preencher documento com os dados do programa exigidos pelo INPI | INTERESSADO | Nova | Informado pelo solicitante e item 3.3.4. Campos conforme o Manual do INPI, item 2.7. |
| 6 | Acessar o processo no SEI e baixar os documentos | AGIR | Nova | Itens 3.1.1 e 3.1.2 |
| 7 | Acessar o e-INPI com o login da UFF | AGIR | Nova | Item 3.2-B. O solicitante confirmou que a AGIR opera os sistemas do INPI. |
| 8 | Baixar a Declaração de Veracidade (DV) vinculada à GRU | AGIR | Nova | Item 3.2-D. A DV é única por GRU (Manual do INPI, item 2.4). |
| 9 | Assinar a DV digitalmente (certificado ICP-Brasil) | AGIR | Nova | O solicitante confirmou: um representante da AGIR assina com o e-CNPJ da UFF, com procuração. |
| 10 | Acessar o e-Software e informar o número da GRU paga | AGIR | Nova | Item 3.2-E; guia e-Software, passos 1–2 |
| 11 | Preencher o formulário e-Software com os dados do interessado | AGIR | Nova | Item 3.2-E; guia e-Software, passos 3–7 |
| 12 | Anexar a DV assinada e revisar o pedido | AGIR | Nova | Itens 3.2-E e 3.2-F; guia e-Software, passo 8 |
| 13 | Enviar o pedido de registro ao INPI (mensagem para o INPI) | AGIR | Nova | Item 3.2-F (protocolo) |
| 14 | Anexar ao SEI o recibo com o número do pedido | AGIR | Nova | Item 3.2-F (obter e armazenar o protocolo) |
| 15 | Evento "Acompanhar a publicação na RPI (despacho publicado)", que recebe as mensagens do INPI, seguido da decisão "Despacho publicado?" (730 – concessão / 742 – petição não conhecida) | AGIR | Nova | Item 3.2-F. Despachos conforme o Manual do INPI, Anexo II. Na revisão de 27/11, o gateway de eventos com dois eventos de mensagem virou um evento único + decisão: mesmo significado, sem cruzamento de setas. |
| 16 | Baixar o certificado de registro no portal do INPI | AGIR | Nova | Itens 3.1.8 e 3.2-F. O certificado é baixado pela Busca Web do INPI. |
| 17 | Gateway paralelo + Enviar ao interessado o certificado de registro + Receber o certificado (fim "Interessado ciente do registro") | AGIR / INTERESSADO | Nova | Confirmado na entrevista (26/11): a AGIR comunica o interessado nos dois desfechos. |
| 18 | Anexar ao SEI a publicação do não conhecimento | AGIR | Nova | Desfecho negativo (item 4.5), confirmado na entrevista |
| 19 | Elaborar despacho de encerramento (pedido não conhecido) | AGIR | Nova | Confirmado na entrevista: após o 742 a AGIR encerra o processo |
| 20 | Enviar e-mail ao interessado informando o não conhecimento + Receber a comunicação (fim "Pedido não conhecido pelo INPI") | AGIR / INTERESSADO | Nova | Desfecho negativo para o interessado, confirmado na entrevista |
| 22 | Gateway paralelo de assinaturas: Assinar o Contrato de Ajuste (AGIR) + Assinar o Contrato de Ajuste (Reitoria, raia Outras unidades da UFF) + evento "Assinaturas dos cotitulares externos concluídas", com a pool caixa-preta **Cotitulares externos** (mensagens: orientações de cadastro no SEI, contrato para assinatura, contrato assinado) | AGIR / Outras unidades da UFF / Cotitulares externos | Nova | Confirmado na entrevista: a AGIR só encerra depois de todas as assinaturas |
| 21 | **Pool INPI:** Pedido recebido pelo e-Software → Validar o pedido automaticamente (GRU paga, assinatura da DV, procuração) → "Pedido regular?" → Publicar a concessão na RPI (730) → Disponibilizar o certificado no portal / Publicar petição não conhecida na RPI (742) | INPI | Nova | Manual do INPI, itens 2.6 e 3, e Anexo II: validação automática, concessão na primeira RPI, certificado no portal |

**Anotações informativas** no diagrama:
- Em "Gerar GRU": serviço 730, R$ 210,00, sem desconto para programa de computador.
- Em "Aguardar pagamento": a GRU deve estar paga antes do pedido, e a confirmação do pagamento leva cerca de 24 h.
- Em "Assinar a DV": representante da AGIR, com e-CNPJ da UFF e procuração.

## 4. Lacunas de informação

**Resolvidas pelo solicitante na revisão de 26/11:**
- **Assinatura da DV:** um representante da AGIR assina com o e-CNPJ da UFF, com procuração.
- **Guarda do pacote e do hash:** a atividade "Armazenar o pacote e o resumo digital" foi retirada. Ela não faz parte do processo atual.
- **Notas de lacuna retiradas do diagrama:** em "Analisar o ativo" (verificação de validade), no subprocesso de pagamento, em "Anexar comprovante de registro" e no não conhecimento (despacho 742). Elas continuam listadas abaixo apenas como registro.

**Resolvidas na entrevista de 26/11:**
- **Ordem entre a DV e o pagamento:** a DV é baixada e assinada depois do pagamento, como está no modelo.
- **Comunicação do resultado ao interessado:** ocorre nos dois desfechos (atividades 17–20, agora confirmadas).
- **Providência após o despacho 742:** a AGIR encerra o processo.
- **Assinatura do Contrato de Ajuste:** assinam AGIR, Reitoria e cotitulares externos. A AGIR encerra só depois de todas as assinaturas (atividade 22).
- **Credencial do e-INPI:** cadastro da UFF.

- **Pagamento da GRU:** feito internamente pela própria AGIR. O "Subprocesso de Pagamento de Despesa com Registro e Manutenção de PI" (nome original) passou a conter a atividade nova "Efetuar o pagamento da GRU". Os passos internos do pagamento não foram descritos e não foram inventados.

**Ainda em aberto:** nenhuma lacuna.

**Itens da solicitação que não se aplicam a este AS-IS:**
- **3.3.7 (pagamento pelo interessado):** no original, quem gera a GRU e paga é a AGIR. Nada foi atribuído ao interessado.
- **3.2-C (descontos):** a página oficial do serviço informa que **não há desconto** para programa de computador (a Portaria INPI/PR nº 10/2025 não inclui esse serviço). Por isso não há gateway de desconto, só uma anotação.
- **Exigência formal do INPI:** não existe no registro eletrônico de software. O e-INPI valida automaticamente e só há dois desfechos, concessão (730) ou petição não conhecida (742). Por isso não foi modelado um ciclo de exigência.

## 5. Justificativa das principais alterações

- **Atividades no SEI (AGIR)** – antes de "Analisar o ativo" e de "Analisar documentação". São os primeiros passos administrativos de cada análise (itens 3.1.1 e 3.1.2), e o original os deixava implícitos.
- **Hash e dados do programa (INTERESSADO)** – depois de "Enviar e-mail com orientações gerais" e antes do peticionamento dos documentos. As orientações gerais são o momento em que o interessado recebe o que deve enviar. O hash e o documento de dados fazem parte da documentação analisada pela AGIR.
  - Ficam dentro do laço de correção original ("Documentos ok? Não" → link "Envio de orientações"). Se houver pendência, o interessado refaz o que for preciso.
  - Esse laço já existia no original e cobre o tratamento de pendências (item 3.1.5), por isso não foi criado outro.
- **e-INPI, DV e e-Software (AGIR)** – em torno das atividades originais "Gerar GRU" e "Realizar registro junto ao INPI". O solicitante confirmou que é a AGIR quem opera os sistemas do INPI. A sequência segue o guia e-Software (login → GRU paga → formulário → DV → envio → número do pedido).
- **Pool INPI** – separa o procedimento externo do fluxo interno da AGIR (item 5 da solicitação).
  - Os desfechos seguem o Anexo II do Manual do INPI (730 e 742).
  - A AGIR acompanha a RPI por um gateway baseado em eventos.
- **Desfechos para o interessado** – no positivo, o gateway paralelo depois de "Anexar comprovante de registro" mantém intacto o fluxo interno original (outras unidades da UFF → cotitularidade). No negativo, o caminho termina no interessado. Os dois retornos foram confirmados na entrevista de 26/11.

## 6. Verificação de consistência

| Verificação | Resultado |
|---|---|
| `node ferramentas/check.js` | ✔ Todo início alcança um fim. Todo nó tem raia, entrada e saída. Toda saída de gateway exclusivo tem rótulo. O link de saída tem destino. As mensagens só ligam pools diferentes. |
| `npx bpmnlint` | Nenhum problema. Os 2 erros anteriores, do subprocesso de pagamento vazio, sumiram depois que ele ganhou conteúdo. |
| Editor bpmn.io (Playwright) | O modelo carrega sem erros (140 formas). |
| Inspeção visual | Nenhuma seta atravessa elementos e nenhuma se sobrepõe a outra. Os rótulos ficam legíveis. |

## 7. Fontes do INPI

- Serviço "Solicitar o registro de programa de computador" (gov.br), consultado em 25/11/2026: https://www.gov.br/pt-br/servicos/solicitar-o-registro-de-programa-de-computador. Fonte do código 730, do valor de R$ 210,00, da ausência de desconto, da exigência de certificado ICP-Brasil e da Busca Web.
- Perguntas frequentes – Programas de computador (INPI): https://www.gov.br/inpi/pt-br/servicos/perguntas-frequentes/programas-de-computador
- Manual do Usuário para o Registro Eletrônico de Programas de Computador (INPI): https://www.gov.br/inpi/pt-br/assuntos/arquivos-programa-de-computador/ManualdousurioV7.5.pdf. Itens 2.3 (hash, SHA-512), 2.4 (DV), 2.6, 2.7 (campos do formulário), 3, Anexos I e II (códigos 730 e 742).
- Guia "Formulário Eletrônico (e-Software)", versão mar/2023: https://www.gov.br/inpi/pt-br/servicos/programas-de-computador/arquivos/guia-basico/eSoftware.pdf. Passos 1–8 e regra de assinatura da DV com e-CNPJ.
