#!/usr/bin/env node
'use strict';
 
const { ArgumentParser } = require('argparse');
const { version } = require('../package.json');
 
const parser = new ArgumentParser({
  description: 'Argparse example'
});
 
parser.add_argument('-v', '--version', { action: 'version', version });
parser.add_argument('-d', '--display-list-information', 
{ 
  help: 'Chose step definitions list to display with or without information. \nl: for normal list, \ni: with information list. \nExample: -d="i" OR -d=i OR -d i',
  default: 'l',
}
);
parser.add_argument('-c', '--config', 
{ 
  help: 'Add your nightwatch config file, Example: -c="config.js" OR -c=config.js OR -c config.js',
  default: '../nightwatch.conf.js',
}
);
parser.add_argument('-s', '--src_folders', 
{ 
  help: 'Add your step definitions folder/s path, Example: -s="path/to/folder1" OR -s="path/to/folder1 path/to/folder2", You can add as much as you want of folder paths',
  default: "tests/step-definitions",
}
);
parser.add_argument('-f', '--format', 
{ 
  help: 'Choose step definitions list format style, just add a number. (1) stdout-space. (2) stdout-dashes. Example: -f=1 OR -f 2',
  default: "1",
}
);
 
var args = parser.parse_args();
process.argv = args;
