#!/usr/bin/env node

const fs = require('fs');
const conf = require('../nightwatch.conf.js');
const argparse = require('../js/argparse.js');

/**
 * Folders Path Array variable
 *
 * Set and Get folders path exist in (--config) tag and
 * (--src_folder) tag added in nodejs command line.
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
 * in nodejs command line.
 */
let outputFormat = 'stdout-spaces';
function setOutputFormat(value) { outputFormat = value; }

/**
 * Start with Function.
 *
 * Return list of array items that start with
 * (Given, Then, When, /** ,* , *\).
 *
 * @param {array} stepsList The full step-definitions file lines list.
 * @return {array} The array has only lines startsWith words chosen.
 */
function startWith(stepsList) {
  if(process.argv.display_list_information == 'i'){
    return (stepsList.startsWith('Given') ||
        stepsList.startsWith('Then') ||
        stepsList.startsWith('When') ||
        stepsList.startsWith('/**') ||
        stepsList.startsWith('* ') ||
        stepsList.startsWith('*/'));
  }
  else{
    if(process.argv.display_list_information == 'l'){
      return (stepsList.startsWith('Given') ||
          stepsList.startsWith('Then') ||
          stepsList.startsWith('When'));
    }
  }
}

/**
 * Filter Step Definitions
 *
 * @param {array} stepsList The step definitions array is sent to filter
 * by startsWith words chosen.
 * @return {array} Step definitions filtered array.
 */
function callStartsWith(stepsList) {
  return stepsList.filter(startWith);
}

/**
 * Clean Steps List
 *
 * Return list of array items cleand from unreadable chars.
 *
 * @param {array} stepsList The step definitions array before 
 * clean unreadable signs.
 * @return {array} The step definitions cleaned array.
 */
function stepsCleanList(stepsList) {
  let stepComment = '';
  const newStepsList = [];

  stepsList.forEach((element) => {
    if (element.startsWith('* ')) {
      element = element.replace('* ', '');

      if (stepComment === '') stepComment = element;
      else stepComment = `${stepComment}\r\n${element}`;
    } else if (!element.startsWith('/**') && !element.startsWith('*/')) {
      const filter1 = element.split('$/');
      const filter2 = filter1[0].replace('(/^', ' ');

      if (stepComment !== '') {
        if (outputFormat.startsWith('html')) newStepsList.push(`${filter2}\r\n<div>${stepComment}</div>`);
        else newStepsList.push(`${filter2}\r\n${stepComment}`);
      } else newStepsList.push(filter2);

      stepComment = '';
    }
  });
  return newStepsList;
}

function srcFolderPaths(path) {
  const paths = path.split(' ');

  setFoldersPath(paths);
}

/**
 * "foldersPath" array
 * 
 * Fill "foldersPath" array process, that has paths of 
 * all folders contain step definitions js files.
 */

  const configPath = require(process.argv.config);

  let configPathsArray = [];
  configPathsArray = configPath.src_folders;

  setFoldersPath(configPathsArray);

  if (foldersPath.length === 0){
    srcFolderPaths(process.argv.src_folders);
  }

  setOutputFormat(process.argv.format);

/**
 * Step definitions list
 * 
 * Get clear step definitions list from js 
 * step definitions files.
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
          if (process.argv.format == 1) {
            console.log(element + '\n');
          } else if (process.argv.format == 2) {
            console.log(element + '\n');
          }
        });
      });
    });
  });
});
