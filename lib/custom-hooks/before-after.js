const {Before, After, BeforeStep, AfterStep} = require('@cucumber/cucumber');

Before(async function () {
  return browser.pause(browser.globals.min_wait_time.before_scenario);
});

After(async function () {
  return browser.pause(browser.globals.min_wait_time.after_scenario);
});

BeforeStep(async function () {
  return browser.pause(browser.globals.min_wait_time.before_step);
});

AfterStep(async function () {
  return browser.pause(browser.globals.min_wait_time.after_step);
});