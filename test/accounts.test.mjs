import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { initializeAccounts } from '../accounts.mjs';
import { createApp } from '../app.mjs';
import { normalizeRegistration } from '../registration.mjs';

const password = ' an exact password ';
const credentials = { email: ' golfer@example.com ', password };
const registration = { ...credentials, displayName: ' Drew ' };

test('registration validation preserves passwords and rejects malformed email', () => {
  assert.deepEqual(normalizeRegistration(registration), {
    displayName: 'Drew', email: 'golfer@example.com', password
  });
  assert.throws(() => normalizeRegistration({ ...registration, email: 'golfer@examplecom' }), TypeError);
  assert.throws(() => normalizeRegistration({ ...registration, password: 'short' }), TypeError);
});

test('a golfer can register, sign in, recover their session, and sign out', async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await initializeAccounts(db);

  const server = createApp(db).listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await once(server, 'listening');

  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body, cookie) => fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body)
  });
  const session = (cookie) => fetch(base + '/api/session', { headers: { cookie } });

  const home = await fetch(base);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /Create an account/);
  assert.equal((await post('/api/accounts', { ...registration, password: 'short' })).status, 400);
  const created = await post('/api/accounts', registration);
  assert.equal(created.status, 201);
  assert.deepEqual(await created.json(), { account: { id: 1, displayName: 'Drew' } });
  assert.equal((await post('/api/accounts', { ...registration, email: 'GOLFER@example.com' })).status, 409);
  const saved = (await db.query('SELECT password_key, password_salt FROM accounts')).rows[0];
  assert.match(saved.password_key, /^[0-9a-f]{128}$/);
  assert.match(saved.password_salt, /^[0-9a-f]{32}$/);
  assert.equal((await post('/api/sessions', { ...credentials, password: password.trim() })).status, 401);
  assert.equal((await post('/api/sessions', { ...credentials, email: 'unknown@example.com' })).status, 401);

  const signedIn = await post('/api/sessions', credentials);
  assert.equal(signedIn.status, 200);
  const header = signedIn.headers.get('set-cookie');
  assert.match(header, /HttpOnly/);
  assert.match(header, /SameSite=Strict/);
  assert.match(header, /Secure/);
  const cookie = header.split(';')[0];
  const persisted = (await db.query('SELECT token_hash FROM account_sessions')).rows[0];
  assert.notEqual(persisted.token_hash, cookie.split('=')[1]);
  assert.deepEqual(await (await session(cookie)).json(), { account: { id: 1, displayName: 'Drew' } });

  await db.query("UPDATE account_sessions SET expires_at = CURRENT_TIMESTAMP - INTERVAL '1 minute'");
  assert.equal((await session(cookie)).status, 401);
  const newSignIn = await post('/api/sessions', credentials);
  const freshCookie = newSignIn.headers.get('set-cookie').split(';')[0];
  assert.equal((await post('/api/logout', {}, freshCookie)).status, 204);
  assert.equal((await session(freshCookie)).status, 401);
});
