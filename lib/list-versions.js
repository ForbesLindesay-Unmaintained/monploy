'use strict';

var assert = require('assert');
var mongod = require('mongod');

module.exports = upload;
function upload(name, options) {
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
  assert(typeof db.bundles.find === 'function');
  return db.bundles.find({ name: name }).sort({timestamp: -1}).then(function (bundles) {
    return Promise.resolve(mustClose ? db.close() : null).then(function () {
      return bundles;
    });
  });
}
