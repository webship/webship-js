'use strict';

const { BeforeAll, AfterAll } = require('@cucumber/cucumber');
const fs = require('fs');
const path = require('path');
const { createMockServer, stopMockServer } = require('./mock-diffy-api/server');

// Minimal valid 1×1 white PNG (width=1 at bytes 16-19 for detectPngWidth)
const MOCK_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk' +
  'YPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

const MOCK_FOLDERS = [
  '/tmp/diffy-test-screenshots/baseline',
  '/tmp/diffy-test-screenshots/feature',
];

BeforeAll(async function () {
  await createMockServer();

  for (const folder of MOCK_FOLDERS) {
    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(path.join(folder, 'mock-screenshot.png'), MOCK_PNG);
  }
});

AfterAll(async function () {
  await stopMockServer();
});
