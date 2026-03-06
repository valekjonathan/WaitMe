# WaitMe — Reglas Cursor

## Arquitectura
- React + Vite + Tailwind + Zustand
- Supabase (Postgres, Auth, Realtime, Storage)
- Mapbox para mapas
- Adapters en `src/data/*.js` → servicios en `src/services/*Supabase.js`

## Reglas
- NO tocar Home.jsx sin orden explícita
- NO modificar visuales no pedidos
- Supabase = única fuente de verdad
- NO crear mocks si existe flujo real
- Mobile-first
- Cambios mínimos, documentar archivos tocados

## Pantallas
Home, History, Chats, Chat, Notifications, Profile, Settings, Navigate

## Env obligatorias
VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_MAPBOX_TOKEN

## Docs
docs/CURSOR_RULES_WAITME.md, docs/SAFE_CHANGE_PROTOCOL.md, docs/WAITME_AGENT_CONTEXT.md
