#!/usr/bin/env node

// Copyright (c) 2018 LG Electronics, Inc.
// SPDX-License-Identifier: LicenseRef-EnactBrowser-Evaluation
//
// You may not use this content except in compliance with the License.
// You may obtain a copy of the License at
//
// https://github.com/webosose/com.webos.app.enactbrowser/blob/master/LICENSE

'use strict';

// Verify the correct version of Node is in use.
const minimum = [6, 4, 0];
const active = process.versions.node.split('.').map(val => parseInt(val));
if(active[0] < minimum[0] || (active[0] === minimum[0] && active[1] < minimum[1])) {
    const chalk = require('chalk');
    console.log(chalk.red('You are running Node ' + active.join('.') + '.\nbrowser lib requires Node ' + minimum.join('.') + ' or higher. \n' + chalk.bold('Please update your version of Node.')));
    process.exit(1);
}

// Handle tasks/arguments
if (process.argv.indexOf('-v') >= 0 || process.argv.indexOf('--version') >= 0) {
    const pkg = require('../package.json');
    console.log(pkg.name);
    console.log('version: ' + pkg.version);
    console.log();
} else {
    const command = process.argv[2];

    switch (command) {
        case 'transpile':{
            const task = require('./transpile.js');
            task(process.argv.slice(3));
            break;
        }
        default: {
            //const create = require('../global-cli/create');
            //create(['--help']);
            console.err("Wrong command");
        }
    }
}
