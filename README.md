#  The NodeJS PhotoBackup server implementation

The NodeJS implementation of PhotoBackup server. It follows the
[official API](https://github.com/PhotoBackup/api/blob/master/api.raml).

## Installation

Install through [npm](https://www.npmjs.com/):

    npm install photobackup

Then run the installer, which asks for the directory to save your pictures to
and the server password:

    photobackup init

This step creates a `~/.photobackup` file which contains:

* `MediaRoot`, the directory where the pictures are written in ;
* `Password`, the SHA-512 hashed password ;
* `Port`, the port (default is 8420).

## Usage

Launch the server with:

    photobackup run

By default, it runs on host `0.0.0.0`, port `8420`.
