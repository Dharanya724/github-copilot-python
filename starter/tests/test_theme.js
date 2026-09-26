const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'static', 'main.js'),
  'utf8'
);
const storageKey = 'sudoku.theme.v1';

function initializeTheme(storage) {
  const attributes = new Map();
  let toggleHandler;
  const toggle = {
    textContent: '',
    addEventListener(event, handler) {
      if (event === 'click') toggleHandler = handler;
    },
    setAttribute(name, value) {
      attributes.set(name, value);
    }
  };
  const context = {
    document: {
      documentElement: {dataset: {}},
      getElementById() {
        return toggle;
      }
    },
    window: {
      addEventListener() {},
      localStorage: {
        getItem(key) {
          return storage.get(key) ?? null;
        },
        setItem(key, value) {
          storage.set(key, value);
        }
      }
    }
  };
  vm.runInNewContext(source, context);
  context.initializeTheme();

  return {
    theme: context.document.documentElement.dataset.theme,
    pressed: attributes.get('aria-pressed'),
    label: toggle.textContent,
    click: toggleHandler
  };
}

test('theme toggle applies and restores the saved preference', () => {
  const storage = new Map();
  const firstPage = initializeTheme(storage);

  assert.equal(firstPage.theme, 'light');
  assert.equal(firstPage.pressed, 'false');
  assert.equal(firstPage.label, 'Dark mode: Off');

  firstPage.click();
  assert.equal(storage.get(storageKey), 'dark');

  const reloadedPage = initializeTheme(storage);
  assert.equal(reloadedPage.theme, 'dark');
  assert.equal(reloadedPage.pressed, 'true');
  assert.equal(reloadedPage.label, 'Dark mode: On');
});

test('unknown saved theme values fall back to light mode', () => {
  const page = initializeTheme(new Map([[storageKey, 'sepia']]));

  assert.equal(page.theme, 'light');
  assert.equal(page.pressed, 'false');
});