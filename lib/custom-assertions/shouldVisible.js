
module.exports.assertion = function (negativeCase, element) {
  
  if (negativeCase) {
    return browser.verify.not.visible(element).end();
  }
  return browser.verify.visible(element).end();
}
