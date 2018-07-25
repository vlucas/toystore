(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _get = require('just-safe-get');
var _set = require('just-safe-set');
var difference = require('difference');
var intersect = require('just-intersect');

/**
 * Create object with provided arrays of keys and values
 *
 * @param {String[]} keys
 * @param {Array} values
 */
function zipObject(keys, values) {
  return keys.reduce(function (object, currentValue, currentIndex) {
    object[currentValue] = values[currentIndex];

    return object;
  }, {});
}

/**
 * Generate random string
 *
 * @param {Number} length
 */
function randomString(length) {
  return (+new Date() * Math.random()).toString(36).substring(0, length || 12);
}

/**
 * Create and return a new store instance
 *
 * @param {Object} Initial store state
 */
function create() {
  var defaultState = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var state = clone(defaultState);
  var watchers = [];

  /**
   * Get a store value by path/key
   *
   * @param {String} path
   * @throws Error when specified store key is not found
   * @return value
   */
  function get(path) {
    var value = _get(state, path);

    if (value === undefined) {
      throw new Error('[toystore] Requested store key "' + path + '" was not found in store.');
    }

    return clone(value);
  }

  /**
   * Get multiple path values from store
   *
   * @param {String[]} paths
   * @return {Object} key/value pair of path => value
   */
  function getAll(paths) {
    if (paths === undefined) {
      return clone(state);
    }

    if (!paths instanceof Array) {
      throw new Error('[toystore] getAll() argument "paths" must be an array.');
    }

    var values = paths.map(get);

    return zipObject(paths, values);
  }

  /**
   * Get a store value by path/key
   *
   * @param {String} path
   * @return value
   */
  function getSilent(path) {
    return _get(state, path);
  }

  /**
   * Run all watchers with new/current values
   */
  function notifyAllWatchers() {
    watchers.map(function _notifyWatcher(watcher) {
      var watchedKeyValues = {};
      try {
        watchedKeyValues = getAll(watcher.paths);
      } catch (e) {}

      watcher.callback(watchedKeyValues);
    });
  }

  /**
   * Notify/update watcher functions for given paths
   *
   * @param {String[]} paths
   */
  function notifyWatchersOnPaths(paths) {
    var expandedPaths = _expandNestedPaths(paths);

    watchers.map(function _notifyWatcher(watcher) {
      var hasPath = intersect(expandedPaths, watcher.paths).length > 0;

      if (hasPath) {
        var watchedKeyValues = {};
        try {
          watchedKeyValues = getAll(paths);
        } catch (e) {}

        if (watcher.options.async !== false) {
          setTimeout(function () {
            watcher.callback(watchedKeyValues);
          }, watcher.options.async || 0);
        } else {
          watcher.callback(watchedKeyValues);
        }
      }
    });

    if (paths !== '*') {
      notifyGlobalWatchers();
    }
  }

  /**
   * Notify/update global watchers
   */
  function notifyGlobalWatchers() {
    notifyWatchersOnPaths('*');
  }

  /**
   * Set a store value at path/key to given value
   *
   * @param {String} path
   * @param {mixed} value
   * @param {Boolean} value
   * @return null
   */
  function set(path, value) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    var paths = _pathsArray(path);
    var existingValue = void 0;

    // If using options.compare = true.  JSON.strigify compare the two sets of data.
    // If they are exactly the same, abort the update.
    if (options.compare) {
      existingValue = getSilent(path);

      if (JSON.stringify(value) === JSON.stringify(existingValue)) {
        return;
      }
    }

    // Get all paths to notify for updates if given an object
    if (_isObject(value) === true) {
      existingValue = existingValue || getSilent(path);

      // If previous value was also an object, we need to see which keys have
      // changed to notify watchers on those keys
      if (_isObject(existingValue)) {

        var oldKeys = _deepKeys(existingValue, path);
        var removedKeys = void 0;

        paths = _deepKeys(value, path);
        removedKeys = difference(oldKeys, paths);

        // If keys were removed in set, we need to notify those watchers
        if (removedKeys.length > 0) {
          paths = paths.concat(removedKeys);
        }
      }
    }

    setSilent(path, value);
    notifyWatchersOnPaths(paths);
  }

  /**
   * Set a store value at path/key to given value WITHOUT notifying watchers
   *
   * @param {String} path
   * @param {mixed} value
   * @return null
   */
  function setSilent(path, value) {
    // Cannot set things that can't be serialized
    var valueType = typeof value === 'undefined' ? 'undefined' : _typeof(value);

    if (valueType === 'function') {
      throw new Error('[toystore] Cannot set "' + path + '" with value type "' + valueType + '". All store values must be serializable.');
    }

    // Setting 'undefined' on an object key here will remove it from the store,
    // so we switch it to null. Removing keys should only be done with 'unset'.
    if (value === undefined) {
      value = null;
    }

    _set(state, path, value);
  }

  /**
   * Set multiple paths with given values to the store
   *
   * @param {Object} key/value pair of path => value
   * @return null
   */
  function setAll(obj) {
    var paths = Object.keys(obj);

    paths.map(function (path) {
      return setSilent(path, obj[path]);
    });
    notifyWatchersOnPaths(paths);
  }

  /**
   * Reset the whole state object to provided one
   *
   * @param {Object} newState (optional) - Will reset to first provided state if none provided
   * @return null
   */
  function reset(newState) {
    state = clone(newState || defaultState);

    notifyAllWatchers();
  }

  /**
   * Watch for changes on a given key, and execute the provided callback when there are changes
   *
   * @param {String[]|String} String path or array of paths to watch
   * @param {Function} callback to execute when there are changes
   * @param {Object} options Options
   * @param {Boolean} options.async Callback execution is async (in next cycle) or sync (as soon as the key changes)
   * @param {Number} options.priority Controls the order the provided callback is called when multiple watches exist on the same key.
   * @return {String} id of watcher (useful for unwatch())
   */
  function watch(paths, callback) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    paths = paths === '*' ? paths : _pathsArray(paths);
    var id = randomString();
    var defaultOptions = { async: false, priority: 0 };

    options = Object.assign({}, defaultOptions, options);

    watchers.push({
      callback: callback,
      id: id,
      options: options,
      paths: paths
    });

    watchers = watchers.sort(_sortByPriority);

    return id;
  }

  /**
   * Watch ALL keys, and execute the provided callback on any and every key change
   */
  function watchAll(callback, options) {
    return watch('*', callback, options);
  }

  /**
   * Watch for changes on a given key once, and execute the provided callback
   * when there are changes. Callback removes itself after the first call so
   * that it is never called again.
   *
   * @param {String[]|String} String path or array of paths to watch
   * @param {Function} callback to execute when there are changes
   * @param {Object} options Options
   * @param {Number} options.priority Controls the order the provided callback is called when multiple watches exist on the same key.
   */
  function watchOnce(paths, callback) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : { priority: 0 };

    var id = void 0;
    var onceCallback = function _watchOnceCallback() {
      unwatch(id);
      callback.apply(undefined, arguments);
    };

    id = watch(paths, onceCallback, options);
  }

  /**
   * Remove key
   */
  function unset(path) {
    _set(state, path, undefined);
  }

  /**
   * Clear/remove specific watcher by id or callback function
   *
   * @param {String|Function} id - String id (returned from watch() or callback function)
   */
  function unwatch(id) {
    var type = typeof id === 'undefined' ? 'undefined' : _typeof(id);
    var index = watchers.findIndex(function _matchWatcher(watcher) {
      return watcher && (type === 'string' ? watcher.id === id : watcher.callback === id);
    });

    if (index !== -1) {
      // We can't delete the last watcher...
      if (watchers.length === 1) {
        unwatchAll();
      } else {
        delete watchers[index];
      }
    }
  }

  /**
   * Clear/remove all watchers
   */
  function unwatchAll() {
    watchers = [];
  }

  // Public API
  return {
    get: get,
    getAll: getAll,
    reset: reset,
    set: set,
    setAll: setAll,
    setSilent: setSilent,
    watch: watch,
    watchAll: watchAll,
    watchOnce: watchOnce,
    unset: unset,
    unwatch: unwatch,
    unwatchAll: unwatchAll
  };
}

