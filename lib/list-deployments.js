'use strict';

var Promise = require('promise');
var getDeployments = require('./get-deployment.js');
var getStore = require('./get-store.js');

module.exports = listDeployments;
function listDeployments(name, options) {
  return getStore(options, function (store) {
    return store.readFile(name + '-deployments.txt').then(function (data) {
      return Promise.all(data.toString().split('\n').filter(Boolean).map(JSON.parse).map(function (id) {
        return store.readFile(id + '.json').then(function (data) {
          return JSON.parse(data.toString());
        });
      }));
    }, function (err) {
      if (err.code !== 'ENOENT') throw err;
      return [];
    });
  });
}
