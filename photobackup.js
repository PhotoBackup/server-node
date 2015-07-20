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

    var doc = "\n" +
            "PhotoBackup NodeJS server.\n" +
            "\n" +
            "Usage:\n" +
            "  photobackup init\n" +
            "  photobackup run\n" +
            "  photobackup (-h | --help)\n" +
            "  photobackup --version\n" +
            "\n" +
            "Options:\n" +
            "  -h --help     Show this screen.\n" +
            "  --version     Show version.\n",
        bodyParser = require('body-parser'),
        docopt = require('docopt').docopt,
        express = require('express'),
        fs = require('fs'),
        ini = require('ini'),
        init = require('./init').init,
        multer  = require('multer'),
        path = require('path'),
        packagejson = require(path.join(__dirname, 'package.json')),

        app = express(),
        args = docopt(doc, {version: packagejson.version}),
        home = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'],
        settings_path = path.join(home, '.photobackup'),
        settings = {};


    if (args.init) {
        init(settings_path);
    } else if (args.run) {

        try {
            settings = ini.parse(fs.readFileSync(settings_path, 'utf-8'));

            var port = 8420; // default
            if (settings.hasOwnProperty('photobackup') && settings.photobackup.hasOwnProperty('Port')) {
                port = settings.photobackup.Port;
            }
            app.listen(port);

        } catch (e) {
            if (e instanceof Error && e.code === 'ENOENT') {
                console.error("Can't read configuration file, running 'photobackup init'");
                init(settings_path);
            } else {
                console.error("Unknown error: " + e);
            }
        }
    }


    if (settings.hasOwnProperty('photobackup')) {

        // multer creates the directory if it does not exist
        app.use(multer({
            dest: settings.photobackup.MediaRoot,
            rename: function (fieldname, filename) { return filename; }
        }));
        // allows to access body parameters of the requests, because you have to...
        app.use(bodyParser.urlencoded({ extended: true }));


        app.get('/', function (req, res) {
            res.redirect('https://photobackup.github.io/');
        });


        app.post('/', function (req, res) {
            var password, filesize;
            try {
                password = req.body.password;
                filesize = parseInt(req.body.filesize, 10);
            } catch (err) {
                console.error(err);
                res.status(400).send({ error: 'missing parameter in the request!' });
            }

            if (password !== settings.photobackup.Password) {
                res.status(403).send({ error: 'wrong password!' });
            }
            if (req.files.upfile === undefined) {
                res.status(403).send({ error: 'missing upfile!' });
            }
            if (req.files.upfile.fieldname === undefined) {
                res.status(403).send({ error: 'upfile has no filedname!' });
            }
            if (req.files.upfile.fieldname !== 'upfile') {
                res.status(403).send({ error: "upfile should be named 'upfile'!" });
            }
            if (filesize !== req.files.upfile.size) {
                res.status(411).send({ error: "file sizes do not match!" });
            }

            // file is saved by some NodeJS magic...
            res.send();
        });


        app.post('/test', function (req, res) {
            var password = req.body.password;
            if (password !== settings.photobackup.Password) {
                res.status(403).send({ error: 'wrong password!' });
            }

            fs.access(settings.photobackup.MediaRoot, fs.W_OK, function (err) {
                if (err) {
                    res.status(500).send({ error: "Can't write to MEDIA_ROOT!" });
                } else {
                    res.send();
                }
            });
        });
    }
}());
