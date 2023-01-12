'use strict';

/**
 * Module dependencies.
 */

var each = require('component-each');
var integration = require('@segment/analytics.js-integration');
var is = require('is');
var extend = require('@ndhoule/extend');
var tick = require('next-tick');
var toISOString = require('@segment/to-iso-string');
var toString = Object.prototype.toString; // in case this method has been overridden by the user


/**
 * Expose `ReplayBird` integration.
 */

var ReplayBird = (module.exports = integration('ReplayBird')
  .global('replaybird')
  .option('siteKey', ''));


/**
 * Initialize.
 *
 * http://www.replaybird.com
 */

ReplayBird.prototype.initialize = function() {
  var self = this;
  this.load(function() {
    tick(self.ready);
  });
};


/**
 * Load
 *
 * @api private
 * @param {Function} callback
 */

ReplayBird.prototype.load = function(callback) {
  /* eslint-disable */
  !function(t,e){var o,n,p,r;e.__SV||(window.replaybird=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src="https://cdn.replaybird.com/agent/latest/replaybird.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="replaybird",u.people=u.people||[],u.toString=function(t){var e="replaybird";return"replaybird"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="identify capture alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.replaybird||[]);
  /* eslint-enable */

  window.replaybird.init(this.options.siteKey, {});
  callback();
};


/**
 * Loaded
 *
 * @return {Boolean}
 */

ReplayBird.prototype.loaded = function() {
  return !!(window.replaybird && window.replaybird.init);
};


/**
 * Identify.
 *
 * @param {Identify} identify
 */

ReplayBird.prototype.identify = function(identify) {
  var id = identify.userId();
  var traits = identify.traits();

  if (identify.name()) traits.name = identify.name();

  if (id) {
      window.replaybird.identify(id, clean(traits));
  }
};


/**
 * Track.
 *
 * @param {Track} track
 */

ReplayBird.prototype.track = function(track) {
  window.replaybird.capture(track.event(), clean(track.properties()));
};

ReplayBird.prototype.capture = ReplayBird.prototype.track;


/**
 * Clean all nested objects and arrays.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function clean(obj) {
  var ret = {};

  for (var k in obj) {
    if (obj.hasOwnProperty(k)) {
      var value = obj[k];
      // ReplayBird's natively library will drop null and undefined properties anyway
      // so no need to send these
      // also prevents uncaught errors since we call .toString() on non objects
      if (value === null || value === undefined) continue;

      // date
      if (is.date(value)) {
        ret[k] = toISOString(value);
        continue;
      }

      // leave boolean as is
      if (is.bool(value)) {
        ret[k] = value;
        continue;
      }

      // leave  numbers as is
      if (is.number(value)) {
        ret[k] = value;
        continue;
      }

      // arrays of objects (eg. `products` array)
      if (toString.call(value) === '[object Array]') {
        ret = extend(ret, trample(k, value));
        continue;
      }

      // non objects
      if (toString.call(value) !== '[object Object]') {
        ret[k] = value.toString();
        continue;
      }

      ret = extend(ret, trample(k, value));
    }
  }
  // json
  // must flatten including the name of the original trait/property
  function trample(key, value) {
    var nestedObj = {};
    nestedObj[key] = value;
    var flattenedObj = flatten(nestedObj, { safe: true });

    // stringify arrays inside nested object to be consistent with top level behavior of arrays
    for (var k in flattenedObj) {
      if (is.array(flattenedObj[k]))
        flattenedObj[k] = JSON.stringify(flattenedObj[k]);
    }

    return flattenedObj;
  }

  return ret;
}
