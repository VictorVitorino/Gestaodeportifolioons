#!/usr/bin/env bash
# QA de regressão — roda a cada passo. Uso: bash labs/gestao-portfolio-feg/qa/qa.sh
set -e
cd "$(dirname "$0")/../../.."
echo "== build"; node labs/gestao-portfolio-feg/build.mjs
echo "== sintaxe"; for f in labs/gestao-portfolio-feg/src/*.js; do node --check "$f"; done
echo "== npm test"; npm test 2>&1 | grep -E "^# (pass|fail)"
echo "== npm run check"; npm run check >/dev/null && echo "check ok"
echo "== navegador"; node labs/gestao-portfolio-feg/qa/qa.cjs
echo "== manual interativo"; node labs/manual-portfolio-feg/build.mjs && node labs/manual-portfolio-feg/qa.cjs
