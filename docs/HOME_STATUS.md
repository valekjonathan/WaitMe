# Estado Home — WaitMe

**Última actualización:** 2026-03-09

---

## Formato fijo

- **Home renderiza sí/no** — cuándo se muestra
- **Logo visible sí/no** — HomeHeader img
- **Frases visibles sí/no** — textos
- **Botones visibles sí/no** — HomeActions
- **WAITME BUILD TEST visible sí/no** — marca dev

---

## Home renderiza sí/no

- **Sí** cuando user != null y ruta es /
- AuthRouter muestra Layout (con Home) si user existe
- Si user null → Login

---

## Logo visible sí/no

- **Sí** en código — HomeHeader con img appLogo (212x212)
- Depende de que Home se renderice (auth ok)

---

## Frases visibles sí/no

- **Sí** en código — "WaitMe!", "Aparca donde te avisen!"
- HomeHeader, dentro del overlay

---

## Botones visibles sí/no

- **Sí** en código — HomeActions (Buscar, Crear)
- Overlay z-[100], pointer-events-auto en el bloque interno

---

## WAITME BUILD TEST visible sí/no

- **Sí** cuando VITE_IOS_DEV_BUILD=1 (ios:refresh)
- **No** en build normal (producción)
- fixed bottom-3 right-3, z-[9999]
