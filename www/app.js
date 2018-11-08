var EventEmitter3 = require('./eventemitter3');
var utils = require('cordova/utils');
var Constants = require('./configs');
var Locale = Constants.Locale;

// class App
// 依赖插件:
var App = function() {
  App.__super__.constructor.call(this); // super();

  this.isDeviceReady = false;
  this.isDOMLoaded = false;
  this.isLoaded = false;
  this.batteryStatus = null;

  this.onDeviceReady = this.onDeviceReady.bind(this);

  this.initialize();
};
utils.extend(App, EventEmitter3);

App.prototype.D = true;
App.prototype.TAG = 'BellPlugin.App';

// cordova event deviceready
App.prototype.isDeviceReady = false;
// dom tree loaded
App.prototype.isDOMLoaded = false;
// dom tree loaded and js/css async loading finished
App.prototype.isLoaded = false;
App.prototype.batteryStatus = null;

App.EVENT_DOM_CONTENT_LOADED = 'DOMContentLoaded';
App.EVENT_LOAD = 'load';
App.EVENT_DEVICE_READY = 'deviceready';
App.EVENT_BATTERY_STATUS = 'batterystatus';
App.EVENT_ONLINE = 'online';
App.EVENT_OFFLINE = 'offline';
App.EVENT_BACK_BUTTON = 'backbutton';
App.EVENT_RESUME = 'resume';
App.EVENT_PAUSE = 'pause';

// 判断是否app已经准备就绪: dom loaded and js/css loaded and device ready
App.prototype.isReady = function() {
  return this.isDOMLoaded && this.isLoaded && this.isDeviceReady;
};

// 初始化，添加各种监听
App.prototype.initialize = function() {
  var self = this;

  document.addEventListener(App.EVENT_DOM_CONTENT_LOADED, function() {
    if (self.D) console.log(self.TAG, App.EVENT_DOM_CONTENT_LOADED, 'emit!');
    self.isDOMLoaded = true;
    self.emit(App.EVENT_DOM_CONTENT_LOADED);
  });

  window.addEventListener(App.EVENT_LOAD, function() {
    if (self.D) console.log(self.TAG, App.EVENT_LOAD, 'emit!');
    self.isLoaded = true;
    self.emit(App.EVENT_LOAD);
  });

  document.addEventListener(App.EVENT_DEVICE_READY, function() {
    if (self.D) console.log(self.TAG, App.EVENT_DEVICE_READY, 'emit!');

    if (!window.cordova) {
      console.error('No cordova!');
      return;
    }

    if (window.cordova.platformId === 'android') {
      var timeoutPid = null;
      var resizeHandler = function() {
        if (self.isDeviceReady) return;
        if (self.D) console.log(self.TAG, 'resize: w=' + window.innerWidth + ', h=' + window.innerHeight);
        window.removeEventListener('resize', resizeHandler);
        if (timeoutPid) clearTimeout(timeoutPid);
        timeoutPid = null;
        self.globalizationAndroidAndBrowserHandler().then(self.onDeviceReady);
      };
      // 先添加resize事件
      window.addEventListener('resize', resizeHandler, false);
      // 然后全屏
      AndroidFullScreen.immersiveMode(function() {
        if (self.D) console.log(self.TAG, 'immersive mode done!');
      }, utils.noop);
      // 异常逻辑处理,防止一直黑屏
      timeoutPid = setTimeout(function() {
        if (!self.isDeviceReady) self.globalizationAndroidAndBrowserHandler().then(self.onDeviceReady);
        timeoutPid = null;
      }, 5000);
    } else if (window.cordova.platformId === 'ios') {

    } else if (window.cordova.platformId === 'browser') {
      self.globalizationAndroidAndBrowserHandler().then(self.onDeviceReady);
    } else {
      console.error('Non-supported platform: ', window.cordova.platformId);
    }
  });
};

App.prototype.globalizationIosHandler = function() {
  return new Promise(function(resolve, reject) {
    navigator.globalization.getPreferredLanguage(function(lang) {
      lang = lang || { value: 'en-US' };
      lang = lang.value.toUpperCase();
      if (lang.length > 7) lang = lang.substring(0, 7);
      else lang = lang.substring(0, 2);

      switch (lang) {
        case 'ZH-HANT':
          Locale.setLocale(Locale.ZH_TRIDITIONAL);
          break;
        case 'ZH-HANS':
          Locale.setLocale(Locale.ZH);
          break;
        case 'JA':
          Locale.setLocale(Locale.JA);
          break;
        case 'RU':
          Locale.setLocale(Locale.RU);
          break;
        case 'KO':
          Locale.setLocale(Locale.KO);
          break;
        default:
          Locale.setLocale(Locale.EN);
          break;
      }
      resolve();
    }, reject);
  });
};

App.prototype.globalizationAndroidAndBrowserHandler = function() {
  return new Promise(function(resolve, reject) {
    navigator.globalization.getPreferredLanguage(function(lang) {
      lang = lang || { value: 'en-US' };
      lang = lang.value.toUpperCase();

      switch (lang) {
        case 'ZH-CN':
        case 'ZH-SG':
          Locale.setLocale(Locale.ZH);
          break;
        case 'ZH-TW':
        case 'ZH-MO':
        case 'ZH-HK':
          Locale.setLocale(Locale.ZH_TRIDITIONAL);
          break;
        default:
          if (lang && lang.startsWith('JA')) {
            Locale.setLocale(Locale.JA);
          } else if (lang && lang.startsWith('RU')) {
            Locale.setLocale(Locale.RU);
          } else if (lang && lang.startsWith('KO')) {
            Locale.setLocale(Locale.KO);
          } else {
            Locale.setLocale(Locale.EN);
          }
          break;
      }
      resolve();
    }, reject);
  });
};

App.prototype.onDeviceReady = function() {
  this.isDeviceReady = true;
  this.emit(App.EVENT_DEVICE_READY);
  if (navigator.splashscreen) navigator.splashscreen.hide();

  if (!window.cordova) return;
  var self = this;

  window.addEventListener(App.EVENT_BATTERY_STATUS, function(status) {
    if (self.D) console.log(self.TAG, App.EVENT_BATTERY_STATUS, 'emit!',
      JSON.stringify(status || { error: -1 }));

    self.batteryStatus = status;
    self.emit(App.EVENT_BATTERY_STATUS, status);
  }, false);

  window.online = navigator.connection.type !== Connection.NONE;
  document.addEventListener(App.EVENT_ONLINE, function() {
    window.online = true;
  }, false);
  document.addEventListener(App.EVENT_OFFLINE, function() {
    window.offline = false;
  }, false);

  document.addEventListener(App.EVENT_BACK_BUTTON, function() {
    self.emit(App.EVENT_BACK_BUTTON);
  }, false);
  document.addEventListener(App.EVENT_RESUME, function() {
    self.emit(App.EVENT_RESUME);
  }, false);
  document.addEventListener(App.EVENT_PAUSE, function() {
    self.emit(App.EVENT_PAUSE);
  });
};

module.exports = App;
