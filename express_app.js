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
    var path = require('path');

    // variables
    var app = express();

    var createRoutes = function (config, sectionName) {
        var fileHasBeenFiltered = false;
        var upload = multer({
            storage: multer.diskStorage({
                // multer creates the directory if it does not exist
                destination: config[sectionName].MediaRoot,
                filename: function (req, file, cb) {
                    cb(null, file.originalname);
                }
            }),
            fileFilter: function (req, file, cb) {
                // test file existance and compare sizes
                // this is a bit crappy, thanks to multer messing with the request...
                try {
                    var filepath = path.join(config[sectionName].MediaRoot, file.originalname);
                    var filesize = parseInt(req.body.filesize, 10);
                    var stats = fs.statSync(filepath);
                    var localFilesize = stats["size"];
                    if (localFilesize === filesize) {
                        fileHasBeenFiltered = true;
                        // fill  the request as if the file was here like it is actually...
                        req.file = {
                            'fieldname': 'upfile',
                            'size': localFilesize
                        };
                    }
                }
                // if file does not exist, write it
                catch(err) {
                    fileHasBeenFiltered = false;
                }

                cb(null, !fileHasBeenFiltered);
            }
        });

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
                return;
            }

            if(password === undefined) {
                end(res, 403, 'no password in request');
                return;
            } else if (!bcrypt.compareSync(password, config[sectionName].PasswordBcrypt)) {
                end(res, 403, 'wrong password!');
                return;
            } else if (!req.hasOwnProperty('file')) {
                end(res, 401, 'missing upfile');
                return;
            } else if (!req.file.hasOwnProperty('fieldname')) {
                end(res, 403, 'upfile has no filedname!');
                return;
            } else if (req.file.fieldname !== 'upfile') {
                end(res, 403, "upfile should be named 'upfile'!");
                return;
            } else if (isNaN(filesize)) {
                end(res, 400, 'missing file size in the request!');
                return;
            } else if (filesize !== req.file.size) {
                end(res, 411, 'file sizes do not match!');
                return;
            } else if (fileHasBeenFiltered) {
                end(res, 409, 'file exists and is complete');
                return;
            }

            // file is saved by some NodeJS magic...
            res.send();
            endWithSuccess(res);
        });

        app.post('/test', function (req, res) {
            var password = req.body.password;
            if (password !== config[sectionName].Password) {
                end(res, 403, 'wrong password!');
                return;
            }

            fs.access(config[sectionName].MediaRoot, fs.W_OK, function (err) {
                if (err) {
                    end(res, 500, "Can't write to MEDIA_ROOT!");
                    return;
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
