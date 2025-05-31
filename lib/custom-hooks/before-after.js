const {BeforeStep, AfterStep} = require('@cucumber/cucumber');

BeforeStep(async function () {
  browser.pause(browser.globals.min_wait_time.before_step);
});

AfterStep(async function () {
  browser.pause(browser.globals.min_wait_time.after_step);
});
