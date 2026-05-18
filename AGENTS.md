# AGENTS.md

## Project Rules

Before making implementation changes, read:

- documents/ImplementationPlan.md
- documents/ImplementationPlan_Addendum.md
- documents/ProjectCodingRules.md

Follow the coding rules in documents/ProjectCodingRules.md.

For weather widget layout changes, first create or update a comparison/debug HTML preview in documents/ and have the user review the layout before applying the change to the app.

## Verification

Before committing code changes, run:

- npm run build
- npm run test:run
- npm run lint

For dependency or lockfile changes, verify that package.json and package-lock.json are synchronized.
Do not add direct dependencies only to work around transitive lockfile issues.

## Git

Use small commits with one purpose.
Do not mix UI changes, CI fixes, dependency updates, and refactors in one commit.
