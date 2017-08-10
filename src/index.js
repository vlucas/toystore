'use strict';

const _get = require('lodash/get');
const _intersection = require('lodash/intersection');
const _set = require('lodash/set');
const _zipObject = require('lodash/zipObject');

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
   * @param {Array} paths
   * @return {Object} key/value pair of path => value
   */
  function getAll(paths) {
    if (paths === undefined) {
      return state;
    }

    let values = paths.map(get);

    return _zipObject(paths, values);
  }

  /**
   * Notify/update watcher functions for given paths
   *
   * @param {Array} paths
   */
  function notifyWatchersOnPaths(paths) {
    watchers.map(watcher => {
      let hasPath = _intersection(paths, watcher.paths).length > 0;

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
    setSilent(path, value);
    notifyWatchersOnPaths([path]);
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
   * @param {Array|String} String path or array of paths to watch
   * @param {Function} callback to execute when there are changes
   */
  function watch(path, callback) {
    watchers.push({
      callback,
      paths: (path instanceof Array) ? path : [path], // Ensure paths is always an array
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

module.exports = {
  create,
};
