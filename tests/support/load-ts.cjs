const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

// Chargeur TypeScript des tests : transpile `src/**/*.ts(x)` à la volée, résout l'alias `@/*` de tsconfig.json
// et embarque une source map pour que la couverture (`--enable-source-maps`) pointe sur les lignes TypeScript.

const ROOT = path.resolve(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');

const compilerOptions = {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2020,
  jsx: ts.JsxEmit.ReactJSX,
  esModuleInterop: true,
  resolveJsonModule: true,
  inlineSourceMap: true,
  inlineSources: true,
};

function compile(module, filename) {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions, fileName: filename });
  module._compile(outputText, filename);
}

let registered = false;

function register() {
  if (registered) return;
  registered = true;
  require.extensions['.ts'] = compile;
  require.extensions['.tsx'] = compile;
  const resolveFilename = Module._resolveFilename;
  Module._resolveFilename = function resolveAlias(request, ...rest) {
    return resolveFilename.call(this, request.startsWith('@/') ? path.join(SRC, request.slice(2)) : request, ...rest);
  };
}

/** Charge un module de `src/` (chemin relatif à `src/`, ex. `lib/bff-proxy.ts`). */
function requireSrc(relative) {
  register();
  return require(path.join(SRC, relative));
}

/** Fichiers source de `src/` (hors `.d.ts`) ayant l'une des extensions données, chemins absolus triés. */
function sourceFiles(extensions = ['.ts', '.tsx']) {
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (!entry.name.endsWith('.d.ts') && extensions.includes(path.extname(entry.name))) files.push(full);
    }
  };
  walk(SRC);
  return files.sort();
}

module.exports = { ROOT, SRC, register, requireSrc, sourceFiles };
