
module.exports.assertion = function (negativeCase) {
  
  this.message = `Testing if text of <${element}> ` + (negativeCase ? `does not contain '${expectedText}'` : `contains '${expectedText}'`);

  this.expected = function () {
    return negativeCase ? `not contains '${expectedText}'` : `contains '${expectedText}'`;
  };

  this.evaluate = function (value) {
    return (typeof value === 'string') && (value.includes(expectedText) !== negativeCase);
  };

  this.value = function (result) {
    return result.value;
  };

  /**
   * The command which is to be executed by the assertion runner; Nightwatch api is available as browser.api
   * @param {function} callback
   */
  this.command = function(callback) {
    setTimeout(function() {
      callback({
        value: ''
      });
    }, 1000);   
  };

  this.pass = function (value) {
    return this.evaluate(value);
  };

  this.failure = function (result) {
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
