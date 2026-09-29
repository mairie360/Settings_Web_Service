const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

const root = join(__dirname, '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

test('Settings uses the shared frontend workflow with Semgrep enabled', () => {
  const workflow = read('.github/workflows/cicd.yml');
  const reusableWorkflows = [...workflow.matchAll(/^\s+uses:\s+mairie360\/CICD\/\.github\/workflows\/frontend-cicd\.yml@(v(\d+)\.(\d+)\.(\d+))\s*$/gm)];
  assert.equal(reusableWorkflows.length, 1, 'Settings must call the shared frontend workflow once');
  const [, version, major, minor, patch] = reusableWorkflows[0];
  assert.equal(Number(major), 3, 'a new major workflow version requires review');
  assert.ok(Number(minor) > 1 || (Number(minor) === 1 && Number(patch) >= 1),
    'the shared workflow must include the Semgrep security audit');
  assert.equal(workflow.match(/cicd_version:\s*"([^"]+)"/)?.[1], version,
    'the reusable workflow ref and input must use the same version');
  assert.doesNotMatch(workflow, /semgrep_fail_on_findings:\s*false|semgrep_config:|continue-on-error:/);
});

test('third-party workflow actions use immutable commits', () => {
  const actions = ['contracts.yml', 'auto-approve.yml'].flatMap((file) => [...read(`.github/workflows/${file}`)
    .matchAll(/uses:\s*([^\s@]+)@([^\s#]+)/g)]);
  assert.deepEqual(actions.map((match) => match[1]).sort(), [
    'actions/checkout', 'actions/setup-node', 'hmarr/auto-approve-action',
  ]);
  for (const [, name, ref] of actions) {
    assert.match(ref, /^[a-f0-9]{40}$/, `${name} must use a full commit SHA`);
  }
});

test('the reusable workflow receives only its declared named secrets', () => {
  const workflow = read('.github/workflows/cicd.yml');
  assert.doesNotMatch(workflow, /secrets:\s*inherit/);
  const mappings = [...workflow.matchAll(/^ {6}([A-Z0-9_]+):[ \t]*\$\{\{[ \t]*secrets\.([A-Z0-9_]+)[ \t]*\}\}[ \t]*$/gm)];
  assert.deepEqual(mappings.map(([, name, source]) => [name, source]), [
    ['CODECOV_TOKEN', 'CODECOV_TOKEN'],
    ['N8N_WEBHOOK_SECRET', 'N8N_WEBHOOK_SECRET'],
  ]);
});

test('npm keeps the seven-day window except for the internal UI package', () => {
  const config = read('.npmrc');
  assert.match(config, /^min-release-age\s*=\s*7\s*$/m);
  const exclusions = [...config.matchAll(/^\s*min-release-age-exclude(\[\])?\s*=\s*(.+?)\s*$/gm)];
  assert.deepEqual(exclusions.map(([, list, name]) => [list, name]), [
    ['[]', '@mairie360/lib-components'],
  ]);
  assert.doesNotMatch(config, /^\s*before\b/m);
});

test('the internal UI package is pinned to its published release in the lockfile', () => {
  const manifest = JSON.parse(read('package.json'));
  const lock = JSON.parse(read('package-lock.json'));
  assert.equal(manifest.dependencies['@mairie360/lib-components'], '0.6.2');
  assert.equal(lock.packages[''].dependencies['@mairie360/lib-components'], '0.6.2');
  const resolved = lock.packages['node_modules/@mairie360/lib-components'];
  assert.equal(resolved.version, '0.6.2');
  assert.match(resolved.resolved, /^https:\/\/npm\.pkg\.github\.com\/download\/@mairie360\/lib-components\/0\.6\.2\//);
  assert.match(resolved.integrity, /^sha512-/);
});

test('CI and local toolchains support the npm release-age policy', () => {
  assert.match(read('.github/workflows/cicd.yml'), /node_version:\s*"24"/);
  assert.match(read('.github/workflows/contracts.yml'), /node-version:\s*'24'/);
  const version = execFileSync('npm', ['--version'], { cwd: root, encoding: 'utf8' }).trim();
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  assert.ok(match, 'npm must report a stable version');
  assert.ok(Number(match[1]) > 11 || (Number(match[1]) === 11 && Number(match[2]) >= 10),
    'npm >=11.10 is required for min-release-age');
});
