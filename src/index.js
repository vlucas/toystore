'use strict';

const _get = require('just-safe-get');
const _set = require('just-safe-set');
const difference = require('difference');
const intersect = require('just-intersect');

/**
 * Create object with provided arrays of keys and values
 *
 * @param {String[]} keys
 * @param {Array} values
 */
function zipObject(keys, values) {
  return keys.reduce(function(object, currentValue, currentIndex) {
    object[currentValue] = values[currentIndex];

    return object;
  }, {});
}

/**
 * Generate random string
 */
function randomString(length) {
  return (+new Date * Math.random()).toString(36).substring(0, length || 12);
}


/**
 * Create and return a new store instance
 *
 * @param {Object} Initial store state
 */
function create(defaultState = {}) {
  let state = clone(defaultState);
  let watchers = [];

  /**
   * Get a store value by path/key
   *
   * @param {String} path
   * @throws Error when specified store key is not found
   * @return value
   */
  function get(path) {
    let value = _get(state, path);

    if (value === undefined) {
      throw new Error('[toystore] Requested store key "' + path + '" was not found in store.');
    }

    // Clone objects and arrays to prevent mutation
    if (typeof value === 'object' && value !== null) {
      value = clone(value);
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

    let values = paths.map(get);

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
      let watchedKeyValues = {};
      try {
        watchedKeyValues = getAll(watcher.paths);
      } catch (e) { }

      watcher.callback(watchedKeyValues);
    });
  }

  /**
   * Notify/update watcher functions for given paths
   *
   * @param {String[]} paths
   */
  function notifyWatchersOnPaths(paths) {
    let expandedPaths = _expandNestedPaths(paths);

    watchers.map(function _notifyWatcher(watcher) {
      let hasPath = intersect(expandedPaths, watcher.paths).length > 0;

      if (hasPath) {
        let watchedKeyValues = {};
        try {
          watchedKeyValues = getAll(paths);
        } catch (e) { }

        watcher.callback(watchedKeyValues);
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
   * @return null
   */
  function set(path, value) {
    let paths = _pathsArray(path);

    // Get all paths to notify for updates if given an object
    if (_isObject(value) === true) {
      let existingValue = getSilent(path);

      // If previous value was also an object, we need to see which keys have
      // changed to notify watchers on those keys
      if (_isObject(existingValue)) {
        let oldKeys = _deepKeys(existingValue, path);
        let removedKeys;

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
    let valueType = typeof value;

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
    let paths = Object.keys(obj);

    paths.map(path => setSilent(path, obj[path]));
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
   * @param {Number} options.priority Controls the order the provided callback is called when multiple watches exist on the same key.
   * @return {String} id of watcher (useful for unwatch())
   */
  function watch(paths, callback, options = { priority: 0 }) {
    paths = paths === '*' ? paths : _pathsArray(paths);
    let id = randomString();

    watchers.push({
      callback,
      id,
      options,
      paths,
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
  function watchOnce(paths, callback, options = { priority: 0 }) {
    let id;
    let onceCallback = function _watchOnceCallback(...args) {
      unwatch(id);
      callback(...args);
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
    let type = typeof id;
    let index = watchers.findIndex(function _matchWatcher(watcher) {
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
    get,
    getAll,
    reset,
    set,
    setAll,
    setSilent,
    watch,
    watchAll,
    watchOnce,
    unset,
    unwatch,
    unwatchAll,
  }
}

function _sortByPriority(a, b) {
  return b.options.priority - a.options.priority;
}

// Ensure paths is always an array
function _pathsArray(paths) {
  return (paths instanceof Array) ? paths : [paths];
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
  let expandedPaths = [];

  _pathsArray(paths).forEach(p => {
    if (p.indexOf('.') !== -1) {
      let pathsWithRoots = p.split('.').map((value, index, array) => array.slice(0, index+1).join('.'));

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
function _deepKeys(obj, prefix = null) {
  return Object.keys(obj).reduce(function(acc, key){
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
  create,
};
