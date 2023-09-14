var reporter = require('cucumber-html-reporter');

var options = {
  theme: 'bootstrap',
  jsonFile: 'tests/reports/cucumber_report.json',
  output: 'tests/reports/cucumber_report.html',
  reportSuiteAsScenarios: true,
  scenarioTimestamp: true,
  launchReport: false,
  brandTitle: "Test Report",
  metadata: {
    "App Version": "7.1.0",
    "Test Environment": "development",
    "Browser": "Google Chrome",
    "Platform": "Linux",
    "Parallel": "Scenarios",
    "Executed": "Remote"
  },
  failedSummaryReport: true,
};

reporter.generate(options);