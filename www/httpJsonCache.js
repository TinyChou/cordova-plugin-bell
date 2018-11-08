var HttpJsonCache = function() {
  this.storage = window.localStorage;
};

HttpJsonCache.KEY_PREFIX = 'http_';
HttpJsonCache.EXPIRED_TIME = 24 * 60 * 60 * 1000; // one day
HttpJsonCache.prototype.D = true;
HttpJsonCache.prototype.TAG = 'HttpJsonCache';

HttpJsonCache.prototype.getCachedJsonByUrl = function(url) {
  if (!url) return;

  var key = btoa(url);
  var cached = JSON.parse(this.storage.getItem(HttpJsonCache.KEY_PREFIX + key));
  if (!cached || !cached.timestamp) return;

  var now = new Date().getTime();
  if (now - cached.timestamp < HttpJsonCache.EXPIRED_TIME) {
    if (this.D) console.log(this.TAG, 'Cache hit!', key);
    return cached.data;
  } else {
    this.storage.removeItem(HttpJsonCache.KEY_PREFIX + key);
  }
};

HttpJsonCache.prototype.cacheJsonWithUrl = function(url, json) {
  if (!url || !json) return;

  var key = btoa(url);
  var obj = {
    timestamp: new Date().getTime(),
    data: json
  };
  var str = JSON.stringify(obj);
  this.storage.setItem(HttpJsonCache.KEY_PREFIX + key,
    str);
  if (this.D) console.log(this.TAG, 'Cache ', HttpJsonCache.KEY_PREFIX + key,
    str);
};

module.exports = HttpJsonCache;
