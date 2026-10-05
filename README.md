# Settings_Web_Service

## Local browser information — MAIR-471

System restores the reference's visible browser/operating-system information
using the existing coarse local detector. Labels are estimates, not a device
inventory; unknown or inaccessible information is not replaced by fixture data.
Server rendering uses a deterministic placeholder, resolved after hydration with
stable string snapshots and no event subscription, network request or storage.
No raw user-agent, browser version, profile/session or deployment metadata is
displayed or transmitted. Assistance and diagnostic exports remain unchanged.

## Protected session navigation — MAIR-405 frontend slice

Restore the preserved prototype's early cookie presence/expiry gate without its
implicit localhost Login fallback. Anonymous/expired page requests redirect only
to a validated runtime `LOGIN_FRONT_URL` (503 if unavailable); non-GET documents
use 303 rather than replaying a body. Protected Settings data and metadata return
an uncached same-origin JSON401, never a cross-origin fetch redirect. A real401
hands the browser to the existing Login `/logout` flow once, with no mutation
replay. Aborted reads cannot navigate after unmount; 400/403/503 remain distinct
business/service errors. Authenticated requests retain the nonce CSP. The
`COOKIE_DOMAIN` setting controls expiry of a document's rejected shared cookie.

This is an early navigation check, **not JWT signature verification, server
revocation or authorization**. The unchanged BFF/proxy still owns real token and
permission checks. The mixed audit's role/Admin link, instance timezone and
deployed acceptance remain open; no backend, contract, demo data, dependency,
security gate or deployment is changed. Focused17regressions (12initially red),
168Node/41component tests and existing60% gates pass. Native proof and genuine CI
must be qualified separately before main/current-local integration.

Rétablir la garde cookie du prototype, sans URL Login locale implicite. Les pages
sans session/expirées rejoignent la destination validée ; les données/métadonnées
renvoient un401JSON de même origine. Le navigateur délègue une seule fois la
reconnexion au flux Login existant, sans rejouer l’écriture ni confondre403/503
avec une expiration. Les lectures annulées ne naviguent pas. CSP conservée,
`COOKIE_DOMAIN` utilisé pour effacer le cookie rejeté d’un document. Ceci ne
certifie ni signature JWT, révocation, rôle admin, fuseau ni environnement réel ;
MAIR405 reste un audit partiellement traité et aucun BFF/API n’est modifié.

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

## Paired sidebar comparison — MAIR-182 / issue #24

A disposable copy of the preserved reference's exact `src` and `public` was
rebuilt with the available Next 16.3.6 / published UI 0.6.10 toolchain. This is
source-reference evidence, not certification of its original Next 15 install.
At 1280×720, the consumer now matches the reference's 44px sidebar links,
positions and lateral shadow; mobile stacking stays below the drawer close
control. The heading, header and tabs' vertical positions remain unchanged.
At measured 390×844, all six panels stay bounded; Close, Shift+Tab/Tab and Escape
restore the opener. Arrow keys/Home/End, draft retention across tabs and the
shared Profile link are checked. Measured 640/768/1920 widths also stay bounded.

The short four-field published profile has no desktop vertical scrollbar, unlike
the reference's longer unsupported profile. Its natural 15px wider content is
intentional: no artificial gutter or demo photo/service/job/biography fields are
added. Preferences, administrator role and real authenticated Dev acceptance
remain separate blockers; no exhaustive pixel or deployed persistence claim.
151 sequential Node tests and 41 component tests pass, with 90.17% lines,
90.96% branches and 94.67% functions (unchanged 60% gates). Types, published
Settings 1.1.0 contract and one-worker production build pass; lint retains one
existing warning. Six disposable calls (four GET and two identical PATCH)
exercise refused save, retained draft, explicit confirmed retry and reload.
Zero validator violations include the declared simulated 503 exception; this
does not certify a deployed BFF or real account. Servers are stopped, original
data unchanged. Required green CI and integration are still prerequisites.

Comparaison sur copie exacte de l'ancienne référence, pas certification de son
installation d'origine. Sidebar 44px/ombre, fermeture et focus mobile, six
panneaux, clavier, profil direct et brouillon sont vérifiés. La largeur naturelle
du profil court reste volontaire, sans fausses données ou sauvegardes. Les
chiffres de tests et appels ci-dessus concernent les fixtures jetables ; CI,
intégration, rôle publié et recette Dev réelle restent distincts. Aucun API/BFF,
contrat, auth, dépendance, workflow, environnement ou pin de cluster modifié.

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

## Shared UI alignment / Alignement UI partagé — MAIR-180

This consumer pins the published `@mairie360/lib-components@0.6.10`, including
its exact download URL and SHA512 integrity. Only the shared UI entry changes
in the lockfile; all other dependencies and security policies are preserved.
Tracking: [MAIR-180](https://mairie-360.atlassian.net/browse/MAIR-180) and
[cross-frontend issue](https://github.com/mairie360/Login_Web_Service/issues/142).
Login stays standalone without header/sidebar/footer; authenticated module
shells and the existing Elearning confirmation/rating features are preserved.
No API/BFF, contract, runtime configuration, demo data or deployment approval change.

Le pin exact et l'intégrité du package publié sont alignés sur Elearning sans
le rétrograder. Les tests de release vérifient le manifeste, le lockfile et le
vrai package installé. Une validation isolée ne remplace pas la CI verte,
l'intégration des sept consommateurs et la recette de la copie locale livrée.

## Composed profile recovery with published UI — 4 October 2026

The existing profile-confirmation and bootstrap-recovery changes are composed
with the approved shared UI0.6.10 consumer pin. The real published tarball was
verified against the lockfile SHA512 before installation in an isolated QA copy;
all other locked dependencies and the user's installed UI0.6.8 remain unchanged.
150 Node tests (seven suites, sequential), 41 component tests, TypeScript,
published Settings1.1.0 contract and production webpack build pass. Original
coverage gates remain60%; lint has one inherited warning, not a disabled rule.

Native desktop1280x720 initial refusal/retry and actual mobile390x844 profile
checks retain all four draft fields and the save error after an unusable response.
GET-only recovery does not resubmit the save. Explicit confirmed retry displays
the returned profile; the next read updates clean fields against that new baseline
and retains a later dirty first name. The shared mobile drawer traps/restores
keyboard focus. Root17px, document390px, no framework overlay; console logs empty.
Only the measured390px recipe counts as mobile, not an earlier ignored override.

The first disposable server stopped before read recovery; its terminal state and
four-request ledger were retained, then the fixture restarted for the three-call
continuation. Seven upstream calls total (five GET, two PATCH); one browser fetch
during downtime reached no mock. Zero validator violations within the explicit
simulated refusals/unusable-response exceptions, not zero strict deviations or
proof of deployed authorization/persistence. Both servers are stopped. This is
not an exhaustive fresh paired prototype comparison, complete image/deployment
test or a green required CI. Issues remain open until integration and exact
main/local-current verification; no API/BFF, contract/client/auth/security change.

Les reprises de lecture et confirmations du profil sont vérifiées ensemble avec
le vrai package UI publié. Le brouillon et l'erreur restent indépendants du GET ;
seule une réponse de profil utilisable confirme l'enregistrement. Les chiffres
ci-dessus distinguent les appels amont du fetch pendant l'arrêt du serveur et les
exceptions simulées. La preuve mobile est réellement390x844 ; aucune autorisation
ou persistance déployée, parité exhaustive ou intégration main n'est revendiquée.
Les deux versions locales et les dépendances utilisateur restent préservées.
