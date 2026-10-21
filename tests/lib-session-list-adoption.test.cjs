const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

// MAIR-607: Administrator and Settings display sessions through the one shared
// SessionList of the library; the revoke action goes through a confirmation dialog.
test('MAIR-607 the security tab renders the library SessionList, not a local list', () => {
  const page = read('src/components/SettingsPage/components/SessionsSection/SessionsSection.tsx');
  assert.match(page, /SessionList \} from "@mairie360\/lib-components\/primitives"|\{[^}]*SessionList[^}]*\} from "@mairie360\/lib-components\/primitives"/);
  assert.match(page, /<SessionList\b/);
  assert.doesNotMatch(page, /Création :|SessionRevokeControl/);
  const dialog = read('src/components/SettingsPage/components/SessionsSection/components/SessionRevokeDialog/SessionRevokeDialog.tsx');
  assert.match(dialog, /ConfirmModal \} from '@mairie360\/lib-components\/primitives'/);
  const primitives = require('@mairie360/lib-components/primitives');
  for (const name of ['SessionList', 'ConfirmModal', 'sessionState']) assert.equal(typeof primitives[name], 'function', `primitives entry exports ${name}`);
});
