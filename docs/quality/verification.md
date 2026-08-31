# Verification guide

Every ticket should preserve the baseline:

```bash
npm test
npm run build
```

Add focused tests when behavior changes. API tests must use isolated temporary data rather than mutate `data/db.json`.

Before scoring a PR, check:

- the PR title uses the exact `CV-###: <ticket title>` format;
- the branch contains only the assigned ticket;
- the ticket's written “Done” checks work;
- `npm test` and `npm run build` pass;
- no real identity data, keys, or secrets were added.
