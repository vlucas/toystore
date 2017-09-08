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
 * Create and return a new store instance
 *
 * @param {Object} Initial store state
 */
function create(defaultState = {}) {
  let state = defaultState;
  let watchers = [];

  /**
   * Get a store value by path/key
   *
   * @param {String} path
   * @return value
   */
  function get(path) {
    return _get(state, path);
  }

  /**
   * Get multiple path values from store
   *
   * @param {String[]} paths
   * @return {Object} key/value pair of path => value
   */
  function getAll(paths) {
    if (paths === undefined) {
      return state;
    }

    let values = paths.map(get);

    return zipObject(paths, values);
  }

  /**
   * Notify/update watcher functions for given paths
   *
   * @param {String[]} paths
   */
  function notifyWatchersOnPaths(paths) {
    let expandedPaths = _expandNestedPaths(paths);

    watchers.map(watcher => {
      let hasPath = intersect(expandedPaths, watcher.paths).length > 0;

      if (hasPath) {
        watcher.callback(getAll(paths));
      }
    });
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
      let oldKeys = _deepKeys(get(path), path);
      let removedKeys;

      paths = _deepKeys(value, path);
      removedKeys = difference(oldKeys, paths);

      // If keys were removed in set, we need to notify those watchers
      if (removedKeys.length > 0) {
        paths = paths.concat(removedKeys);
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
   * @param {Object} newState
   * @return null
   */
  function reset(newState) {
    state = newState;
  }

  /**
   * Watch for changes on a given key, and execute the provided callback when there are changes
   *
   * @param {String[]|String} String path or array of paths to watch
   * @param {Function} callback to execute when there are changes
   */
  function watch(paths, callback) {
    paths = _pathsArray(paths);

    watchers.push({
      callback,
      paths,
    });
  }

  /**
   * Clear/remove specific watcher by callback function
   */
  function unwatch(callback) {
    let index = watchers.findIndex(w => w.callback === callback);

    if (index) {
      delete watchers[index];
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
    unwatch,
    unwatchAll,
  }
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

    if (typeof value === 'object') {
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

module.exports = {
  create,
};
