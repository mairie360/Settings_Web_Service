const assert = require('node:assert/strict');
const path = require('node:path');
const { test } = require('node:test');
const { SRC, requireSrc, sourceFiles } = require('./support/load-ts.cjs');

// La couverture de `node --test` ne compte que les fichiers chargés. Charger tous les modules `src/**/*.ts` ici
// les fait entrer dans le calcul du seuil de 60 % (comme `collectCoverageFrom` des BFFs), testés ou non.
// Les composants `.tsx` (pages, layout) ne sont pas mesurés : pas de tests DOM dans ce dépôt.

test('every src/**/*.ts module loads and is counted by the coverage threshold', t => {
  // Next resolves this compile-time server marker; Node loads the actual module
  // below without pretending to execute a browser-only server import.
  const Module = require('node:module');
  const originalLoad = Module._load;
  Module._load = function(request, ...rest) {
    return request === 'server-only' ? {} : originalLoad.call(this, request, ...rest);
  };
  t.after(() => { Module._load = originalLoad; });
  const modules = sourceFiles(['.ts']).map((file) => path.relative(SRC, file));
  assert.ok(modules.includes('lib/settings-api.ts'));
  for (const module of modules) assert.equal(typeof requireSrc(module), 'object', module);
});
