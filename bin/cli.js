#!/usr/bin/env node

var command = process.argv[2];
var argv = require('minimist')(process.argv.slice(3));

var fs = require('fs');
var Guid = require('guid');
var Promise = require('promise');
var monploy = require('../');

function printHelp() {
  console.log('monploy upload <options>');
  console.log('monploy list <options>');
  console.log('monploy download <options>');
}

var s3 = {
  key: argv.key || process.env.DEPLOY_KEY,
  secret: argv.secret || process.env.DEPLOY_SECRET,
  bucket: argv.bucket || process.env.DEPLOY_BUCKET,
  region: argv.region || process.env.DEPLOY_REGION
};

function printVersions(versions) {
  versions.forEach(function (version) {
    console.log(version.id.substring(0, 8) + ' - ' + version.message + ' (' + version.build + ')');
  });
}

switch (command) {
  case 'upload':
    monploy.upload(process.cwd(), argv, {s3: s3}).done(function (id) {
      console.log('uploaded ' + id);
    });
    break;
  case 'download':
    var id;
    if (argv.id && Guid.isGuid(argv.id)) {
      id = argv.id;
    } else if (argv.id) {
      argv.id = '' + argv.id;
      id = monploy.list(argv.name, {s3: s3}).then(function (list) {
        list = list.filter(function (version) {
          return version.id.substring(0, argv.id.length) === argv.id;
        });
        if (list.length > 1) {
          throw new Error('More than one version matches that id');
        } else if (list.length < 1) {
          throw new Error('No versions match that id');
        } else {
          return list[0].id;
        }
      });
    } else if (argv.latest) {
      id = monploy.getTag(argv.name, 'latest', {s3: s3});
    } else if (argv.tag) {
      id = monploy.getTag(argv.name, argv.tag, {s3: s3});
    } else {
      printHelp();
      process.exit(1);
    }
    Promise.resolve(id).done(function (id) {
      monploy.download(id, process.cwd(), {s3: s3}).done(function () {
        console.log('downloaded ' + id);
      });
    });
    break;
  case 'list':
    if (argv.name) {
      // {"name":"test-package",
      //  "branch":"master",
      //  "commit":"95df442c56853ccd90d632a460cf9edc94748eb0",
      //  "message":"Work on just Amazon S3, nobody wanted mongo anyway",
      //  "build":null,
      //  "id":"b3824fa9-e293-89d9-416c-f1eb532691f2",
      //  "timestamp":"2014-06-15T23:16:28.343Z"}
      monploy.list(argv.name, {s3: s3}).done(printVersions);
    } else {
      monploy.list(JSON.parse(fs.readFileSync('package.json', 'utf8')).name,
                   {s3: s3}).done(printVersions);
    }
    break;
  case 'help':
    printHelp();
    break;
  default:
    if (command) {
      console.error('Command "' + command + '" was not recognised.');
    }
    printHelp();
    if (command) {
      process.exit(1);
    }
}
