const http = require('node:http');

// Faux BFF servi en HTTP réel (même principe que les mocks amont des tests des BFFs) : chaque requête reçue est
// vérifiée contre le contrat OpenAPI du service simulé (chemin, méthode, paramètres, corps JSON), et chaque
// réponse mockée est validée contre le schéma du statut renvoyé. Les écarts sont collectés dans `violations`.

class ContractMockServer {
  /**
   * @param {string} service nom affiché dans les violations
   * @param {import('./openapi-contract.cjs').OpenApiContract} contract contrat du service simulé
   * @param {{ metadataPaths?: string[] }} [options]
   */
  constructor(service, contract, { metadataPaths = [] } = {}) {
    this.service = service;
    this.contract = contract;
    // Chemins servis par le vrai service sans être déclarés dans son contrat (ex. `/openapi.json` du BFF) :
    // le mock y répond avec le contrat lui-même.
    this.metadataPaths = metadataPaths;
    this.requests = [];
    this.violations = [];
    this.handlers = new Map();
    this.server = undefined;
    this.url = '';
  }

  async start() {
    this.server = http.createServer((req, res) => {
      this.handle(req, res).catch((error) => {
        // Une exception dans le mock ne doit pas faire tomber le lanceur de tests : elle devient une violation.
        this.violations.push(`[${this.service}] erreur du mock : ${error instanceof Error ? error.message : String(error)}`);
        send(res, 500, JSON.stringify({ error: { message: 'Erreur du mock' } }));
      });
    });
    await new Promise((resolve) => this.server.listen(0, '127.0.0.1', resolve));
    this.url = `http://127.0.0.1:${this.server.address().port}`;
    return this.url;
  }

  async stop() {
    if (!this.server) return;
    this.server.closeAllConnections();
    await new Promise((resolve) => this.server.close(() => resolve()));
    this.server = undefined;
  }

  /** Enregistre une réponse ; le couple méthode/chemin doit exister dans le contrat simulé. */
  on(method, template, handler) {
    if (!this.contract.document.paths[template]?.[method.toLowerCase()]) {
      throw new Error(`${method} ${template} n'est pas déclaré dans le contrat ${this.contract.title}`);
    }
    this.handlers.set(`${method.toUpperCase()} ${template}`, typeof handler === 'function' ? handler : () => handler);
    return this;
  }

  reset() {
    this.requests.length = 0;
    this.violations.length = 0;
    this.handlers.clear();
  }

  calls(template, method) {
    return this.requests.filter((request) => request.template === template && (!method || request.method === method.toUpperCase()));
  }

  async handle(req, res) {
    const method = req.method ?? 'GET';
    const url = new URL(req.url ?? '/', this.url);
    const rawBody = await readBody(req);
    if (['GET', 'HEAD'].includes(method) && this.metadataPaths.includes(url.pathname)) {
      this.requests.push({ method, url, template: url.pathname, pathParams: {}, headers: req.headers, undeclaredQuery: [], body: undefined });
      return send(res, 200, method === 'HEAD' ? '' : JSON.stringify(this.contract.document));
    }
    // Express sert HEAD pour toute route GET : un HEAD est vérifié contre l'opération GET quand HEAD n'est pas déclaré.
    const contractMethod = method === 'HEAD' && !this.contract.match('HEAD', url.pathname) ? 'GET' : method;
    const { match, errors, undeclaredQuery } = this.contract.validateRequest(contractMethod, url);
    errors.forEach((error) => this.violations.push(`[${this.service}] requête ${method} ${url.pathname}${url.search} : ${error}`));
    if (!match) return send(res, 404, JSON.stringify({ error: { message: 'Route absente du contrat' } }));

    let body;
    const { required, schema: bodySchema } = this.contract.requestBodySchema(match);
    if (rawBody.length) {
      try { body = JSON.parse(rawBody.toString('utf8')); } catch { this.violations.push(`[${this.service}] requête ${method} ${match.template} : corps JSON invalide`); }
    } else if (required) {
      this.violations.push(`[${this.service}] requête ${method} ${match.template} : corps requis manquant`);
    }
    if (bodySchema && body !== undefined) {
      this.contract.validate(bodySchema, body, '$body').forEach((error) => this.violations.push(`[${this.service}] requête ${method} ${match.template} ${error}`));
    }

    const request = { method, url, template: match.template, pathParams: match.pathParams, headers: req.headers, undeclaredQuery, body };
    this.requests.push(request);
    const handler = this.handlers.get(`${contractMethod} ${match.template}`);
    if (!handler) {
      this.violations.push(`[${this.service}] appel non mocké : ${method} ${match.template}`);
      return send(res, 500, JSON.stringify({ error: { message: 'Appel non mocké' } }));
    }

    const reply = handler(request);
    if (reply.dropConnection) return void req.socket.destroy();
    const status = reply.status ?? 200;
    if (!reply.outOfContract) {
      const { documented, schema } = this.contract.responseSchema(match, status);
      if (!documented) this.violations.push(`[${this.service}] ${method} ${match.template} : statut ${status} non documenté`);
      if (schema && reply.raw === undefined) {
        this.contract.validate(schema, reply.body).forEach((error) => this.violations.push(`[${this.service}] réponse ${status} ${method} ${match.template} ${error}`));
      }
    }
    const payload = method === 'HEAD' ? '' : reply.raw ?? (reply.body === undefined ? '' : JSON.stringify(reply.body));
    return send(res, status, payload, reply.contentType, reply.headers);
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function send(res, status, payload, contentType = 'application/json', headers = {}) {
  if (res.headersSent) return;
  res.writeHead(status, { ...(payload ? { 'Content-Type': contentType } : {}), ...headers });
  res.end(payload);
}

/** Retourne une URL sur laquelle rien n'écoute (port libéré juste après attribution). */
async function unreachableUrl() {
  const server = http.createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  await new Promise((resolve) => server.close(() => resolve()));
  return `http://127.0.0.1:${port}`;
}

module.exports = { ContractMockServer, unreachableUrl };
