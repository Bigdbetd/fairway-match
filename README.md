# Fairway Match

Fairway Match is a golf matchmaking application in development for recreational golfers, college students, and local golf groups. It brings player discovery, tournament partner openings, and friendly competition into one place.

## Planned core features
- Player profiles with city, skill level, and availability.
- Match creation with course, date, format, participants, optional agreed stakes, and final results. Payments are handled outside the app.
- Partner finder for rounds and tournaments.
- Squads that can challenge other groups.

## Technology stack
- Frontend: HTML, CSS, and JavaScript served by Express for the MVP. React and Vite were in the original plan.
- Backend: Node.js and Express REST API
- Database: PostgreSQL
- Containers: Docker and Docker Compose
- Account testing: Node.js test runner with an embedded PostgreSQL engine (PGlite)
- CI/CD: GitHub Actions
- Deployment: Google Cloud Run for frontend/backend and Cloud SQL for PostgreSQL
- Coding assistant: GitHub Copilot, with generated code reviewed and tested

## AI integration strategy
The final release will include an AI match-description assistant through a backend API. It will turn non-sensitive match details into an editable invitation. Users review the text before saving it. API keys remain on the server; failures leave manual match creation available. Copilot will also assist development, debugging, and test generation. Confirm the course AI requirements against the Final Project Overview before implementation.

## Delivery plan
- Sprint 1, through the end of Unit 12: MVP with account access, profiles, match creation/listing, joining a match, persistent data, tests, and a deployed application.
- Sprint 2, Units 13-14: player discovery, partner finder, squads/challenges, agreed stakes/results, AI description assistant, expanded tests, and final documentation.

## Project status
The Unit 12 MVP lets a golfer register and sign in, create a round, and let another signed-in golfer find and join it. The host takes one seat. Once a match fills, it stays visible to the golfers who joined it.

| Sprint work | Status |
| --- | --- |
| FM-4 Account access | Implemented in [PR #1](https://github.com/Bigdbetd/fairway-match/pull/1) |
| FM-7 Match creation | Implemented in [PR #2](https://github.com/Bigdbetd/fairway-match/pull/2) |
| FM-8 Browse and join | Implemented in [PR #3](https://github.com/Bigdbetd/fairway-match/pull/3) |
| FM-5 Profile editing | Deferred to keep Sprint 1 focused on the round flow |
| FM-14 Deployment | Container configuration and Docker verification workflow added. A Cloud Run deployment still requires authorized project access and a PostgreSQL connection. |

## Run with Docker

From the repository root, run:

```sh
docker compose up --build -d
```

Open http://localhost:8080. Register and sign in, then create a round at least a few minutes in the future. Use a private window to register and sign in with a second account. Find the round and select **Join match**. Return to the organizer window and select **Refresh matches** to see the updated count.

Compose starts a local PostgreSQL 16 service alongside the app. The included database credentials are for local development, and the database is reachable only inside the Compose network. Run `docker compose down` to stop the containers. The named volume preserves the local data. To run the automated round flow against this stack, install the test dependencies with `npm ci` and run:

```sh
FAIRWAY_TEST_URL=http://127.0.0.1:8080 node --test test/matches.test.mjs
```

The [MVP Docker verification workflow](https://github.com/Bigdbetd/fairway-match/actions/workflows/mvp-docker.yml) runs the Docker Compose flow on Ubuntu 22.04 and 24.04.

## Manual Cloud Run deployment

Use a Google Cloud project with billing and the Cloud Run, Cloud Build, Artifact Registry, and Secret Manager APIs available. Create a Secret Manager secret called `fairway-match-database-url` containing the connection URL for a PostgreSQL database reachable from Cloud Run. Grant the service identity access to the secret. The database role must be able to create the application tables, and the database connection should use TLS as required by the provider.

From a clean checkout, substitute your project and region in the commands below. Cloud Build uses the repository's Dockerfile.

```sh
gcloud run deploy fairway-match --source . \
  --project PROJECT_ID --region REGION \
  --update-secrets DATABASE_URL=fairway-match-database-url:latest \
  --allow-unauthenticated

gcloud run services describe fairway-match \
  --project PROJECT_ID --region REGION --format='value(status.url)'
```

Record the service URL and the deployment result in the submission. If the revision fails to start, inspect its Cloud Run logs for database reachability, secret access, or startup errors.

## Run locally without Docker

Use Node.js 22 or later and a PostgreSQL database. Give the application database role permission to create its account and session tables on startup.

```sh
npm ci
export DATABASE_URL='postgresql://USER:PASSWORD@localhost:5432/fairway_match'
npm start
```

Open http://localhost:8080, create an account, and then sign in with the same email and password. Refresh to check session restoration and select **Sign out** to end the session. Set `PORT` to override 8080. Keep database credentials outside source control. Set `NODE_ENV=production` when serving through HTTPS so the session cookie is marked Secure.

Run `npm test` to verify the browser entry page and the account HTTP API against an embedded PostgreSQL engine. The test covers validation, normalized and duplicate email addresses, password hashing, failed sign-in, session expiry, and sign-out. The round test also covers future tee times, duplicate joins, and competing claims for the final seat.

## AI development example

GitHub Copilot drafted `normalizeRegistration` in [registration.mjs](registration.mjs). This part of the draft normalizes account identifiers and preserves the exact password supplied by the golfer.

```js
const normalizedName = displayName.trim();
const normalizedEmail = email.trim().toLowerCase();
return { displayName: normalizedName, email: normalizedEmail, password };
```

ChatGPT adapted the implementation, used an escaped dot for the email domain separator, and added automated tests for malformed email and password preservation. It also implemented the Express and PostgreSQL integration and tested the HTTP account lifecycle. ChatGPT also implemented and tested the match flow, including the database update that prevents golfers from overbooking the last seat, and prepared the Docker setup.

## Documentation
- [Jira backlog and sprint plan](https://drewsworkspace-98efd31d.atlassian.net/jira/software/projects/FM/boards/1/backlog)
- [Confluence Project Overview](https://drewsworkspace-98efd31d.atlassian.net/wiki/spaces/FM/overview)

Jira contains 3 epics, 11 user stories with acceptance criteria, 22 implementation subtasks, and 2 planned sprints. Confluence is connected through the Jira Docs tab.

Public viewing is not enabled: the current Free plans restrict anonymous permission configuration.

