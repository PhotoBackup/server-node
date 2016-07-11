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

    var bcrypt = require('bcrypt');
    var fs = require('fs');
    var ini = require('ini');
    var inquirer = require('inquirer');
    var sha512 = require('sha512');

    var questions = [
        {
            type: 'input',
            name: 'mediaroot',
            message: 'The directory where to put the pictures (should be writable by the server you use):',
            validate: validationFunc
        },
        {
            type: 'input',
            name: 'owner',
            message: 'Owner of the directory:',
            default: 'www-data',
            validate: validationFunc
        },
        {
            type: 'password',
            name: 'password',
            message: 'The server password:',
            validate: validationFunc
        }
    ];

    // validate the answers given by the user
    var validationFunc = function (input) {
        return (input.length !== 0);
    };

    // create the config object for the ini file
    function createConfig (configPath, section) {
        var config = {};
        try {
            // config is the content of the ini file
            config = ini.parse(fs.readFileSync(configPath, 'utf-8'));
            if (config.hasOwnProperty(section)) {
                // if the current section already exists, update it
                delete config[section];
            }
        } catch (e) {
            // config is an empty object if there is an error
            config = {};
        }
        return config;
    }

    // function to export
    var init = function (configPath, username, sectionName) {
        inquirer.prompt(questions).then(function (answers) {
            var config = createConfig(configPath, sectionName);
            var passSHA = sha512(answers.password).toString('hex');
            var passhash = bcrypt.hashSync(passSHA, bcrypt.genSaltSync());

            // fill the section
            config[sectionName] = {
                'BindAddress': '127.0.0.1',
                'MediaRoot': answers.mediaroot,
                'Password': passSHA,
                'PasswordBcrypt': passhash,
                'Port': 8420
            };

            // write the whole file
            fs.writeFileSync(configPath, ini.stringify(config));
            var option = (username.length > 0) ? ' ' + username : '';
            console.log("\nCreated, now launch PhotoBackup server with 'photobackup run" + option + "'");
        });
    };

    module.exports = { init: init };

}());
