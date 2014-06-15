'use strict';

var zlib = require('zlib');
var tar = require('tar');
var fstream = require('fstream');
var concat = require('concat-stream');
var Promise = require('promise');

module.exports = buildPackage;
function buildPackage(directory) {
  var folder = fstream.Reader({
    path: directory,
    type: 'Directory',
    filter: function (entry) { // {path, basename, dirname, type} (type is "Directory" or "File")
      var basename = entry.basename
      // some files are *never* allowed under any circumstances
      // these files should always be either temporary files or
      // version control related files
      if (basename === '.git' || basename === '.lock-wscript' ||
          basename.match(/^\.wafpickle-[0-9]+$/) ||
          basename === 'CVS' || basename === '.svn' || basename === '.hg' ||
          basename.match(/^\..*\.swp$/) ||
          basename === '.DS_Store' ||  basename.match(/^\._/)) {
        return false
      } else {
        return true;
      }
    }
  });
  var tarPack = tar.Pack();
  var gzip = zlib.Gzip();
  folder
    .on('error', function (er) {
      if (er) debug('Error reading folder')
      return gzip.emit('error', er)
    });
  tarPack
    .on('error', function (er) {
      if (er) debug('tar creation error')
      gzip.emit('error', er)
    });
  return folder.pipe(tarPack).pipe(gzip);
}
buildPackage.buffer = function (directory) {
  return new Promise(function (resolve, reject) {
    var source = buildPackage(directory);
    var dest = concat(resolve);
    source.on('error', reject);
    dest.on('error', reject);
    source.pipe(dest);
  });
};
