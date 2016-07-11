#!/usr/bin/env node
/*
 * Copyright (C) 2013-2016 Stéphane Péchard.
 *
 * This file is part of PhotoBackup.
 *
 * PhotoBackup is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * PhotoBackup is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

(function () {
    'use strict';

    // command line documentation
    var doc = '\n' +
            'PhotoBackup NodeJS server.\n' +
            '\n' +
            'Usage:\n' +
            '  photobackup init [<username>]\n' +
            '  photobackup run [<username>]\n' +
            '  photobackup list\n' +
            '  photobackup (-h | --help)\n' +
            '  photobackup --version\n' +
            '\n' +
            'Options:\n' +
            '  -h --help     Show this screen.\n' +
            '  --version     Show version.\n';

    // imports
    var docopt = require('docopt').docopt;
    var fs = require('fs');
    var ini = require('ini');
    var pbInit = require('./init').init;
    var path = require('path');
    var packagejson = require(path.join(__dirname, 'package.json'));

    // variables
    var expressApp = require('./express_app');
    var app = expressApp.app;
    var args = docopt(doc, {version: packagejson.version});
    var home = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
    var configPath = path.join(home, '.photobackup');
    var config = {};

    // compute some internal information
    var username = ''; // default
    if (args.hasOwnProperty('<username>') && args['<username>'] !== null) {
        username = args['<username>'];
    }
    var sectionName = 'photobackup'; // default
    if (username.length > 0) {
        sectionName += '-' + username;
    }

    // which command to activate
    if (args.init) {
        pbInit(configPath, username, sectionName);

    } else if (args.run) {

        try {
            config = ini.parse(fs.readFileSync(configPath, 'utf-8'));
            if (!config.hasOwnProperty(sectionName)) {
                console.error('ERROR: Unknown username in the current configuration...');
                process.exit();
            }

            var port = config[sectionName].Port || 8420;
            var address = config[sectionName].BindAddress || '127.0.0.1';
            app.listen(port, address, function () {
                console.log('PhotoBackup client listening on http://' + address + ':' + port + '\n');
            });

        } catch (e) {
            if (e instanceof Error && e.code === 'ENOENT') {
                var option = (username.length > 0) ? ' ' + username : '';
                console.error("Can't read configuration file, running 'photobackup init" + option + "'");
                pbInit(configPath, username, sectionName);
            } else {
                console.error('Unknown error: ' + e);
            }
        }

    } else if (args.list) {
      try {
          config = ini.parse(fs.readFileSync(configPath, 'utf-8'));
          var list = Object.keys(config).join('\n')
                                        .replace(/photobackup-/g, '- ')
                                        .replace(/^photobackup/g, '<unnamed one>');
          console.log('Runnable PhotoBackup configurations are:\n' + list);
      } catch (e) {
          console.log("No configuration file found, run 'photobackup init' to create one");
      }
    }

    if (config.hasOwnProperty(sectionName)) {
        expressApp.createRoutes(config, sectionName);
    }

}());
