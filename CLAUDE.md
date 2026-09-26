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
- `tests/network-contract.test.cjs` scans the AST of `src/` (`tests/support/network-surface.cjs`). Only `lib/bff-client.ts` and `lib/bff-proxy.ts` may call `fetch`. Every `requestBff` call must live in `lib/settings-api.ts` with a literal path and method declared in the contract, and the contract package may only be imported as `import type … from '@mairie360/bff-settings-openapi/model'`. The only server route is `app/[...path]/route.ts`, the only `forwardToBff` call uses `configuredBffUrl()`, the only env vars read are `SETTINGS_BFF_URL`, `BFF_SETTINGS_BASE_URL` and `NODE_ENV`, and no absolute network URL is hard-coded.
- `tests/package-contract.test.cjs` (same as Login_Web_Service): the package is pinned to an exact `X.Y.Z`, installed and locked at that version; it is the only `@mairie360/*-openapi` dependency; `contracts/openapi.json` deep-equals the contract rebuilt from it; the security/performance stacks start `bff-settings:<package version>` and no other BFF.
- Adding a BFF operation to the contract requires an entry in `SETTINGS_OPERATIONS` (`tests/support/settings-fixtures.cjs`). Adding a network call means updating the pinned lists in `network-contract.test.cjs`.

### OpenAPI contract

The only contract is **BFF_Settings's, as published in `@mairie360/bff-settings-openapi`**, pinned to an exact version in `package.json` `dependencies` (currently `1.0.0`). Never copy it from a BFF checkout: the local `BFFs/BFF_Settings` can be ahead of the last release (its `mair-121` branch documents extra error statuses not in `1.0.0`). The package is orval output (`endpoints/bffSettings.ts` + `model/*.ts`, no `openapi.json`, and its `main` points to a missing `index.ts`), so:

- `scripts/orval-contract.mjs` rebuilds an OpenAPI document from it with the TypeScript compiler API. It is the same ESM port as in `Login_Web_Service` (only `PACKAGE_NAME` differs), so keep them aligned. It writes that document to the committed `contracts/openapi.json`, which the proxy imports at build time and the tests load. Never hand-edit it.
- orval keeps paths, methods, bodies, success schemas (`2XX`) and models named `<OperationId><status>` (the preference `404`s, `check_apis` `502`). It drops other error statuses, formats (`email`) and `additionalProperties: false`, so mocked BFF error replies must say `outOfContract: true`.
- Code imports types straight from the package (`import type { SettingsProfile } from '@mairie360/bff-settings-openapi/model'`, in `src/lib/settings-api.ts`). `requestBff` types its path as `BffPath`, the keys of `contracts/openapi.json` `paths`. There is no generated `.d.ts`.

```bash
npm install --save-exact @mairie360/bff-settings-openapi@X.Y.Z   # bump: published releases only, never 0.0.0-dev/staging
npm run contracts:sync      # (= contracts:generate) rebuild contracts/openapi.json from the installed package
npm run contracts:check     # fail if the version isn't exact X.Y.Z, installed != package.json, a second bff-*-openapi exists, or the snapshot is stale
```

These commands run offline. After a bump, also move the `bff-settings` image tag in `docker-compose-security.yml` / `docker-compose-performance.yml` to the same version (`package-contract.test.cjs` enforces it), then add the new operations to `SETTINGS_OPERATIONS`.

## Architecture

