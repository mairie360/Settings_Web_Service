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

## Contracts and background / Contrats et compléments

- [BFF.md](BFF.md)
- [BACKEND.md](BACKEND.md)
- [contracts/openapi.json](contracts/openapi.json)

`BACKEND.md`, when present, includes proposed backend requirements; use the guides and versioned OpenAPI contract to identify current behavior.

`BACKEND.md`, lorsqu’il est présent, contient des besoins backend proposés; consulter les guides et le contrat OpenAPI versionné pour identifier le comportement actuel.
