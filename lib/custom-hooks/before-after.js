const {Before, After, BeforeStep, AfterStep} = require('@cucumber/cucumber');

/**
 * Safely pauses based on global config.
 * Handles case where browser or globals may be undefined.
 * @param {string} key
 */
function safePause(key) {
  const time = (global.browser?.globals?.min_wait_time?.[key]) || 0;
  if (time > 0 && global.browser?.pause) {
    global.browser.pause(time);
  }
}

// Register hooks
Before(function () {
  safePause('before_scenario');
});

After(function () {
  safePause('after_scenario');
});

BeforeStep(function () {
  safePause('before_step');
});

AfterStep(function () {
  safePause('after_step');
});
