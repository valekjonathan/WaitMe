#!/usr/bin/env node
/**
 * ChatGPT ↔ Repo Bridge — WaitMe
 * POST /task → write devcontext/CHATGPT_TASK.md
 * GET /state → return STATE_OF_TRUTH, NEXT_TASK, LATEST_MASTER_AUDIT
 * Runs on localhost:8787
 */
import { createServer } from 'http';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const DC = join(ROOT, 'devcontext');
const DOCS = join(ROOT, 'docs');

const PORT = 8787;

function readSafe(path, fallback = null) {
  try {
    if (existsSync(path)) return readFileSync(path, 'utf8');
  } catch (_) {}
  return fallback;
}

function jsonResponse(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  if (req.method === 'GET' && url.pathname === '/state') {
    const chatgptStatePath = join(DC, 'CHATGPT_STATE.json');
    if (existsSync(chatgptStatePath)) {
      try {
        const data = JSON.parse(readFileSync(chatgptStatePath, 'utf8'));
        return jsonResponse(res, data);
      } catch (_) {}
    }
    const stateOfTruth = readSafe(join(DC, 'STATE_OF_TRUTH.json'), '{}');
    const nextTask = readSafe(join(DC, 'NEXT_TASK.md'), '');
    const latestAudit = readSafe(join(DC, 'LATEST_MASTER_AUDIT.json'), '{}');
    let stateObj = {};
    try {
      stateObj = {
        state_of_truth: JSON.parse(stateOfTruth),
        next_task: nextTask,
        latest_master_audit: JSON.parse(latestAudit),
        exported_at: new Date().toISOString(),
      };
    } catch (_) {
      stateObj = {
        state_of_truth: stateOfTruth,
        next_task: nextTask,
        latest_master_audit: latestAudit,
        exported_at: new Date().toISOString(),
      };
    }
    return jsonResponse(res, stateObj);
  }

  if (req.method === 'POST' && url.pathname === '/task') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const data = body ? JSON.parse(body) : {};
        const task = data.task || data.content || body || '# No task provided';
        const taskPath = join(DC, 'CHATGPT_TASK.md');
        const content =
          typeof task === 'string'
            ? task
            : `# ChatGPT Task\n\n${task}\n\n---\nUpdated: ${new Date().toISOString()}`;
        writeFileSync(taskPath, content, 'utf8');
        jsonResponse(res, { ok: true, path: 'devcontext/CHATGPT_TASK.md' });
      } catch (e) {
        jsonResponse(res, { ok: false, error: e?.message }, 400);
      }
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/') {
    return jsonResponse(res, {
      name: 'waitme-chatgpt-bridge',
      port: PORT,
      endpoints: {
        'POST /task': 'Write task to devcontext/CHATGPT_TASK.md',
        'GET /state': 'Return project state',
      },
    });
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[bridge] ChatGPT bridge on http://localhost:${PORT}`);
});
