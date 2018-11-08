/**
 * 使用方法：
 *  BellPlugin.appUpgrader.check();
 */

var Constants = require('./configs');
var Configs = Constants.Configs;
var Locale = Constants.Locale;
console.log(Locale,"Locale");
var Platform = Constants.Platform;
var Product = Constants.Product;
var utils = require('cordova/utils');
var Downloader = require('./downloader');
var HttpJsonCache = require('./httpJsonCache');

var AppDownloader = function(url, versionNo, prodName, options) {
  AppDownloader.__super__.constructor.call(this, url,
    'apks/' + (prodName + versionNo) + '.apk', options);
};
utils.extend(AppDownloader, Downloader);

AppDownloader.LOCAL_STORAGE_KEY = 'download_apk';

AppDownloader.prototype.saveDownloadInfo = function() {
  var storage = window.localStorage;
  storage.setItem(AppDownloader.LOCAL_STORAGE_KEY, true);

  if (window.cordova && window.cordova.platformId === 'android') {
    var path = Downloader.PATH_BASE + this.path;
    window.cordova.plugins.fileOpener2.open(
      path,
      'application/vnd.android.package-archive'
    );
  }
};

AppDownloader.prototype.getCachedDownloadInfo = function() {
  var storage = window.localStorage;
  var str = storage.getItem(AppDownloader.LOCAL_STORAGE_KEY);
  if (!!str) {
    return JSON.parse(str);
  } else {
    return false;
  }
};

AppDownloader.clearIfNeeded = function() {
  var storage = window.localStorage;
  storage.removeItem(AppDownloader.LOCAL_STORAGE_KEY);

  if (!window.resolveLocalFileSystemURL) return Promise.resolve();

  return new Promise(function(resolve, reject) {
    window.resolveLocalFileSystemURL(
      Downloader.PATH_BASE + 'apks/',
      function (entry) {
        entry.remove(resolve, resolve);
      },
      resolve
    );
  });
};

var cache = new HttpJsonCache();
var UPGRADE_LEVEL_FORCE = 1; // 强制升级，弹窗不能关闭，且只能点击升级
var UPGRADE_LEVEL_RECOMMENDED = 2; // 推荐升级，弹窗，可以关闭
var UPGRADE_LEVEL_NO_PROMPT = 3; // 不提示，请求数据，但不提示
var LAST_CHECK_MS_STORAGE_KEY = 'last_app_check_ms';

function initDialog(canceledOnTouchOutside) {
  var mask = document.createElement('div');
  var container = document.createElement('div');
  document.body.appendChild(mask);
  document.body.appendChild(container);

  mask.style.position = 'absolute';
  mask.style.width = '100%';
  mask.style.height = '100%';
  mask.style['background-color'] = 'black';
  mask.style.opacity = 0.5;
  mask.style.display = 'none';
  mask.style['z-index'] = 2147483647;

  container.style.position = 'absolute';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.display = 'none';
  container.style['z-index'] = 2147483647;

  container.onmousedown = container.ontouchend = function(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!canceledOnTouchOutside) container.hide();
  };

  container.show = function() {
    if (container.style.display === 'block') return;
    mask.style.display = 'block';
    container.style.display = 'block';

    if (typeof container.onShow === 'function') container.onShow();

  };

  container.hide = function() {
    if (container.style.display === 'none') return;
    mask.style.display = 'none';
    container.style.display = 'none';

    if (typeof container.onHide === 'function') container.onHide();

    container.onHide = null;
    container.onShow = null;
    container.clearContent();

    document.body.removeChild(mask);
    document.body.removeChild(container);
  };

  container.clearContent = function() {
    while(container.hasChildNodes()) {
      container.removeChild(container.lastChild);
    }
  };

  return container;
};

/*
{
  "errCode": 0,
  "message": "",
  "upgradeLevel": 1,
  "versionName": "v1.2.345-release",
  "versionNo": "4.0.0",
  "title": "修复xxBUG!",
  "desc": "此次修复了XXXbugs",
  "downloadUrl": "http://localhost:8080/app_manager/download/MabotGov4.0.0.apk"
}
*/

