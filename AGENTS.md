# CivicVoice workshop repository

This is a deliberately underbuilt teaching fixture. Preserve the one-command local developer experience:

```bash
npm run dev
```

Before changing code:

1. Read the assigned ticket in `workshop/TICKETS.md`.
2. Follow `docs/workshop/participant-workflow.md`.
3. Keep one ticket per branch and open a draft PR immediately.
4. Keep identities fictional; never add real NRICs, secrets, or external services.
5. Do not silently fix unrelated intentional rough edges.

Required participant conventions:

- Branch: `cv-003-character-limit`
- Commit: `CV-003 Add feedback character count and limit`
- PR title: `CV-003: Add feedback character count and limit`

Run before marking work ready:

```bash
npm test
npm run build
```

Documentation router:

| Need | Read |
| --- | --- |
| Docs index and repository map | `docs/README.md` |
| Branch, draft PR, title, and scoring workflow | `docs/workshop/participant-workflow.md` |
| Facilitator dashboard and fork monitoring | `docs/workshop/facilitator-dashboard.md` |
| App structure and data flow | `docs/architecture/overview.md` |
| Test and verification expectations | `docs/quality/verification.md` |
| Ticket requirements and acceptance checks | `workshop/TICKETS.md` |
