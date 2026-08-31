# CivicVoice participant tickets

Pick tickets in any order unless a dependency is stated. Each ticket is intentionally small enough for a live Codex attempt and has a crisp “done” check. The baseline is underbuilt on purpose; do not treat it as a production identity system.

Scoring suggestion: S = 1 point, M = 2 points, L = 3 points. A ticket counts only when its acceptance checks work locally and `npm test` still passes.

## Citizen experience

### CV-001 — Keep the user signed in after refresh · S

Persist a successful session locally and restore it on page load. Signing out must clear it.

Done: sign in, refresh, and remain on the correct page; sign out, refresh, and return to login.

### CV-002 — Validate NRIC-like input before login · S

Reject empty or malformed workshop IDs before making the login request. Accept the seeded `S0000001A` and `S0000002B` IDs.

Done: an inline message appears for malformed input and no network request is sent.

### CV-003 — Add feedback character count and limit · S

Show a live count and enforce a 500-character maximum.

Done: the counter updates while typing; more than 500 characters cannot be submitted.

### CV-004 — Prevent blank or whitespace-only feedback · S

The current API accepts spaces. Fix both client and server validation.

Done: blank, spaces, and newlines are rejected; useful text still submits.

### CV-005 — Add feedback categories · M

Let citizens choose `Estate`, `Transport`, `Environment`, or `Other`, and save the selected category.

Done: the chosen category appears in the admin inbox and survives a page refresh.

### CV-006 — Add a submission reference number · S

After submission, show a short human-readable reference derived from the saved feedback.

Done: success message contains a reference such as `CV-123456`; it is not the full UUID.

### CV-007 — Add a “submit another” success state · S

Replace the form after success with a confirmation panel and a button to start another submission.

Done: a second submission can be made without signing out.

### CV-008 — Make the feedback form accessible · M

Improve keyboard focus, labels, live error announcements, and success announcements.

Done: the main flow works with keyboard only and a screen reader can identify errors and success.

## Admin workflow

### CV-009 — Sort newest feedback first · S

The admin inbox should be reliably newest-first, independent of storage order.

Done: automated test covers out-of-order seed data and the UI shows newest first.

### CV-010 — Add category and status filters · M

Add controls to filter the inbox by category and `New`, `In review`, or `Closed`.

Done: filters work together, and a clear action restores all items.

### CV-011 — Add keyword search · M

Search feedback messages and citizen names without a server round trip on every keystroke.

Done: search is case-insensitive and shows a useful empty state.

### CV-012 — Let admins update status · M

Add an API endpoint and UI control to move an item among `New`, `In review`, and `Closed`.

Done: status persists in `data/db.json` and remains updated after refresh.

### CV-013 — Add inbox summary cards · S

Show counts for total, new, in-review, and closed feedback.

Done: counts update after a status change.

### CV-014 — Add feedback detail view · M

Clicking an inbox row should open a focused detail view with all stored fields and a back action.

Done: direct selection works, and returning to the list keeps filters/search.

### CV-015 — Export visible feedback to CSV · M

Add an export button that downloads exactly the currently filtered feedback.

Done: CSV opens cleanly in a spreadsheet app and safely quotes commas/newlines.

### CV-016 — Add pagination · M

Show 10 items per page with previous/next controls.

Done: controls disable at the ends and filters reset to a valid page.

## Reliability and security lessons

### CV-017 — Replace the role header with real session checks · L

The admin endpoint trusts `x-user-role`. Replace that with an opaque server-issued session token and middleware.

Done: a citizen cannot read the inbox by changing a request header; tests cover the attack.

### CV-018 — Stop storing plain-text passwords · L

Hash demo passwords and compare hashes during login. Keep the same workshop credentials.

Done: no plain-text password exists in the persisted user records; login tests still pass.

### CV-019 — Add login rate limiting · M

Limit repeated failed sign-ins from the same client and return a useful `429` response.

Done: an automated test demonstrates the limit and successful sign-in remains usable.

### CV-020 — Sanitize unsafe feedback rendering · M

Protect the admin view from script-like feedback and add a regression test.

Done: malicious-looking text displays as text, never executes, and the test documents the case.

### CV-021 — Avoid exposing NRIC-like IDs in the admin list · S

Mask identifiers wherever they are shown outside the login form.

Done: detail and list views show only a masked form such as `S••••••1A`.

### CV-022 — Add structured API error handling · M

Return consistent `{ error: { code, message } }` payloads and make the client handle them.

Done: login, validation, forbidden, and unknown-route errors share the contract; tests cover it.

## Engineering quality

### CV-023 — Add client component tests · M

Cover login mode switching and citizen feedback success/error behavior.

Done: tests run under `npm test` and fail if the covered behavior regresses.

### CV-024 — Add API contract tests for admin behavior · M

Test admin login, inbox access, and at least one forbidden access case.

Done: tests use isolated temp data and do not mutate `data/db.json`.

### CV-025 — Add a loading and retry state to the admin inbox · S

The admin screen is blank while loading and unhelpful on failure.

Done: loading, error, retry, and empty states are visibly distinct.

### CV-026 — Add a health status indicator · S

Use `/api/health` to show whether the local API is reachable on the login screen.

Done: indicator changes when the API is stopped and recovers without a full page reload.

### CV-027 — Add dark mode · M

Add a theme toggle that respects the OS preference initially and persists the user's choice.

Done: all screens remain readable in both themes.

### CV-028 — Make mobile admin usable · M

The inbox is cramped on small screens. Create a responsive layout without hiding important data.

Done: at 375px width, list rows, filters, and status controls remain usable without horizontal scrolling.

## OpenAI API extensions

These tickets are optional stretch work. Keep API keys server-side in an ignored §.env§ file, never in client code or Git, and make the non-AI baseline continue to work when no key is configured. Tests must mock API calls rather than spend credits.

### CV-029 — Auto-categorize feedback · L

Use an OpenAI API call on submission to choose §Estate§, §Transport§, §Environment§, or §Other§, with a deterministic fallback when the API is unavailable.

Done: useful feedback is categorized, the category is stored, no key reaches the browser, and mocked tests cover success and fallback.

### CV-030 — Summarize long feedback for admins · L

Add a server endpoint that creates a one-sentence summary for feedback longer than 200 characters and display it in the admin detail view.

Done: summaries are generated on demand, cached with the feedback item, and failure leaves the original feedback readable.

### CV-031 — Read feedback aloud · M

Add a text-to-speech action for the citizen confirmation screen using an OpenAI TTS API from the server.

Done: a user can play/pause the generated audio, loading and failure states are clear, and audio is not generated for blank feedback.

### CV-032 — Translate feedback for admins · L

Let an admin request an English translation while preserving the original text and clearly labeling the translated copy.

Done: non-English feedback can be translated on demand, the original is always visible, and mocked tests cover API failure.

### CV-033 — Suggest urgency and routing · L

Use structured model output to suggest §Low§, §Medium§, or §High§ urgency and a responsible team, while keeping the suggestion visibly reviewable by an admin.

Done: suggestions never silently change status, malformed model output is rejected, and an admin can accept or dismiss the suggestion.

## Facilitator notes on dependencies

- CV-005 makes CV-010 more meaningful.
- CV-012 makes CV-013 more meaningful.
- CV-017 and CV-018 are deliberately larger and best for experienced participants.
- CV-023 and CV-024 are good “review and verification” tickets after a participant has changed behavior.
- CV-029 through CV-033 need an OpenAI API key and are optional stretch tickets; pair them with explicit mock-based tests.
