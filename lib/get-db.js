'use strict';

var assert = require('assert');
var mongod = require('mongod');

function (options, fn) {
  var mustClose = false;
  var db;
  if (typeof options.db === 'string') {
    mustClose = true;
    db = mongod(options.db, ['bundles']);
  } else if (options.db) {
    db = options.db;
  } else if (process.env.DEPLOY_DB) {
    mustClose = true;
    db = mongod(process.env.DEPLOY_DB, ['bundles']);
  }

  assert(typeof db === 'object', 'You must either provide a `db` option or a `DEPLOY_DB` environment variable');
  assert(typeof db.bundles === 'object');

  assert(typeof db.bundles.insert === 'function');
  assert(typeof db.bundles.update === 'function');
  assert(typeof db.bundles.find === 'function');

  var result = fn(db);
  if (!mustClose) {
    return Promise.resolve(result);
  } else {
    return Promise.resolve(result).then(function (res) {
      return db.close().then(function () { return res; });
    });
  }
}
