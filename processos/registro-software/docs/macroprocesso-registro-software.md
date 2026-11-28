# Macroprocesso – Registro de Programa de Computador (Software) – AGIR/UFF (AS-IS)

**Escopo:** estado atual (AS-IS), sem TO-BE e sem melhorias. Os diagramas e este documento derivam do mesmo modelo (`fontes/registro-software-asis.json`) e das respostas da entrevista de 26/11/2026.

**Representação:** diagramas em preto e branco. Cada etapa termina numa única saída de continuidade ("Saída → Etapa N: resultado"), e a etapa seguinte começa pela entrada de mesmo nome ("Entrada ← Etapa M: resultado"). As atividades novas em relação ao modelo original (PROPPI v08) estão marcadas como "nova" na fonte.

## 1. Arquitetura de processos

```
Nível 1 – Macroprocesso: Gestão da Propriedade Intelectual (AGIR / PROPPI)
└── Nível 2 – Processo: Registro de Propriedade Intelectual
    │        (patentes, marcas, desenhos industriais e programas de computador – modelo PROPPI v08)
    └── Nível 3 – Subprocesso: Registro de Programa de Computador (Software)   → macro/00-macro.bpmn
        ├── Nível 4 – Etapa 1 – Abertura do pedido   → etapas/01-abertura.bpmn
        ├── Nível 4 – Etapa 2 – Avaliação do ativo   → etapas/02-avaliacao.bpmn
        ├── Nível 4 – Etapa 3 – Instrução documental   → etapas/03-instrucao.bpmn
        ├── Nível 4 – Etapa 4 – Pagamento da GRU   → etapas/04-pagamento.bpmn
        ├── Nível 4 – Etapa 5 – Depósito do pedido no INPI   → etapas/05-deposito.bpmn
        ├── Nível 4 – Etapa 6 – Resultado do INPI   → etapas/06-resultado.bpmn
        └── Nível 4 – Etapa 7 – Registros internos e formalização da cotitularidade   → etapas/07-registros.bpmn
```
Os demais tipos de ativo do Nível 2 (patentes, marcas e desenhos industriais) estão **fora do escopo** deste trabalho.

### Nível 5 – Atividades por etapa

**Etapa 1 – Abertura do pedido**
- Identificar procedimento de abertura — *INTERESSADO*
- Realizar o peticionamento do processo — *INTERESSADO*
- Incluir Requerimento de Avaliação do ativo — *INTERESSADO*
- Preencher Requerimento de Avaliação do ativo — *INTERESSADO*

**Etapa 2 – Avaliação do ativo**
- Acessar o processo no SEI e baixar o requerimento — *AGIR* 🟩
- Analisar o ativo — *AGIR*
- Enviar e-mail ao interessado informando a decisão — *AGIR*
- Receber a decisão por e-mail — *INTERESSADO* 🟩
- Elaborar despacho de encerramento — *AGIR*
- Enviar e-mail ao interessado agendando reunião — *AGIR*
- Receber o convite da reunião — *INTERESSADO* 🟩
- Elaborar despacho de encerramento — *AGIR*

**Etapa 3 – Instrução documental**
- Enviar e-mail com orientações gerais — *AGIR*
- Reunir os arquivos-fonte e compactar em pacote digital (ZIP) — *INTERESSADO* 🟩
- Gerar o resumo digital (hash SHA-512) do pacote — *INTERESSADO* 🟩
- Preencher documento com os dados do programa exigidos pelo INPI — *INTERESSADO* 🟩
- Realizar o peticionamento dos documentos — *INTERESSADO*
- Preencher documentos solicitados — *INTERESSADO*
- Acessar o processo no SEI e baixar os documentos — *AGIR* 🟩
- Analisar documentação — *AGIR*

**Etapa 4 – Pagamento da GRU**
- Acessar o e-INPI com o login da UFF — *AGIR* 🟩
- Gerar GRU — *AGIR*
- Subprocesso de Pagamento de Despesa com Registro e Manutenção de Propriedade Intelectual — *AGIR*
- Anexar o comprovante de pagamento — *AGIR*

**Etapa 5 – Depósito do pedido no INPI**
- Baixar a Declaração de Veracidade (DV) vinculada à GRU — *AGIR* 🟩
- Assinar a DV digitalmente (certificado ICP-Brasil) — *AGIR* 🟩
- Acessar o e-Software e informar o número da GRU paga — *AGIR* 🟩
- Preencher o formulário e-Software com os dados do interessado — *AGIR* 🟩
- Anexar a DV assinada e revisar o pedido — *AGIR* 🟩
- Enviar o pedido de registro ao INPI — *AGIR* 🟩
- Anexar ao SEI o recibo com o número do pedido — *AGIR* 🟩

