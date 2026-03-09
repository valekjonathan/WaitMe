/**
 * Integración OpenAI Agents SDK (esqueleto).
 * TODO: Implementar cuando se tenga API key y se desee conectar.
 *
 * Flujo previsto:
 * 1. Recibir webhook de GitHub con push
 * 2. Descargar devcontext/waitme-live-context.zip o docs/ desde GitHub
 * 3. Pasar contexto a OpenAI
 * 4. Agente responde con estado actual o siguiente paso
 */

export async function processWithOpenAI(context) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log('[openai] OPENAI_API_KEY not set, skipping');
    return null;
  }
  // TODO: Llamar a OpenAI Agents SDK
  return { status: 'not_implemented', context };
}
