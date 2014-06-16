var getStore = require('./get-store.js');


module.exports = getDeployment;
function getDeployment(id, options) {
  return getStore(options, function (store) {
    return store.readFile(id + '.json').then(function (data) {
      return JSON.parse(data.toString());
    });
  });
}
