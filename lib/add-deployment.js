'use strict';

var assert = require('assert');
var Promise = require('promise');
var guid = require('guid').raw;
var detect = require('./detect.js');
var getStore = require('./get-store.js');

module.exports = addDeployment;
function addDeployment(name, deployment, options) {
  return getStore(options, function (store) {
    deployment.id = guid();

    return store.writeFile(deployment.id + '.json', new Buffer(JSON.stringify(deployment))).then(function () {
      return pushIfNotExists(store, name + '-deployments.txt', JSON.stringify(deployment.id));
    }).then(function () {
      return deployment.id;
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
