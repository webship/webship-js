const request = require("request");

module.exports.assertion = function (negativeCase, expectedStatusCode) {

  return browser.url(function (currentURL) {
    request(currentURL.value, (error, response, body) => {
      if (negativeCase) {
        return browser.assert.not.equal(response.statusCode, expectedStatusCode).end();
      }
      return browser.assert.equal(response.statusCode, expectedStatusCode).end();
    });
  });
}
