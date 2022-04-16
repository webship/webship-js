const { client } = require('nightwatch');
const { Given, When, Then, And, But } = require('cucumber');

When(/^I go to "([^"]*)"$/, urlAddress => {
  return client.url(urlAddress).waitForElementVisible('body', 1000);
});

