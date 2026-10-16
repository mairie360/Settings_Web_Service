const assert = require('node:assert/strict');
const { test } = require('node:test');
const { JSDOM } = require('jsdom');
const { requireSrc } = require('./support/load-ts.cjs');
const { installReactRuntime, mount } = require('./support/server-view.cjs');
const fixtures = require('./support/settings-fixtures.cjs');

installReactRuntime();
const React = require('react');
const Home = requireSrc('components/settings-page.tsx').default;
const api = requireSrc('lib/settings-api.ts');

test('a confirmed profile notification closes by Escape without repeating its save or losing the next draft', async t => {
  let confirm;
  const writes = [];
  t.mock.method(api, 'saveProfile', patch => {
    writes.push(patch);
    return new Promise(resolve => { confirm = resolve; });
  });
  const view = mount(React.createElement(Home, { initialData: fixtures.bootstrap() }));
  t.after(() => { view.unmount(); delete global.window; delete global.document; });
  await view.settle();
  await view.fire(props => props.name === 'first_name', 'onChange', { target: { value: 'Submitted draft' } });
  const saving = view.fire((_props, _text, tag) => tag === 'form', 'onSubmit');
  await view.settle();
  assert.doesNotMatch(view.text(), /Votre profil a été enregistré/);
  assert.equal(writes.length, 1);
  confirm(fixtures.profile({ first_name: 'Confirmed name' }));
  await saving;

  const dom = new JSDOM(view.html);
  try {
    const notices = [...dom.window.document.querySelectorAll('[role="status"]')]
      .filter(node => node.textContent.includes('Votre profil a été enregistré.'));
    assert.equal(notices.length, 1, 'One confirmed receipt has one live announcement.');
    assert.ok(notices[0].querySelector('button[aria-label]'),
      'The confirmed receipt exposes a manual close command.');
  } finally { dom.window.close(); }

  const notice = view.hostElements(props => props.role === 'status' && typeof props.onKeyDown === 'function')[0];
  await view.act(() => notice?.props.onKeyDown({ key: 'Escape', preventDefault() {}, stopPropagation() {} }));
  assert.doesNotMatch(view.text(), /Votre profil a été enregistré/);
  assert.match(view.html, /value="Confirmed name"/);
  assert.deepEqual(writes, [{ first_name: 'Submitted draft' }]);
  await view.fire(props => props.name === 'first_name', 'onChange', { target: { value: 'Next draft' } });
  assert.match(view.html, /value="Next draft"/);
  assert.deepEqual(writes, [{ first_name: 'Submitted draft' }]);
});

test('only a confirmed empty sessions source receives a named empty section', async t => {
  const view = mount(React.createElement(Home, { initialData: fixtures.bootstrap({ sessions: [] }) }));
  t.after(() => { view.unmount(); delete global.window; delete global.document; });
  await view.settle();
  await view.click((_props, text, tag) => tag === 'button' && text === 'Sécurité');
  const dom = new JSDOM(view.html);
  try {
    const section = [...dom.window.document.querySelectorAll('section[aria-labelledby]')]
      .find(node => dom.window.document.getElementById(node.getAttribute('aria-labelledby'))?.textContent === 'Aucune session à afficher.');
    assert.ok(section, 'Confirmed emptiness is discoverable as a named section.');
    assert.equal(section.querySelectorAll('button').length, 0, 'No unsupported session action is invented.');
  } finally { dom.window.close(); }
});
