import { createRequire } from 'module';
import { Router } from 'express';

const require = createRequire(import.meta.url);
const VERSION = require('../../package.json').version || '0.2.0';

export const healthRouter = Router();

healthRouter.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: VERSION,
    service: 'waitme-automation-bridge',
  });
});
