# FinTrack
# Development Priority

Prioritize **implementation and feature completion** over extensive testing.

The primary goal is to build the complete FinTrack application according to the project specification. When implementing a feature:

1. Implement the feature completely and integrate it with the existing architecture.
2. Perform only **basic sanity checks** necessary to confirm that the implementation is not obviously broken.
3. Run lightweight checks such as:

   * Build/compile checks
   * Type checking
   * Linting when appropriate
   * Basic API/request verification
   * Checking obvious runtime errors
4. **Do not spend excessive time writing tests.**
5. Do not create comprehensive unit-test suites, exhaustive integration tests, extensive end-to-end tests, or large amounts of test infrastructure unless explicitly requested.
6. Do not repeatedly rewrite or retest working code without a concrete reason.
7. If a test fails, fix the underlying implementation when the problem is clear, then continue with the feature.
8. Avoid spending multiple iterations trying to achieve perfect test coverage.
9. Prefer moving on to the next feature once the current implementation passes reasonable sanity checks.
10. **Testing and comprehensive QA will be performed separately after the main implementation is complete.**

## Important

Do not interpret "production-quality" as requiring exhaustive automated testing during the initial implementation phase.

For this phase, prioritize:

**Architecture → Implementation → Integration → Basic sanity check → Next feature**

rather than:

**Architecture → Implementation → Extensive tests → More tests → Edge-case tests → Test refactoring → Next feature**

The application should still be implemented carefully and correctly. The instruction is specifically to avoid excessive testing during development, not to ignore obvious bugs or knowingly leave broken functionality.

## Migrations

Do **not** run `python manage.py migrate` automatically. Generate migrations with `makemigrations` when models change, but only run `migrate` when the user explicitly asks.

## Design

UI colors/theme: follow `docs/theme.md` and `DESIGN.md` (Forest, Sage, Cream, Sand; Inter). Third-party component provenance is recorded in `DESIGN.md`.

## Commands (web/)

`npm run lint`, `npm run typecheck`, `npm run test` (vitest), `npm run build`. Backend (api/): `ruff`, `mypy`, `pytest`.
