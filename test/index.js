'use strict';

var assert = require('assert');
var fs = require('fs');
var resolve = require('path').resolve;
var test = require('testit');
var Promise = require('promise');
var mkdirp = require('mkdirp').sync;
var rimraf = require('rimraf').sync;
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
test('buildPackage.buffer', function () {
  reset();
  return monploy.buildPackage.buffer(resolve(__dirname + '/fixture')).then(function (bundle) {
    return monploy.extractPackage.buffer(bundle, __dirname + '/temp/package');
  }).then(function () {
    checkPackage();
  });
});

test('uploadPackage', function () {
  reset();
  var operation = 0;
  var bundle;
  return monploy.release(resolve(__dirname + '/fixture'), {}, {
    db: {
      bundles: {
        insert: function (object) {
          console.dir(object);
          assert(0 === operation++);
          assert(object.name === 'test-package');
          return Promise.resolve({_id: 'test-id'});
        }, update: function (query, update) {
          assert(2 === operation++);
          assert(query._id === 'test-id');
          assert.deepEqual(update, { $set: { ready: true } });
          return Promise.resolve(null);
        }
      }
    },
    s3: {
      writeFile: function (path, buffer, callback) {
        bundle = buffer;
        assert(Buffer.isBuffer(buffer));
        assert(path === '/test-id.tar.gz');
        assert(1 === operation++);
        return Promise.resolve(null);
      }
    }
  }).then(function () {
    return monploy.extractPackage.buffer(bundle, __dirname + '/temp/package');
  }).then(function () {
    checkPackage();
  });
});
test('list versions', function () {
  return monploy.list('test-package', {
    db: {
      bundles: {
        find: function (query) {
          assert.deepEqual(query, {name: 'test-package', ready: true});
          return {
            sort: function (sorter) {
              assert.deepEqual(sorter, {timestamp: -1});
              return Promise.resolve([]);
            }
          };
        }
      }
    }
  }).then(function (res) {
    assert.deepEqual(res, []);
  });
});
