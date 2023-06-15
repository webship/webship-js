
module.exports.command = function (item) {

    browser.element('css selector', item, function (result) {
      if (result.status === 0) {
        return browser.click("link text", result.value);
      } else {
        browser.element('css selector', '#' + item, function (result) {
          if (result.status === 0) {
            return browser.click("link text", result.value);
          } else {
            return browser.click("link text", item);
          }
        });
      }
    });
}