- **Contract-gated catch-all proxy** — `src/app/[...path]/route.ts` exports `proxyBffRequest` (`src/lib/bff-proxy.ts`) for every method. It matches the path against `contracts/openapi.json` `paths` (brace segments are wildcards): unknown path → 404, method not declared → 405 with `Allow` (GET implies HEAD), empty/`.`/`..` segments → 400; `/openapi.json` and `/swagger.json` are always forwarded. **A BFF route is therefore reachable from the browser only once the synced contract declares it.**
- **`forwardToBff`** strips hop-by-hop headers, the `cookie` header and the middleware-added `x-nonce` / `content-security-policy` request headers (a new header injected by the middleware must be added to that list), turns the `accessToken` cookie into `Authorization: Bearer` when no Authorization header is present, keeps the query string and raw (binary) body, uses `redirect: 'manual'`, a 15 s timeout and `Cache-Control: no-store`, preserves upstream status/headers (including `Set-Cookie`, empty 204/205/304 bodies) and returns a controlled 502 JSON error when the BFF is unreachable. `tests/proxy.test.cjs` pins this behaviour.
- **BFF URL** — `SETTINGS_BFF_URL` → `BFF_SETTINGS_BASE_URL`; resolved at request time on the server. A missing or invalid URL returns an uncached 503 without contacting an upstream. Explicitly configure either variable for local development too.
- **One front, one BFF** — this front only calls BFF_Settings. There is no `/api/*` session adapter to BFF User or any other BFF: the session is just the `accessToken` cookie set by Login. Do not add a route or env var pointing at another BFF; `tests/network-contract.test.cjs` fails if you do.
- **Client calls** — pages never call `requestBff` directly: `src/lib/settings-api.ts` (`loadSettings`, `saveProfile`) holds every browser call to BFF_Settings. `requestBff` (`src/lib/bff-client.ts`) types its `path` as `BffPath` (keys of `contracts/openapi.json`), so a path outside the published contract does not compile. It which throws a plain `Error` whose message comes from `{ error: { message } }` / `{ message }` bodies (French fallback otherwise) and returns `undefined` on 204; authentication relies solely on the `accessToken` cookie.
- `src/app/page.tsx` keeps the bootstrap data and editable profile in React state; saving calls `saveProfile` (`PATCH /settings/profile`) and replaces the form with the response. Types are re-exported from `settings-api.ts`. "Profil" edits the account; "Sécurité" lists sessions, honouring `sources.sessions === "unavailable"`. "Système" renders `SettingsAssistance` for browser-only help and authored-text/allowlisted-diagnostic downloads; it receives no business DTO and never reads storage or contacts support. Notifications/Appearance/General stay unavailable: their declared PATCH paths have empty schemas and bootstrap exposes no preferences. Never invent the missing contract from demo fixtures.
- **Security headers** — `src/middleware.ts` (matcher excludes `/api`, `/_next/*` and paths with a dot) only sets a per-request nonce `Content-Security-Policy` (built in `src/lib/content-security-policy.ts`, forwarded to Next.js via request headers); there is no auth gate and no `auth-session.ts`, so unauthenticated users are not redirected by this app. `src/app/layout.tsx` forces dynamic rendering for that reason: a prerendered page would carry no nonce and its scripts would be blocked. Any new external origin (images, fonts, browser-side API calls) must be added to that policy.
- `next.config.ts` sets `output: 'standalone'` (required by the Dockerfile), `poweredByHeader: false` and static security headers on every route (`tests/security-headers.test.cjs` pins them, and the ZAP baseline fails without them).

## CI/CD

- `.github/workflows/cicd.yml` calls `mairie360/CICD/.github/workflows/frontend-cicd.yml@v2.3.1` (`package_name: settings-front`, `node_version: "23"`, `cicd_version: v2.3.1`, `secrets: inherit`; Renovate bumps the `@v` pin and `cicd_version` together). Up to the dev release it runs: `npm ci` → `npm run lint` + `npm audit --audit-level=high` (high/critical advisories block) → `npm run build` → `npm test --if-present` (uploads `coverage/lcov.info` to Codecov) → on `main`, builds `Dockerfile` with `NODE_AUTH_TOKEN` as build-arg and pushes `ghcr.io/mairie360/settings-front:dev-<sha>` / `dev-latest`. Some jobs set up Node without a registry, so the committed `.npmrc` must keep the `@mairie360` registry + `${NODE_AUTH_TOKEN}` lines.
- `.github/workflows/contracts.yml` (Node 22) runs `contracts:check` and `test:contracts` on every push/PR.
- `Dockerfile`: two-stage `node:<ver>-bookworm-slim` build, standalone output, non-root `nextjs` user, `PORT=5000`, `CMD node server.js`.

## Isolated security & performance tests

Same pattern as the APIs/BFFs, adapted to a web front. Not part of `npm test`; they need Docker and `NODE_AUTH_TOKEN` (the front image is built from the production `Dockerfile`).

- `./security_test.sh` → `docker-compose-security.yml`: full isolated upstream stack (Postgres + Liquibase + `init-test.sql` seed, Redis, Core API, BFF_Settings; published GHCR images, versions overridable via `*_IMAGE` env vars) + this front, then `zap-baseline.py` (spider + passive scan) authenticated with a static `accessToken` cookie. Any WARN/FAIL alert not set to IGNORE in `.zap/rules.tsv` fails the run.
- `./performance_test.sh` → `docker-compose-performance.yml`: same stack + k6 running `load-test.js` (page `/`, then `/health` and `/settings/bootstrap` through the proxy) with a JWT minted from `JWT_SECRET`; thresholds fail the run.
- Test user is id 2 (seeded in `init-test.sql`); every service shares `JWT_SECRET=b"secret"`. `TARGET_IMAGE` lets the stacks reuse a pre-built front image. These files are excluded from the image by `.dockerignore`.

## Gotchas

- `docker-compose.yml` and `development.Dockerfile` are still the unmodified template (a `projects` service behind an nginx that mounts a non-existent `nginx.conf`, `npm ci` without the GitHub Packages token) and do not start this module; rely on `docker-compose-security.yml` / `docker-compose-performance.yml` for a working stack definition.

## Pull request reviewers

Every PR requests a review from the whole team, minus its author: `CarolinHugo`, `LAURETbenjamin`, `MathTek` and `Quentintnrl` (`gh pr create … --reviewer CarolinHugo,LAURETbenjamin,MathTek`). `.github/CODEOWNERS` makes GitHub request them automatically as well.
