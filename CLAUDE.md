# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Next.js 15 (App Router, React 19, TypeScript, Tailwind 4) web service for Mairie360 hosting user settings (contact details, sessions; other tabs shown as not yet available). The browser only talks to this app's own origin; the Next.js server forwards data calls to **BFF_Settings**. UI building blocks come from the private package `@mairie360/lib-components`. Docs are bilingual: `docs/en|fr/module.md` (functional) and `docs/en|fr/technical.md` (routes, config, troubleshooting) — update both languages together. `BFF.md` / `BACKEND.md` contain *proposed* backend needs; the OpenAPI snapshot is the source of truth for implemented behaviour.

## Commands

Private `@mairie360/*` packages come from GitHub Packages: `.npmrc` reads `NODE_AUTH_TOKEN`, so export a token with `read:packages` before installing or building images.

```bash
npm ci
npm run dev -- --port 5000         # needs the BFF(s) reachable, see "BFF URL" below
npm run build && npm run start -- --port 5000
npm run lint                             # next lint (next/core-web-vitals + next/typescript)
npm test                                 # node:test on tests/*.test.cjs + lcov in coverage/lcov.info (what CI runs)
npm run test:contracts                   # same tests, no coverage
node --test --test-name-pattern="<name>" tests/proxy.test.cjs   # single test
```

Tests are plain CommonJS `node:test` files (no Jest/Vitest, no DOM tests); new tests must match `tests/*.test.cjs`. Load source through `tests/support/load-ts.cjs` (`requireSrc('lib/x.ts')`): it transpiles `.ts`/`.tsx` with inline source maps and resolves the `@/*` alias. `npm test` passes `--enable-source-maps`, so coverage is reported on TypeScript lines; it counts erased imports/types/comments as uncovered, which makes it conservative. `tests/coverage-scope.test.cjs` loads every `src/**/*.ts` module so untested modules still count toward the 60% threshold; `src/app/page.tsx` is loaded and measured by `tests/settings-page.bff-mocks.test.cjs` only.

Tests that pin "the front only talks to the network through the contracts":

