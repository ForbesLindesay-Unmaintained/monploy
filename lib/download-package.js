'use strict';

var assert = require('assert');
var Promise = require('promise');
var extractPackage = require('./extract-package.js');
var getStore = require('./get-store.js');

module.exports = download;
function download(id, directory, options) {
  return getStore(options, function (store) {
    return store.createReadStream(id + '.tar.gz').pipe(extractPackage(directory));
  });
}
