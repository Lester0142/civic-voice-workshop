# Facilitator guide

This file is the session run-of-show. For fork monitoring, scoring, local instances, and dashboard configuration, read [docs/workshop/facilitator-dashboard.md](../docs/workshop/facilitator-dashboard.md).

## Suggested 75-minute run

1. 0–10 min — everyone forks/clones, runs `npm install`, then `npm run dev`.
2. 10–15 min — demonstrate public and admin baseline.
3. 15–20 min — explain scoring, fixed PR titles, and the draft-PR-first rule.
4. 20–60 min — build sprint.
5. 60–70 min — demos and scoring.
6. 70–75 min — debrief on prompts, review, tests, and trade-offs.

## Preflight

```bash
npm install
npm run dev
npm test
npm run build
npm run reset-db
```

Test both fictional accounts:

| Mode | ID | Password |
| --- | --- | --- |
| Public | `S0000001A` | `citizen123` |
| Admin | `S0000002B` | `admin123` |

## Fair scoring

- One ticket per branch and PR.
- Participants open a draft PR immediately with `CV-###: <exact ticket title>`.
- S = 1 point, M = 2 points, L = 3 points.
- A ticket counts only when its written “Done” checks work and baseline checks remain green.
- No real identity or personal data.

## Suggested ticket menu

- First-time Codex users: S front-end tickets.
- Comfortable web developers: M full-stack tickets.
- Experienced participants: L security and OpenAI API tickets.

## Baseline rough edges

The fixture intentionally has weak sessions, plain-text demo credentials, minimal validation, no categories, no status updates, and sparse tests. These are ticket surfaces, not accidental production patterns.

## One-command promise

Participants should keep using:

```bash
npm run dev
```

Client changes reload automatically. Restart the same command after server-side changes.
