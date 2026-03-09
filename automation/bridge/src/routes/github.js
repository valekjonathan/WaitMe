import { Router } from 'express';
import { verifyGithubWebhook } from '../githubWebhook.js';

export const githubRouter = Router();

githubRouter.post('/', (req, res) => {
  const rawBody = req.body; // Buffer (express.raw)
  const signature = req.headers['x-hub-signature-256'];
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (secret && signature) {
    const isValid = verifyGithubWebhook(rawBody, signature, secret);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  const payload = JSON.parse(rawBody.toString());
  const event = req.headers['x-github-event'];

  console.log('[github] Event:', event, 'Repo:', payload.repository?.full_name);

  res.status(200).json({ received: true, event });
});
