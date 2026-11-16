# Fairway Match

Fairway Match is a planned golf matchmaking application for recreational golfers, college students, and local golf groups. It brings player discovery, tournament partner openings, and friendly competition into one place.

## Planned core features
- Player profiles with city, skill level, and availability.
- Match creation with course, date, format, participants, optional agreed stakes, and final results. Payments are handled outside the app.
- Partner finder for rounds and tournaments.
- Squads that can challenge other groups.

## Planned technology stack
- Frontend: React with Vite
- Backend: Node.js and Express REST API
- Database: PostgreSQL
- Containers: Docker and Docker Compose
- Testing: Vitest, React Testing Library, and Supertest
- CI/CD: GitHub Actions
- Deployment: Google Cloud Run for frontend/backend and Cloud SQL for PostgreSQL
- Coding assistant: GitHub Copilot, with generated code reviewed and tested

## AI integration strategy
The final release will include an AI match-description assistant through a backend API. It will turn non-sensitive match details into an editable invitation. Users review the text before saving it. API keys remain on the server; failures leave manual match creation available. Copilot will also assist development, debugging, and test generation. Confirm the course AI requirements against the Final Project Overview before implementation.

## Delivery plan
- Sprint 1, through the end of Unit 12: MVP with account access, profiles, match creation/listing, joining a match, persistent data, tests, and a deployed application.
- Sprint 2, Units 13-14: player discovery, partner finder, squads/challenges, agreed stakes/results, AI description assistant, expanded tests, and final documentation.

## Project status
Planning stage. Application code and deployment are not yet implemented.

## Documentation
- [Jira backlog and sprint plan](https://drewsworkspace-98efd31d.atlassian.net/jira/software/projects/FM/boards/1/backlog)
- [Confluence Project Overview](https://drewsworkspace-98efd31d.atlassian.net/wiki/spaces/FM/overview)

Jira contains 3 epics, 11 user stories with acceptance criteria, 22 implementation subtasks, and 2 planned sprints. Confluence is connected through the Jira Docs tab.

Public viewing is not enabled: the current Free plans restrict anonymous permission configuration.

The README will grow to include setup instructions, environment variables, API documentation, testing, and deployment instructions as implementation progresses.
