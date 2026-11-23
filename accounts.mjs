import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { scrypt } from 'node:crypto';
import { normalizeRegistration } from './registration.mjs';

const deriveKey = promisify(scrypt);
const dummySalt = randomBytes(16).toString('hex');
const dummyKey = scryptSync(randomBytes(32), dummySalt, 64);
export const sessionLifetimeMs = 24 * 60 * 60 * 1000;

const digest = (token) => createHash('sha256').update(token).digest('hex');

export async function initializeAccounts(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      display_name text NOT NULL,
      email text NOT NULL UNIQUE,
      password_salt text NOT NULL,
      password_key text NOT NULL
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS account_sessions (
      token_hash text PRIMARY KEY,
      account_id integer NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      expires_at timestamptz NOT NULL
    )
  `);
}

export async function registerAccount(db, input) {
  const { displayName, email, password } = normalizeRegistration(input);
  const salt = randomBytes(16).toString('hex');
  const key = await deriveKey(password, salt, 64);
  const result = await db.query(`
    INSERT INTO accounts (display_name, email, password_salt, password_key)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (email) DO NOTHING
    RETURNING id, display_name AS "displayName"
  `, [displayName, email, salt, key.toString('hex')]);
  return result.rows[0];
}

export async function signIn(db, input) {
  if (typeof input?.email !== 'string' || typeof input?.password !== 'string' ||
      input.email.length > 254 || input.password.length < 12 || input.password.length > 128) {
    return;
  }
  const result = await db.query(`
    SELECT id, display_name AS "displayName", password_salt, password_key
    FROM accounts WHERE email = $1
  `, [input.email.trim().toLowerCase()]);
  const account = result.rows[0];
  const actual = await deriveKey(input.password, account?.password_salt ?? dummySalt, 64);
  const expected = account ? Buffer.from(account.password_key, 'hex') : dummyKey;
  if (!timingSafeEqual(actual, expected) || !account) return;

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + sessionLifetimeMs);
  await db.query(
    'INSERT INTO account_sessions (token_hash, account_id, expires_at) VALUES ($1, $2, $3)',
    [digest(token), account.id, expiresAt]
  );
  return { token, account: { id: account.id, displayName: account.displayName } };
}

export async function getAccount(db, token) {
  if (!token) return;
  const result = await db.query(`
    SELECT accounts.id, accounts.display_name AS "displayName"
    FROM account_sessions
    JOIN accounts ON accounts.id = account_sessions.account_id
    WHERE token_hash = $1 AND expires_at > CURRENT_TIMESTAMP
  `, [digest(token)]);
  return result.rows[0];
}

export async function signOut(db, token) {
  if (token) await db.query('DELETE FROM account_sessions WHERE token_hash = $1', [digest(token)]);
}