function initDomAppUpgradeAlert(forceUpgrade, obj) {
  var container = initDialog(forceUpgrade);

  var domRoot = document.createElement('div');
  container.appendChild(domRoot);

  domRoot.onmousedown = domRoot.ontouchend = function(e) {
    e.preventDefault();
    e.stopPropagation();
  };

  // box size
  domRoot.style.width = '50rem' ;//'20rem';
  domRoot.style.minHeight = '20rem';//'15rem';
  domRoot.style['background-color'] = 'white';
  domRoot.style.top = '50%';
  domRoot.style.left = '50%';
  domRoot.style.position = 'relative';
  domRoot.style.transform = 'translate(-50%, -50%)';
  domRoot.style['border-radius'] = '1rem';
  domRoot.style.padding = '1.5rem';
  domRoot.style.paddingBottom = '8rem';
  domRoot.style['text-align'] = 'center';

  // title:
  var titleDom = document.createElement('h3');
  domRoot.appendChild(titleDom);
  titleDom.textContent = Locale.getInternalString('not_downloaded') + ' ' + obj.versionNo;

  // message:
  var messageDom = document.createElement('h5');
  domRoot.appendChild(messageDom);
  messageDom.innerHTML = obj.title + '<br/>' + obj.desc;
  messageDom.style.lineHeight = '1.8';
  messageDom.style.width = '80%';
  messageDom.style.marginLeft = '10%';
  messageDom.style.textAlign = 'left';

  // buttons
  if (!forceUpgrade) {
    var upgradeDom = document.createElement('button');
    domRoot.appendChild(upgradeDom);
    upgradeDom.innerHTML = Locale.getInternalString('ok');
    upgradeDom.style.position = 'absolute';
    upgradeDom.style.bottom = '1.5rem';
    upgradeDom.style.left = '1.5rem';
    upgradeDom.style['font-size'] = '2rem';
    upgradeDom.style['background-color'] = 'orange';
    upgradeDom.style.color = 'white';
    upgradeDom.style.padding = '1rem 3rem';
    upgradeDom.style['border-radius'] = '1rem';

    var cancelDom = document.createElement('button');
    domRoot.appendChild(cancelDom);
    cancelDom.innerHTML = Locale.getInternalString('cancel');
    cancelDom.style.position = 'absolute';
    cancelDom.style.bottom = '1.5rem';
    cancelDom.style.right = '1.5rem';
    cancelDom.style['font-size'] = '2rem';
    cancelDom.style['background-color'] = 'orange';
    cancelDom.style.color = 'white';
    cancelDom.style.padding = '1rem 3rem';
    cancelDom.style['border-radius'] = '1rem';
    cancelDom.style.opacity = 0.5;

    cancelDom.onmousedown = cancelDom.ontouchend = function(e) {
      e.preventDefault();
      e.stopPropagation();
      container.hide();
    };

    upgradeDom.onmousedown = upgradeDom.ontouchend = function(e) {
      e.preventDefault();
      e.stopPropagation();
      AppUpgrader.gotoDownloadAndInstall(obj.downloadUrl, obj.versionNo);
      container.hide();
    };
  } else {
    var upgradeDom = document.createElement('button');
    domRoot.appendChild(upgradeDom);
    console.log(upgradeDom,"upgradeDom");
    upgradeDom.innerHTML = Locale.getInternalString('ok');
    upgradeDom.style.position = 'absolute';
    upgradeDom.style.bottom = '1.5rem';
    upgradeDom.style.transform = 'translate(-50%)';
    upgradeDom.style['font-size'] = '2rem';
    upgradeDom.style['background-color'] = 'orange';
    upgradeDom.style.color = 'white';
    upgradeDom.style.padding = '1rem 3rem';
    upgradeDom.style['border-radius'] = '1rem';

    upgradeDom.onmousedown = upgradeDom.ontouchend = function(e) {
      e.preventDefault();
      e.stopPropagation();
      AppUpgrader.gotoDownloadAndInstall(obj.downloadUrl, obj.versionNo);
      container.hide();
    };
  }

  container.show();
};
// static class AppUpgrader
var AppUpgrader = function() {};
AppUpgrader.check = function() {
  // issue: 如果没有cordova, opener2，app version plugins，啥也不干
  if (typeof window.cordova === 'undefined' || !window.cordova.getAppVersion || !window.cordova.plugins.fileOpener2) return;
  // issue: 如果上次检测时间为一天内，啥也不干
  var lastCheckMs = localStorage.getItem(LAST_CHECK_MS_STORAGE_KEY);
  if (lastCheckMs && (new Date().getTime() - lastCheckMs) < 24 * 60 * 60 * 1000) return;
  // 更新时间到localstorage
  localStorage.setItem(LAST_CHECK_MS_STORAGE_KEY, new Date().getTime());

  AppUpgrader.fetchRemoteVersionInfo(function(obj) {
    AppUpgrader.getCurrentAppVersionCode(function(currVersion) {
      console.log('[VERSION] curr: ', currVersion, 'remote: ', obj.versionNo);
      var vCompare = AppUpgrader.versionCompare(obj.versionNo, currVersion);
      if (vCompare < 0) { // remote version < local version
        console.warn('Local version bigger than remote version? Emm...');
      } else if (vCompare > 0) { // remote version > local version
        AppUpgrader.shouldUpgrade(obj);
      } else { // it's the lastest already, no need to upgrade
        console.info('It\'s the lastest already, no need to upgrade');
        AppDownloader.clearIfNeeded(); // clear if needed
      }
    });
  }, function(err) {
    console.error('fetch error :(', err);
    // TODO: remove it
    // initDomAppUpgradeAlert(true, {
    //   "errCode": 0,
    //   "message": "",
    //   "upgradeLevel": 1,
    //   "versionName": "v1.2.345-release",
    //   "versionNo": "4.0.0",
    //   "title": "修复xxBUG!",
    //   "desc": "此次修复了XXXbugs",
    //   "downloadUrl": "http://localhost:8080/app_manager/download/MabotGov4.0.0.apk"
    // });
  });
};
AppUpgrader.fetchRemoteVersionInfo = function(success, fail) {
  const url = Configs.GET_APP_LASTEST_VERSION_INFO;
  const cached = cache.getCachedJsonByUrl(url + Locale.getLocale());
  if (cached) {
    if (typeof success === 'function') success(cached);
  } else {
    const http = new XMLHttpRequest();
    const transferFailed = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof fail === 'function') fail();
    };
    http.addEventListener('error', transferFailed, true);
    http.timeout = 3 * 1000;
    http.onreadystatechange = () => {
      if (http.readyState === 4) {
        if (http.status === 200) {
          const json = JSON.parse(http.responseText);
          if (json.errCode === 0) {

            cache.cacheJsonWithUrl(url + Locale.getLocale(), json);

            if (typeof success === 'function') success(json);
          } else {
            if (typeof fail === 'function') fail(json);
          }
        } else {
          if (typeof fail === 'function') fail(http.status);
        }
      }
    };
    http.open('POST', url, true);
    http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    const request = {
      prodCode: Product.MABOT_IDE_PAD,
      platform: Platform.getPlatformCode(),
      locale: Locale.getLocale()
    };
    http.send(JSON.stringify(request));
  }
};
AppUpgrader.getCurrentAppVersionCode = function(cb) {
  if (!window.cordova || window.cordova.platformId === 'browser') {
    if (typeof cb === 'function') cb(packageJson.version);
  } else if (window.cordova.platformId === 'ios') {
    // version code from cordova-plugin-app-version
    cordova.getAppVersion.getVersionCode().then((code) => {
      if (typeof cb === 'function') cb(code);
    });
  } else if (window.cordova.platformId === 'android') {
    cordova.getAppVersion.getVersionNumber().then((code) => {
      if (typeof cb === 'function') cb(code);
    });
  }
};
// v1 > v2  return 1
// v1 < v2  return -1
// v1 == v2 return 0
AppUpgrader.versionCompare = function(v1, v2) {
  const parts1 = v1.split('.');
  const parts2 = v2.split('.');

  for (let i = 0, N = Math.min(parts1.length, parts2.length); i < N; i++ ) {
    const num1 = parseInt(parts1[i]);
    const num2 = parseInt(parts2[i]);

    if (num1 > num2) { // '3.0.0' > '1.0.0'
      return 1;
    } else if (num1 < num2) { // '3.0.0' < '3.1.0'
      return -1;
    } else {
      if (i == N - 1) {
        if (parts1.length > parts2.length) { // '3.0.91.1' > '3.0.91'
          return 1;
        } else if (parts1.length < parts2.length) { // '3.0.91' < '3.0.91.1'
          return -1;
        } else {
          return 0;
        }
      } else {
        continue;
      }
    }
  }
};
/*
级别定义:
1.强制： 当发生重大升级或者重大bug修复时，需要使用强制更新，一旦当前版本号低于制定安全版本时（该逻辑由服务器端判断），服务端返回“强制更新”的指令和版本信息，APP进行强制提示，不允许跳过，不允许使用APP内任何功能。
2.建议：日常运营使用该级别，一旦当前版本号低于建议版本时（该处逻辑由服务端判断），服务端返回“建议升级”的指令和版本信息，APP进行弹窗升级提醒，允许用户跳过该版本升级(不再提示)。
3.不提示：对于非重要的版本升级时，无需提示用户升级，避免干扰。
*/
AppUpgrader.shouldUpgrade = function(obj) {
  if (!obj) return;
  const upgradeLevel = obj.upgradeLevel;
  switch (upgradeLevel) {
    case UPGRADE_LEVEL_FORCE:
      AppUpgrader.alertUpgradeDialog(true, obj);
      break;
    case UPGRADE_LEVEL_RECOMMENDED:
      AppUpgrader.alertUpgradeDialog(false, obj);
      break;
    case UPGRADE_LEVEL_NO_PROMPT:
      console.log('UPGRADE_LEVEL_NO_PROMPT ', 'and ignored!');
      break;
  }
};

