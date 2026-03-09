/**
 * WaitMe Automation Bridge
 * Recibe webhooks de GitHub, se comunica con OpenAI Agents SDK.
 */
import express from 'express';
import { healthRouter } from './routes/health.js';
import { githubRouter } from './routes/github.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Webhook necesita body raw para verificar firma HMAC
app.use('/webhook/github', express.raw({ type: 'application/json' }), githubRouter);
app.use(express.json());
app.use('/health', healthRouter);

app.get('/', (req, res) => {
  res.json({
    name: 'waitme-automation-bridge',
    version: '0.1.0',
    endpoints: ['/health', '/webhook/github', '/ping'],
  });
});

app.post('/ping', (req, res) => {
  const { repo, status } = req.body || {};
  console.log('[bridge] Ping:', repo, status);
  res.json({ received: true });
});

app.listen(PORT, () => {
  console.log(`[bridge] Listening on port ${PORT}`);
});
