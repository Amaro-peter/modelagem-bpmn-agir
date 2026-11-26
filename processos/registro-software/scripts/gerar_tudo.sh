#!/usr/bin/env bash
# Regera todos os artefatos do processo "Registro de software" a partir das fontes JSON.
# Uso (na raiz do repositório): npm run registro-software
set -euo pipefail
cd "$(dirname "$0")/../../.."
P=processos/registro-software

python3 -I $P/scripts/gerar_etapas.py            # fontes/etapas/*.json a partir do AS-IS

node ferramentas/build.js $P/fontes/registro-software-asis.json $P/as-is/registro-software-asis.bpmn
node ferramentas/build.js $P/fontes/etapas/00-macro.json $P/macro/00-macro.bpmn
for f in $P/fontes/etapas/0[1-7]-*.json; do
  node ferramentas/build.js "$f" "$P/etapas/$(basename "$f" .json).bpmn"
done

for f in $P/as-is/*.bpmn $P/macro/*.bpmn $P/etapas/*.bpmn; do
  node ferramentas/render.js "$f" >/dev/null
done

python3 -I $P/scripts/gerar_doc.py                # docs/macroprocesso-registro-software.md
echo "ok: artefatos regerados em $P"
