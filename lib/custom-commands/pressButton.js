
module.exports.command = function (item) {

  browser.element('css selector', item, function (result) {
    if (result.status === 0) {
      return browser.click(item);
    } else {
      browser.element('css selector', '#' + item, function (result) {
        if (result.status === 0) {
          return browser.click('#' + item);
        } else {
          browser.element('css selector', '.' + item, function (result) {
            if (result.status === 0) {
              return browser.click('.' + item);
            } else {
              return browser.click("[value='" + item + "']");
            }
          });
        }
      });
    }
  });
}