#!/usr/bin/env node
/*
 * Copyright (C) 2013-2015 Stéphane Péchard.
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
    var path = require('path');
    var sha512 = require('sha512');

    var questions = [
        {
            type: "input",
            name: "mediaroot",
            message: "The directory where to put the pictures (should be writable by the server you use):",
            validate: validation_function
        },
        {
            type: "input",
            name: "owner",
            message: "Owner of the directory:",
            default: "www-data",
            validate: validation_function
        },
        {
            type: "password",
            name: "password",
            message: "The server password:",
            validate: validation_function
        }
    ];

    // validate the answers given by the user
    var validation_function = function (input) {
        return (input.length !== 0);
    };


    // create the config object for the ini file
    function create_config(config_path, section) {
        try {
            // config is the content of the ini file
            var config = ini.parse(fs.readFileSync(config_path, 'utf-8'));
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
    var init = function (config_path, username, section_name) {
        inquirer.prompt(questions, function (answers) {
            var config = create_config(config_path, section_name);
            var pass_sha = sha512(answers.password).toString('hex');
            var passhash = bcrypt.hashSync(pass_sha, bcrypt.genSaltSync());

            // fill the section
            config[section_name] = {
                'BindAddress': '127.0.0.1',
                'MediaRoot': answers.mediaroot,
                'Password': pass_sha,
                'PasswordBcrypt': passhash,
                'Port': 8420
            };

            // write the whole file
            fs.writeFileSync(config_path, ini.stringify(config));
            var option = (username.length > 0) ? ' ' + username : '';
            console.log("\nCreated, now launch PhotoBackup server with 'photobackup run" + option + "'");
        });
    };

    module.exports = { init: init };

}());
