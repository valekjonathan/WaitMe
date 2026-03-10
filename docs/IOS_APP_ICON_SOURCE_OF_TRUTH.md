# iOS App Icon — Fuente de Verdad

---

## 1. Archivo fuente

**Único origen:**
```
src/assets/d2ae993d3_WaitMe.png
```

- 1024×1024 px
- Logo principal de WaitMe (badge cristal cuadrado)
- Usado en Home, Login, Header

---

## 2. Estrategia de generación

**Script:** `scripts/generate-ios-appicons.mjs`

1. Extrae región superior (top 700px) — badge sin texto
2. Trim — elimina márgenes negros
3. Crop cuadrado centrado
4. Resize a cada tamaño requerido
5. Sin canvas extra, sin padding

**Comando:**
```bash
npm run icons:ios
```

---

## 3. Salida

**Directorio:**
```
ios/App/App/Assets.xcassets/AppIcon.appiconset/
```

**Tamaños generados:** 20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024 px

---

## 4. Integración en pipeline

El flujo `npm run ios:device` ejecuta `npm run icons:ios` antes de `cap sync`, de modo que los iconos correctos se incluyen en cada build para iPhone.

---

## 5. Cómo verificar

- Ejecutar `npm run icons:ios`
- Revisar que `ios/App/App/Assets.xcassets/AppIcon.appiconset/` contiene los PNG
- Instalar en iPhone y comprobar que el icono ocupa todo el espacio (sin bordes/padding visibles)
