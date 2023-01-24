#!/usr/bin/env node
'use strict';

const fs = require('fs');
var insidProject = false;
var basePath = '';
var projectPath = '';

const currentPath = process.argv[1].split("node_modules");
basePath = currentPath[0].substring(0, currentPath[0].lastIndexOf("/")) + '/';

  if(currentPath.length > 1){
    projectPath = basePath + "node_modules/webship-js/"; 
  } 
  else{
    projectPath = basePath; 

  }

/**
 * -----------------------------------------------------
 * Parse arguments
 * -----------------------------------------------------
 */
const { ArgumentParser } = require('argparse');
const { version } = require('./package.json');

const parser = new ArgumentParser({
  description: 'Argparse example'
});

parser.add_argument('-ci', '--continuous_integration',
  {
    help: 'Add your CI services (circleci, github, gitlab, bitbucket), By default: -ci circleci',
    default: 'circleci',
  });

parser.add_argument('-b', '--browser',
{
  help: 'Add your Browser (chrome, firefox), By default: -b chrome',
  default: 'chrome',
});

parser.add_argument('-os', '--operating_system',
{
  help: 'Add your Operating System (linux, mac, windows), By default: -os linux',
  default: 'linux',
});

var argsParse = parser.parse_args();

/**
 * -----------------------------------------------------
 */

/**
 * Generate the appropriate nightwatch.conf.js
 * 
 * Generate nightwatch testing configs according to the used CI
 * service, operating system, and browser.
 */

fs.unlink(projectPath + 'nightwatch.conf.js', (err) => {
  if (err) {
    throw err;
  }
});

const confTemplate = projectPath + 'assets/config_templates/' + argsParse.continuous_integration + '-' + argsParse.operating_system + '-' + argsParse.browser + '.conf.js';

fs.copyFile(confTemplate, projectPath + 'nightwatch.conf.js', (err) => {
  if (err) {
    throw err;
  }
});