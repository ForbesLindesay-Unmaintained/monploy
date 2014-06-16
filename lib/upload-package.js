'use strict';

var assert = require('assert');
var Promise = require('promise');
var detect = require('./detect.js');
var buildPackage = require('./build-package.js');
var getStore = require('./get-store.js');
var guid = require('guid').raw;

module.exports = upload;
function upload(directory, info, options) {
  return getStore(options, function (store) {
    return detect(directory, info).then(function (info) {
      assert(typeof info.name === 'string' && /^[a-zA-Z0-9\-\_\.]+$/.test(info.name));
      info.id = guid();
      info.timestamp = (new Date()).toISOString();

      var updatePackages = pushIfNotExists(store, 'packages.txt', JSON.stringify(info.name));

      var uploadBundle = new Promise(function (resolve, reject) {
        return buildPackage(directory).pipe(store.createWriteStream(info.id + '.tar.gz'))
          .on('error', reject)
          .on('close', resolve);
      });

      var addMetadata = uploadBundle.then(function () {
        return pushIfNotExists(store, info.name + '-versions.txt', JSON.stringify(info));
      });

      return Promise.all([updatePackages, uploadBundle, addMetadata]).then(function () {
        return Promise.all([
          store.writeFile(info.name + '-tag-latest.txt', new Buffer(info.id)),
          store.writeFile(info.name + '-tag-' + info.branch + '.txt', new Buffer(info.id))
        ]);
      }).then(function () {
        return info.id;
      });
    });
  });
}

function pushIfNotExists(store, file, line) {
  return store.readFile(file).then(function (body) {
    body = body.toString().split('\n');
    if (body.indexOf(line) === -1) {
      body.push(line);
      return store.writeFile(file, new Buffer(body.join('\n'))).then(function () {
        return delay(1000);
      }).then(function () {
        return pushIfNotExists(store, file, line);
      });
    }
  }, function (err) {
    if (err.code !== 'ENOENT') throw err;
    return store.writeFile(file, new Buffer(line)).then(function () {
      return delay(1000);
    }).then(function () {
      return pushIfNotExists(store, file, line);
    });
  });
}

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

