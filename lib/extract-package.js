'use strict';

var zlib = require('zlib');
var tar = require('tar');
var Promise = require('promise');

module.exports = extractPackage;
function extractPackage(directory) {
  var unzip = zlib.Unzip();
  var promise = new Promise(function (resolve, reject) {
    var tarExtract = tar.Extract({ type: 'Directory', path: directory, strip: 1 });
    tarExtract.on('close', resolve);
    tarExtract.on('error', reject);
    unzip.on('error', reject);
    unzip.pipe(tarExtract);
  });
  Object.keys(Promise.prototype).forEach(function (key) {
    unzip[key] = Promise.prototype[key];
  });
  unzip.then = promise.then.bind(promise);
  return unzip;
}
