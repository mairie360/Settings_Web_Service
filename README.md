# Settings_Web_Service

Let users update contact details and inspect sessions. The interface explicitly identifies settings that are not yet available.

Permettre à l’utilisateur de modifier ses coordonnées et de consulter ses sessions. L’interface affiche explicitement les réglages qui ne sont pas encore disponibles.

## Documentation

| Language / Langue | Module | Technical / Technique |
| --- | --- | --- |
| English | [Module overview](docs/en/module.md) | [Technical documentation](docs/en/technical.md) |
| Français | [Présentation du module](docs/fr/module.md) | [Documentation technique](docs/fr/technical.md) |

The guides describe the implemented module, its current limitations, local setup, routes, data, verification and CI/CD.

Les guides décrivent le module implémenté, ses limites actuelles, le démarrage local, les routes, les données, les vérifications et la CI/CD.

## Frontend verification

After installing dependencies, `npm test` runs the existing contract/proxy
suite and the Settings component suite. `npm run test:components` runs only the
Vitest/Testing Library tests. They exercise persisted-profile behavior,
unavailable states, keyboard navigation and serious/critical axe findings
with synthetic contract-shaped responses; they do not prove behavior against
a live BFF or replace manual accessibility review.

Profile saves keep one in-flight PATCH and freeze all four inputs until it
settles. A successful HTTP status alone does not confirm a usable profile:
the page checks the published `SettingsProfile` shape before replacing either
the confirmed data or the draft. An unusable reply keeps the draft, displays
an error and unlocks retry without inventing missing fields. Optional phone
may be absent, null or a string; valid server normalizations remain authoritative.
The fault-injection tests intentionally return invalid confirmations and do not
claim that those replies conform to the contract or occur on deployed services.

### Read recovery (MAIR-456)

After an initial refusal, **Réessayer** explicitly repeats the existing bootstrap
GET. When sessions are unavailable, **Actualiser les paramètres** refreshes the
same response. Reads are single-flight, abort on unmount, ignore stale results
and cannot compete with profile saves. The received profile becomes the new
confirmed baseline; all dirty contact fields, including edits made while the
read is pending, remain in the draft. Clean fields adopt the received values.
Read recovery never repeats a PATCH or clears an independent save/logout error.
Component regressions cover refusal, keyboard retry, concurrent guards,
StrictMode cleanup and draft preservation; HTTP contract tests verify the real
page/client/proxy trace. Synthetic responses are test-only, not deployed data.

### Composed recovery and confirmation

The confirmation check runs before updating the read baseline. An unusable
save reply cannot turn a subsequent bootstrap read into a draft reset or a
false acknowledgement. Cross-feature HTTP and React regressions cover the
invalid save, explicit read with draft retention and independent save error,
explicit valid retry, and a later read adopting clean fields from the new
confirmed baseline. Read/save guards and both individual regression suites
remain intact. This candidate does not change the shared-library pin or claim
that its required remote CI, deployed behavior or current-local integration pass.

## Container packaging (MAIR-436)

The Dockerfile and both Node CI inputs use Node `24.21.0`. The official
`bookworm-slim` base is pinned by digest in the dependency and runtime stages.
The existing shared workflow supplies `node_auth_token` as a BuildKit secret;
`npm ci` mounts it as a temporary environment variable alongside the read-only
tracked `.npmrc`. Do not pass a credential as a build argument or replace the
tracked placeholder with a literal token. The seven-day npm release-age window
and the sole `@mairie360/lib-components` exception remain enabled.

`docker buildx build --check .` checks the Dockerfile without using credentials.
`docker buildx build --target dependencies --network=none .` without a secret
must fail with `secret node_auth_token: not found`, before npm runs. These checks
do not prove a complete authenticated image build. The existing main pipeline
verifies the actual build/push, image scan and signature using its ephemeral
credential. No API/BFF, cluster pin, registry access or Staging/Prod gate is
changed by this consumer packaging fix. MAIR-436 remains open for its other
frontend and workflow-hardening criteria.

Both isolated Compose test stacks also supply this same build secret from the
existing `NODE_AUTH_TOKEN` environment. It is not a container runtime secret or
environment variable, and no test-stack API/BFF service or scan rule is changed.
`docker compose --env-file /dev/null -f docker-compose-security.yml config --no-interpolate`
(and the performance variant) validates the configuration without starting
services; it is not evidence that the dynamic/performance tests have passed.

The runner retains Node, curl and the traced application dependencies, but does
not include npm/npx, yarn or corepack: package installation belongs only to the
builder, and the standalone runtime starts `node server.js`. This removes the
unused vulnerable global npm dependencies identified by the blocking image
scan of `dev-f522ee3`; no scan exclusion or policy downgrade is used. The
`runtime-base` target can be built without any npm credential to check Node,
curl and removal of these CLIs; only the main pipeline verifies the full image.

## Contracts and background / Contrats et compléments

- [BFF.md](BFF.md)
- [BACKEND.md](BACKEND.md)
- [contracts/openapi.json](contracts/openapi.json)

`BACKEND.md`, when present, includes proposed backend requirements; use the guides and versioned OpenAPI contract to identify current behavior.

`BACKEND.md`, lorsqu’il est présent, contient des besoins backend proposés; consulter les guides et le contrat OpenAPI versionné pour identifier le comportement actuel.