- `tests/settings.bff-mocks.test.cjs` runs the real chain: browser code → `src/app/**/route.ts` → real `fetch` → `ContractMockServer` (`tests/support/contract-mock-server.cjs`, the same design as the BFFs' upstream mocks). The mock simulates BFF_Settings from `contracts/openapi.json`. It records violations for undeclared routes, methods or bodies and for non-conforming mocked replies, and `afterEach` asserts there are none. `tests/support/front-harness.cjs` replaces `globalThis.fetch`. Outside a route handler it acts as the browser: same origin only, routed to the matching `route.ts` with cookies. Inside a handler (`AsyncLocalStorage`) it acts as the server and may only reach BFF_Settings.
- `tests/settings-page.bff-mocks.test.cjs` renders the real `src/app/page.tsx` through `tests/support/server-view.cjs` (`react-dom/server` with hook state kept between passes, same file in every front, see `../CLAUDE.md`) on the same harness and mock: loading state, form values from `/settings/bootstrap`, tab switching (`view.click('Sécurité')`), typing and submitting the form (`view.fire(..., 'onChange' | 'onSubmit')` → `PATCH /settings/profile`) and error alerts are asserted on the HTML.
- `tests/network-contract.test.cjs` scans the AST of `src/` (`tests/support/network-surface.cjs`). Only `lib/bff-client.ts` and `lib/bff-proxy.ts` may call `fetch`. Every business request must be a generated `bffSettings.<operation>(…)` call living in `lib/settings-api.ts` (no path string; `requestBff` is only the transport of the axios adapter in `lib/bff-client.ts`), each operation must exist in the generated client and the contract, and the contract package may only be imported as `import type … from '@mairie360/bff-settings-openapi/model'`, except `lib/bff-client.ts` which imports the generated client (`@mairie360/bff-settings-openapi/endpoints/bffSettings`); axios is allowed only in that file. The only server route is the BFF catch-all; the only `forwardToBff` call uses `configuredBffUrl()`. Environment reads are pinned to the BFF URLs and active frontend URLs including Login; no absolute network URL is hard-coded.
- `tests/package-contract.test.cjs` (same as Login_Web_Service): the package is pinned to an accepted exact version (`scripts/contract-version.mjs`: a release `X.Y.Z` or a `0.0.0-dev.<sha40>` dev package, never `staging`), installed and locked at that version; it is the only `@mairie360/*-openapi` dependency; `contracts/openapi.json` deep-equals the contract rebuilt from it; the stacks start `bff-settings` in the image built from the same commit (`X.Y.Z`, or `dev-<sha7>` for a dev package) and no other BFF.
- Adding a BFF operation to the contract requires an entry in `SETTINGS_OPERATIONS` (`tests/support/settings-fixtures.cjs`). Adding a network call means updating the pinned lists in `network-contract.test.cjs`.

### OpenAPI contract

The only contract is **BFF_Settings's, as published in `@mairie360/bff-settings-openapi`**, pinned to an exact version in `package.json` `dependencies`: a release `X.Y.Z`, or the `0.0.0-dev.<sha>` package the CICD publishes for each commit of BFF_Settings `main` (used since MAIR-509 while no release is cut). Never copy it from a BFF checkout: the local `BFFs/BFF_Settings` can be ahead of what is published. The package is orval output (`endpoints/bffSettings.ts` + `model/*.ts`, no `openapi.json`, and its `main` points to a missing `index.ts`), so:

- `scripts/orval-contract.mjs` rebuilds an OpenAPI document from it with the TypeScript compiler API. It is the same ESM port as in `Login_Web_Service` (only `PACKAGE_NAME` differs), so keep them aligned. It writes that document to the committed `contracts/openapi.json`, which the proxy imports at build time and the tests load. Never hand-edit it.
- orval keeps paths, methods, bodies, success schemas (`2XX`) and models named `<OperationId><status>`. The dev package references the shared `ErrorResponse` model (`{ error: { code, message, details } }`) instead of per-operation error models, so no error status is documented any more: every mocked BFF error reply must say `outOfContract: true`. It also drops formats (`email`) and `additionalProperties: false`. Nullable orval enums (`typeof X[keyof typeof X] | null`) become `{ type: ['string','null'], enum: [..., null] }`.
- Code imports types straight from the package (`import type { SettingsProfile } from '@mairie360/bff-settings-openapi/model'`, in `src/lib/settings-api.ts`). Paths come only from the generated client (`bffSettings` in `lib/bff-client.ts`, `getBffSettings` over an axios instance whose adapter delegates to `requestBff`). There is no generated `.d.ts`.

```bash
npm install --save-exact @mairie360/bff-settings-openapi@<version>   # bump: a release X.Y.Z or a published 0.0.0-dev.<sha40>, never staging
npm run contracts:sync      # (= contracts:generate) rebuild contracts/openapi.json from the installed package
npm run contracts:check     # fail if the version isn't an accepted exact version, installed != package.json, a second bff-*-openapi exists, or the snapshot is stale
```

These commands run offline. After a bump, also move the `bff-settings` image tag of the `docker-compose*.yml` files to the image built from the same commit (`X.Y.Z` for a release, `dev-<sha7>` for a dev package; `package-contract.test.cjs` enforces it), then add the new operations to `SETTINGS_OPERATIONS`. The stacks also pin dev images of Core API and the database: the dev Liquibase needs `-Dallow_template_admin=true`, the database enforces argon2id hashes in `init-test.sql`, the dev Core API needs `JWT_ALLOW_WEAK_SECRET` for the shared test secret and `RATE_LIMIT_ENABLED=false`, and BFF_Settings refuses to start without `JWT_SECRET`.

## Figma mockup

Figma is the source of truth: design and agree any UI change on **Mairie360 – Settings_Web_Service** (https://www.figma.com/design/8lGidmyfK2O59e3qvlrKGf) first, then code it. Shared components come from the lib mockup https://www.figma.com/design/T7vetUfuzPEXk5TxjHRiO2 and are instantiated, never redrawn.

## Component tree convention

Every component under `src/components/` is a **folder named after it**, and the folder tree
mirrors the composition tree:

```
Name/
  index.ts          # exports the component (and the helpers it owns)
  Name.tsx          # imports ONLY its direct sub-components, through their index.ts
  Name.test.jsx     # its tests, co-located (vitest + jsdom; `.jsx` in this repo, `.tsx` in the TypeScript-tested fronts)
  components/       # one such folder per direct sub-component, recursively
```

- A component needs nothing but the `index.ts` of its direct sub-components: `Name.tsx` imports
  `./components/Sub`, never `./components/Sub/Sub` nor a sub-sub-component. Leaves are folders
  too (without `components/`).
- Helpers a component owns (models, hooks, `*.ts`) sit beside it and are exported by its
  `index.ts`; a helper shared by two siblings sits in their closest common ancestor.
- A big component is acceptable only for a technical reason stated in a comment; otherwise
  split it so that each visible part is a component and what composes it a sub-component.
- Page and journey tests stay in `tests/`; per-component tests are the co-located
  `Name.test.jsx`. `tests/component-tree-convention.test.cjs` enforces the folder, the index,
  the co-located test and the index-only imports.

## Front tickets and the Figma mockup

A front ticket (Jira + GitHub issue + PR) **must link the Figma frame that serves as the
example** of what is being built or changed. Without that link the ticket cannot be worked
on, unless the change does not affect the display (tooling, tests, proxy, contracts…). Update
and agree the mockup first, then code it: the sync direction is Figma → code.

## Architecture

- **One component tree on the normalised lib (MAIR-608)** — `src/components/SettingsPage/` is the single root (see *Component tree convention*): `SettingsPage.tsx` renders the lib `AccessibleShell`, its hooks `use-settings-data.ts` (bootstrap read, page-return reload, retained data) and `use-profile-form.ts` sit beside it, and `components/` holds its direct parts: `SettingsHeader/`, `SettingsLoading/`, `SettingsNotices/`, `SettingsTabs/` (+ `settings-tabs.ts`, the URL ↔ tab mapping), the three cards shared by the tabs (`SettingsMutationForm/`, `SettingsSection/`, `FeedbackToast/`), and one component per tab content: `ProfileForm/`, `SessionsSection/components/SessionRevokeDialog/`, `PreferencesPanel/components/{PreferenceSelect,AppearancePreview}/`, `SystemPanel/components/{BrowserInformation,DiagnosticSection,AssistanceDialog}/`, `SettingsPendingFeatures/components/{ProfilePhoto,ProfessionalDraft,PasswordForm,TwoFactorSection,DraftPreferences,InstanceUpdatesPanel}/`. `src/app/page.tsx` imports `@/components/SettingsPage`; every component has its co-located `Name.test.jsx`, `tests/component-tree-convention.test.cjs` checks the tree.
- **Sessions through the lib `SessionList` (MAIR-607)** — `src/components/SettingsPage/components/SessionsSection/SessionsSection.tsx` renders `SessionList` from `@mairie360/lib-components/primitives` (states by the lib `sessionState`); its row action opens `security/SessionRevokeDialog.tsx` (lib `ConfirmModal` + feature port `revokeSession`, pending message when the port is not wired). No local session list markup (pinned by `tests/lib-session-list-adoption.test.cjs`).
- **Shell from the lib (MAIR-578)** — `src/components/SettingsPage/SettingsPage.tsx` renders `AccessibleShell` from `@mairie360/lib-components/shell` (the page date comes through the lib `PageHeader`); `src/lib/front-urls-provider.tsx` uses the lib `configureSidebarCookieDomain`. No local `accessible-shell.tsx`, `desktop-navigation.tsx`, `current-date.tsx` or `sidebar-preference.ts` (pinned by `tests/lib-shell-adoption.test.cjs`).

- **Contract-gated catch-all proxy** — `src/app/[...path]/route.ts` exports `proxyBffRequest` (`src/lib/bff-proxy.ts`) for every method. It matches the path against `contracts/openapi.json` `paths` (brace segments are wildcards): unknown path → 404, method not declared → 405 with `Allow` (GET implies HEAD), empty/`.`/`..` segments → 400; `/openapi.json` and `/swagger.json` are always forwarded. **A BFF route is therefore reachable from the browser only once the synced contract declares it.**
- **`forwardToBff`** strips hop-by-hop headers, the `cookie` header and the middleware-added `x-nonce` / `content-security-policy` request headers (a new header injected by the middleware must be added to that list), turns the `accessToken` cookie into `Authorization: Bearer` when no Authorization header is present, keeps the query string and raw (binary) body, uses `redirect: 'manual'`, a 15 s timeout and `Cache-Control: no-store`, preserves upstream status/headers (including `Set-Cookie`, empty 204/205/304 bodies) and returns a controlled 502 JSON error when the BFF is unreachable. `tests/proxy.test.cjs` pins this behaviour.
- **BFF URL** — `SETTINGS_BFF_URL` → `BFF_SETTINGS_BASE_URL`; resolved at request time on the server. A missing or invalid URL returns an uncached 503 without contacting an upstream. Explicitly configure either variable for local development too.
- **One front, one BFF** — this front only calls BFF_Settings. There is no session adapter to BFF User or any other BFF: the session is the `accessToken` cookie set by Login. `src/lib/logout.ts` validates the runtime `LOGIN_FRONT_URL` and navigates to its `/logout` page; Login owns cookie expiry and its BFF User logout call. Settings makes no logout request and does not claim server-side revocation (MAIR-143/MAIR-226). Do not add a route or env var pointing at another BFF; `tests/network-contract.test.cjs` fails if you do.
- **Client calls** — pages never call `requestBff` directly: `src/lib/settings-api.ts` (`loadSettings`, `saveProfile`) holds every browser call to BFF_Settings. The generated operations (`bffSettings`, `src/lib/bff-client.ts`) own the paths, so a path outside the published contract cannot be written; `requestBff` carries them. It throws a `BffRequestError` (message from `{ error: { message } }` / `{ message }` bodies, French fallback otherwise, plus `status`, `error.code` and `error.details[]`) and returns `undefined` on 204; authentication relies solely on the `accessToken` cookie.
- `src/app/page.tsx` keeps the bootstrap data and editable profile in React state; saving calls `saveProfile` (`PATCH /settings/profile`) and replaces the form with the response. Types are re-exported from `settings-api.ts`. `src/lib/profile-form.ts` (MAIR-511) holds the form rules mirrored from `SettingsProfilePatch` (`PROFILE_FIELDS`: `maxLength`, HTML `pattern`, help text; a test pins them to `contracts/openapi.json`), `isEmailChanged` (the BFF's trimmed, case-insensitive comparison), `profilePatch` and `saveErrorMessage` (French wording: `details[]` labelled per field via `describeDetail`, 403 wrong password, 409 address in use). The e-mail change shows a `current_password` field (state separate from the profile, cleared on revert or confirmed save); an empty one refuses the save locally. "Profil" edits the account; "Sécurité" lists sessions, honouring `sources.sessions === "unavailable"`. "Système" renders `SettingsAssistance` for browser-only help and authored-text/allowlisted-diagnostic downloads; it receives no business DTO and never reads storage or contacts support. Notifications/Appearance/General stay unavailable: their declared PATCH paths have empty schemas and bootstrap exposes no preferences. Never invent the missing contract from demo fixtures.
- **Session navigation and security headers** — MAIR-405 restores an early cookie-presence/decoded-expiry gate (not signature/permission verification). Protected Settings data and explicitly matched `/openapi.json`/`/swagger.json` return no-store JSON401 without an upstream call; missing/expired document sessions go to validated runtime Login or controlled503, rejected document cookies are expired on optional `COOKIE_DOMAIN`. Non-GET documents use303, not body replay. The client checks cancellation before/after fetch and delegates a real401 once to the existing Login `/logout` flow, never replaying a write or confusing403/503 with authentication. Keep the BFF's real verification and existing CSP nonce/directives intact. Other dot/static/API matcher exclusions are unchanged. `src/app/layout.tsx` stays dynamic for per-request CSP. Server revocation/admin role/timezone are separate unresolved audit findings; do not invent their contracts or modify backend code.
- `next.config.ts` sets `output: 'standalone'` (required by the Dockerfile), `poweredByHeader: false` and static security headers on every route (`tests/security-headers.test.cjs` pins them, and the ZAP baseline fails without them).

### Local browser information (MAIR-471)

`settings-browser-information.tsx` reuses `deviceFamilies` for two coarse labels.
Keep its stable string `useSyncExternalStore` snapshots, deterministic server
placeholder and no-event subscription: never read navigator during server render,
persist a raw user-agent, guess an unknown device, or add network/storage reads.
Browser versions and deployment metadata remain deliberately absent. The existing
assistance/download allowlist and modal behavior must remain unchanged.

## CI/CD

- `.github/workflows/cicd.yml` calls `mairie360/CICD/.github/workflows/frontend-cicd.yml@<sha>` pinned to a CICD commit (`package_name: settings-front`, `node_version: "24.21.0"`, `cicd_version` = the same sha, each followed by a `# vX.Y.Z` comment so Renovate bumps them together with `dev-dependency-exception.yml`; `tests/cicd-pin.test.cjs` checks they agree) and passes only the `CODECOV_TOKEN` and `N8N_WEBHOOK_SECRET` secrets plus the release-journal ones (`ANTHROPIC_API_KEY`, `RELEASE_APP_ID`, `RELEASE_APP_PK`, org secrets used by CICD to commit `RELEASE_JOURNAL.md` on `main` after each release). It runs on `pull_request`, `workflow_dispatch` and on `push` to `main` only, so a PR branch no longer runs the pipeline twice (MAIR-436). The workflow token is read-only by default (`permissions: contents: read`); only the `CICD` job gets `contents`/`packages`/`id-token: write`, the cap the reusable workflow needs for its release jobs (dev image push + cosign signature, prod tag). `tests/workflow-permissions.test.cjs` (identical in the eight fronts) pins both rules. A separate read-only `required_security_scan` job runs Semgrep and Gitleaks under the legacy required check name. The reusable pipeline runs `npm ci` → `npm run lint` + `npm audit --omit=dev --audit-level=high` (blocking; the full audit is report-only) + Semgrep/Gitleaks → `npm run build` + `npm test` (Codecov) → on `main`, builds `Dockerfile` with the token as the BuildKit secret `node_auth_token` (never a build arg), scans it with Trivy, signs it with cosign and pushes `ghcr.io/mairie360/settings-front:dev-<sha>`. Some jobs set up Node without a registry, so the committed `.npmrc` must keep the `@mairie360` registry + `${NODE_AUTH_TOKEN}` lines.
- `.github/workflows/contracts.yml` (exact Node 24.21.0) runs `contracts:check` and `test:contracts` on every PR and on pushes to `main`.
- `Dockerfile`: two-stage `node:<ver>-bookworm-slim` build, standalone output, non-root `nextjs` user, `PORT=5000`, `CMD node server.js`.

## Isolated security & performance tests

Same pattern as the APIs/BFFs, adapted to a web front. Not part of `npm test`; they need Docker and `NODE_AUTH_TOKEN` (the front image is built from the production `Dockerfile`).

- `./security_test.sh` → `docker-compose-security.yml`: full isolated upstream stack (Postgres + Liquibase + `init-test.sql` seed, Redis, Core API, BFF_Settings; published GHCR images, versions overridable via `*_IMAGE` env vars) + this front, then `zap-baseline.py` (classic spider + AJAX spider `-j`, which renders the page in a headless browser so the BFF contract routes fetched by the bundle are scanned too, + passive scan) authenticated with a static `accessToken` cookie. Any WARN/FAIL alert not set to IGNORE in `.zap/rules.tsv` fails the run; since MAIR-516 the server-error rule (100000) is no longer ignored, so a 5xx relayed by the proxy fails the scan.
- `./performance_test.sh` → `docker-compose-performance.yml`: same stack + k6 running `load-test.js`: a `reads` scenario (page `/`, then `/health` and `/settings/bootstrap` through the proxy, the path the page uses) and a `writes` scenario (MAIR-516, `PATCH /settings/general` alternating the timezone), both with a JWT minted from `JWT_SECRET`; strict status checks and per-endpoint thresholds fail the run.
- Test user is id 2 (seeded in `init-test.sql`); every service shares `JWT_SECRET=b"secret"`. `TARGET_IMAGE` lets the stacks reuse a pre-built front image. These files are excluded from the image by `.dockerignore`.

## Gotchas

- `docker-compose.yml` is the local dev stack (Postgres + Liquibase + seed, Redis, Core API, BFF_Settings, this front built from the production `Dockerfile` on :5000). Export `NODE_AUTH_TOKEN` first: it reaches the build as the BuildKit secret `node_auth_token`, never as a build arg nor in the running container (MAIR-436, `tests/dev-image-secret.test.cjs`). `development.Dockerfile` (`npm run dev`, same pinned Node 24.21.0 and secret mount) is not used by any compose file.

## Pull request reviewers

Every PR requests a review from the whole team, minus its author: `CarolinHugo`, `LAURETbenjamin`, `MathTek` and `Quentintnrl` (`gh pr create … --reviewer CarolinHugo,LAURETbenjamin,MathTek`). `.github/CODEOWNERS` makes GitHub request them automatically as well.

## Promotion to staging and prod (MAIR-494)

A push to `main` only releases dev (`cicd.yml` stops at `release-dev`). Staging and prod are manual:
`gh workflow run promote-staging.yml -R mairie360/Settings_Web_Service` (main's newest commit) or `gh workflow run promote-staging.yml -R mairie360/Settings_Web_Service -f sha=SHA` (a given commit), then the same with `promote-prod.yml`
(environments `Staging` / `Prod`). Staging refuses a commit without `dev-<sha>` and a green main run, and runs
the ZAP and k6 stacks on that image; prod refuses one without `staging-<sha>` and tags the version semantic-release computes
for that commit. `cicd.yml`, `promote-staging.yml` and `promote-prod.yml` pin the same mairie360/CICD release.
