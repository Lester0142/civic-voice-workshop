# Participant workflow

Each participant works from their own fork. Keep one ticket per branch and one ticket per merge request / GitHub pull request.

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

The dashboard can see pushed branches and PRs; it cannot see unpushed local work.
