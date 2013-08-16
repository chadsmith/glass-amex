# American Express for Google Glass

Check your American Express balance through Glass.

##Prerequisites

* Google Glass w/ access to Mirror API
* Node.js, NPM
* [American Express](https://www.americanexpress.com/)

## Installation

`npm install` or `npm install express googleapis moment banking`

## Configuration

* Create a new [Google APIs Project](https://code.google.com/apis/console)
* Enable the Google Mirror API
* Create an OAuth 2.0 client ID for a web application
* Enter your server's hostname and port in [app.js](https://github.com/chadsmith/glass-amex/blob/master/app.js#L8-11)
* Enter your Mirror API credentials in [app.js](https://github.com/chadsmith/glass-amex/blob/master/app.js#L12-15)
* Enter your Amex credentials in [app.js](https://github.com/chadsmith/glass-amex/blob/master/app.js#L16-20)

## Usage

`node app` or `forever start app.js`

* Authorize the app by visiting http://hostname:port/ on your computer
* View your account balance in your Glass timeline
