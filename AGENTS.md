# Recipe Box development guide

Use these rules when changing the Recipe Box API:

- Keep HTTP status codes and response shapes in `routes/`; keep MongoDB access and data validation in `services/` and `db/`.
- Validate fields before database writes. Reject wrong types, missing required text, and values over the documented limits.
- Scope every recipe read, update, and delete to both the recipe ID and the signed-in account ID. Return the same 404 for a missing recipe and another account's recipe.
- Return errors as `{ "error": "..." }`. Never send password hashes, database credentials, account IDs, or session tokens in recipe responses.
- After API changes, run `npm test`; run `npm run smoke` when database behavior changes.

The Day 3 exercise asks for a reusable `SKILL.md` or `AGENTS.md`. This file is the repo-wide guide; its owner-scoping rule caught the risk of cross-account recipe access, and its validation rule is applied to the optional notes field.