/*
{
   errCode:  0, // no errors

   upgradeLevel: 1,// 1-强制 2-建议 3-不提示

   versionName: “v1.2.345-release”, //版本名

   versionNo: “4.0.0”, //版本号

   title: “修复重大BUG!”, //版本标题

   desc: “此次我们修复了一个导致APP崩溃的重大bug，请及时更新。”, // 版本介绍

   downloadUrl: “http://localhost:8080/app_manager/download/MabotGov4.0.0.apk" //最新安卓版app下载链接或者最新pc版下载链接
}

Z-index:
┌──────────────────────┬───────────────────┬──────────────────────────────────┐
│ Browser              │ Max z─index value │ When exceeded, value changes to: │
╞══════════════════════╪═══════════════════╪══════════════════════════════════╡
│ Firefox 0 - 2        │ 2147483647        │ element disappears               │
├──────────────────────┼───────────────────┼──────────────────────────────────┤
│ Firefox 3            │ 2147483647        │ 0                                │
├──────────────────────┼───────────────────┼──────────────────────────────────┤
│ Firefox 4+           │ 2147483647        │ 2147483647                       │
├──────────────────────┼───────────────────┼──────────────────────────────────┤
│ Safari 0 - 3         │ 16777271          │ 16777271                         │
├──────────────────────┼───────────────────┼──────────────────────────────────┤
│ Safari 4+            │ 2147483647        │ 2147483647                       │
├──────────────────────┼───────────────────┼──────────────────────────────────┤
│ Internet Explorer 6+ │ 2147483647        │ 2147483647                       │
├──────────────────────┼───────────────────┼──────────────────────────────────┤
│ Chrome 29+           │ 2147483647        │ 2147483647                       │
├──────────────────────┼───────────────────┼──────────────────────────────────┤
│ Opera 9+             │ 2147483647        │ 2147483647                       │
└──────────────────────┴───────────────────┴──────────────────────────────────┘
*/
AppUpgrader.alertUpgradeDialog = function(forceUpgrade, obj) {
  initDomAppUpgradeAlert(forceUpgrade, obj);
};

