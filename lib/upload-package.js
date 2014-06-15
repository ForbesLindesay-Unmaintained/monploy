'use strict';

var assert = require('assert');
var mongod = require('mongod');
var knox = require('knox');
var Promise = require('promise');

module.exports = upload;
function upload(bundle, info, options) {
  var mustClose = false;
  var db;
  if (typeof options.db === 'string') {
    mustClose = true;
    db = mongod(options.db, ['bundles']);
  } else {
    db = options.db;
  }
  assert(typeof db === 'object');
  assert(typeof db.bundles === 'object');
  assert(typeof db.bundles.insert === 'function');
  assert(typeof db.bundles.update === 'function');
  assert(typeof info.name === 'string');
  var id;
  return db.bundles.insert({
    timestamp: new Date(),
    name: info.name,
    build: info.build,
    branch: info.branch,
    commit: info.commit,
    message: info.message,
    ready: false
  }).then(function (res) {
    id = res._id;
    return uploadBundle(id, bundle, options);
  }).then(function () {
    return db.bundles.update({_id: id}, {$set: {ready: true}});
  }).then(function () {
    if (mustClose) {
      return db.close();
    }
  });
}
function uploadBundle(id, bundle, options) {
  return new Promise(function (resolve, reject) {
    var client;
    if (options.s3 && typeof options.s3.put === 'function') {
      client = options.s3;
    } else {
      client = knox.createClient(options.s3);
    }
    client.putBuffer(bundle, '/' + id + '.tar.gz', function (err, res) {
      if (err) reject(err);
      else resolve(res);
    });
  });
}
