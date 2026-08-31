# Workshop contribution workflow

Each participant works from their own fork. Keep one ticket per branch and one ticket per merge request / GitHub pull request.

## Fixed naming

- Branch: `cv-003-character-limit`
- MR / PR title: `CV-003: Add feedback character count and limit`
- Commit subject: `CV-003 Add feedback character count and limit`

The `CV-###` prefix must exactly match a ticket in `workshop/TICKETS.md`. GitHub's numeric PR ID is separate; the ticket key is what the facilitator dashboard and scoring use.

## MR / PR body

Use the repository template and keep the sections:

1. Ticket
2. What changed
3. Verification
4. Screenshots or notes
5. Known limitations

An MR is ready for scoring only when its “Done” checks work locally and `npm test` still passes.

## Suggested participant flow

```bash
git checkout -b cv-003-character-limit
# ask Codex to implement CV-003
npm test
npm run build
git add .
git commit -m "CV-003 Add feedback character count and limit"
git push -u origin cv-003-character-limit
```

Then open a PR against the workshop repository with the fixed title.
