var Test = require('./test');
var sayHello = require('./sayHello');
var appUpgrader = require('./appUpgrader');
var App = require('./app');

var Bell = {
  a: 'hello',
  Test: Test,
  sayHello: sayHello,
  appUpgrader: appUpgrader,
  app: new App()
};

Bell.app.on(App.EVENT_DEVICE_READY, function() {
  Bell.appUpgrader.check();
}, null);

module.exports = Bell;
