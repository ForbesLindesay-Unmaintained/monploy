'use strict';

var getStore = require('./get-store.js');

module.exports = listVersions;
function listVersions(name, tag, options) {
  return getStore(options, function (store) {
    return store.readFile(name + '-tag-' + tag + '.txt').then(function (data) {
      return data.toString();
    });
  });
}
