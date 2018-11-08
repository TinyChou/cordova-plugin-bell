var Constants = exports;
var Configs = {};
var Product = {};
var Platform = {};
var Locale = {};

// Configs
Configs.ORIGIN = 'https://www.bellrobot.com/';
Configs.HOST = Configs.ORIGIN + 'mabot_app_manager';
Configs.FORUM = 'https://www.bellrobot.com/forum/';
Configs.GET_APP_LASTEST_VERSION_INFO = 'https://ubao.bellrobot.com/get_lastest_app_version';
Configs.GET_INSTRUCTION_LASTEST_VERSION_INFO =
  'https://ubao.bellrobot.com/get_lastest_instructions_version_info';
Configs.APP_STORE_LINK = //'https://itunes.apple.com/cn/app/mabot-go/id1116909822?l=en&mt=8';
  'https://itunes.apple.com/cn/app/mabot-ide/id1237590947?l=en&mt=8';
// Product
Product.MABOT_GO = 1;
Product.MABOT_IDE_PAD = 2;
Product.MABOT_IDE_PC= 3;
Product.WINGBOT_APP = 4;
Product.THUNDER_GO = 5;
Product.THUNDER_IDE_PC = 6;
Product.MABOT_WONDER = 7;

// Platform
Platform.ANDROID = 1;
Platform.IOS = 2;
Platform.WINDOWS = 3;
Platform.MAC_OSX = 4;
Platform.BROWSER = 5;
Platform.getPlatformCode = function() {
  if (!!window.cordova) {
    if (window.cordova.platformId === 'android') {
      return Platform.ANDROID;
    } else if (window.cordova.platformId === 'ios') {
      return Platform.IOS;
    } else {
      Platform.BROWSER;
    }
  } else {
    return Platform.BROWSER;
  }
};

// Locale
Locale.ZH = 'zh-cn';
Locale.ZH_TRIDITIONAL = 'zh-tw';
Locale.EN = 'en';
Locale.JA = 'ja';
Locale.RU = 'ru';
Locale.KO = 'ko';
Locale.currLocale_ = Locale.ZH;// 该全局变量会在launch.js中根据当前系统地区语言进行赋值
Locale.getLocale = function() {
  // TODO: all the apps localization should be unified
  return Locale.currLocale_;
  // throw 'Unknown language!';
};
Locale.setLocale = function(locale) {
  Locale.currLocale_ = locale;
};
Locale.internalStrings = {
  'zh-cn': {
    not_downloaded: '未下载',
    ok: '确定',
    cancel: '取消',
    downloading: '正在下载...'
  },
  'zh-tw': {
    not_downloaded: '未下載',
    ok: '確定',
    cancel: '取消',
    downloading: '正在下載...'
  },
  'en': {
    not_downloaded: 'Not download',
    ok: 'OK',
    cancel: 'Cancel',
    downloading: 'Downloading...'
  },
  'ja': {
    not_downloaded: 'ダウンロードが必要',
    ok: 'OK',
    cancel: 'キャンセル',
    downloading: 'ダウンロード中...'
  },
  'ru': {
    not_downloaded: 'Не загружено',
    ok: 'хорошо',
    cancel: 'отменен',
    downloading: 'Loading ...'
  },
  'ko': {
    not_downloaded: '다운로드되지 않음',
    ok: '확인',
    cancel: '취소',
    downloading: '다운로드 중 ...'
  }
};
Locale.getInternalString = function(key) {
  var lang = Locale.getLocale();
  return Locale.internalStrings[lang][key];
};

exports.Configs = Configs;
exports.Product = Product;
exports.Platform = Platform;
exports.Locale = Locale;
