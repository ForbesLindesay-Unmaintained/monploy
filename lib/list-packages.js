'use strict';

var getStore = require('./get-store.js');

module.exports = listVersions;
function listVersions(options) {
  return getStore(options, function (store) {
    return store.readFile('packages.txt').then(function (data) {
      return data.toString().split('\n').filter(Boolean).map(JSON.parse).sort(function (a, b) {
        return a.timestamp < b.timestamp ? 1 : -1;
      });
    }, function (err) {
      if (err.code !== 'ENOENT') throw err;
      return [];
    });
  });
}
