# Facilitator dashboard

The board polls configured participant forks, reads PR titles, syncs each fork's latest `main` into disposable local clones, and can launch trusted local instances.

## Real workshop setup

```bash
cp facilitator/participants.example.json facilitator/participants.json
npm run facilitator
```

Open [http://localhost:4200](http://localhost:4200).

To discover every real GitHub fork automatically instead of maintaining a participant list:

```bash
FACILITATOR_CONFIG=facilitator/github-live.json npm run facilitator
```

This mode adds a row for each fork owner and reads PRs targeting the base repository. It uses your authenticated `gh` CLI when available, then falls back to the public GitHub API. Forks are read-only and never launched locally unless you explicitly add a trusted participant configuration.

The board recognizes only PR titles that begin `CV-###:`. It treats:

- draft PR as in progress;
- open PR as in progress / awaiting review;
- merged PR as complete;
- closed unmerged PR as stopped.

For real fork discovery, completion is checked against each participant fork's `main`, not the facilitator repository. If a ticket branch commit is reachable from that fork's `main`, the board counts it as merged even when the PR targeting the facilitator repository was merely closed. A standardized `cv-###-...` branch can identify the ticket when the PR title is malformed, but participants should still use the required title format.

Require participants to open a draft PR immediately and push often. GitHub cannot reveal unpushed local work.

## Configuration and trust

Each participant needs a unique `id`, `name`, `forkRepo`, `webPort`, and `apiPort`. Set `trusted: true` only when you are comfortable executing that participant's code locally.

The dashboard only starts local apps when both `autoStart` and `trusted` are true. Synced clones live under ignored `.workshop/forks/` and are disposable.

For private repositories or higher API limits, provide `GITHUB_TOKEN` in the shell. Never commit it.

For a long-running local race, set `participantsFile` in the facilitator config. The board rereads that JSON manifest on every refresh, so an external runner can update MR states and scores without restarting the dashboard.

Use `directLocalRepo` for trusted local participant clones that are already managed by a runner; the board reads their HEAD directly instead of making another disposable sync copy.

## Scoring

Ticket size comes from `workshop/TICKETS.md`:

- S = 1 point
- M = 2 points
- L = 3 points

The board ranks participants by aggregate merged-ticket points, then merged-ticket count.
