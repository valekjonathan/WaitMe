/**
 * Integración OpenAI Agents SDK / MCP / Apps SDK (esqueleto).
 *
 * DÓNDE SE INYECTARÁ EL CONTEXTO:
 * - context: objeto de readContext() con repo, docs_status, auth_status, ios_status, etc.
 * - Se pasará como system message o tool context a la API de OpenAI
 *
 * CÓMO SE EXPONDRÁ COMO HERRAMIENTA:
 * - Endpoint POST /openai/chat que reciba { message } y devuelva respuesta con contexto
 * - O MCP server que exponga "get_waitme_context" como herramienta
 * - O Apps SDK que registre el bridge como fuente de datos
 *
 * QUÉ FALTA PARA CONECTAR CHATGPT:
 * 1. OPENAI_API_KEY en .env
 * 2. Implementar llamada a OpenAI API (Chat Completions o Agents SDK)
 * 3. Pasar context como contexto del sistema
 * 4. Configurar ChatGPT Custom GPT o MCP para que apunte al bridge
 * 5. (Opcional) MCP server en el bridge que ChatGPT pueda conectar
 */
import { info } from './lib/logger.js';

export async function processWithOpenAI(context) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    info('openai', 'OPENAI_API_KEY not set, skipping');
    return { status: 'not_configured', context };
  }

  // TODO: Llamar a OpenAI Agents SDK o Chat Completions
  // const response = await openai.chat.completions.create({
  //   model: 'gpt-4',
  //   messages: [
  //     { role: 'system', content: `Contexto WaitMe: ${JSON.stringify(context)}` },
  //     { role: 'user', content: userMessage }
  //   ]
  // });

  return {
    status: 'skeleton',
    message: 'Implementar llamada a OpenAI API',
    context_keys: Object.keys(context || {}),
  };
}
