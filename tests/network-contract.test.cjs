const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { describe, test } = require('node:test');
const { ROOT, requireSrc } = require('./support/load-ts.cjs');
const { OpenApiContract } = require('./support/openapi-contract.cjs');
const { scanNetworkSurface } = require('./support/network-surface.cjs');
const fixtures = require('./support/settings-fixtures.cjs');

// Le contrat de référence du front est celui publié par BFF_Settings dans le paquet @mairie360/bff-settings-openapi,
// à la version exacte épinglée dans package.json, reconstruit dans contracts/openapi.json.
// Vérification statique (AST de tout src/, .ts et .tsx) que le front ne parle au réseau qu'à travers ce contrat :
// - le navigateur n'appelle que sa propre origine, via `requestBff`, sur des opérations du paquet publié ;
// - le serveur Next.js ne relaie que vers un seul BFF, BFF_Settings, à travers le proxy dont la liste blanche
//   (contracts/openapi.json) expose exactement les opérations du paquet publié ;
// - aucune autre API réseau, bibliothèque HTTP, URL absolue ou paquet OpenAPI d'un autre BFF n'est utilisé.
// Les comportements correspondants sont exercés contre un mock dans settings.bff-mocks.test.cjs.

const PACKAGE = '@mairie360/bff-settings-openapi';
// Reconstruction exacte du paquet publié à la version épinglée (vérifiée par package-contract.test.cjs).
const contract = OpenApiContract.load(path.join(ROOT, 'contracts', 'openapi.json'));
const surface = scanNetworkSurface();

const operationKeys = () => contract.operations().map(({ method, template }) => `${method} ${template}`).sort();
const successSchema = (method, template) => contract.responseSchema(contract.match(method, template), 200).schema;

describe('published BFF_Settings contract in src/', () => {
  test('the proxy allowlist is the snapshot rebuilt from the package', () => {
    const source = fs.readFileSync(path.join(ROOT, 'src', 'lib', 'bff-proxy.ts'), 'utf8');
    assert.match(source, /import contract from '\.\.\/\.\.\/contracts\/openapi\.json';/);
    assert.equal(contract.document.info['x-source-package'].split('@').slice(0, 2).join('@'), PACKAGE);
  });

  test('the package is the only OpenAPI package imported, for its types only (never its axios client)', () => {
    assert.ok(surface.openapiPackages.length > 0);
    for (const entry of surface.openapiPackages) {
      assert.ok(entry.typeOnly && entry.specifier === `${PACKAGE}/model`, `${entry.at} : importer uniquement \`import type … from '${PACKAGE}/model'\``);
    }
  });
});

describe('network surface of src/', () => {
  test('only the BFF client and the BFF proxy use a raw network API', () => {
    assert.deepEqual(surface.raw.map(({ file, api }) => `${file} ${api}`), [
      'lib/bff-client.ts fetch',
      'lib/bff-proxy.ts fetch',
    ]);
  });

  test('the only hard-coded URL is the local BFF_Settings fallback', () => {
    assert.deepEqual(surface.absoluteUrls.map(({ file, url }) => `${file} ${url}`), ['lib/bff-proxy.ts http://localhost:4008']);
  });

  test('every browser call goes through requestBff from src/lib/settings-api.ts', () => {
    assert.ok(surface.requestBff.length > 0);
    assert.deepEqual([...new Set(surface.requestBff.map(({ file }) => file))], ['lib/settings-api.ts']);
  });

  test('every requestBff call targets a literal operation of the published contract', () => {
    for (const call of surface.requestBff) {
      assert.ok(call.path && call.method, `${call.at} : chemin et méthode doivent être littéraux pour être vérifiables`);
      assert.ok(contract.match(call.method, call.path), `${call.at} : ${call.method} ${call.path} absent de ${PACKAGE}`);
    }
    assert.deepEqual(surface.requestBff.map(({ method, path: pathname }) => `${method} ${pathname}`), ['GET /settings/bootstrap', 'PATCH /settings/profile']);
  });

  test('the front relays to a single BFF: only the contract proxy forwards, to configuredBffUrl()', () => {
    assert.deepEqual(surface.forwardToBff.map(({ file, baseUrl }) => `${file} ${baseUrl}`), ['lib/bff-proxy.ts configuredBffUrl()']);
  });

  test('the only server route is the contract catch-all proxy', () => {
    assert.deepEqual(surface.routes, ['app/[...path]/route.ts']);
  });

  test('the only BFF URL read from the environment is the BFF_Settings one', () => {
    assert.deepEqual(surface.env.map(({ file, name }) => `${file} ${name}`), [
      'lib/bff-proxy.ts SETTINGS_BFF_URL',
      'lib/bff-proxy.ts BFF_SETTINGS_BASE_URL',
      'middleware.ts NODE_ENV',
    ]);
  });

  test('the browser Content-Security-Policy only allows same-origin connections', () => {
    const { buildContentSecurityPolicy } = requireSrc('lib/content-security-policy.ts');
    for (const isDevelopment of [false, true]) {
      const directives = buildContentSecurityPolicy('nonce', isDevelopment).split('; ');
      assert.ok(directives.includes("connect-src 'self'"));
      assert.ok(directives.includes("default-src 'self'"));
    }
  });
});

describe('fixtures conform to the published contract', () => {
  test('every published operation has a conforming fixture', () => {
    assert.deepEqual(Object.keys(fixtures.SETTINGS_OPERATIONS).sort(), operationKeys());
    for (const [key, { send, reply }] of Object.entries(fixtures.SETTINGS_OPERATIONS)) {
      const [method, template] = key.split(' ');
      assert.deepEqual(contract.validate(successSchema(method, template), reply.body), [], key);
      const { schema } = contract.requestBodySchema(contract.match(method, template));
      if (send !== undefined) assert.deepEqual(contract.validate(schema, send), [], `${key} (corps envoyé)`);
    }
  });

  test('bootstrap, profile and error fixtures', () => {
    assert.deepEqual(contract.validate(contract.schema('SettingsBootstrap'), fixtures.bootstrap({ sessions: [fixtures.session('s-2', { revoked_at: '2026-09-16T08:00:00Z' })], sources: { sessions: 'unavailable' } })), []);
    assert.deepEqual(contract.validate(contract.schema('SettingsProfilePatch'), fixtures.profile({ phone: null })), []);
    // Error n'est rattaché à aucune opération par orval, mais le modèle est publié : c'est le corps des erreurs du BFF.
    assert.deepEqual(contract.validate(contract.schema('Error'), fixtures.error('Refus')), []);
  });

  test('the validator reports contract violations', () => {
    assert.deepEqual(contract.validate(contract.schema('SettingsBootstrap'), { profile: { first_name: 42, email: 'anne@mairie.test' }, sessions: {}, sources: { sessions: 'maybe' } }), [
      '$.profile.last_name: propriété requise manquante',
      '$.profile.first_name: type string attendu, reçu number',
      '$.sessions: type array attendu, reçu object',
      '$.sources.sessions: valeur "maybe" hors enum ["available","unavailable"]',
    ]);
    assert.deepEqual(contract.validateRequest('GET', new URL('http://bff/settings/profile')).errors, ["GET /settings/profile n'existe pas dans le contrat bff_settings"]);
  });
});
