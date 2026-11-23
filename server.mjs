import pg from 'pg';
import { initializeAccounts } from './accounts.mjs';
import { createApp } from './app.mjs';

if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before starting Fairway Match');
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
db.on('error', (error) => console.error('Idle database connection failed', error.code ?? error.name));
await initializeAccounts(db);

const secureCookies = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT ?? 8080);
const server = createApp(db, { secureCookies }).listen(port, '0.0.0.0', () => {
  console.log(`Fairway Match listening on port ${port}`);
});

process.once('SIGTERM', () => {
  server.close(() => void db.end());
});
