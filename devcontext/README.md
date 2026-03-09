# devcontext/ — Contexto vivo para ChatGPT

Esta carpeta se sube a GitHub. ChatGPT puede leer estos archivos directamente desde el repo.

## Contenido

| Archivo | Descripción |
|---------|-------------|
| waitme-live-context.zip | Snapshot del proyecto (src, scripts, docs, configs). Sin node_modules, ios, dist. |
| latest-simulator.png | Captura del simulador iOS tras último cambio |
| latest-simulator-after-login.png | Captura tras login (si el cambio afecta auth) |
| project-tree.txt | Estructura del proyecto (tree -L 4 o find) |

## Generación

Tras cada cambio relevante, Cursor ejecuta el protocolo live-context:
1. Actualiza docs/
2. Genera ZIP
3. Genera screenshot
4. Genera project-tree
5. git add docs devcontext && git commit -m "devcontext update" && git push
