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
  // PR #74 already moved main to v4.0.1. That published workflow retains
  // blocking Semgrep/Gitleaks and npm audit before build/tests, with named
  // secrets and no consumer override. Keep the major-review guard (v5 fails).
  assert.equal(Number(major), 4, 'a new major workflow version requires review');
  assert.ok(Number(minor) > 0 || Number(patch) >= 1,
    'the shared workflow must include the reviewed v4.0.1 security audits');
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

test('the legacy required security name runs real immutable blocking scanners', () => {
  const workflow = read('.github/workflows/cicd.yml');
  assert.match(workflow, /on:\s*\n  push:\s*\n  pull_request:\s*\n  workflow_dispatch:/);
  const job = workflow.split('  required_security_scan:\n')[1]?.split('\n  CICD:')[0];
  assert.ok(job, 'the legacy required check needs its own executable scan job');
  assert.match(job, /name: CICD \/ Code Security Audit \(Semgrep\)/);
  assert.match(job, /permissions:\s*\n      contents: read\s*\n    steps:/);
  assert.match(job, /timeout-minutes: 20/);
  assert.doesNotMatch(job, /continue-on-error:|\bif:|\bsecrets:|\btoken:|security-events:|packages:|id-token:|\brun:|\bexclude:|\bpaths:/);
  const actions = [...job.matchAll(/uses: ([^\s@]+)@([^\s#]+)/g)];
  assert.equal(actions.length, 2);
  for (const [, name, sha] of actions) {
    assert.equal(name, 'actions/checkout');
    assert.equal(sha, '3d3c42e5aac5ba805825da76410c181273ba90b1');
  }
  assert.match(job, /fetch-depth: 0/);
  assert.equal([...job.matchAll(/persist-credentials: false/g)].length, 2);
  assert.match(job, /repository: mairie360\/CICD\s*\n          ref: 539847726d4058a9565c4f682c2d1d8302874b06/);
  assert.match(job, /uses: \.\/cicd-repo\/actions\/semgrep/);
  assert.match(job, /config: p\/typescript p\/react p\/owasp-top-ten p\/secrets p\/dockerfile p\/github-actions/);
  assert.match(job, /artifact_name: semgrep-required-check-sarif/);
  assert.match(job, /uses: \.\/cicd-repo\/actions\/gitleaks/);
  assert.equal([...job.matchAll(/fail_on_findings: "true"/g)].length, 2);
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
  assert.equal(manifest.dependencies['@mairie360/lib-components'], '0.6.8');
  assert.equal(lock.packages[''].dependencies['@mairie360/lib-components'], '0.6.8');
  const resolved = lock.packages['node_modules/@mairie360/lib-components'];
  assert.equal(resolved.version, '0.6.8');
  assert.match(resolved.resolved, /^https:\/\/npm\.pkg\.github\.com\/download\/@mairie360\/lib-components\/0\.6\.8\//);
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
