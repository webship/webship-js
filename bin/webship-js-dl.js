#!/usr/bin/env node

const fs = require('fs');
const conf = require('../nightwatch.conf.js');

/**
 * Folders Path Array variable
 *
 * Set and Get folders path exist in (--config) tag and
 * (--src_folder) tag added in nodejs command line
 */
let foldersPath = [];
function setFoldersPath(value) {
  value.forEach((element) => {
    foldersPath.push(element);
  });
}

/**
 * Output Format name variable
 *
 * Set and Get Output Format exist in (--format) tag added
 * in nodejs command line
 */
let outputFormat = 'stdout-spaces';
function setOutputFormat(value) { outputFormat = value; }

/**
 * Start with Function.
 *
 * Return list of array items that start with (Given, Then, When).
 *
 * @param {array} stepsList The full step-definitions file lines list
 * @return {array} The array has only lines startsWith words chosen
 */
function startWith(stepsList) {
  return (stepsList.startsWith('Given') ||
        stepsList.startsWith('Then') ||
        stepsList.startsWith('When'));
}

/**
 * Filter Step Definitions
 *
 * @param {array} stepsList The step definitions array is sent to filter
 * by startsWith words chosen
 * @return {array} Step definitions filtered array
 */
function callStartsWith(stepsList) {
  return stepsList.filter(startWith);
}

/**
 * Clean Steps List
 *
 * Return list of array items cleand from unreadable chars
 *
 * @param {array} stepsList The step definitions array before clean
 * unreadable signs
 * @return {array} The step definitions cleaned array
 */
function stepsCleanList(stepsList) {
  const newStepsList = [];

  stepsList.forEach((element) => {
    const filter1 = element.split('$/');
    const filter2 = filter1[0].replace('(/^', ' ');

    newStepsList.push(filter2);
  });
  return newStepsList;
}

function srcFolderPaths(path) {
  const splitConfig = path.split('=');
  const pathsLine = splitConfig[1];
  const paths = pathsLine.split(' ');

  setFoldersPath(paths);
}

/**
 * "foldersPath" array
 * 
 * Fill "foldersPath" array process, that has paths of 
 * all folders contain step definitions js files
 */

for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i].startsWith('--config')) {
    const splitConfig = process.argv[i].split('=');
    const path = splitConfig[1];
    const configPath = require(path);

    let configPathsArray = [];
    configPathsArray = configPath.src_folders;

    setFoldersPath(configPathsArray);
  } else if (process.argv[i].startsWith('--src_folders')) {
    srcFolderPaths(process.argv[i]);
  } else if (process.argv[i].startsWith('--format')) {
    setOutputFormat(process.argv[i].split('=')[1]);
  }
}

if (foldersPath.length === 0) foldersPath = conf.src_folders;

/**
 * Step definitions list
 * 
 * Get clear step definitions list from js 
 * step definitions files
 */

foldersPath.forEach((folderPath) => {
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      return console.log(`Unable to scan directory: ${err}`);
    }

    files.forEach((file) => {
      fs.readFile(`./${folderPath}/${file}`, 'utf8', (err, data) => {
        if (err) {
          throw new Error(err);
        }
        const contentLines = data.split('\n');
        const contentTrimmed = contentLines.map((element) => element.trim());

        const stepsStartWith = callStartsWith(contentTrimmed);
        const stepsList = stepsCleanList(stepsStartWith);

        stepsList.forEach((element) => {
          if (outputFormat.startsWith('stdout')) {
            console.log(element);
          } else if (outputFormat.startsWith('html')) {
            console.log(`<div>${element}</div>`);
          } else { console.log(element); }
        });
      });
    });
  });
});
