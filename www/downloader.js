var EventEmitter3 = require('./eventemitter3');
var utils = require('cordova/utils');

/**
 * 下载类，将url指定连接的资源下载保存到本地，本地路径为path
 * options可以指定额外的配置参数
 * @see https://github.com/apache/cordova-plugin-file-transfer#upload
 *
 */
var Downloader = function(url, path, options) {
  Downloader.__super__.constructor.call(this);

  this.status = Downloader.STATUS_PENDING;
  this.url = url;
  this.path = path;
  this.options = options;
  this.progress = 0;
};
utils.extend(Downloader, EventEmitter3);// 继承自EventEmitter3

// status
Downloader.STATUS_PENDING = 0x00; // 还未开始下载，刚初始化
Downloader.STATUS_DOWNLOADING = 0x01; // 进入下载，正在下载中
Downloader.STATUS_DOWNLOADED = 0x02; // 下载成功
Downloader.STATUS_DOWNLOAD_FAILED = 0x03; // 下载失败
// events
Downloader.EVENT_STARTED = 'event_started';
Downloader.EVENT_PROGRESS = 'event_progress';
Downloader.EVENT_SUCCESS = 'event_success';
Downloader.EVENT_FAILED = 'event_failed';
// base path
Downloader.PATH_BASE = 'cdvfile://localhost/persistent/download/bellai/';
// timeout seconds
Downloader.TIMEOUT_MS = 5 * 1000;

Downloader.prototype.status = Downloader.STATUS_PENDING;
Downloader.prototype.url = null; // 下载链接
Downloader.prototype.path = null; // 本地保存路径
Downloader.prototype.options = null; // 配置项
Downloader.prototype.progress = 0; // 当前下载进度 0-100
Downloader.prototype.D = false; // 是否打开调试log
Downloader.prototype.TAG = 'Downloader'; // 调试tag

Downloader.prototype.start = function() {
  this.emit(Downloader.EVENT_STARTED);
  this.status = Downloader.STATUS_DOWNLOADING;

  var url = this.url;
  var path = Downloader.PATH_BASE + this.path;

  if (this.D) console.log(this.TAG, url, '->', path);

  var transfer = new FileTransfer();
  var self = this;
  transfer.onprogress = function(e) {
    if (e.lengthComputable) {
      var p = parseInt(e.loaded / e.total * 100);

      if (self.progress !== p) {
        self.emit(Downloader.EVENT_PROGRESS, p);
        self.progress = p;
      }
    }
  };

  transfer.download(
    url,
    path,

    function(entry) {
      self.onDownloadSuccess(entry);
    },

    function(err) {
      self.onDownloadFailed(err);
    },

    false,
    this.options || {}
  );

  var prevProgress = this.progress;
  // FIXME: more intelligent way?
  setTimeout(function() {
    if (self.status === Downloader.STATUS_DOWNLOADING &&
      self.progress === prevProgress) {
        transfer.abort();
      }
  }, Downloader.TIMEOUT_MS);
};

Downloader.prototype.dispose = function() {
  this.removeAllListeners(Downloader.EVENT_STARTED);
  this.removeAllListeners(Downloader.EVENT_PROGRESS);
  this.removeAllListeners(Downloader.EVENT_SUCCESS);
  this.removeAllListeners(Downloader.EVENT_FAILED);
};

Downloader.prototype.addStartListener = function(fn, context) {
  this.once(Downloader.EVENT_STARTED, fn, context);
};

Downloader.prototype.addProgressListener = function(fn, context) {
  this.on(Downloader.EVENT_PROGRESS, fn, context);
};

Downloader.prototype.addSuccessListener = function(fn, context) {
  this.once(Downloader.EVENT_SUCCESS, fn, context);
};

Downloader.prototype.addFailListener = function(fn, context) {
  this.once(Downloader.EVENT_FAILED, fn, context);
};

Downloader.prototype.onDownloadSuccess = function(entry) {
  if (this.D) console.log(this.TAG, 'onDownloadSuccess', JSON.stringify(entry));

  this.saveDownloadInfo();
  this.status = Downloader.STATUS_DOWNLOADED;
  this.emit(Downloader.EVENT_SUCCESS);
  this.dispose();
};

Downloader.prototype.onDownloadFailed = function(err) {
  if (this.D) console.warn(this.TAG, 'onDownloadFailed', json.stringify(err));

  this.status = Downloader.STATUS_DOWNLOAD_FAILED;
  this.emit(Downloader.EVENT_FAILED);
  this.dispose();
};

Downloader.prototype.saveDownloadInfo = function() {
  var storage = window.localStorage;
  storage.setItem('download_' + btoa(this.url), true);
};

Downloader.prototype.getCachedDownloadInfo = function() {
  var storage = window.localStorage;
  return storage.getItem('download_' + btoa(this.url));
};

module.exports = Downloader;
