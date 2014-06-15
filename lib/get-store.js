'use strict';

var PassThrough = require('stream').PassThrough;
var knox = require('knox');
var concat = require('concat-stream');

module.exports = getStore;
function getStore(options, fn) {
  if (options.store) return fn(normalize(options.store));
  if (options.knox) return fn(normalize(new KnoxStore(options.knox)));
  if (options.s3) return fn(normalize(new KnoxStore(knox.createClient(options.s3))));
}

function KnoxStore(client) {
  this.client = client;
}
KnoxStore.prototype.writeFile = function (name, buffer) {
  return new Promise(function (resolve, reject) {
    this.client.putBuffer(buffer, '/' + name, function (err) {
      if (err) reject(err);
      else resolve(null);
    });
  });
};
KnoxStore.prototype.createReadStream = function (name) {
  var errored = false;
  var result = new PassThrough();
  this.client.get('/' + name).on('response', function (res) {
    if (errored) return;
    if (res.statusCode !== 200) {
      errored = true;
      result.emit('error', new Error('Status code ' + res.statusCode));
      result.end();
      return;
    }
    res.pipe(result);
  }).on('error', function (err) {
    if (errored) return;
    errored = true;
    result.emit('error', err);
    result.end();
  });
  return result;
};

function normalize(store) {
  assert(typeof store.writeFile === 'function' || typeof store.createWriteStream === 'function');
  assert(typeof store.readFile === 'function' || typeof store.createReadStream === 'function');
  if (!store.writeFile) {
    store.writeFile = function (name, buffer) {
      return new Promise(function (resolve, reject) {
        store.createWriteStream(name).on('error', reject).on('close', resolve).end(buffer);
      });
    };
  }
  if (!store.createWriteStream) {
    store.createWriteStream = function (name) {
      var stream = new PassThrough();
      stream.pipe(concat(function (buffer) {
        store.writeFile(name, buffer).done(function () {
          stream.emit('close');
        }, function (err) {
          stream.emit('error', err);
          stream.emit('close');
        });
      }));
      return stream;
    };
  }
  if (!store.readFile) {
    store.readFile = function (name) {
      return new Promise(function (resolve, reject) {
        store.createReadStream(name).on('error', reject).pipe(concat(resolve));
      });
    };
  }
  if (!store.createReadStream) {
    store.createReadStream = function (name) {
      var stream = new PassThrough();
      store.readFile(name).done(function (buffer) {
        stream.end(buffer);
      }, function (err) {
        stream.emit('error', err);
        stream.end();
      });
      return stream;
    };
  }
}
