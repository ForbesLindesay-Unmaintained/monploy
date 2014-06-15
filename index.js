'use strict';

exports.buildPackage = require('./lib/build-package.js');
exports.extractPackage = require('./lib/extract-package.js');

exports.uploadPackage = require('./lib/upload-package.js');

exports.release = function (directory, info, options) {
  return exports.buildPackage.buffer(dirname).then(function (bundle) {
    return exports.uploadPackage(bundle, info, options);
  });
}
