const assert = require('node:assert/strict');
const { test, beforeEach, after } = require('node:test');
const Module = require('node:module');
const { AsyncLocalStorage } = require('node:async_hooks');
const { requireSrc } = require('./support/load-ts.cjs');
const context = new AsyncLocalStorage();
const originalLoad = Module._load;
const originalFetch = global.fetch;
let access;
Module._load = function(request, ...rest) {
  if (request === 'server-only') return {};
  if (request === 'next/headers') return { cookies: async () => ({
    get: name => name === 'accessToken' ? { value: context.getStore()?.access ?? access } : undefined,
    set: () => { throw new Error('A server read cannot set cookies'); },
  }) };
  return originalLoad.call(this, request, ...rest);
};
const { loadInitialSettings } = requireSrc('lib/server-settings.ts');
const Home = requireSrc('app/page.tsx').default;
const Loading = requireSrc('app/loading.tsx').default;
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const expires = Math.floor(Date.now()/1000)+600;
const token = name => `${encode({ alg: 'HS256' })}.${encode({ sub: name, exp: expires })}.signature`;
const bootstrap = () => require('./support/settings-fixtures.cjs').bootstrap();
let calls;
let reply;
beforeEach(() => {
  process.env.SETTINGS_FRONT_URL = 'https://front.example.test';
  process.env.SETTINGS_BFF_URL = 'https://bff.example.test';
  process.env.LOGIN_FRONT_URL = 'https://login.example.test';
  access = token('fixture'); calls=[]; reply = () => Response.json(bootstrap());
  global.fetch = async (url, init) => { calls.push({ url: String(url), method: init.method, headers: new Headers(init.headers), cache: init.cache }); return reply(url, init); };
});
after(() => { Module._load = originalLoad; global.fetch = originalFetch; });

test('the actual SDK and shared proxy make one no-store authenticated read and expose no transport secrets', async () => {
  const body = bootstrap(); body.refreshToken = 'never-serialize'; body.sources.debugSecret = 'never-serialize';
  if (body.profile) body.profile.refreshToken = 'never-serialize';
  reply = () => Response.json(body, { headers: { 'Set-Cookie': 'refreshToken=upstream-cookie; Path=/' } });
  const result = await loadInitialSettings();
  assert.ok(result); assert.equal(calls.length,1); assert.equal(calls[0].url, 'https://bff.example.test/settings/bootstrap');
  assert.equal(calls[0].method,'GET'); assert.equal(calls[0].cache,'no-store');
  assert.equal(calls[0].headers.get('Authorization'), 'Bearer '+access);
  assert.equal(calls[0].headers.has('cookie'), false);
  assert.doesNotMatch(JSON.stringify(result), /never-serialize|upstream-cookie|signature|accessToken|refreshToken/);
});

test('missing, opaque and expired access cookies never reach the BFF or an owner refresh', async () => {
  for (const value of [undefined, '', 'opaque', `${encode({})}.${encode({exp:1})}.signature`]) {
    access=value; assert.equal(await loadInitialSettings(),null);
  }
  assert.equal(calls.length,0);
});

test('only configured public destinations are accepted and request Host is unnecessary', async () => {
  for (const value of ['', 'javascript:alert(1)', 'https://user:password@front.example.test', 'https://front.example.test/?secret=value']) {
    process.env.SETTINGS_FRONT_URL=value; assert.equal(await loadInitialSettings(),null);
  }
  process.env.SETTINGS_FRONT_URL='https://front.example.test'; delete process.env.SETTINGS_BFF_URL;
  assert.equal(await loadInitialSettings(),null); assert.equal(calls.length,0);
});

for (const status of [401,403,503]) test(`HTTP${status} remains unconfirmed without refresh or clearing cookies during render`, async () => {
  reply=()=>Response.json({error:{message:'Private internal refusal'}},{status});
  assert.equal(await loadInitialSettings(),null); assert.equal(calls.length,1);
  assert.equal(calls[0].url,'https://bff.example.test/settings/bootstrap');
});

test('an outage, malformed JSON or invalid DTO preserves the client recovery path', async () => {
  for (const response of [() => { throw new Error('Private outage'); }, () => new Response('{broken'), () => Response.json({})]) {
    reply=response; assert.equal(await loadInitialSettings(),null);
  }
});

test('a new RSC receipt has a distinct opaque lifetime and no account data is reused between requests', async () => {
  const first=await Home(); const second=await Home(); assert.notEqual(first.key,second.key);
  assert.ok(first.props.initialData); assert.ok(second.props.initialData);
  assert.doesNotMatch(first.key, /fixture|signature/);
  reply=async(_url,init)=>{const name=new Headers(init.headers).get('Authorization')===`Bearer ${token('first')}`?'First':'Second';const dto=bootstrap();if(dto.profile)dto.profile.first_name=name;else dto.userFirstName=name;return Response.json(dto);};
  const results=await Promise.all(['first','second'].map(name=>context.run({access:token(name)},()=>loadInitialSettings())));
  const names=results.map(dto=>dto.profile?.first_name ?? dto.userFirstName);assert.deepEqual(names,['First','Second']);
});

test('the real server page renders confirmed HTML before effects and the fallback has one persistent status', async () => {
  const { renderToStaticMarkup }=require('react-dom/server');
  const page=await Home();const html=renderToStaticMarkup(page);
  assert.match(html,/Anne Marie/);assert.doesNotMatch(html,/never-serialize|Chargement des/);
  assert.equal(calls.length,1);
  const fallback=renderToStaticMarkup(require('react').createElement(Loading));
  assert.match(fallback,/aria-busy="true"/);assert.match(fallback,/role="status"/);assert.match(fallback,/aria-hidden="true"/);
});


test('the rendered profile form keeps personal fields out of the URL before hydration', async () => {
  const { renderToStaticMarkup } = require('react-dom/server');
  const { JSDOM } = require('jsdom');
  const html = new JSDOM(renderToStaticMarkup(await Home()));
  try {
    const input = html.window.document.querySelector('input[name="email"]');
    assert.ok(input, 'The actual confirmed personal-data form must be present');
    assert.equal(input.form.method, 'post', 'The native browser fallback must never serialize the profile into a GET query');
  } finally { html.window.close(); }
});
