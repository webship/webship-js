
module.exports.assertion = function (negativeCase) {
  
  browser.message = `Testing if text of <${element}> ` + (negativeCase ? `does not contain '${expectedText}'` : `contains '${expectedText}'`);

  browser.expected = function () {
    return negativeCase ? `not contains '${expectedText}'` : `contains '${expectedText}'`;
  };

  browser.evaluate = function (value) {
    return (typeof value === 'string') && (value.includes(expectedText) !== negativeCase);
  };

  browser.value = function (result) {
    return result.value;
  };

  browser.command = function (callback) {
    return browser.api.getText(element, callback);
  };

  browser.pass = function (value) {
    return browser.evaluate(value);
  };

  browser.failure = function (result) {
    return result === false || result && result.status === -1;
  };

  browser.getCurrentUrl(function(result) {
    var homepageUrl = browser.launch_url;
    if(endsWith(result.value, "/")){
      homepageUrl += "/";
    }

    if (negativeCase) {
      return browser.assert.not.urlEquals(homepageUrl).end();
    }
    return browser.assert.urlEquals(homepageUrl).end();
  });
}
