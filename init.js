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

    var fs = require('fs'),
        ini = require('ini'),
        inquirer = require('inquirer'),
        sha512 = require('sha512'),
        validation_function = function (input) {
            return (input.length !== 0);
        },
        questions = [
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

    var init = function (settings_path) {
        inquirer.prompt(questions, function (answers) {
            var settings = {
                    'MediaRoot': answers.mediaroot,
                    'Password': sha512(answers.password).toString('hex'),
                    'Port': 8420
                };
            fs.writeFileSync(settings_path, ini.stringify(settings, { section: 'photobackup' }));
            console.log("\nCreated, now launch PhotoBackup server with 'photobackup run'");
        });
    };

    module.exports = { init: init };

}());
