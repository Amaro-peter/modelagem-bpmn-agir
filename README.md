# Modelagem BPMN – AGIR/UFF

Modelos de processo em **BPMN 2.0** da AGIR (Agência de Inovação da UFF), com a documentação de apoio da metodologia BPM e as ferramentas usadas para gerá-los.

## Processos

| Processo | Situação | Conteúdo |
|---|---|---|
| [Registro de Programa de Computador (Software)](processos/registro-software/) | AS-IS concluído | Modelo AS-IS completo, macroprocesso em 7 etapas, relatório AS-IS, arquitetura de processos, SIPOC e RACI |

## Estrutura

```
processos/
└── registro-software/
    ├── as-is/      modelo AS-IS completo (.bpmn + imagem)
    ├── macro/      macroprocesso: as 7 etapas encadeadas
    ├── etapas/     um diagrama por etapa (01 a 07)
    ├── docs/       relatório AS-IS e documento do macroprocesso (arquitetura, SIPOC, RACI)
    ├── fontes/     definições JSON das quais os .bpmn são gerados
    └── scripts/    geração das etapas e da documentação deste processo
ferramentas/        gerador, layout com raias, validação, renderização e editor
```

## Como visualizar

- **No GitHub:** as imagens `.png` ao lado de cada `.bpmn` mostram os diagramas.
- **Para abrir ou editar:** carregue o `.bpmn` em [bpmn.io](https://demo.bpmn.io), no Camunda Modeler ou em qualquer ferramenta BPMN 2.0. As cores (atividade original ou nova) seguem o padrão *BPMN in Color*.
- **No editor local deste repositório:**
  ```bash
  npm install
  npm run editor
  # abrir http://localhost:8080/ferramentas/editor.html?file=processos/registro-software/macro/00-macro.bpmn
  ```
  O botão **Salvar no projeto** (Ctrl+S) grava o arquivo de volta no próprio caminho.

## Como regerar

Os `.bpmn`, as imagens e o documento do macroprocesso são gerados a partir das fontes JSON:

```bash
npm install
npm run registro-software   # regera AS-IS, macro, etapas, imagens e documentação
npm run validar             # bpmnlint + checagem de consistência em todos os modelos
```

Para renderizar as imagens, é preciso ter um Chromium instalado pelo Playwright (`npx playwright install chromium`), ou indicar o executável em `CHROMIUM_PATH`.

## Ferramentas

Feitas sobre a pilha [bpmn.io](https://bpmn.io): bpmn-js, bpmn-moddle, bpmn-auto-layout e bpmnlint.

| Comando | O que faz |
|---|---|
| `npm run build -- <def.json> <saida.bpmn>` | Gera BPMN 2.0 com diagrama a partir de uma definição JSON |
| `npm run check -- <def.json>` | Checa a consistência: início alcança fim, raias, rótulos de gateway, mensagens e call activities |
| `npx bpmnlint <arquivo.bpmn>` | Valida as regras BPMN (configuração em `.bpmnlintrc`) |
| `npm run render -- <arquivo.bpmn>` | Gera SVG e PNG, um por plano (inclusive drill-downs) |
| `npm run editor` | Editor visual local com gravação no projeto |

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
- **Pools:** `"blackbox": true` cria um participante sem processo (caixa-preta); `"color"` destaca a pool.
- **Formato simples:** também é aceito o formato de uma pool só (`lanes`/`nodes`/`flows` no topo). Sem raias, o layout é feito pelo `bpmn-auto-layout`.
- **Nomes:** todo elemento precisa de `name`, exceto os gateways de junção (regra `label-required` do bpmnlint).
