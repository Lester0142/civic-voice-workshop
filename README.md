# CivicVoice workshop starter

CivicVoice is a deliberately underbuilt local app for a hands-on Codex workshop. A fictional member of the public signs in with an NRIC-like identifier and submits feedback; a fictional admin signs in and reads the inbox.

It is intentionally **not production authentication** and must never be used with real NRICs or personal data. The weak session model, plain-text demo passwords, and local file-backed database are workshop material.

## Quick start

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The same `npm run dev` command starts both the Vite web app and the local API.

Demo accounts:

| Mode | NRIC-like ID | Password |
| --- | --- | --- |
| Public | `S0000001A` | `citizen123` |
| Admin | `S0000002B` | `admin123` |

The API runs at [http://localhost:3001](http://localhost:3001). Workshop data is stored locally in `data/db.json`, which is created automatically and ignored by Git.

When you change server-side code, stop and rerun the same `npm run dev` command. Client-side changes reload automatically.

## Useful commands

```bash
npm run dev        # run web and API together
npm test           # run the small baseline API test suite
npm run build      # verify the web app builds
npm run reset-db   # restore the original local workshop data
```

## Baseline behavior

- Public user can sign in and submit free-text feedback.
- Admin can sign in and view all feedback.
- One seeded feedback item appears in the admin inbox.
- Refreshing the browser signs the user out.

That last point and many other rough edges are intentional. See [workshop/TICKETS.md](workshop/TICKETS.md) for the participant backlog and [workshop/FACILITATOR.md](workshop/FACILITATOR.md) for running the session.

## Stack

- React + Vite client in `client/`
- Express API in `server/`
- Lowdb JSON file as a zero-setup local datastore
- Vitest + Supertest for baseline tests

## Safety note

All identities are fictional. The app is a teaching fixture, not a model of Singpass or a government identity system.