function _sortByPriority(a, b) {
  return b.options.priority - a.options.priority;
}

// Ensure paths is always an array
function _pathsArray(paths) {
  return paths instanceof Array ? paths : [paths];
}

/**
 * Expand nested path syntax to include root paths as well. Mainly used for
 * notifications on key updates, so updates on nested keys will notify root
 * key, and vice-versa.
 *
 * Ex: 'user.email' => ['user', 'user.email']
 *
 * @param {String|String[]} paths
 */
function _expandNestedPaths(paths) {
  var expandedPaths = [];

  _pathsArray(paths).forEach(function (p) {
    if (p.indexOf('.') !== -1) {
      var pathsWithRoots = p.split('.').map(function (value, index, array) {
        return array.slice(0, index + 1).join('.');
      });

      expandedPaths = expandedPaths.concat(pathsWithRoots);
    } else {
      expandedPaths.push(p);
    }
  });

  return expandedPaths;
}

/**
 * Get all keys for the given object recursively
 *
 * Ex: { user: { email: 'foo@bar.com', id: 2 } } => ['user.email', 'user.id']
 */
function _deepKeys(obj) {
  var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

  return Object.keys(obj).reduce(function (acc, key) {
    var value = obj[key];

    if (_isObject(value)) {
      acc.push.apply(acc, _deepKeys(value, prefix ? prefix + '.' + key : key));
    } else {
      acc.push(prefix ? prefix + '.' + key : key);
    }

    return acc;
  }, []);
}

