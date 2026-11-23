import express from 'express';
import { fileURLToPath } from 'node:url';
import { getAccount, registerAccount, sessionLifetimeMs, signIn, signOut } from './accounts.mjs';

import { createMatch, joinMatch, listMatches } from './matches.mjs';

const cookieName = 'fairway_session';

function readToken(req) {
  return req.headers.cookie?.match(/(?:^|;\s*)fairway_session=([a-f0-9]{64})(?:;|$)/)?.[1];
}

export function createApp(db, { secureCookies = true } = {}) {
  const app = express();
  app.disable('x-powered-by');
  const cookieOptions = { httpOnly: true, secure: secureCookies, sameSite: 'strict', path: '/' };

  app.use((_req, res, next) => {
    res.set({
      'Content-Security-Policy': "default-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer'
    });
    next();
  });
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (req.method === 'POST' && !req.is('application/json')) {
      return res.status(415).json({ error: 'Send an application/json request' });
    }
    next();
  });
  app.use('/api', express.json({ limit: '8kb' }));

  app.post('/api/accounts', async (req, res) => {
    let account;
    try {
      account = await registerAccount(db, req.body);
    } catch (error) {
      if (error instanceof TypeError) return res.status(400).json({ error: error.message });
      throw error;
    }
    if (!account) return res.status(409).json({ error: 'Unable to register with that email' });
    res.status(201).json({ account });
  });

  app.post('/api/sessions', async (req, res) => {
    const session = await signIn(db, req.body);
    if (!session) return res.status(401).json({ error: 'Invalid email or password' });
    res.cookie(cookieName, session.token, { ...cookieOptions, maxAge: sessionLifetimeMs });
    res.json({ account: session.account });
  });

  app.get('/api/session', async (req, res) => {
    const account = await getAccount(db, readToken(req));
    if (!account) return res.status(401).json({ error: 'Sign in to continue' });
    res.json({ account });
  });

  app.post('/api/logout', async (req, res) => {
    await signOut(db, readToken(req));
    res.clearCookie(cookieName, cookieOptions);
    res.sendStatus(204);
  });

  app.use('/api/matches', async (req, res, next) => {
    const account = await getAccount(db, readToken(req));
    if (!account) return res.status(401).json({ error: 'Sign in to manage matches' });
    res.locals.account = account;
    next();
  });

  app.post('/api/matches', async (req, res) => {
    const match = await createMatch(db, res.locals.account.id, req.body);
    if (!match) return res.status(400).json({ error: 'Enter a course, a future tee time, a format, and 2–4 players' });
    res.status(201).json({ match });
  });

  app.get('/api/matches', async (_req, res) => {
    res.json({ matches: await listMatches(db, res.locals.account.id) });
  });

  app.post('/api/matches/:id/join', async (req, res) => {
    const matchId = Number(req.params.id);
    if (!Number.isInteger(matchId) || matchId < 1 || matchId > 2147483647) {
      return res.status(400).json({ error: 'Invalid match identifier' });
    }
    const match = await joinMatch(db, res.locals.account.id, matchId);
    if (!match) return res.status(409).json({ error: 'Match is unavailable or you already joined' });
    res.json({ match });
  });

  app.use(express.static(fileURLToPath(new URL('./public/', import.meta.url))));
  app.use((error, _req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Request is too large' });
    console.error('API request failed', error.code ?? error.name);
    res.status(500).json({ error: 'Unable to process the request' });
  });
  return app;
}
