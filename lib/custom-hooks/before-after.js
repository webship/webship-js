const {Before, After, BeforeStep, AfterStep} = require('@cucumber/cucumber');

/**
 * Safely pauses based on global config.
 * Handles case where browser or globals may be undefined.
 * @param {string} key
 */
async function safePause(key) {
  const time = (global.browser?.globals?.min_wait_time?.[key]) || 0;
  if (time > 0 && global.browser?.pause) {
    await global.browser.pause(time);
  }
}

// Register hooks
Before(async function () {
  await safePause('before_scenario');
});

After(async function () {
  await safePause('after_scenario');
});

BeforeStep(async function () {
  await safePause('before_step');
});

AfterStep(async function () {
  await safePause('after_step');
});