**Etapa 6 – Resultado do INPI**
- Baixar o certificado de registro no portal do INPI — *AGIR* 🟩
- Anexar comprovante de registro — *AGIR*
- Enviar ao interessado o certificado de registro — *AGIR* 🟩
- Receber o certificado de registro — *INTERESSADO* 🟩
- Elaborar despacho de encaminhamento — *AGIR*
- Anexar ao SEI a publicação do não conhecimento — *AGIR* 🟩
- Elaborar despacho de encerramento (pedido não conhecido) — *AGIR* 🟩
- Enviar e-mail ao interessado informando o não conhecimento — *AGIR* 🟩
- Receber a comunicação de não conhecimento do pedido — *INTERESSADO* 🟩

**Etapa 7 – Registros internos e formalização da cotitularidade**
- Realizar os registros patrimonial e contábil para devolver à AGIR — *Outras unidades da UFF*
- Elaborar despacho de encerramento — *AGIR*
- Anexar minuta do Contrato de Ajuste de Propriedade Intelectual — *AGIR*
- Elaborar despacho de encaminhamento — *AGIR*
- Emitir parecer jurídico sobre o Contrato de Ajuste e devolver à AGIR — *Outras unidades da UFF*
- Incluir o Contrato de Ajuste de Propriedade Intelectual, de acordo com parecer da PROGER — *AGIR*
- Enviar e-mail com orientações sobre o cadastro de usuários externos — *AGIR*
- Disponibilizar Contrato de Ajuste de Propriedade Intelectual para assinaturas externas — *AGIR*
- Assinar o Contrato de Ajuste (AGIR) — *AGIR* 🟩
- Assinar o Contrato de Ajuste (Reitoria) — *Outras unidades da UFF* 🟩
- Elaborar despacho de encerramento — *AGIR*

## 2. Mapa das etapas

| Etapa | Objetivo | Evento de início | Eventos de fim | Participantes | Diagrama |
|---|---|---|---|---|---|
| Etapa 1 – Abertura do pedido | Formalizar o interesse e abrir o processo com o Requerimento de Avaliação do ativo. | Interesse em registrar o software | Saída → Etapa 2: Requerimento enviado | INTERESSADO | [01-abertura.bpmn](../etapas/01-abertura.bpmn) |
| Etapa 2 – Avaliação do ativo | Decidir se o ativo atende aos requisitos e se o processo continua. | Entrada ← Etapa 1: Requerimento enviado | Encerrado: requisitos não atendidos; Encerrado: avaliação negativa; Saída → Etapa 3: Ativo aprovado | INTERESSADO, AGIR | [02-avaliacao.bpmn](../etapas/02-avaliacao.bpmn) |
| Etapa 3 – Instrução documental | Reunir e validar a documentação do software (pacote, hash e dados exigidos pelo INPI). | Entrada ← Etapa 2: Ativo aprovado | Saída → Etapa 4: Documentação aprovada | INTERESSADO, AGIR | [03-instrucao.bpmn](../etapas/03-instrucao.bpmn) |
| Etapa 4 – Pagamento da GRU | Emitir e pagar a GRU do serviço 730 e comprovar o pagamento no processo. | Entrada ← Etapa 3: Documentação aprovada | Saída → Etapa 5: Pagamento comprovado | AGIR | [04-pagamento.bpmn](../etapas/04-pagamento.bpmn) |
| Etapa 5 – Depósito do pedido no INPI | Preparar a DV e o formulário e-Software e depositar o pedido de registro no INPI. | Entrada ← Etapa 4: Pagamento comprovado | Saída → Etapa 6: Pedido depositado | AGIR, INPI – Instituto Nacional da Propriedade Industrial | [05-deposito.bpmn](../etapas/05-deposito.bpmn) |
| Etapa 6 – Resultado do INPI | Obter o resultado do INPI (730 ou 742), registrá-lo no SEI e comunicar o interessado. | Entrada ← Etapa 5: Pedido depositado | Interessado ciente do registro; Pedido não conhecido pelo INPI; Saída → Etapa 7: Registro concedido | INTERESSADO, AGIR, INPI – Instituto Nacional da Propriedade Industrial | [06-resultado.bpmn](../etapas/06-resultado.bpmn) |
| Etapa 7 – Registros internos e formalização da cotitularidade | Fazer os registros patrimonial e contábil e, havendo cotitularidade, formalizar o Contrato de Ajuste. | Entrada ← Etapa 6: Registro concedido | Encerrado: registro concluído; Encerrado: contrato disponibilizado | AGIR, Outras unidades da UFF, Cotitulares externos | [07-registros.bpmn](../etapas/07-registros.bpmn) |

