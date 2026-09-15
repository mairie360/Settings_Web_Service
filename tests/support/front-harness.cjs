const fs = require('node:fs');
const path = require('node:path');
const { AsyncLocalStorage } = require('node:async_hooks');
const { NextRequest } = require('next/server');
const { SRC, requireSrc } = require('./load-ts.cjs');

// Simule le chemin réseau complet du front sans navigateur ni serveur Next.js :
// - « navigateur » : `fetch` appelé hors d'un handler de route. Seule l'origine du front est autorisée (comme
//   `connect-src 'self'`) ; la requête est routée vers le `route.ts` de `src/app` qui correspond, avec les cookies ;
// - « serveur » : `fetch` appelé pendant l'exécution d'un handler. Seule l'origine du BFF du front est joignable
//   (un front n'appelle qu'un BFF), via le vrai client HTTP.
// Tout autre appel est refusé et consigné dans `violations`.

const ORIGIN = 'http://localhost:5000';
const APP = path.join(SRC, 'app');

/** Routes `src/app/**\/route.ts`, triées comme Next.js : statiques, puis dynamiques, puis catch-all. */
function appRoutes() {
  const routes = [];
  const walk = (dir, segments) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(path.join(dir, entry.name), [...segments, entry.name]);
      else if (entry.name === 'route.ts') routes.push({ file: path.relative(SRC, path.join(dir, entry.name)), segments });
    }
  };
  walk(APP, []);
  const rank = (route) => Math.max(0, ...route.segments.map((segment) => (segment.startsWith('[...') ? 2 : segment.startsWith('[') ? 1 : 0)));
  return routes.sort((a, b) => rank(a) - rank(b));
}

function matchRoute(routes, segments) {
  for (const route of routes) {
    const params = {};
    let matched = route.segments.length === segments.length;
    for (const [index, segment] of route.segments.entries()) {
      if (segment.startsWith('[...')) {
        matched = segments.length > index;
        if (matched) params[segment.slice(4, -1)] = segments.slice(index);
        break;
      }
      if (index >= segments.length) { matched = false; break; }
      if (segment.startsWith('[')) params[segment.slice(1, -1)] = segments[index];
      else if (segment !== segments[index]) { matched = false; break; }
    }
    if (matched) return { route, params };
  }
  return undefined;
}

/**
 * @param {{ cookies?: Record<string, string>, upstreams: () => string[] }} options
 *   `upstreams` : URL(s) du BFF du front que le serveur Next.js a le droit de joindre (plusieurs quand un test
 *   fait varier l'URL configurée, par exemple vers un port fermé).
 */
function createFront({ cookies = {}, upstreams }) {
  const realFetch = globalThis.fetch;
  const server = new AsyncLocalStorage();
  const routes = appRoutes();
  const violations = [];
  const browserCalls = [];
  const upstreamCalls = [];

  async function serverFetch(input, init = {}) {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const { route } = server.getStore();
    upstreamCalls.push({ route, method: init.method ?? 'GET', url });
    if (!upstreams().some((allowed) => allowed && new URL(allowed).origin === url.origin)) {
      violations.push(`serveur (${route}) : ${init.method ?? 'GET'} ${url.href} ne vise pas BFF_Settings`);
      throw new TypeError('fetch failed');
    }
    return realFetch(input, init);
  }

  async function browserFetch(input, init = {}) {
    const url = new URL(input instanceof Request ? input.url : String(input), ORIGIN);
    const method = (init.method ?? 'GET').toUpperCase();
    browserCalls.push({ method, path: `${url.pathname}${url.search}` });
    if (url.origin !== ORIGIN) {
      violations.push(`navigateur : ${method} ${url.href} sort de l'origine du front`);
      throw new TypeError('Failed to fetch');
    }
    const found = matchRoute(routes, url.pathname.split('/').filter(Boolean).map(decodeURIComponent));
    if (!found) return new Response(null, { status: 404 });
    const handler = requireSrc(found.route.file)[method];
    if (typeof handler !== 'function') return new Response(null, { status: 405 });

    const headers = new Headers(init.headers);
    const cookie = Object.entries(cookies).map(([name, value]) => `${name}=${value}`).join('; ');
    if (cookie && !headers.has('cookie')) headers.set('cookie', cookie);
    const request = new NextRequest(url, { ...init, method, headers });
    return server.run({ route: found.route.file }, () => handler(request, { params: Promise.resolve(found.params) }));
  }

  return {
    ORIGIN,
    cookies,
    violations,
    browserCalls,
    upstreamCalls,
    routes,
    install() {
      globalThis.fetch = (input, init) => (server.getStore() ? serverFetch(input, init) : browserFetch(input, init));
    },
    uninstall() {
      globalThis.fetch = realFetch;
    },
    reset() {
      violations.length = 0;
      browserCalls.length = 0;
      upstreamCalls.length = 0;
    },
  };
}

module.exports = { ORIGIN, appRoutes, createFront };
