import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { initializeAccounts } from '../accounts.mjs';
import { initializeMatches } from '../matches.mjs';
import { createApp } from '../app.mjs';

test('golfers can create, find, and join a match subject to capacity', async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await initializeAccounts(db);
  await initializeMatches(db);
  const server = createApp(db).listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;

  function post(path, data, cookie = '') {
    return fetch(base + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json', cookie },
      body: JSON.stringify(data)
    });
  }

  async function golfer(name) {
    const credentials = { email: `${name}@example.com`, password: 'test-only-passphrase' };
    assert.equal((await post('/api/accounts', { ...credentials, displayName: name })).status, 201);
    const response = await post('/api/sessions', credentials);
    assert.equal(response.status, 200);
    return response.headers.get('set-cookie').split(';')[0];
  }

  const host = await golfer('host');
  const guest = await golfer('guest');
  const extra = await golfer('extra');
  const details = {
    course: 'Lake Club', teeTime: new Date(Date.now() + 86400000).toISOString(),
    format: 'casual', capacity: 2
  };
  assert.equal((await post('/api/matches', details)).status, 401);
  assert.equal((await post('/api/matches', { ...details, capacity: 1 }, host)).status, 400);
  assert.equal((await post('/api/matches', { ...details, teeTime: '2000-01-01T12:00:00Z' }, host)).status, 400);
  const created = await post('/api/matches', details, host);
  assert.equal(created.status, 201);
  const { match } = await created.json();
  assert.equal(match.playerCount, 1);
  const browse = (cookie) => fetch(base + '/api/matches', { headers: { cookie } }).then((res) => res.json());
  assert.equal((await browse(guest)).matches[0].course, details.course);
  const join = (cookie) => post(`/api/matches/${match.id}/join`, {}, cookie);
  assert.equal((await join(host)).status, 409);
  const results = await Promise.all([join(guest), join(extra)]);
  assert.deepEqual(results.map((result) => result.status).sort(), [200, 409]);
  const winner = results[0].status === 200 ? guest : extra;
  const loser = winner === guest ? extra : guest;
  assert.equal((await browse(winner)).matches[0].joined, true);
  assert.equal((await browse(winner)).matches[0].playerCount, 2);
  assert.deepEqual((await browse(loser)).matches, []);
  assert.equal((await join(winner)).status, 409);
});