No **macroprocesso** ([00-macro.bpmn](../macro/00-macro.bpmn)), cada etapa é uma *call activity* que chama o processo da etapa. Há dois pontos de decisão: **"Ativo apto?"** após a Etapa 2 (encerramento na avaliação) e **"Resultado do INPI"** após a Etapa 6 (730 segue para a Etapa 7; 742 encerra o processo). O INPI aparece como pool caixa-preta, que recebe o pedido (Etapa 5) e publica o resultado na RPI (Etapa 6).

## 3. SIPOC por etapa

### Etapa 1 – Abertura do pedido

| S – Fornecedores | I – Entradas | P – Atividades principais | O – Saídas | C – Clientes |
|---|---|---|---|---|
| Interessado (usuário externo ou servidor UFF) | Interesse em registrar o software; dados do ativo | 1. Identificar procedimento de abertura<br>2. Realizar o peticionamento do processo<br>3. Incluir Requerimento de Avaliação do ativo<br>4. Preencher Requerimento de Avaliação do ativo | Processo aberto no SEI com o Requerimento de Avaliação do ativo | AGIR |

### Etapa 2 – Avaliação do ativo

| S – Fornecedores | I – Entradas | P – Atividades principais | O – Saídas | C – Clientes |
|---|---|---|---|---|
| Interessado | Requerimento de Avaliação do ativo (SEI) | 1. Acessar o processo no SEI e baixar o requerimento<br>2. Analisar o ativo<br>3. Enviar e-mail ao interessado informando a decisão<br>4. Receber a decisão por e-mail<br>5. Elaborar despacho de encerramento<br>6. Enviar e-mail ao interessado agendando reunião<br>7. Receber o convite da reunião<br>8. Elaborar despacho de encerramento | Ativo aprovado para continuidade **ou** processo encerrado com despacho e e-mail ao interessado | AGIR (Etapa 3); Interessado |

### Etapa 3 – Instrução documental

| S – Fornecedores | I – Entradas | P – Atividades principais | O – Saídas | C – Clientes |
|---|---|---|---|---|
| Interessado; AGIR | Orientações gerais; arquivos-fonte do programa; dados de titularidade, autoria e características | 1. Enviar e-mail com orientações gerais<br>2. Reunir os arquivos-fonte e compactar em pacote digital (ZIP)<br>3. Gerar o resumo digital (hash SHA-512) do pacote<br>4. Preencher documento com os dados do programa exigidos pelo INPI<br>5. Realizar o peticionamento dos documentos<br>6. Preencher documentos solicitados<br>7. Acessar o processo no SEI e baixar os documentos<br>8. Analisar documentação | Documentação aprovada no SEI (pacote, resumo hash SHA-512 e documento com os dados exigidos pelo INPI) | AGIR (Etapas 4 e 5) |

### Etapa 4 – Pagamento da GRU

| S – Fornecedores | I – Entradas | P – Atividades principais | O – Saídas | C – Clientes |
|---|---|---|---|---|
| AGIR; sistemas do INPI (e-INPI/GRU) | Documentação aprovada; cadastro da UFF no e-INPI; recursos da AGIR para o pagamento | 1. Acessar o e-INPI com o login da UFF<br>2. Gerar GRU<br>3. Subprocesso de Pagamento de Despesa com Registro e Manutenção de Propriedade Intelectual<br>4. Anexar o comprovante de pagamento | GRU 730 paga e comprovante anexado ao SEI | AGIR (Etapa 5); INPI (retribuição) |

### Etapa 5 – Depósito do pedido no INPI

| S – Fornecedores | I – Entradas | P – Atividades principais | O – Saídas | C – Clientes |
|---|---|---|---|---|
| AGIR; Interessado (hash e dados da Etapa 3); INPI (DV e e-Software) | GRU paga; resumo hash; documento de dados do programa; e-CNPJ da UFF com procuração | 1. Baixar a Declaração de Veracidade (DV) vinculada à GRU<br>2. Assinar a DV digitalmente (certificado ICP-Brasil)<br>3. Acessar o e-Software e informar o número da GRU paga<br>4. Preencher o formulário e-Software com os dados do interessado<br>5. Anexar a DV assinada e revisar o pedido<br>6. Enviar o pedido de registro ao INPI<br>7. Anexar ao SEI o recibo com o número do pedido | Pedido depositado no e-Software; recibo com o número do pedido anexado ao SEI | INPI; AGIR (Etapa 6) |

### Etapa 6 – Resultado do INPI

