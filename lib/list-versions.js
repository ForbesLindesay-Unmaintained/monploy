'use strict';

var getDb = require('./get-db.js');

module.exports = upload;
function upload(name, options) {
  return getDb(options, function (db) {
    return db.bundles.find({ name: name }).sort({timestamp: -1});
  });
}
