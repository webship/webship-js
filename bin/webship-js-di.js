#!/usr/bin/env node

import fs from 'fs';
import * as sd_format from "./webship-js-sd-filter.js";
import conf from "../nightwatch.conf.js";
const FoldersPath = conf.src_folders;

sd_format.setListFormat("-di");
// console.log(sd_format.ListFormat);

for(var i=2; i<process.argv.length; i++)
  FoldersPath.push(process.argv[i]);

FoldersPath.forEach(Folder_Path => {

  fs.readdir(Folder_Path, function (err, files) {

    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 
    
    files.forEach(file => {
      fs.readFile('./' + Folder_Path + '/' + file, 'utf8', (err, data) => {
        if(err){
          throw new Error(err);
        }
        const SplitByLine_Arr = data.split("\n");
        const Trim_Arr = SplitByLine_Arr.map(element => {
          return element.trim();
        });

        const StartWith_Arr = sd_format.FilterStepDefinitions(Trim_Arr);
        const Steps_Arr = sd_format.CleanStepsList(StartWith_Arr);
    
        Steps_Arr.forEach(element => {
          console.log(element);
        });
      });
    });
  });
});
  