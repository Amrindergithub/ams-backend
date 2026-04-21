## Summary

<!-- 1-3 bullets describing what changed and why. -->

-

## Screens / routes touched

<!-- e.g. /admin, /student/scan, /verify — or API endpoints. -->

-

## Test plan

- [ ] **Backend:** `cd backend && node index.js` boots cleanly on `:5001`; affected endpoints respond.
- [ ] **Frontend:** `cd frontend && npm start` compiles without warnings; walk through affected screens.
- [ ] **Contracts:** `cd backend && npx truffle test` passes (only if Solidity changed).
- [ ] Committed with conventional-commits subject.
- [ ] No AI-attribution trailers in any commit (`git log --format=%B | grep -iE "claude|anthropic|co-authored-by"` returns empty).

## Notes

<!-- Anything a reviewer needs to know: follow-ups, known limitations, links. -->
