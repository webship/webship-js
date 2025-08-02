const { execSync } = require('child_process');

const command = `nightwatch \
  --format @cucumber/pretty-formatter \
  --format-options '{"colorsEnabled": true}' \
  --format-options '{"theme": {"feature keyword":["bold","blue"],"feature name":["blue","underline"],"feature description":["blueBright"],"scenario keyword":["bold","magenta"],"scenario name":["magenta","underline"],"step keyword":["bold","green"],"step text":["greenBright","italic"]}}' \
  --format json:./tests/reports/cucumber_report.json`;

execSync(command, { stdio: 'inherit' });
execSync('node generate-reports.js', { stdio: 'inherit' });