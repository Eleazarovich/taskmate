# Taskmate end-to-end tests

The Playwright suite starts an isolated `docker-compose.yaml` project with a
temporary Postgres volume before the tests and removes it afterward.

```bash
npm install
npx playwright install chromium
npm test
```

The main scenario uses two independent browser contexts to verify that a task
created in one signed-in client and moved in another is persisted and visible
after the first client reloads. Taskmate's MVP is intentionally a personal
Kanban board, so both clients use the same account and the second client
verifies the account's persisted board state.
