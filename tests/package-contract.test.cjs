const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

// Le contrat du front est celui de BFF_Settings publié dans @mairie360/bff-settings-openapi, épinglé à une version
// exacte (release X.Y.Z ou paquet dev 0.0.0-dev.<sha> du main du BFF, scripts/contract-version.mjs) :
// contracts/openapi.json doit en être la reconstruction exacte (scripts/orval-contract.mjs), et BFF_Settings est
// le seul BFF, dans l'image construite depuis le même commit, partout où ce dépôt le démarre. Même contrôle que
// dans Login_Web_Service.

const ROOT = path.join(__dirname, '..');
const PACKAGE_NAME = '@mairie360/bff-settings-openapi';
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
const manifest = readJson('package.json');
const pinned = manifest.dependencies[PACKAGE_NAME];

test('the BFF_Settings contract package is pinned to an exact published version, installed as locked', async () => {
  const { isAcceptedContractVersion } = await import('../scripts/contract-version.mjs');
  assert.ok(isAcceptedContractVersion(pinned), `${PACKAGE_NAME} doit être épinglé à une version exacte X.Y.Z ou 0.0.0-dev.<sha> (pas de plage ni de pré-version staging)`);
  assert.equal(readJson(`node_modules/${PACKAGE_NAME}/package.json`).version, pinned);
  assert.equal(readJson('package-lock.json').packages[`node_modules/${PACKAGE_NAME}`].version, pinned);
});

test('only one BFF contract package is used', () => {
  const all = { ...manifest.dependencies, ...manifest.devDependencies };
  assert.deepEqual(Object.keys(all).filter((name) => /^@mairie360\/.+-openapi$/.test(name)), [PACKAGE_NAME]);
});

test('contracts/openapi.json is exactly the contract rebuilt from the installed package', async () => {
  const { buildOrvalOpenApi } = await import('../scripts/orval-contract.mjs');
  const snapshot = readJson('contracts/openapi.json');
  assert.equal(snapshot.info['x-source-package'], `${PACKAGE_NAME}@${pinned}`);
  assert.equal(snapshot.info.title, 'bff_settings');
  assert.deepEqual(snapshot, buildOrvalOpenApi(PACKAGE_NAME, ROOT));
});

test('every Docker stack starts BFF_Settings only, in the image built from the contract package commit', async () => {
  const { imageTagForContractVersion } = await import('../scripts/contract-version.mjs');
  const expectedTag = imageTagForContractVersion(pinned);
  for (const file of fs.readdirSync(ROOT).filter((name) => /^docker-compose.*\.ya?ml$/.test(name))) {
    const images = [...fs.readFileSync(path.join(ROOT, file), 'utf8').matchAll(/ghcr\.io\/mairie360\/(bff-[\w-]+):([\w.-]+)/g)];
    assert.deepEqual(images.map(([, name, tag]) => `${name}:${tag}`), [`bff-settings:${expectedTag}`], file);
  }
});

test('the contract version policy accepts releases and dev packages and maps them to image tags', async () => {
  const { isAcceptedContractVersion, imageTagForContractVersion } = await import('../scripts/contract-version.mjs');
  assert.equal(isAcceptedContractVersion('1.1.0'), true);
  assert.equal(imageTagForContractVersion('1.1.0'), '1.1.0');
  assert.equal(isAcceptedContractVersion('0.0.0-dev.eb4e17f930d957dbf5df6c58dc34b69916198d62'), true);
  assert.equal(imageTagForContractVersion('0.0.0-dev.eb4e17f930d957dbf5df6c58dc34b69916198d62'), 'dev-eb4e17f');
  for (const rejected of ['^1.1.0', '1.1', '0.0.0-staging.eb4e17f930d957dbf5df6c58dc34b69916198d62', '0.0.0-dev.eb4e17f', 'latest']) {
    assert.equal(isAcceptedContractVersion(rejected), false, rejected);
  }
});
