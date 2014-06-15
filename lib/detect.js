'use strict';

var fs = require('fs');
var cp = require('child_process');
var Promise = require('promise');
var readFile = Promise.denodeify(fs.readFile);
function exec(path, options) {
  return new Promise(function (resolve, reject) {
    cp.exec(path, options, function (err, stdout, stderr) {
      if (err) {
        err.stdout = stdout;
        err.stderr = stderr;
        reject(err);
      } else {
        resolve({stdout: stdout, stderr: stderr});
      }
    });
  });
}

module.exports = function detect(directory, info) {
  var name = info.name || getName(directory);
  var branch = info.branch || process.env.CI_BRANCH || getBranch(directory);
  var commit = info.commit || process.env.CI_COMMIT_ID || getCommit(directory);
  var message = info.message || process.env.CI_MESSAGE || getCommitMessage(directory);
  return Promise.all([name, branch, commit, message]).then(function (res) {
    return {
      name: res[0],
      branch: res[1],
      commit: res[2],
      message: res[3],
      build: info.build || process.env.CI_BUILD_URL || null
    };
  });
};
function getName(directory) {
  return readFile(directory + '/package.json', 'utf8').then(function (src) {
    return JSON.parse(src).name;
  }, function (err) {
    if (err.code !== 'ENOENT') throw err;
    throw new Error('No name was found and "package.json" does not exist');
  });
}
function getBranch(directory) {
  return exec('git rev-parse --abbrev-ref HEAD', {
    cwd: directory
  }).then(function (res) {
    return res.stdout.toString().trim();
  }, function () {
    return null;
  });
}
function getCommit(directory) {
  return exec('git rev-parse HEAD', {
    cwd: directory
  }).then(function (res) {
    return res.stdout.toString().trim();
  }, function () {
    return null;
  });
}
function getCommitMessage(directory) {
  return exec('git log -1 --pretty=%B', {
    cwd: directory
  }).then(function (res) {
    return res.stdout.toString().trim();
  }, function () {
    return null;
  });
}
