# Estado Home — WaitMe

**Última actualización:** 2026-03-10 18:18

---

## Formato obligatorio

- **Home renderiza sí/no** — cuándo
- **logo visible sí/no** — HomeHeader
- **frases visibles sí/no** — textos
- **botones visibles sí/no** — HomeActions
- **WAITME BUILD TEST visible sí/no** — marca dev
- **causa actual si falla** — diagnóstico

---

## Home renderiza sí/no

- **Sí** cuando user != null y ruta /
- AuthRouter → Layout (Home) si user existe

---

## logo visible sí/no

- **Sí** en código — HomeHeader img 212x212
- Depende de Home renderizado (auth)

---

## frases visibles sí/no

- **Sí** en código — "WaitMe!", "Aparca donde te avisen!"

---

## botones visibles sí/no

- **Sí** en código — HomeActions Buscar, Crear

---

## WAITME BUILD TEST visible sí/no

- **Sí** con VITE_IOS_DEV_BUILD=1 (ios:refresh)
- fixed bottom-3 right-3

---

## causa actual si falla

- Si Home no se ve: probablemente user null (auth). Revisar [AUTH STEP].
