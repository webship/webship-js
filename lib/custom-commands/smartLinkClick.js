
module.exports.command = function (elementValue) {

  browser.element('css selector', elementValue, function (result) {
    if (result.status === 0) {
      return browser.click(elementValue);
    }
    else {
      browser.click("link text", elementValue);
    }
  });
}