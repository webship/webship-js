const {Before, After, BeforeStep, AfterStep} = require('@cucumber/cucumber');

Before(async function () {
  browser.pause(browser.globals.min_wait_time.before_scenario);
});

After(async function () {
  browser.pause(browser.globals.min_wait_time.after_scenario);
});

BeforeStep(async function () {
  browser.pause(browser.globals.min_wait_time.before_step);
});

AfterStep(async function () {
  browser.pause(browser.globals.min_wait_time.after_step);
});
