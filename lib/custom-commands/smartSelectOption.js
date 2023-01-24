
module.exports.command = function (option, selectBox) {

  browser.element('css selector', selectBox, function (result) {
    if (result.status === 0) {
      return browser.click(selectBox + ' option[value=' + option + ']');
    } else {
      browser.element('css selector', '#' + selectBox, function (result) {
        if (result.status === 0) {
          return browser.click('#' + selectBox + ' option[value=' + option + ']');
        }
      });
    }
  });
}
