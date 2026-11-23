# Fairway Match

Fairway Match is a golf matchmaking application in development for recreational golfers, college students, and local golf groups. It brings player discovery, tournament partner openings, and friendly competition into one place.

## Planned core features
- Player profiles with city, skill level, and availability.
- Match creation with course, date, format, participants, optional agreed stakes, and final results. Payments are handled outside the app.
- Partner finder for rounds and tournaments.
- Squads that can challenge other groups.

## Technology stack
- Frontend: HTML, CSS, and JavaScript served by Express for the account-access increment. React and Vite were in the original plan.
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
FM-4 implements registration, sign-in, session restoration, and sign-out. Match creation, browsing, joining, profile editing, and cloud deployment are pending.

## Run account access locally

Use Node.js 22 or later and a PostgreSQL database. Give the application database role permission to create its account and session tables on startup.

```sh
npm ci
export DATABASE_URL='postgresql://USER:PASSWORD@localhost:5432/fairway_match'
npm start
```

Open http://localhost:8080, create an account, and then sign in with the same email and password. Refresh to check session restoration and select **Sign out** to end the session. Set `PORT` to override 8080. Keep database credentials outside source control. Set `NODE_ENV=production` when serving through HTTPS so the session cookie is marked Secure.

Run `npm test` to verify the browser entry page and the account HTTP API against an embedded PostgreSQL engine. The test covers validation, normalized and duplicate email addresses, password hashing, failed sign-in, session expiry, and sign-out. Docker and Cloud Run verification belong to FM-14.

## AI development example

GitHub Copilot drafted `normalizeRegistration` in [registration.mjs](registration.mjs). This part of the draft normalizes account identifiers and preserves the exact password supplied by the golfer.

```js
const normalizedName = displayName.trim();
const normalizedEmail = email.trim().toLowerCase();
return { displayName: normalizedName, email: normalizedEmail, password };
```

ChatGPT adapted the implementation, used an escaped dot for the email domain separator, and added automated tests for malformed email and password preservation. It also implemented the Express and PostgreSQL integration and tested the HTTP account lifecycle.

## Documentation
- [Jira backlog and sprint plan](https://drewsworkspace-98efd31d.atlassian.net/jira/software/projects/FM/boards/1/backlog)
- [Confluence Project Overview](https://drewsworkspace-98efd31d.atlassian.net/wiki/spaces/FM/overview)

Jira contains 3 epics, 11 user stories with acceptance criteria, 22 implementation subtasks, and 2 planned sprints. Confluence is connected through the Jira Docs tab.

Public viewing is not enabled: the current Free plans restrict anonymous permission configuration.

