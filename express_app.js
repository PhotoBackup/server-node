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

    // imports
    var bcrypt = require('bcrypt');
    var bodyParser = require('body-parser');
    var express = require('express');
    var fs = require('fs');
    var multer = require('multer');

    // variables
    var app = express();

    var createRoutes = function (config, sectionName) {
        var upload = multer({ storage: multer.diskStorage({
            // multer creates the directory if it does not exist
            destination: config[sectionName].MediaRoot,
            filename: function (req, file, cb) {
                cb(null, file.originalname)
            }
        })});

        // allows to access body parameters of the requests, because you have to...
        app.use(bodyParser.urlencoded({ extended: true }));

        // routes
        app.get('/', function (req, res) {
            res.redirect('https://photobackup.github.io/');
            endWithSuccess(res);
        });

        app.post('/', upload.single('upfile'), function (req, res) {
            var password, filesize;
            try {
                password = req.body.password;
                filesize = parseInt(req.body.filesize, 10);
            } catch (err) {
                end(res, 400, 'missing parameter in the request! => ' + err);
            }

            if (!bcrypt.compareSync(password, config[sectionName].PasswordBcrypt)) {
                end(res, 403, 'wrong password!');
            }
            if (!req.hasOwnProperty('file')) {
                end(res, 403, 'missing upfile');
            }
            if (!req.file.hasOwnProperty('fieldname')) {
                end(res, 403, 'upfile has no filedname!');
            }
            if (req.file.fieldname !== 'upfile') {
                end(res, 403, "upfile should be named 'upfile'!");
            }
            if (filesize !== req.file.size) {
                end(res, 411, 'file sizes do not match!');
            }

            // file is saved by some NodeJS magic...
            res.send();
            endWithSuccess(res);
        });

        app.post('/test', function (req, res) {
            var password = req.body.password;
            if (password !== config[sectionName].Password) {
                end(res, 403, 'wrong password!');
            }

            fs.access(config[sectionName].MediaRoot, fs.W_OK, function (err) {
                if (err) {
                    end(res, 500, "Can't write to MEDIA_ROOT!");
                } else {
                    res.send();
                    endWithSuccess(res);
                }
            });
        });
    };

    // show error and return response
    function end (res, code, message) {
        res.status(code).send({ error: message });
        pblog(console.error, res.req.method + ' ' + res.req.url, code + ' => ' + message);
    }

    // in case of success
    function endWithSuccess (res) {
        if (res.statusCode === 200) {
            pblog(console.log, res.req.method + ' ' + res.req.url, res.statusCode);
        }
    }

    // minimalist logger
    function pblog (consoleFunc, message, suffix) {
        consoleFunc((new Date()).toISOString(), message || '', suffix || '');
    }

    // final export
    module.exports = {
        app: app,
        createRoutes: createRoutes
    };

}());
