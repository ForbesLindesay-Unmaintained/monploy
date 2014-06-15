'use strict';

var assert = require('assert');
var Promise = require('promise');
var detect = require('./detect.js');
var buildPackage = require('./build-package.js');
var getStore = require('./get-store.js');

module.exports = download;
function download(id, directory, options) {
  return getStore(options, function (store) {
    return Promise.resolve(store.createReadStream(id + '.tar.gz').pipe(extractPackage(directory)));
  });
}
