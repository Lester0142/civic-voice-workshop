# Participant workflow

Each participant works from their own **public** fork. Keep one ticket per branch and one ticket per merge request / GitHub pull request. The facilitator dashboard discovers public forks automatically; private forks will not appear.

## Before your first ticket

Fork [github.com/ianho-oai/civic-voice-workshop](https://github.com/ianho-oai/civic-voice-workshop) into your own GitHub account, keep the fork public, then clone and start it:

On macOS, install the prerequisites with Homebrew first if needed:

```bash
brew install git node gh
git --version
node --version
npm --version
gh --version
```

Then clone and start your fork:

```bash
git clone https://github.com/<your-github-name>/civic-voice-workshop.git
cd civic-voice-workshop
npm install
npm run dev
```

Replace `<your-github-name>` with your GitHub username. The app opens at [http://localhost:5173](http://localhost:5173). Use `S0000001A` / `citizen123` for the public flow or `S0000002B` / `admin123` for the admin flow.

## Start every ticket the same way

1. Pick one ticket from `workshop/TICKETS.md`.
2. Create a branch: `cv-003-character-limit`.
3. Open a draft PR immediately, before implementation is complete.
4. Use Codex to implement only that ticket.
5. Push small commits regularly so the facilitator board can see activity.
6. Run the checks and mark the PR ready only when the ticket's “Done” checks pass.

## Fixed naming

| Item | Required format | Example |
| --- | --- | --- |
| Branch | `cv-###-short-slug` | `cv-003-character-limit` |
| Commit subject | `CV-### <short summary>` | `CV-003 Add feedback character count and limit` |
| Draft PR title | `CV-###: <exact ticket title>` | `CV-003: Add feedback character count and limit` |

The `CV-###` prefix must exactly match the assigned ticket. GitHub's numeric PR ID is separate; the ticket key drives scoring.

## Required PR body

Use `.github/pull_request_template.md` and keep these sections:

1. Ticket
2. What changed
3. Verification
4. Screenshots or notes
5. Known limitations

## Suggested commands

```bash
git checkout -b cv-003-character-limit
# open a draft PR with title: CV-003: Add feedback character count and limit
# ask Codex to implement only CV-003
npm test
npm run build
git add .
git commit -m "CV-003 Add feedback character count and limit"
git push -u origin cv-003-character-limit
```

Other available commands:

```bash
npm run test:watch # keep tests running while you edit
npm run reset-db   # restore the original local data
```

The dashboard can see pushed branches and PRs; it cannot see unpushed local work.
