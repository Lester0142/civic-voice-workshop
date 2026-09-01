# CivicVoice workshop starter

CivicVoice is a deliberately underbuilt local app for a hands-on Codex workshop. A fictional member of the public signs in with an NRIC-like identifier and submits feedback; a fictional admin signs in and reads the inbox.

It is intentionally **not production authentication** and must never be used with real NRICs or personal data. The weak session model, plain-text demo passwords, and local file-backed database are workshop material.

## Participant setup

### 1. Install the prerequisites

Before the workshop, make sure you have:

- Git and a GitHub account;
- Node.js 20 or newer, with npm;
- Codex available in your editor or terminal;
- a browser that can open local URLs.

Check your Node version:

```bash
node --version
```

If it does not start with `v20` or higher, update Node before continuing.

### 2. Fork and clone your own copy

1. Open [github.com/ianho-oai/civic-voice-workshop](https://github.com/ianho-oai/civic-voice-workshop).
2. Click **Fork** and create the fork under your own GitHub account.
3. Clone your fork, not the facilitator's repository:

```bash
git clone https://github.com/<your-github-name>/civic-voice-workshop.git
cd civic-voice-workshop
npm install
```

Replace `<your-github-name>` with your GitHub username. Keep the default branch named `main`.

### 3. Run the starter app

Use the same command throughout the workshop:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). This one command starts both the Vite web app and the local API at [http://localhost:3001](http://localhost:3001).

Demo accounts:

| Mode | NRIC-like ID | Password |
| --- | --- | --- |
| Public | `S0000001A` | `citizen123` |
| Admin | `S0000002B` | `admin123` |

Workshop data is stored locally in `data/db.json`. The file is created automatically and ignored by Git. Client-side changes reload automatically; after server-side changes, stop and rerun `npm run dev`.

### 4. Pick one ticket and open a draft PR immediately

Read [workshop/TICKETS.md](workshop/TICKETS.md), choose one ticket, and keep one ticket per branch and pull request. Create your branch using the ticket key:

```bash
git checkout -b cv-003-character-limit
```

Open a draft GitHub pull request before implementation is complete. The facilitator dashboard can see draft/open PRs and pushed commits, but it cannot see unpushed local work.

Use these fixed formats so the dashboard can recognize and score your work:

| Item | Required format | Example |
| --- | --- | --- |
| Branch | `cv-###-short-slug` | `cv-003-character-limit` |
| Commit subject | `CV-### <short summary>` | `CV-003 Add feedback character count and limit` |
| Draft PR title | `CV-###: <exact ticket title>` | `CV-003: Add feedback character count and limit` |

The `CV-###` prefix must exactly match your ticket. Use the PR body sections from [.github/pull_request_template.md](.github/pull_request_template.md).

### 5. Ask Codex to implement only your ticket

A useful first prompt is:

```text
Read AGENTS.md, docs/workshop/participant-workflow.md, and workshop/TICKETS.md.
Implement only CV-003. Keep fictional data only. Add focused tests, then run
npm test and npm run build before you finish.
```

Review Codex's diff, keep unrelated intentional rough edges unchanged, and push small commits regularly.

### 6. Verify, commit, and push

Before marking the PR ready, run:

```bash
npm test
npm run build
```

Then commit and push using the fixed format:

```bash
git add .
git commit -m "CV-003 Add feedback character count and limit"
git push -u origin cv-003-character-limit
```

Confirm the ticket's **Done** checks work locally, update the PR body with your verification, and only then mark the draft PR ready for review.

### 7. Scoring and AI tickets

- **S** tickets are front-end starters worth 1 point.
- **M** tickets are full-stack intermediate work worth 2 points.
- **L** tickets are advanced security or OpenAI API work worth 3 points.
- OpenAI API tickets are marked separately on the facilitator leaderboard.

### Useful commands

```bash
npm run dev        # run web and API together
npm test           # run the baseline test suite
npm run build      # verify the web app builds
npm run reset-db   # restore the original local workshop data
```

### If something looks wrong

- Wrong app state? Run `npm run reset-db`, then restart `npm run dev`.
- Web app opens but API calls fail? Check that nothing else is using port `3001`.
- Browser changes appear but server changes do not? Stop and rerun `npm run dev`.
- Dashboard shows no progress? Push your branch and make sure the draft PR title starts with the exact `CV-###:` ticket key.

For more detail, start with the [documentation index](docs/README.md) and the [participant workflow](docs/workshop/participant-workflow.md). Facilitators can use the [dashboard guide](docs/workshop/facilitator-dashboard.md).

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
