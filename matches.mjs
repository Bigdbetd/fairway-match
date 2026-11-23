export async function initializeMatches(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS golf_matches (
      id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      organizer_id integer NOT NULL REFERENCES accounts(id),
      course text NOT NULL,
      tee_time timestamptz NOT NULL,
      format text NOT NULL CHECK (format IN ('casual', 'stroke', 'match')),
      capacity integer NOT NULL CHECK (capacity BETWEEN 2 AND 4),
      players integer[] NOT NULL,
      CHECK (cardinality(players) BETWEEN 1 AND capacity)
    )
  `);
}

const matchFields = 'id, organizer_id AS "organizerId", course, tee_time AS "teeTime", format, capacity, cardinality(players) AS "playerCount"';

export async function createMatch(db, organizerId, input) {
  const course = typeof input?.course === 'string' ? input.course.trim() : '';
  const teeTime = Date.parse(input?.teeTime);
  const { format, capacity } = input ?? {};
  if (course.length < 2 || course.length > 100 ||
      typeof input?.teeTime !== 'string' || !Number.isFinite(teeTime) || teeTime <= Date.now() ||
      !['casual', 'stroke', 'match'].includes(format) ||
      !Number.isInteger(capacity) || capacity < 2 || capacity > 4) return;

  const { rows } = await db.query(`
    INSERT INTO golf_matches (organizer_id, course, tee_time, format, capacity, players)
    VALUES ($1, $2, $3, $4, $5, ARRAY[$1]::integer[])
    RETURNING ${matchFields}
  `, [organizerId, course, new Date(teeTime), format, capacity]);
  return rows[0];
}

export async function listMatches(db, accountId) {
  const { rows } = await db.query(`
    SELECT ${matchFields}, $1 = ANY(players) AS joined
    FROM golf_matches
    WHERE tee_time > CURRENT_TIMESTAMP
      AND (cardinality(players) < capacity OR $1 = ANY(players))
    ORDER BY tee_time, id
  `, [accountId]);
  return rows;
}

export async function joinMatch(db, accountId, matchId) {
  // One row update claims the slot. PostgreSQL rechecks these conditions
  // after any concurrent update to the same match.
  const { rows } = await db.query(`
    UPDATE golf_matches
    SET players = array_append(players, $1)
    WHERE id = $2 AND tee_time > CURRENT_TIMESTAMP
      AND cardinality(players) < capacity AND NOT ($1 = ANY(players))
    RETURNING ${matchFields}
  `, [accountId, matchId]);
  return rows[0];
}
