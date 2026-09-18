const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { SRC, sourceFiles } = require('./load-ts.cjs');

// Inventaire statique de tout ce qui peut émettre une requête réseau dans `src/` (AST TypeScript, .ts et .tsx) :
// API réseau brutes, appels `requestBff` (navigateur → BFF_Settings via le proxy), relais `forwardToBff` (serveur →
// BFF) avec l'expression de leur URL de base, variables d'environnement lues, routes serveur, paquets
// `@mairie360/*-openapi` importés et URLs absolues en dur.

const RAW_CALLS = new Set(['fetch', 'sendBeacon']);
const RAW_CONSTRUCTORS = new Set(['XMLHttpRequest', 'WebSocket', 'EventSource']);
const HTTP_MODULES = new Set(['axios', 'ky', 'got', 'node-fetch', 'undici', 'swr', 'http', 'https', 'net', 'node:http', 'node:https', 'node:net']);

const literalText = (node) => (node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : undefined);
const calleeName = (expression) => (ts.isIdentifier(expression) ? expression.text : ts.isPropertyAccessExpression(expression) ? expression.name.text : undefined);

/** Méthode HTTP d'un appel `requestBff(path, init)` : `GET` sans `method`, `undefined` si elle n'est pas littérale. */
function requestMethod(init) {
  if (!init) return 'GET';
  if (!ts.isObjectLiteralExpression(init)) return undefined;
  const property = init.properties.find((candidate) => candidate.name && candidate.name.getText() === 'method');
  if (!property) return 'GET';
  return ts.isPropertyAssignment(property) ? literalText(property.initializer)?.toUpperCase() : undefined;
}

/** `process.env.X` ou `process.env['X']` → `X`. */
function envName(node) {
  if (!ts.isPropertyAccessExpression(node) && !ts.isElementAccessExpression(node)) return undefined;
  const target = node.expression;
  if (!ts.isPropertyAccessExpression(target) || target.getText() !== 'process.env') return undefined;
  return ts.isPropertyAccessExpression(node) ? node.name.text : literalText(node.argumentExpression) ?? '<dynamique>';
}

function scanNetworkSurface() {
  const surface = { raw: [], requestBff: [], forwardToBff: [], env: [], routes: [], openapiPackages: [], absoluteUrls: [] };
  for (const file of sourceFiles()) {
    const relative = path.relative(SRC, file).split(path.sep).join('/');
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const at = (node) => `${relative}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
    if (path.basename(file, path.extname(file)) === 'route') surface.routes.push(relative);

    const visit = (node) => {
      const specifier = (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) ? literalText(node.moduleSpecifier) : undefined;
      if (specifier && /^@mairie360\/[^/]+-openapi(\/|$)/.test(specifier)) {
        surface.openapiPackages.push({ file: relative, specifier, typeOnly: Boolean(node.importClause?.isTypeOnly ?? node.isTypeOnly), at: at(node) });
      }
      if (ts.isImportDeclaration(node) && HTTP_MODULES.has(literalText(node.moduleSpecifier))) {
        surface.raw.push({ file: relative, api: `import ${literalText(node.moduleSpecifier)}`, at: at(node) });
      }
      if (ts.isNewExpression(node) && RAW_CONSTRUCTORS.has(calleeName(node.expression))) {
        surface.raw.push({ file: relative, api: `new ${calleeName(node.expression)}`, at: at(node) });
      }
      if (ts.isCallExpression(node)) {
        const name = calleeName(node.expression);
        const [first, second] = node.arguments;
        if (name === 'require' && HTTP_MODULES.has(literalText(first))) surface.raw.push({ file: relative, api: `require ${literalText(first)}`, at: at(node) });
        if (RAW_CALLS.has(name)) surface.raw.push({ file: relative, api: name, at: at(node) });
        if (name === 'requestBff') surface.requestBff.push({ file: relative, at: at(node), method: requestMethod(second), path: literalText(first) });
        if (name === 'forwardToBff') surface.forwardToBff.push({ file: relative, at: at(node), baseUrl: node.arguments[1]?.getText() });
      }
      const opaqueEnv = ts.isPropertyAccessExpression(node) && node.getText() === 'process.env' && envName(node.parent) === undefined;
      const env = opaqueEnv ? '<process.env sans nom littéral>' : envName(node);
      if (env && !surface.env.some((entry) => entry.name === env && entry.file === relative)) surface.env.push({ file: relative, name: env, at: at(node) });
      const text = literalText(node);
      if (text !== undefined && /^(https?|wss?):\/\//i.test(text)) surface.absoluteUrls.push({ file: relative, url: text, at: at(node) });
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return surface;
}

module.exports = { scanNetworkSurface };