/**
 * Ensure value is not an object
 */
function _isObject(testVar) {
  return testVar instanceof Object && !Array.isArray(testVar) && testVar !== null;
}

/**
 * Deep clone object to break references
 */
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

module.exports = {
  create: create
};

},{"difference":2,"just-intersect":3,"just-safe-get":4,"just-safe-set":5}],2:[function(require,module,exports){


var Difference = module.exports = function difference(a, b) {
    if (b.length > a.length) {
        var tmp = a;
        a = b;
        b = tmp;
    }

    var o_a = {};
    var o_b = {};

    for (var i = 0; i < a.length; i += 1) {
        o_a[a[i]] = a[i];
    }

    for (var i = 0; i < b.length; i += 1) {
        o_b[b[i]] = b[i];
    }


    var result = [];
    for (var key in o_b) {
        if (o_a[key] === undefined) result.push(o_b[key]);
    }
    for (var key in o_a) {
        if (o_b[key] === undefined) result.push(o_a[key]);
    }
    return result;
}
},{}],3:[function(require,module,exports){
module.exports = intersect;

/*
  intersect([1, 2, 5, 6], [2, 3, 5, 6]); // [2, 5, 6]
*/

function intersect(arr1, arr2) {
  var result = [];
  var len = arr1.length;
  for (var i = 0; i < len; i++) {
    var elem = arr1[i];
    if (arr2.indexOf(elem) > -1) {
      result.push(elem);
    }
  }
  return result;
}

},{}],4:[function(require,module,exports){
module.exports = get;

/*
  const obj = {a: {aa: {aaa: 2}}, b: 4};

  get(obj, 'a.aa.aaa'); // 2
  get(obj, ['a', 'aa', 'aaa']); // 2

  get(obj, 'b.bb.bbb'); // undefined
  get(obj, ['b', 'bb', 'bbb']); // undefined

  get(obj.a, 'aa.aaa'); // 2
  get(obj.a, ['aa', 'aaa']); // 2

  get(obj.b, 'bb.bbb'); // undefined
  get(obj.b, ['bb', 'bbb']); // undefined

  const obj = {a: {}};
  const sym = Symbol();
  obj.a[sym] = 4;
  get(obj.a, sym); // 4
*/

function get(obj, props) {
  if (typeof props == 'string') {
    props = props.split('.');
  }
  if (typeof props == 'symbol') {
    props = [props];
  }
  var prop;
  while ((prop = props.shift())) {
    obj = obj[prop];
    if (!obj) {
      return obj;
    }
  }
  return obj;
}

},{}],5:[function(require,module,exports){
module.exports = set;

/*
  var obj1 = {};
  set(obj1, 'a.aa.aaa', 4}); // true
  obj1; // {a: {aa: {aaa: 4}}}

  var obj2 = {};
  set(obj2, [a, aa, aaa], 4}); // true
  obj2; // {a: {aa: {aaa: 4}}}

  var obj3 = {a: {aa: {aaa: 2}}};
  set(obj3, 'a.aa.aaa', 3); // true
  obj3; // {a: {aa: {aaa: 3}}}

  var obj4 = {a: {aa: {aaa: 2}}};
  set(obj4, 'a.aa', {bbb: 7}); // true
  obj4; // {a: {aa: {bbb: 7}}}

  const obj5 = {a: {}};
  const sym = Symbol();
  set(obj5.a, sym, 7); // true
  obj5; // {a: {Symbol(): 7}}
*/

function set(obj, props, value) {
  if (typeof props == 'string') {
    props = props.split('.');
  }
  if (typeof props == 'symbol') {
    props = [props];
  }
  var lastProp = props.pop();
  if (!lastProp) {
    return false;
  }
  var thisProp;
  while ((thisProp = props.shift())) {
    if (!obj[thisProp]) {
      obj[thisProp] = {};
    }
    obj = obj[thisProp];
  }
  obj[lastProp] = value;
  return true;
}

},{}]},{},[1]);
