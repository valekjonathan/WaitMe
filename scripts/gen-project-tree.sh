#!/bin/bash
# Genera devcontext/project-tree.txt para ChatGPT
cd "$(dirname "$0")/.."
OUT="devcontext/project-tree.txt"
mkdir -p devcontext
if command -v tree &>/dev/null; then
  tree -L 4 -I 'node_modules|dist|coverage|playwright-report|test-results|DerivedData|.git' > "$OUT" 2>/dev/null
else
  find . -maxdepth 4 -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' -not -path '*/DerivedData/*' 2>/dev/null | sort | head -600 > "$OUT"
fi
echo "Generated $OUT"
