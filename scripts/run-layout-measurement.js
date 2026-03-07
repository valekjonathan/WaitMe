#!/usr/bin/env node
/**
 * Ejecuta mediciones de layout en el navegador.
 * Uso: npm run dev (en otra terminal) + node scripts/run-layout-measurement.js
 * O: npx playwright test tests/validation/measure-layout-real.spec.js --reporter=json 2>/dev/null | tail -1 | node -e "const d=require('fs').readFileSync(0,'utf8');console.log(d)"
 *
 * Alternativa: abrir http://localhost:5173, entrar en create, luego search,
 * y en consola ejecutar:
 *   copy(JSON.stringify({create: window.__WAITME_ZOOM_MEASURE, card: window.__WAITME_CARD_MEASURE}))
 */
console.log(`
Medición manual de layout:
1. npm run dev
2. Abrir http://localhost:5173
3. Clic "Estoy aparcado aquí" - esperar 2s
4. En consola: console.log(JSON.stringify(window.__WAITME_ZOOM_MEASURE, window.__WAITME_CARD_MEASURE))
5. Clic logo (waitme:goLogo) o recargar
6. Clic "¿Dónde quieres aparcar?" - esperar 2s
7. En consola: console.log(JSON.stringify(window.__WAITME_ZOOM_MEASURE, window.__WAITME_CARD_MEASURE))

Resultado esperado:
- createZoomTop, navigateZoomTop -> differenceZoom <= 1
- createCardBottom, navigateCardBottom -> differenceCard <= 1
`);
