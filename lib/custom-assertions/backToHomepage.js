
module.exports.assertion = function (negativeCase) {
  
  browser.getCurrentUrl(function(result) {
    var homepageUrl = browser.launch_url;
    if(endsWith(result.value, "/")){
      homepageUrl += "/";
    }

    if (negativeCase) {
      return browser.assert.not.urlEquals(homepageUrl);
    }
    return browser.assert.urlEquals(homepageUrl);
  });
}
