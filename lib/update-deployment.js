'use strict';

var getStore = require('./get-store.js');

module.exports = updateDeployment;
function updateDeployment(deployment, options) {
  return getStore(options, function (store) {
    return store.writeFile(deployment.id + '.json', new Buffer(JSON.stringify(deployment)));
  });
}
