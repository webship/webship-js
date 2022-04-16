const { client } = require('nightwatch');
const { Given, When, Then, And, But } = require('cucumber');

Then(/^I should see "([^"]*)"$/, textValue => {
  return client.assert.containsText('body', textValue);
});
