# Modelagem BPMN – AGIR/UFF

Modelos de processo em **BPMN 2.0** da AGIR (Agência de Inovação da UFF), com a documentação de apoio da metodologia BPM e as ferramentas usadas para gerá-los.

## Comece aqui: instalar, rodar e visualizar

Funciona em **Windows, macOS e Linux**. Escolha o caminho que precisar.

### 1. Só ver os diagramas (sem instalar nada)

- **No navegador, pelo GitHub:** abra a pasta do [processo de registro de software](processos/registro-software/). O macroprocesso aparece na própria página, e cada etapa tem link para a imagem.
- **Abrir um `.bpmn` de forma interativa:**
  1. Neste repositório, abra o arquivo `.bpmn` desejado e clique em **Download raw file** (ícone de download).
  2. Acesse **https://demo.bpmn.io**.
  3. Arraste o arquivo baixado para a página. Dá para dar zoom, navegar e clicar nos elementos.
- **Programa de computador:** instale o [Camunda Modeler](https://camunda.com/download/modeler/) (gratuito) e use **File → Open File** no `.bpmn`.

### 2. Instalar a ferramenta deste repositório

**Pré-requisitos** (instale uma vez):

| Programa | Para quê | Onde baixar |
|---|---|---|
| **Node.js 18 ou mais novo** (versão LTS) | Editor, validação e geração dos modelos | https://nodejs.org |
| **Git** | Baixar o repositório | https://git-scm.com/downloads |
| Python 3 *(opcional)* | Só para regerar as etapas e a documentação | https://www.python.org/downloads |
| Google Chrome *(opcional)* | Só para gerar as imagens `.png`/`.svg` | https://www.google.com/chrome |

Para conferir a instalação, abra um terminal (no Windows, o **PowerShell**; no macOS, o **Terminal**) e rode `node --version` e `git --version`.

**Baixar e instalar:**

```bash
git clone https://github.com/Amaro-peter/modelagem-bpmn-agir.git
cd modelagem-bpmn-agir
npm install
```

Sem Git, use **Code → Download ZIP** nesta página, descompacte, abra o terminal dentro da pasta e rode `npm install`.

### 3. Rodar o editor e visualizar os BPMN

```bash
npm run editor
```

Deixe esse terminal aberto e abra no navegador:

**http://localhost:8080/ferramentas/editor.html?file=processos/registro-software/macro/00-macro.bpmn**

- **Abrir outro modelo:** troque o caminho depois de `file=`. Exemplos: `processos/registro-software/etapas/06-resultado.bpmn`, `processos/registro-software/as-is/registro-software-asis.bpmn` ou o TO-BE `processos/registro-software/to-be/macro/00-macro.bpmn`. Também dá para usar o botão **Escolher arquivo** no topo do editor.
- **Navegar no diagrama:** roda do mouse para zoom e arrastar o fundo para mover. Nos subprocessos, o ícone ↘ abre o detalhe.
- **Editar:** use a paleta à esquerda. **Salvar no projeto** (ou **Ctrl+S**) grava no próprio arquivo, e **Baixar .bpmn** / **Baixar .svg** exportam cópias.
- **Encerrar o editor:** **Ctrl+C** no terminal.

### 4. Validar e regerar *(opcional)*

```bash
npm run validar             # confere todos os modelos (regras BPMN + consistência)
npm run registro-software   # regera AS-IS, macro, etapas, imagens e documentação a partir das fontes JSON
```

O `registro-software` precisa do Python 3. Para gerar as imagens, ele usa o Google Chrome ou o Microsoft Edge instalados. Se não houver nenhum dos dois, rode `npx playwright install chromium`.

## Processos

| Processo | Situação | Conteúdo |
|---|---|---|
| [Registro de Programa de Computador (Software)](processos/registro-software/) | AS-IS e TO-BE concluídos | **AS-IS:** modelo completo, macroprocesso em 7 etapas, relatório, arquitetura de processos, SIPOC e RACI. **[TO-BE](processos/registro-software/to-be/):** processo futuro com a Plataforma de Gestão de PI (completo, macro e 7 etapas), gargalos × melhorias, sistemas, automações, exceções, aderência às restrições, KPIs e requisitos |

## Estrutura

```
processos/
└── registro-software/
    ├── as-is/      modelo AS-IS completo (.bpmn + imagem)
    ├── macro/      macroprocesso: as 7 etapas encadeadas
    ├── etapas/     um diagrama por etapa (01 a 07)
    ├── docs/       relatório AS-IS e documento do macroprocesso (arquitetura, SIPOC, RACI)
    ├── fontes/     definições JSON das quais os .bpmn são gerados
    ├── scripts/    geração das etapas e da documentação deste processo
    └── to-be/      estado futuro: completo, macro/, etapas/, docs/, fontes/, scripts/
ferramentas/        gerador, layout com raias, divisão em etapas, validação, renderização e editor
```

## Ferramentas

Feitas sobre a pilha [bpmn.io](https://bpmn.io): bpmn-js, bpmn-moddle, bpmn-auto-layout e bpmnlint.

| Comando | O que faz |
|---|---|
| `npm run build -- <def.json> <saida.bpmn>` | Gera BPMN 2.0 com diagrama a partir de uma definição JSON |
| `npm run check -- <def.json>` | Checa a consistência: início alcança fim, raias, rótulos de gateway, mensagens e call activities |
| `npx bpmnlint <arquivo.bpmn>` | Valida as regras BPMN (configuração em `.bpmnlintrc`) |
| `npm run render -- <arquivo.bpmn>` | Gera SVG e PNG, um por plano (inclusive drill-downs) |
| `npm run editor` | Editor visual local com gravação no projeto |
| `npm run comparar -- <antes.bpmn> <depois.bpmn>` | Mostra o que mudou entre duas versões de um diagrama (elementos, nomes, ligações, raias e posições) |
| `python3 -I ferramentas/dividir_etapas.py <fonte.json> <pasta>` | Gera os diagramas por etapa e o macroprocesso a partir de uma fonte com `"etapa"` em cada nó |

### Formato da definição (JSON)

```json
{
  "id": "Processo_X", "name": "Nome do processo",
  "pools": [
    { "id": "Pool_A", "name": "Organização", "processId": "Processo_X",
      "lanes": [{ "id": "L_a", "name": "Área A" }, { "id": "L_b", "name": "Área B" }],
      "nodes": [
        { "id": "ini", "type": "start", "name": "Início", "lane": "L_a" },
        { "id": "t1", "type": "user", "name": "Tarefa", "lane": "L_b", "status": "nova", "note": "Anotação" },
        { "id": "fim", "type": "end", "name": "Fim", "lane": "L_b" }
      ],
      "flows": [["ini", "t1"], ["t1", "fim", "rótulo opcional"]],
      "groups": [{ "id": "G1", "name": "Rótulo do grupo", "nodes": ["t1"] }] },
    { "id": "Pool_B", "name": "Participante externo", "blackbox": true, "color": { "fill": "#e3f0fb", "stroke": "#1565c0" } }
  ],
  "messageFlows": [["t1", "Pool_B", "rótulo opcional"]]
}
```

- **Tipos de nó:** `start`, `end`, `task`, `user`, `service`, `script`, `manual`, `send`, `receive`, `business`, `xor`, `and`, `or`, `event` (gateway baseado em eventos), `catch`, `throw`, `subprocess` e `call` (call activity, com `"calls": "<processId>"`).
- **Eventos:** `"event"` pode ser `message`, `timer`, `conditional`, `link`, `terminate` ou `signal`. `"link"` dá o nome do par de links.
- **Marcação:** `"status"` pode ser `nova` (verde) ou `confirmar` (laranja). Sem status, a atividade é a original. `"note"` cria uma anotação ligada ao nó.
- **Dicas de layout:** `"under": "<id>"` coloca o nó logo abaixo de outro; `"shift": n` empurra o nó n colunas para a direita.
- **Subprocessos:** um `subprocess` com `nodes` vira etapa recolhida com drill-down; sem `nodes`, fica recolhido sem conteúdo.
- **Eventos de borda:** `{"type": "boundary", "attachedTo": "<id>", "event": "timer", "interrupting": false, "timer": "P5D"}` (prazos, lembretes e exceções).
- **Pools e raias:** `"blackbox": true` cria um participante sem processo (caixa-preta); `"color"` destaca uma pool ou raia.
- **Formato simples:** também é aceito o formato de uma pool só (`lanes`/`nodes`/`flows` no topo). Sem raias, o layout é feito pelo `bpmn-auto-layout`.
- **Nomes:** todo elemento precisa de `name`, exceto os gateways de junção (regra `label-required` do bpmnlint).
