# CivicVoice participant tickets

Pick one ticket per branch and open a draft PR immediately. Use the exact title format `CV-###: <ticket title>`. A ticket counts only when its “Done” checks work locally and `npm test` still passes.

Scoring:

- S = 1 point: front-end-only starter work.
- M = 2 points: intermediate full-stack work touching both client and server behavior.
- L = 3 points: advanced security or OpenAI API work.

## S — front-end starter tickets

### CV-001 — Keep the user signed in after refresh · S

Persist a successful session locally and restore it on page load. Signing out must clear it.

Done: sign in, refresh, and remain on the correct page; sign out, refresh, and return to login.

### CV-002 — Validate NRIC-like input before login · S

Reject empty or malformed workshop IDs in the browser before making the login request. Accept seeded IDs.

Done: an inline message appears for malformed input and no network request is sent.

### CV-003 — Add feedback character count and limit · S

Show a live count and enforce a 500-character maximum in the form.

Done: the counter updates while typing; more than 500 characters cannot be entered or submitted.

### CV-007 — Add a “submit another” success state · S

Replace the form after success with a confirmation panel and a button to start another submission.

Done: a second submission can be made without signing out.

### CV-008 — Make the feedback form accessible · S

Improve keyboard focus, labels, live error announcements, and success announcements.

Done: the main flow works with keyboard only and a screen reader can identify errors and success.

### CV-011 — Add keyword search · S

Search already-loaded feedback messages and citizen names in the admin UI without a server round trip.

Done: search is case-insensitive and shows a useful empty state.

### CV-013 — Add inbox summary cards · S

Show client-side counts for total, new, in-review, and closed feedback.

Done: counts reflect the currently loaded inbox and remain readable on mobile.

### CV-021 — Avoid exposing NRIC-like IDs in the admin list · S

Mask identifiers wherever they are rendered outside the login form.

Done: list and detail views show only a masked form such as `S••••••1A`.

### CV-025 — Add a loading and retry state to the admin inbox · S

The admin screen is blank while loading and unhelpful on failure.

Done: loading, error, retry, and empty states are visibly distinct.

### CV-027 — Add dark mode · S

Add a theme toggle that respects the OS preference initially and persists the user's choice.

Done: all screens remain readable in both themes.

### CV-028 — Make mobile admin usable · S

The inbox is cramped on small screens. Create a responsive layout without hiding important data.

Done: at 375px width, list rows and controls remain usable without horizontal scrolling.

## M — full-stack intermediate tickets

### CV-004 — Prevent blank or whitespace-only feedback · M

Fix both client and server validation so spaces and newlines are not accepted.

Done: the browser blocks blank text, the API rejects bypass attempts, and useful text still submits.

### CV-005 — Add feedback categories · M

Let citizens choose `Estate`, `Transport`, `Environment`, or `Other`, validate it server-side, and store it.

Done: the chosen category appears in the admin inbox and survives a page refresh.

### CV-006 — Add a submission reference number · M

Return a short human-readable reference from the API and show it after submission.

Done: success message contains a reference such as `CV-123456`; it is not the full UUID.

### CV-009 — Sort newest feedback first · M

Make the API return newest-first feedback and keep the UI order reliable.

Done: an automated test covers out-of-order stored data and the UI shows newest first.

### CV-010 — Add category and status filters · M

Add API query parameters and UI controls for category plus `New`, `In review`, and `Closed`.

Done: filters work together, refresh correctly, and a clear action restores all items.

### CV-012 — Let admins update status · M

Add an API endpoint and UI control to move an item among `New`, `In review`, and `Closed`.

Done: status persists in `data/db.json` and remains updated after refresh.

### CV-014 — Add feedback detail view · M

Add an API route and focused UI detail view with all stored fields and a back action.

Done: direct selection works, and returning to the list keeps filters/search.

### CV-015 — Export visible feedback to CSV · M

Add a server-generated CSV export for the currently filtered inbox and a UI download action.

Done: CSV opens cleanly in a spreadsheet app and safely quotes commas/newlines.

### CV-016 — Add pagination · M

Add paginated API results and previous/next controls with 10 items per page.

Done: controls disable at the ends and filters reset to a valid page.

### CV-019 — Add login rate limiting · M

Rate-limit repeated failed sign-ins in the API and show a useful client-side `429` message.

Done: an automated test demonstrates the limit and successful sign-in remains usable.

### CV-020 — Sanitize unsafe feedback rendering · M

Normalize unsafe feedback server-side and make the admin UI render it only as text.

Done: malicious-looking text never executes and a regression test documents the case.

### CV-022 — Add structured API error handling · M

Return consistent `{ error: { code, message } }` payloads and update the client to handle them.

Done: login, validation, forbidden, and unknown-route errors share the contract; tests cover it.

### CV-023 — Add end-to-end client/API tests · M

Add tests that cover login mode switching plus citizen feedback success/error across the client/API boundary.

Done: tests run under `npm test` and fail if the covered behavior regresses.

### CV-024 — Add API contract tests for admin behavior · M

Test admin login, inbox access, and at least one forbidden access case using isolated temp data.

Done: tests do not mutate `data/db.json` and cover the client-visible response contract.

### CV-026 — Add a health status indicator · M

Use `/api/health` to show whether the local API is reachable on the login screen and recover automatically.

Done: indicator changes when the API is stopped and recovers without a full page reload.

## L — advanced security and OpenAI API tickets

Keep API keys server-side in an ignored `.env` file, never in client code or Git. The non-AI baseline must continue to work when no key is configured, and tests must mock API calls rather than spend credits.

### Security foundations

### CV-017 — Replace the role header with real session checks · L

The admin endpoint trusts `x-user-role`. Replace that with an opaque server-issued session token and middleware.

Done: a citizen cannot read the inbox by changing a request header; tests cover the attack.

### CV-018 — Stop storing plain-text passwords · L

Hash demo passwords and compare hashes during login while keeping the same workshop credentials.

Done: no plain-text password exists in persisted user records; login tests still pass.

### OpenAI API extensions

### CV-029 — Auto-categorize feedback · L

Use an OpenAI API call on submission to choose `Estate`, `Transport`, `Environment`, or `Other`, with deterministic fallback.

Done: useful feedback is categorized, stored, no key reaches the browser, and mocked tests cover success/fallback.

### CV-030 — Summarize long feedback for admins · L

Add a server endpoint that creates a one-sentence summary for feedback longer than 200 characters.

Done: summaries are generated on demand, cached, and failure leaves original feedback readable.

### CV-031 — Read feedback aloud · L

Add a text-to-speech action for the citizen confirmation screen using an OpenAI TTS API from the server.

Done: a user can play/pause generated audio, failure states are clear, and blank feedback is not synthesized.

### CV-032 — Translate feedback for admins · L

Let an admin request an English translation while preserving and labeling the original text.

Done: translation is on demand, the original is always visible, and mocked tests cover API failure.

### CV-033 — Suggest urgency and routing · L

Use structured model output to suggest `Low`, `Medium`, or `High` urgency and a responsible team.

Done: suggestions never silently change status, malformed output is rejected, and admins can accept or dismiss.

## Facilitator notes

- S tickets are intentionally client-only and approachable for first-time Codex users.
- M tickets require coordinating browser behavior with API/data behavior.
- L tickets are best for experienced participants and require stronger review.
- CV-005 makes CV-010 more meaningful.
- CV-012 makes CV-013 more meaningful.
- CV-029 through CV-033 need an OpenAI API key and mock-based tests.
