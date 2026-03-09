/**
 * Ruta GET /context/latest
 * Devuelve el último contexto agregado (desde cache local).
 */
import { Router } from 'express';
import { readContext } from '../lib/contextReader.js';
import { info } from '../lib/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = path.join(__dirname, '../../.cache/latest-context.json');

export const contextRouter = Router();

contextRouter.get('/latest', async (req, res) => {
  try {
    const owner = process.env.REPO_OWNER || 'valekjonathan';
    const repo = process.env.REPO_NAME || 'WaitMe';
    const token = process.env.GITHUB_TOKEN;

    if (fs.existsSync(CACHE_PATH)) {
      const cached = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
      const age = Date.now() - new Date(cached.fetched_at).getTime();
      if (age < 5 * 60 * 1000) {
        return res.json(cached);
      }
    }

    const context = await readContext(owner, repo, 'main', token);
    const cacheDir = path.dirname(CACHE_PATH);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    fs.writeFileSync(CACHE_PATH, JSON.stringify(context, null, 2), 'utf8');
    info('context/latest', 'fetched and cached');
    res.json(context);
  } catch (err) {
    info('context/latest error', err?.message);
    if (fs.existsSync(CACHE_PATH)) {
      const cached = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
      return res.json(cached);
    }
    res.status(500).json({
      error: 'Failed to fetch context',
      message: err?.message,
    });
  }
});
