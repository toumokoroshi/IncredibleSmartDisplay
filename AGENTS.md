# AGENTS.md

## Project Rules

Before making implementation changes, read:

- documents/ImplementationPlan.md
- documents/ImplementationPlan_Addendum.md
- documents/ProjectCodingRules.md

Follow the coding rules in documents/ProjectCodingRules.md.

When an implementation decision changes future work, update the relevant documentation in the same change.

## Static Hosting And Privacy

This app is designed for GitHub Pages and Fully Kiosk Browser. Treat all frontend code, config, bundled environment variables, public JSON, and public assets as publicly readable.

Do not add API keys, OAuth tokens, refresh tokens, private iCal URLs, tokenized URLs, webhook URLs, private calendar IDs, home automation tokens, or personal calendar event details to frontend code, config, tests, generated JSON, logs, or screenshots.

Every provider must be explicit. Do not implicitly mix mock and real data.

Current normal data-source policy:

- Weather: `openMeteo`
- Calendar: `localDate`
- News: `staticJson`
- Traffic: `staticJson`
- PetPhoto: `staticManifest`
- Stocks: registered but disabled, usually `mock`

Private Google Calendar access is out of scope unless the documentation is updated with an accepted access-control model. Do not implement private Google Calendar API access, private iCal access, or a private calendar iframe as the primary UI without explicit user approval and a documentation update.

Workers may hold secrets, but a public Worker URL must not expose private data. `workerJson` responses must be already normalized to the WidgetData contract and must use structured, public-safe errors.

## Architecture

Widgets must not consume external API responses directly.

External APIs, generated JSON, mock data, and local date data must be converted into WidgetData in the service layer before rendering.

Keep provider-specific logic in services, adapters, generators, or Workers. Keep Widget components focused on rendering data and states.

Do not let intermediate provider names become long-term architecture boundaries. `mock`, `localDate`, `staticJson`, and `workerJson` are adapter choices. Shared hooks, layouts, commands, and Widget components should depend on provider-neutral contracts such as WidgetData, WidgetService, WidgetDefinition, cache policy, and query policy.

If a temporary implementation starts becoming reusable, extract or rename the reusable part behind a provider-neutral utility before another Widget depends on it.

When adding or changing a Widget provider, update:

- Widget settings type and schema
- Service validation and mapping
- Contract tests
- dashboard.config.ts if the operational provider changes
- documents/ImplementationPlan.md or documents/ImplementationPlan_Addendum.md if the decision affects future work

## Layout Changes

For any UI change — widget layout, global styles (colors, borders, typography, spacing), or shared components — first create or update a comparison/debug HTML preview in documents/, perform a self-review against the change's goal, and then have the user review the preview before applying the change to the app.

For detail layout changes, preserve measurement probe classes described in the implementation documents and update tests when the probe contract changes.

Check the tablet target viewport, especially `1524 x 1016` CSS px, for clipping and overflow.

## Verification

Before committing code changes, run:

- npm run build
- npm run test:run
- npm run lint

Do not call real external APIs from unit or integration tests.

For dependency or lockfile changes, verify that package.json and package-lock.json are synchronized.
Do not add direct dependencies only to work around transitive lockfile issues.

## Git

Use small commits with one purpose.
Do not mix UI changes, CI fixes, dependency updates, documentation policy changes, and refactors in one commit.

Do not revert user or unrelated local changes unless explicitly requested.