| S – Fornecedores | I – Entradas | P – Atividades principais | O – Saídas | C – Clientes |
|---|---|---|---|---|
| INPI | Pedido depositado; publicações na RPI (despachos 730 e 742) | 1. Baixar o certificado de registro no portal do INPI<br>2. Anexar comprovante de registro<br>3. Enviar ao interessado o certificado de registro<br>4. Receber o certificado de registro<br>5. Elaborar despacho de encaminhamento<br>6. Anexar ao SEI a publicação do não conhecimento<br>7. Elaborar despacho de encerramento (pedido não conhecido)<br>8. Enviar e-mail ao interessado informando o não conhecimento<br>9. Receber a comunicação de não conhecimento do pedido | 730: certificado anexado ao SEI e enviado ao interessado, processo encaminhado • 742: processo encerrado e interessado comunicado | Interessado; Outras unidades da UFF (Etapa 7) |

### Etapa 7 – Registros internos e formalização da cotitularidade

| S – Fornecedores | I – Entradas | P – Atividades principais | O – Saídas | C – Clientes |
|---|---|---|---|---|
| AGIR; Outras unidades da UFF (incl. Reitoria e PROGER); Cotitulares externos | Processo com o certificado de registro; minuta do Contrato de Ajuste (quando há cotitularidade) | 1. Realizar os registros patrimonial e contábil para devolver à AGIR<br>2. Elaborar despacho de encerramento<br>3. Anexar minuta do Contrato de Ajuste de Propriedade Intelectual<br>4. Elaborar despacho de encaminhamento<br>5. Emitir parecer jurídico sobre o Contrato de Ajuste e devolver à AGIR<br>6. Incluir o Contrato de Ajuste de Propriedade Intelectual, de acordo com parecer da PROGER<br>7. Enviar e-mail com orientações sobre o cadastro de usuários externos<br>8. Disponibilizar Contrato de Ajuste de Propriedade Intelectual para assinaturas externas<br>9. Assinar o Contrato de Ajuste (AGIR)<br>10. Assinar o Contrato de Ajuste (Reitoria)<br>11. Elaborar despacho de encerramento | Bem registrado (patrimonial e contábil); Contrato de Ajuste assinado por AGIR, Reitoria e cotitulares; processo encerrado | UFF; Cotitulares externos |

## 4. Matriz RACI

R = executa • A = aprova/responde pelo resultado (sempre a AGIR, conforme a entrevista) • C = consultado • I = informado

| Etapa | Interessado | AGIR | Outras unidades da UFF | INPI | Cotitulares externos |
|---|---|---|---|---|---|
| Etapa 1 – Abertura do pedido | R | A | – | – | – |
| Etapa 2 – Avaliação do ativo | C, I | R, A | – | – | – |
| Etapa 3 – Instrução documental | R | R, A | – | – | – |
| Etapa 4 – Pagamento da GRU | – | R, A | – | I | – |
| Etapa 5 – Depósito do pedido no INPI | C | R, A | – | I | – |
| Etapa 6 – Resultado do INPI | I | R, A | I | R | – |
| Etapa 7 – Registros internos e formalização da cotitularidade | – | R, A | R | – | R, I |

**Observações:**
- Etapa 2: o interessado é consultado na reunião de avaliação e informado da decisão por e-mail.
- Etapa 4: o pagamento da GRU é feito internamente pela própria AGIR (dentro do "Subprocesso de Pagamento de Despesa com Registro e Manutenção de PI").
- Etapa 6: o INPI executa a validação automática e as publicações na RPI.
- Etapa 7: "Outras unidades da UFF" reúne CAP/SAEP e DAC/CCONT (registros), PROGER (parecer jurídico) e Reitoria (assinatura). Os cotitulares externos assinam o contrato e são orientados sobre o cadastro no SEI.

## 5. Decisões da entrevista (26/11/2026)

- Formato: um diagrama por etapa (7) + diagrama macro com raias por responsável e o INPI como participante externo.
- Arquitetura: Gestão da PI → Registro de PI → Registro de programa de computador → etapas → atividades.
- Aprovação (A) dos despachos e decisões: a própria AGIR.
- Pagamento da GRU: feito internamente pela própria AGIR (definido em 26/11, após a entrevista; antes estava como caixa-preta).
- Comunicação ao interessado: ocorre nos dois desfechos (730 e 742).
- Após o despacho 742: a AGIR encerra o processo.
- Declaração de Veracidade: baixada e assinada depois do pagamento, por representante da AGIR com e-CNPJ da UFF e procuração.
- e-INPI/e-Software: acesso com o cadastro da UFF.
- Contrato de Ajuste: assinam AGIR, Reitoria e cotitulares externos (usuários externos do SEI); a AGIR encerra só depois de todas as assinaturas.

## 6. Lacunas restantes

Nenhuma. O último ponto em aberto (quem paga a GRU) foi definido: a própria AGIR, internamente. Os passos internos do pagamento (meio de pagamento, autorização etc.) não foram descritos e, por isso, o subprocesso contém uma única atividade, "Efetuar o pagamento da GRU". Se houver passos relevantes, eles podem ser detalhados ali.
