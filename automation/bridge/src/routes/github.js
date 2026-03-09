/**
 * Ruta POST /github-webhook
 * Recibe eventos push de GitHub, valida firma, lee contexto y guarda snapshot.
 */
import { Router } from 'express';
import { verifyGithubWebhook } from '../githubWebhook.js';
import { readContext } from '../lib/contextReader.js';
import { info } from '../lib/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = path.join(__dirname, '../../.cache/latest-context.json');

export const githubRouter = Router();

githubRouter.post('/', async (req, res) => {
  const rawBody = req.body;
  const signature = req.headers['x-hub-signature-256'];
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (secret && signature) {
    const isValid = verifyGithubWebhook(rawBody, signature, secret);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString());
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const event = req.headers['x-github-event'];
  const repo = payload.repository;
  const branch = payload.ref?.replace('refs/heads/', '');

  info('github-webhook', event, repo?.full_name, branch, payload.after?.slice(0, 7));

  if (event === 'push' && branch === 'main') {
    try {
      const [owner, repoName] = (repo?.full_name || 'valekjonathan/WaitMe').split('/');
      const token = process.env.GITHUB_TOKEN;
      const context = await readContext(owner, repoName, branch, token);

      const cacheDir = path.dirname(CACHE_PATH);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      fs.writeFileSync(CACHE_PATH, JSON.stringify(context, null, 2), 'utf8');
      info('github-webhook', 'context saved to cache');
    } catch (err) {
      info('github-webhook', 'context fetch error', err?.message);
    }
  }

  res.status(200).json({
    received: true,
    event,
    repo: repo?.full_name,
    branch,
    commit: payload.after?.slice(0, 7),
  });
});
