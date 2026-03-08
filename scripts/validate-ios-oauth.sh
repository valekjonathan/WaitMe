#!/usr/bin/env bash
# Valida OAuth Google en iOS Simulator.
# 1. Build + sync + install
# 2. Ejecuta flujo Maestro (tap Continuar con Google → espera 120s para que completes login)
# Cuando Safari abra: inicia sesión con Google. Cuando aparezca "¿Abrir en WaitMe?", pulsa Abrir.
set -e
cd "$(dirname "$0")/.."

echo "=== Build + sync ==="
npm run build
npx cap sync ios

echo ""
echo "=== Detectando simulador booted ==="
BOOTED=$(xcrun simctl list devices | grep "Booted" | head -1 | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/')
if [ -z "$BOOTED" ]; then
  echo "No hay simulador booted. Arranca uno con: open -a Simulator"
  exit 1
fi
echo "Simulador: $BOOTED"

echo ""
echo "=== Instalando app ==="
npx cap run ios --target="$BOOTED"

echo ""
echo "=== Ejecutando flujo OAuth (tienes 120s para completar login en Safari) ==="
echo "Cuando Safari abra: inicia sesión con Google."
echo "Cuando aparezca '¿Abrir en WaitMe?', pulsa Abrir."
echo ""
export PATH="/opt/homebrew/opt/openjdk@17/bin:${PATH:-}"
export PATH="$HOME/.maestro/bin:${PATH:-}"
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true

if maestro test .maestro/flows/oauth-google-login.yaml; then
  echo ""
  echo "✅ Login Google validado: Home visible."
else
  echo ""
  echo "⚠️ El flujo no completó en 120s. Si completaste el login, verifica que Home se muestre."
fi
