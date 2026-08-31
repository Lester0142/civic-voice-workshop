# Facilitator guide

## Workshop shape

This starter supports a simple competition: every participant forks the same baseline, picks tickets, uses Codex to implement them, and demonstrates working acceptance checks.

Suggested 75-minute run:

1. 0–10 min — everyone clones/forks, runs `npm install`, then `npm run dev`.
2. 10–15 min — facilitator demonstrates the public and admin baseline.
3. 15–20 min — explain ticket scoring and the rule that working verification beats generated code.
4. 20–60 min — build sprint; participants choose tickets.
5. 60–70 min — demos and scoring.
6. 70–75 min — debrief on prompts, review, tests, and trade-offs.

## Preflight

Before the session, verify on a clean machine:

```bash
npm install
npm run dev
npm test
npm run build
```

Then test both demo accounts and reset the datastore with `npm run reset-db`.

## Rules that keep scoring fair

- Participants may work alone or in teams, but each ticket is scored once per fork.
- A ticket is complete only when its written “Done” checks can be demonstrated.
- Existing baseline tests must remain green.
- For overlapping implementations, score the ticket whose acceptance checks are most fully met.
- No real identity or personal data.

## Suggested ticket menu by experience

- First-time Codex users: CV-001, CV-003, CV-004, CV-006, CV-025, CV-026.
- Comfortable web developers: CV-005, CV-010, CV-012, CV-014, CV-023, CV-024.
- Experienced participants: CV-017, CV-018, CV-019, CV-022.

## Baseline rough edges to point out

The app intentionally has no persistent browser session, weak server-side authorization, plain-text demo credentials, minimal validation, no categories, no status updates, and sparse tests. These are the learning surface, not accidental workshop breakage.

## One-command promise

The only command participants need during the sprint is:

```bash
npm run dev
```

It starts both the web client and API. Keep that script stable during the workshop.
