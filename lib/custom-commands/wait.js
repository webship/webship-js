module.exports.command = function (maxof, number, timeType) {

  var waitTime = number * 1000;
  if(timeType == "m"){
    waitTime = waitTime * 60;
  }

  if (maxof) {
    return browser.waitForElementPresent('body', waitTime);
  }
  return browser.pause(waitTime);
}