module.exports = {
  default: {
    timeout: 30000,
    require: [
      'tests/support/world.js',
      'tests/step-definitions/**/*.js',
    ],
    paths: ['tests/features/**/*.feature'],
    format: [
      '@cucumber/pretty-formatter',
      'json:tests/reports/cucumber_report.json',
    ],
  },
};
