# Project Coding Rules

These rules are project-level instructions for IncredibleSmartDisplay. Keep fixes narrow, preserve the widget/service architecture, and avoid adding complexity to work around unclear failures.

## 1. CI And Dependency Management

- If `package.json` changes, commit the corresponding `package-lock.json` change in the same commit.
- Treat `npm ci` failures as dependency lock consistency problems first.
- Do not change app code, workflows, or direct dependencies to work around a lockfile-only issue.
- Add a direct dependency only when application code imports or uses that package directly.
- Do not add direct dependencies just to silence transitive dependency lockfile errors.
- Windows `npm ci` does not fully reproduce Ubuntu GitHub Actions behavior, especially for optional or native dependencies.
- Before pushing implementation changes, run `npm run build`, `npm run test:run`, and `npm run lint`.
- For lockfile fixes, confirm every package named in the CI missing-package error exists in `package-lock.json` under `packages`.
- Review lockfile diffs carefully because `npm install` can normalize optional dependencies differently by OS.
- Keep CI fixes separate from UI changes, refactors, and feature work.

## 2. Bug Fix Policy

- Identify the actual reproduction context first: local OS, GitHub Actions runner OS, Node version, npm version, and command.
- Fix the cause stated by the error message before trying broader changes.
- Keep the fix scope as small as possible.
- Do not include opportunistic cleanup in a bug-fix commit.
- If a fix is based on a hypothesis, document the hypothesis, evidence, and any remaining unverified assumptions.
- If the same failure happens again, assume the previous premise was incomplete and update the policy or verification approach.
- For CI-only failures that cannot be fully reproduced locally, add a structural check that directly matches the CI error.
- Do not add unrelated dependencies or workaround code when the root cause is still unclear.

## 3. Architecture Rules

- A widget is an independent functional unit.
- Widgets must not consume external API responses directly.
- External API, mock data, and static JSON must be converted into widget data in the service layer.
- Widget responsibilities are rendering, loading/error/empty/stale states, and reporting user actions.
- Provider differences must be handled in the service layer or adapter layer.
- `dashboard.config.ts` is the entry point for display structure and widget settings.
- When adding a widget, add `widgets/{name}`, `services/{name}`, definition, registry registration, config, and tests together.
- A failure in one widget must not break the full dashboard.
- Do not mix mock and real implementations implicitly. Make the provider explicit.

## 4. TypeScript Rules

- Avoid `any`. Use `unknown` for external input and validate it with schemas before use.
- Keep API response types separate from widget data types.
- Use semantic aliases such as `ISODateTimeString` and `ISODateString` for date strings.
- Optional values must have explicit UI fallbacks.
- Prefer union types for enum-like values.
- Keep widget status values aligned with `"idle" | "loading" | "success" | "error" | "stale" | "offline"`.
- Centralize display modes in `DisplayMode`.
- Route future dashboard operations through `DashboardCommand` instead of adding widget-specific command paths.

## 5. React And UI Rules

- Optimize for a 12.4 inch tablet in landscape orientation with no required scrolling.
- Main information should be readable within roughly three seconds.
- Keep Quick Area as a future command surface, but keep it compact so it does not crowd core widgets.
- Touch targets should stay at least 44px high or wide where practical.
- Use `line-clamp` or `ellipsis` to prevent long text from breaking layouts.
- Empty state is not an error state.
- Stale state should preserve displayable previous data with a warning-style indication.
- UI changes must be checked against the target viewport for clipping.
- Temperature must use the Celsius symbol, Unicode `U+2103`, not the text `deg`.
- When touching display text, search for `deg` and common mojibake marker strings before committing.

## 6. Config And Secrets

- Do not commit API keys, private URLs, tokens, webhook URLs, or personal iCal URLs.
- Treat every `VITE_` environment variable as public because it is bundled into frontend code.
- APIs requiring secrets should eventually be accessed through Cloudflare Workers, generated JSON, or another server-side boundary.
- Do not fetch or display private personal data directly from public GitHub Pages code.
- Mock and fixed config values must be explicit in provider names or settings.
- Prefer config-driven placeholders over comments that say a hardcoded value will be replaced later.

## 7. Testing Rules

- Even for visual UI changes, run `npm run build`, `npm run test:run`, and `npm run lint`.
- Add contract tests for service-layer response conversion logic.
- Prioritize tests for config validation, registry resolution, cache restore, and stale fallback.
- Do not perform real external API calls in unit or integration tests.
- Keep mock data in fixtures or test support modules.
- For CI fixes, verify with the same Node/npm and OS conditions where feasible.
- Do not chase coverage numbers alone. Cover paths that would create real operational risk if broken.

## 8. Git And Commit Rules

- Keep one purpose per commit.
- Do not mix CI fixes, UI changes, dependency updates, and refactors in one commit.
- Do not revert user or unrelated local changes unless explicitly instructed.
- A `package-lock.json`-only commit must have a clear explanation for why only the lockfile changed.
- Commit messages should state the purpose of the change.
- Good examples: `Add missing emnapi lock entries`, `Make quick area a compact command bar`, `Use Celsius symbol in weather widget`.

## 9. Documentation Rules

- When an implementation decision changes, update `ImplementationPlan.md` or `ImplementationPlan_Addendum.md` if the decision affects future work.
- Code comments should explain why the current design exists, not list vague future work.
- Use TODO comments only when the required follow-up condition is clear.
- Mock, fixed, and placeholder implementations should be named so their temporary nature is obvious.
- If a user action is required, explain both the steps and the reason.

## 10. Review Checklist

- Is the change scope minimal for the cause?
- Did this add an unnecessary direct dependency?
- Does the lockfile diff match the npm or CI requirement?
- Does every widget still go through the service layer for external data?
- Is the mock/real boundary explicit?
- Does the UI fit the tablet landscape target without clipping?
- Are units and text encoding correct?
- Do `build`, `test:run`, and `lint` pass?
- Does the commit contain only one purpose?
