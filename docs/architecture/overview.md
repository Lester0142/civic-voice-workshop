# Architecture overview

CivicVoice is intentionally simple:

- Vite serves the React client.
- Express serves `/api/login`, `/api/feedback`, and `/api/health`.
- Lowdb stores seeded fictional users and feedback in local `data/db.json`.
- `npm run dev` starts client and API together through `scripts/dev.js`.

The baseline is not production authentication. Plain-text demo passwords, weak session behavior, and local storage are intentional ticket surfaces.

The facilitator board is separate from the citizen app. It lives in `facilitator/`, reads a JSON configuration, polls GitHub or local rehearsal fixtures, clones forks into `.workshop/forks/`, and launches each trusted clone on unique ports.
