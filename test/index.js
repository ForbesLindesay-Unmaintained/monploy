'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var resolve = path.resolve;
var test = require('testit');
var Promise = require('promise');
var mkdirp = require('mkdirp').sync;
var rimraf = require('rimraf').sync;
var mkdirpAsync = Promise.denodeify(require('mkdirp'));
var monploy = require('../');

function reset() {
  rimraf(__dirname + '/temp');
  mkdirp(__dirname + '/temp');
}
function checkPackage() {
  var src = fs.readFileSync(__dirname + '/temp/package/index.js', 'utf8');
  var mod = {exports: {}};
  Function('module', src)(mod);
  assert(mod.exports() === 42);
}

test('buildPackage', function (done) {
  reset();
  monploy.buildPackage(resolve(__dirname + '/fixture'))
    .pipe(fs.createWriteStream(__dirname + '/temp/package.tar.gz'))
    .on('close', function () {
      fs.createReadStream(__dirname + '/temp/package.tar.gz')
        .pipe(monploy.extractPackage(resolve(__dirname + '/temp/package')))
        .then(function () {
          checkPackage();
        })
        .nodeify(done);
    });
});

var LocalStore = {};
LocalStore.writeFile = function (name, blob) {
  var p = path.join(__dirname, 'temp', 'store', name);
  return mkdirpAsync(path.dirname(p)).then(function () {
    return Promise.denodeify(fs.writeFile)(p, blob);
  });
};
LocalStore.readFile = function (name) {
  var p = path.join(__dirname, 'temp', 'store', name);
  return Promise.denodeify(fs.readFile)(p);
};


test('list versions', function () {
  reset();
  return monploy.list('test-package', {store: LocalStore}).then(function (res) {
    assert.deepEqual(res, []);
  });
});
test('list packages', function () {
  reset();
  return monploy.listPackages({store: LocalStore}).then(function (res) {
    assert.deepEqual(res, []);
  });
});
test('uploadPackage', function () {
  reset();
  return monploy.release(resolve(__dirname + '/fixture'), {}, {store: LocalStore}).then(function () {
    return monploy.listPackages({store: LocalStore});
  }).then(function (packages) {
    assert.deepEqual(packages, ['test-package']);
    return monploy.list('test-package', {store: LocalStore});
  }).then(function (versions) {
    assert(versions.length === 1);
    return monploy.download(
      versions[0].id,
      resolve(__dirname + '/temp/package'),
      {store: LocalStore});
  }).then(function () {
    checkPackage();
    return monploy.release(resolve(__dirname + '/fixture'), {}, {store: LocalStore})
  }).then(function () {
    return monploy.listPackages({store: LocalStore});
  }).then(function (packages) {
    assert.deepEqual(packages, ['test-package']);
    return monploy.list('test-package', {store: LocalStore});
  }).then(function (versions) {
    assert(versions.length === 2);
    return monploy.download(
      versions[1].id,
      resolve(__dirname + '/temp/package'),
      {store: LocalStore});
  }).then(function () {
    checkPackage();
  });
});
