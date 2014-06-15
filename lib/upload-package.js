'use strict';

var assert = require('assert');
var Promise = require('promise');
var detect = require('./detect.js');
var buildPackage = require('./build-package.js');
var getStore = require('./get-store.js');
var getDb = require('./get-db.js');

module.exports = upload;
function upload(directory, info, options) {
  return getStore(options, function (store) {
    return getDb(options, function (db) {
      var id;
      return detect(directory, info).then(function (info) {
        assert(typeof info.name === 'string');
        info.timestamp = new Date();
        info.ready = false;
        return db.bundles.insert(info);
      }).then(function (res) {
        id = res._id;
        return new Promise(function (resolve, reject) {
          return buildPackage(directory).pipe(store.createWriteStream(id + '.tar.gz'))
            .on('error', reject)
            .on('close', resolve);
        });
      }).then(function () {
        return db.bundles.update({_id: id}, {$set: {ready: true}});
      });
    });
  });
}
