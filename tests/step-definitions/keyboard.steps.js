'use strict';

// Simulate keyboard interactions on the page or on a specific element.

const { When } = require('@cucumber/cucumber');

// Common name aliases — lowercase names like "enter", "tab".
function normalizeKey(key) {
  const map = {
    enter: 'Enter', return: 'Enter', tab: 'Tab', escape: 'Escape', esc: 'Escape',
    space: 'Space', backspace: 'Backspace', delete: 'Delete',
    up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight',
    home: 'Home', end: 'End', pageup: 'PageUp', pagedown: 'PageDown',
  };
  const lower = key.toLowerCase();
  return map[lower] || key;
}

/**
 * Press a single key against the page (whatever element is currently focused).
 *
 * Common aliases (`enter`, `tab`, `esc`, `space`, `up/down/left/right`) are
 * normalised to Playwright's canonical key names.
 *
 * Example #1: When I press the key "Enter"
 * Example #2: When I press the key "Escape"
 * Example #3: And I press the key "Tab"
 * Example #4: When I press the key "ArrowDown"
 * Example #5: When I focus on the element "#search"
 *               And I press the key "Enter"
 *
 */
When(/^(I |we )*press the key "([^"]*)"$/, async function (pronoun, key) {
  await this.page.keyboard.press(normalizeKey(key));
});

/**
 * Press a single key while a specific element is focused.
 *
 * Example #1: When I press the key "Enter" on the element "#search"
 * Example #2: When I press the key "Tab" on the element "input[type=email]"
 * Example #3: And I press the key "ArrowDown" on the element ".combobox"
 * Example #4: When I press the key "Backspace" on the element "#name"
 * Example #5: When I press the key "Escape" on the element "[role=dialog]"
 *
 */
When(/^(I |we )*press the key "([^"]*)" on the element "([^"]*)"$/, async function (pronoun, key, sel) {
  await this.page.locator(sel).first().press(normalizeKey(key));
});

/**
 * Press a key combination against the page. Combos use `+` between modifiers
 * and the final key (e.g. `Control+a`, `Meta+s`, `Shift+Tab`).
 *
 * Example #1: When I press the keys "Control+a"
 * Example #2: When I press the keys "Meta+s"
 * Example #3: And I press the keys "Shift+Tab"
 * Example #4: When I press the keys "Alt+ArrowLeft"
 * Example #5: When I press the keys "Control+Shift+P"
 *
 */
When(/^(I |we )*press the keys "([^"]*)"$/, async function (pronoun, keys) {
  await this.page.keyboard.press(keys);
});

/**
 * Press a key combination while a specific element is focused.
 *
 * Example #1: When I press the keys "Control+a" on the element "#editor"
 * Example #2: When I press the keys "Meta+s" on the element "form"
 * Example #3: And I press the keys "Shift+Tab" on the element "#email"
 * Example #4: When I press the keys "Control+Enter" on the element "#message"
 * Example #5: When I press the keys "Alt+Down" on the element ".combobox"
 *
 */
When(/^(I |we )*press the keys "([^"]*)" on the element "([^"]*)"$/, async function (pronoun, keys, sel) {
  await this.page.locator(sel).first().press(keys);
});
