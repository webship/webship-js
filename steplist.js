#!/usr/bin/env node
'use strict';

const fs = require('fs');
var insidProject = false;
var basePath = '';
var projectPath = '';

const currentPath = process.argv[1].split("node_modules");
basePath = currentPath[0].substring(0, currentPath[0].lastIndexOf("/"));
basePath = basePath + '/';
projectPath = basePath + "node_modules/webship-js/"; 

  if(currentPath.length > 1){
    insidProject = true;    
  } 
  else{
    insidProject = false;
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

parser.add_argument('-v', '--version', { action: 'version', version });
parser.add_argument('-l', '--list',
  {
    help: 'Display step definitions list without information.',
    action: 'store_true',
    default: true,
  });

parser.add_argument('-i', '--info',
  {
    help: 'Display step definitions list with information.',
    action: 'store_true',
  });

parser.add_argument('-c', '--config',
  {
    help: 'Add your nightwatch config file, Example: -c="nightwatch.conf.js" OR -c=nightwatch.conf.js OR -c nightwatch.conf.js',
    default: 'nightwatch.conf.js',
  });

parser.add_argument('-s', '--src_folders',
  {
    help: 'Add your step definitions folder/s path, Example: -s="path/to/folder1" OR -s="path/to/folder1 path/to/folder2", You can add as much as you want of folder paths',
    default: "",
  });

parser.add_argument('-f', '--format',
  {
    help: 'Choose step definitions list format style. \n(1) stdout-spaces. \n(2) stdout-dashes \n(3) html-spaces. \n(4) html-dashes. Example: -f=stdout-dashes OR -f stdout-dashes',
    default: "stdout-spaces",
  });

var argsParse = parser.parse_args();

/**
 * -----------------------------------------------------
 */

/**
 * Folders Path Array variable
 *
 * Set and Get folders path exist in (--config) tag and
 * (--src_folder) tag added in nodejs command line.
 */
let foldersPath = [];
function setFoldersPath(value, type) {
  value.forEach((element) => {
    var elementPath = '';
      if(insidProject == true && !process.argv.find(element => element == type)){
        elementPath = projectPath + element;
      }
      else if(insidProject == false && !process.argv.find(element => element == type)){
        elementPath = basePath + element;
      }
      else{
        elementPath = element;
      }

    foldersPath.push(elementPath);
  });
}

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
  if (argsParse.info == true) {
    return (stepsList.startsWith('Given') ||
      stepsList.startsWith('Then') ||
      stepsList.startsWith('When') ||
      stepsList.startsWith('/**') ||
      stepsList.startsWith('* ') ||
      stepsList.startsWith('*/'));
  }
  else if (argsParse.list == true) {
    return (stepsList.startsWith('Given') ||
      stepsList.startsWith('Then') ||
      stepsList.startsWith('When'));
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
 * Return list of array items was clean from unreadable chars.
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
        if (argsParse.format.startsWith('html')){
          stepComment = `<div class="info">${stepComment}</div>\r\n`;
          newStepsList.push(`${filter2}\r\n${stepComment}`);
        } 
        else newStepsList.push(`${filter2}\r\n${stepComment}`);
      } else newStepsList.push(filter2);

      stepComment = '';
    }
  });
  return newStepsList;
}

function srcFolderPaths(path) {
  const paths = path.split(' ');

  setFoldersPath(paths, '-s');
}

/**
 * "foldersPath" array
 * 
 * Fill "foldersPath" array process, that has paths of 
 * all folders contain step definitions js files.
 */

if(insidProject == true && !process.argv.find(element => element == "-c")){
  argsParse.config = projectPath + argsParse.config;
}
else if(insidProject == false && !process.argv.find(element => element == "-c")){
  argsParse.config = basePath + argsParse.config;
}

const configPath = require(argsParse.config);

let configPathsArray = [];

configPathsArray = configPath.src_folders;
setFoldersPath(configPathsArray, '-c');

if (foldersPath.length === 0) {
  configPathsArray = argsParse.src_folders;
  setFoldersPath(configPathsArray, '-c');
}

if(process.argv.find(element => element == '-s')){
  srcFolderPaths(argsParse.src_folders);
}

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
      fs.readFile(`${folderPath}/${file}`, 'utf8', (err, data) => {
        if (err) {
          throw new Error(err);
        }
        const contentLines = data.split('\n');
        const contentTrimmed = contentLines.map((element) => element.trim());

        const stepsStartWith = callStartsWith(contentTrimmed);
        const stepsList = stepsCleanList(stepsStartWith);

        stepsList.forEach((element) => {
          if (argsParse.format == 'stdout-spaces') {
            console.log(element + '\n');
          } else if (argsParse.format == 'stdout-dashes') {
            console.log(element + '\n');
          } else if (argsParse.format == 'html-spaces') {
            console.log('<div>' + element + '</div>');
          } else if (argsParse.format == 'html-dashes') {
            console.log('<div>' + element + '</div>');
          }
        });
      });
    });
  });
});
