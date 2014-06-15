'use strict';

var fs = require('fs');
var Promise = require('promise');
var readFile = Promise.denodeify(fs.readFile);

module.exports = function detect(directory, info) {
  var name = info.name || readFile(directory + '/package.json', 'utf8').then(function (src) {
    return JSON.parse(info).name;
  }, function (err) {
    if (err.code !== 'ENOENT') throw err;
    throw new Error('No name was found and "package.json" does not exist');
  });
  return Promise.resolve(name).then(function (name) {
    info.name = name;
  });
  /*
    branch: info.branch,
    commit: info.commit,
    message: info.message,
  */
};
