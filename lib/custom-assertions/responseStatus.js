const axios = require('axios');

module.exports.assertion = function (negativeCase, expectedStatusCode) {

  browser.url(function (currentURL) {
    request(currentURL.value, (error, response, body) => {
      if (negativeCase) {
        return axios.get(currentURL.value)
          .then(function (response) {
            browser.assert.equal(response.status, expectedStatusCode);
          })
          .catch(function (error) {
            browser.assert.equal(error.status, expectedStatusCode);
          })
          .finally(function () {
            // always executed
          });
      }
      return axios.get(currentURL.value)
        .then(function (response) {
          browser.assert.equal(response.status, expectedStatusCode);
        })
        .catch(function (error) {
          browser.assert.equal(error.status, expectedStatusCode);
        })
        .finally(function () {
          // always executed
        });
    });
  });
}