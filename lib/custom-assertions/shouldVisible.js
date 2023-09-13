
module.exports.assertion = function (negativeCase, element) {
  
  if (negativeCase) {
    return browser.verify.not.visible(element);
  }
  return browser.verify.visible(element);
}
