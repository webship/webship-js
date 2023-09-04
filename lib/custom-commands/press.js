module.exports.command = function (item) {

  if(browser.click("[value='" + item + "']")) {
    return;
  }
}