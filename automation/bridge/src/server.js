/**
 * WaitMe Automation Bridge
 * GitHub Webhook → Context → OpenAI (futuro)
 */
import { createRequire } from 'module';
import express from 'express';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');
import { healthRouter } from './routes/health.js';
import { githubRouter } from './routes/github.js';
import { contextRouter } from './routes/context.js';
import { info } from './lib/logger.js';

const app = express();
const PORT = process.env.PORT || 3000;
const VERSION = pkg.version || '0.2.0';

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    name: 'waitme-automation-bridge',
    version: VERSION,
    endpoints: ['/health', '/github-webhook', '/ping', '/context/latest'],
  });
});

app.use('/health', healthRouter);
app.use('/context', contextRouter);

app.post('/github-webhook', express.raw({ type: 'application/json' }), githubRouter);

app.post('/ping', (req, res) => {
  const { repo, status, timestamp } = req.body || {};
  info('ping', repo, status, timestamp);
  res.json({
    received: true,
    repo: repo || null,
    status: status || null,
    timestamp: timestamp || new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  info('Listening on port', PORT);
});
