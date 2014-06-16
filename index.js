'use strict';

// internal methods
exports.buildPackage = require('./lib/build-package.js');
exports.extractPackage = require('./lib/extract-package.js');

// (name, options)
exports.list = require('./lib/list-versions.js');
exports.getTag = require('./lib/get-tag.js');
// (options)
exports.listPackages = require('./lib/list-packages.js');
// (directory, info, options)
exports.upload = require('./lib/upload-package.js');
// (id, directory, options)
exports.download = require('./lib/download-package.js');

exports.listDeployments = require('./lib/list-deployments.js');
exports.addDeployment = require('./lib/add-deployment.js');
exports.updateDeployment = require('./lib/update-deployment.js');
exports.getDeployment = require('./lib/get-deployment.js');