AppUpgrader.gotoDownloadAndInstall = function(url, versionNo) {
  if (!window.cordova || window.cordova.platformId === 'browser') return; // do nothing in browser
  if (window.cordova.platformId === 'ios') {
    // @see https://stackoverflow.com/questions/17887348/phonegap-open-link-in-browser
    window.open(Configs.APP_STORE_LINK, '_system');
    return;
  }
  var downloader = new AppDownloader(url, versionNo, 'MabotIDE_');
  var dialog = AppUpgrader.genProgressDialog(Locale.getInternalString('downloading'));
  downloader.addStartListener(function() {
    dialog.dom.show();
  });
  downloader.addProgressListener(function(p) {
    dialog.setProgress(p);
  });
  downloader.addSuccessListener(function() {
    dialog.dom.hide();
  });
  downloader.addFailListener(function() {
    dialog.dom.hide();
  });
  downloader.start();
};

AppUpgrader.genProgressDialog = function(message) {
  var container = initDialog(true);

  // 白色容器div
  var domRoot = document.createElement('div');
  container.appendChild(domRoot);
  domRoot.onmousedown = domRoot.ontouchend = function(e) {
    e.preventDefault();
    e.stopPropagation();
  };

  var windowSize = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  var width = 1.3 / 3 * windowSize.width;
  var height = 1 / 4 * windowSize.height;

  domRoot.style.width = width + 'px';
  domRoot.style.height = height + 'px';
  domRoot.style.backgroundColor = 'white';
  domRoot.style.borderRadius = height / 4 + 'px';
  domRoot.style.position = 'absolute';
  domRoot.style.top = '50%';
  domRoot.style.left = '50%';
  domRoot.style.transform = 'translate(-50%, -50%)';
  domRoot.style.padding = '5%';
  domRoot.style.boxSizing = 'content-box';


  var SVG_NS = 'http://www.w3.org/2000/svg';
  var HTML_NS = 'http://www.w3.org/1999/xhtml';
  var XLINK_NS = 'http://www.w3.org/1999/xlink';
  function createSvgElement(name, attrs, parent) {
    var e = document.createElementNS(SVG_NS, name);
    for (var key in attrs) {
      e.setAttribute(key, attrs[key]);
    }
    if (document.body.runtimeStyle) {
      e.runtimeStyle = e.currentStyle = e.style;
    }
    if (parent) parent.appendChild(e);
    return e;
  };

  // 进度条使用svg
  var SVG_WIDTH = width;
  var SVG_HEIGHT = 0.3 * height;
  var svg = createSvgElement('svg', {
    'xmlns': SVG_NS,
    'xmlns:html': HTML_NS,
    'xmlns:xlink': XLINK_NS,
    'version': '1.1',
    'width': SVG_WIDTH + 'px',
    'height': SVG_HEIGHT + 'px',
    'style': 'position: absolute; top: 30%;'
  }, domRoot);
  // 外框
  createSvgElement('rect', {
    'x': 1,
    'y': 0,
    'width': SVG_WIDTH - 2,
    'height': SVG_HEIGHT - 2,
    'fill': 'none',
    'stroke': '#fda948',
    'stroke-width': 1,
    'rx': SVG_HEIGHT / 2,
    'ry': SVG_HEIGHT / 2
  }, svg);
  // 背景rect
  var PADDING = 0.02 * SVG_WIDTH;
  createSvgElement('rect', {
    'x': PADDING,
    'y': PADDING,
    'width': SVG_WIDTH - PADDING * 2,
    'height': SVG_HEIGHT - PADDING * 2,
    'fill': '#fbf1ea',
    'stroke': 'none',
    'rx': (SVG_HEIGHT - PADDING * 2) / 2,
    'ry': (SVG_HEIGHT - PADDING * 2) / 2
  }, svg);
  // progress
  var progress = createSvgElement('rect', {
    'x': PADDING,
    'y': PADDING,
    'width': 0,
    'height': SVG_HEIGHT - PADDING * 2,
    'fill': '#fda948',
    'stroke': 'none',
    'rx': (SVG_HEIGHT - PADDING * 2) / 2,
    'ry': (SVG_HEIGHT - PADDING * 2) / 2
  }, svg);


  // message
  var label = document.createElement('p');
  domRoot.appendChild(label);
  label.style.position = 'absolute';
  label.style.bottom = '20%';
  label.style.width = '80%';
  label.style.textAlign = 'center';
  label.style.fontSize = height * 0.9 * 0.25 / 3 * (1.2 / 3 * 4) + 'px';
  label.textContent = message || '正在下载...';

  return {
    dom: container,
    setProgress: function(newProgress) {
      var ratio = newProgress / 100;
      progress.setAttribute('width', (SVG_WIDTH - PADDING * 2) * ratio);
    }
  };
};

module.exports = AppUpgrader;
