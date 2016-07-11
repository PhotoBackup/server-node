#  The NodeJS PhotoBackup server implementation

This is a [NodeJS](https://nodejs.org/) implementation of PhotoBackup server. It follows the
[official API](https://github.com/PhotoBackup/api/blob/master/api.raml).

## Installation

Install through [npm](https://www.npmjs.com/):

    npm install photobackup

Then run the installer, which asks for the directory to save your pictures to
and the server password:

    photobackup init <name>

This step creates a `~/.photobackup` file which contains, for every name:

* BindAddress, the IP address (default is 127.0.0.1) ;
* `MediaRoot`, the directory where the pictures are written in ;
* `Password`, the SHA-512 hashed password (for backward compatibility only, will soon be totally replaced the following) ;
* `PasswordBcrypt`, Bcrypt-ed version of the SHA-512 hashed password ;
* `Port`, the port (default is 8420).

## Usage

Launch the server with:

    photobackup run <name>

By default, it runs on `127.0.0.1:8420`.

## What names are for?

Names allow you to run several PhotoBackup instances on a same server. All instances are configured in the same `~/.photobackup` file. If you want to run instances concurrently, you'll need to set a different port to each instance.

The `name` parameter in `init` and `run` commands is optional. Without it, you init and run the default instance.
