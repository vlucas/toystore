"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

(function e(t, n, r) {
  function s(o, u) {
    if (!n[o]) {
      if (!t[o]) {
        var a = typeof require == "function" && require;if (!u && a) return a(o, !0);if (i) return i(o, !0);var f = new Error("Cannot find module '" + o + "'");throw f.code = "MODULE_NOT_FOUND", f;
      }var l = n[o] = { exports: {} };t[o][0].call(l.exports, function (e) {
        var n = t[o][1][e];return s(n ? n : e);
      }, l, l.exports, e, t, n, r);
    }return n[o].exports;
  }var i = typeof require == "function" && require;for (var o = 0; o < r.length; o++) {
    s(r[o]);
  }return s;
})({ 1: [function (require, module, exports) {

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
    };
  }, {}], 2: [function (require, module, exports) {
    'use strict';

    var isObj = require('is-obj');

    function getPathSegments(path) {
      var pathArr = path.split('.');
      var parts = [];

      for (var i = 0; i < pathArr.length; i++) {
        var p = pathArr[i];

        while (p[p.length - 1] === '\\' && pathArr[i + 1] !== undefined) {
          p = p.slice(0, -1) + '.';
          p += pathArr[++i];
        }

        parts.push(p);
      }

      return parts;
    }

    module.exports = {
      get: function get(obj, path, value) {
        if (!isObj(obj) || typeof path !== 'string') {
          return value === undefined ? obj : value;
        }

        var pathArr = getPathSegments(path);

        for (var i = 0; i < pathArr.length; i++) {
          if (!Object.prototype.propertyIsEnumerable.call(obj, pathArr[i])) {
            return value;
          }

          obj = obj[pathArr[i]];

          if (obj === undefined || obj === null) {
            // `obj` is either `undefined` or `null` so we want to stop the loop, and
            // if this is not the last bit of the path, and
            // if it did't return `undefined`
            // it would return `null` if `obj` is `null`
            // but we want `get({foo: null}, 'foo.bar')` to equal `undefined`, or the supplied value, not `null`
            if (i !== pathArr.length - 1) {
              return value;
            }

            break;
          }
        }

        return obj;
      },
      set: function set(obj, path, value) {
        if (!isObj(obj) || typeof path !== 'string') {
          return obj;
        }

        var root = obj;
        var pathArr = getPathSegments(path);

        for (var i = 0; i < pathArr.length; i++) {
          var p = pathArr[i];

          if (!isObj(obj[p])) {
            obj[p] = {};
          }

          if (i === pathArr.length - 1) {
            obj[p] = value;
          }

          obj = obj[p];
        }

        return root;
      },
      delete: function _delete(obj, path) {
        if (!isObj(obj) || typeof path !== 'string') {
          return;
        }

        var pathArr = getPathSegments(path);

        for (var i = 0; i < pathArr.length; i++) {
          var p = pathArr[i];

          if (i === pathArr.length - 1) {
            delete obj[p];
            return;
          }

          obj = obj[p];

          if (!isObj(obj)) {
            return;
          }
        }
      },
      has: function has(obj, path) {
        if (!isObj(obj) || typeof path !== 'string') {
          return false;
        }

        var pathArr = getPathSegments(path);

        for (var i = 0; i < pathArr.length; i++) {
          if (isObj(obj)) {
            if (!(pathArr[i] in obj)) {
              return false;
            }

            obj = obj[pathArr[i]];
          } else {
            return false;
          }
        }

        return true;
      }
    };
  }, { "is-obj": 4 }], 3: [function (require, module, exports) {
    module.exports = intersect;

    function many(sets) {
      var o = {};
      var l = sets.length - 1;
      var first = sets[0];
      var last = sets[l];

      for (var i in first) {
        o[first[i]] = 0;
      }for (var i = 1; i <= l; i++) {
        var row = sets[i];
        for (var j in row) {
          var key = row[j];
          if (o[key] === i - 1) o[key] = i;
        }
      }

      var a = [];
      for (var i in last) {
        var key = last[i];
        if (o[key] === l) a.push(key);
      }

      return a;
    }

    function intersect(a, b) {
      if (!b) return many(a);

      var res = [];
      for (var i = 0; i < a.length; i++) {
        if (indexOf(b, a[i]) > -1) res.push(a[i]);
      }
      return res;
    }

    intersect.big = function (a, b) {
      if (!b) return many(a);

      var ret = [];
      var temp = {};

      for (var i = 0; i < b.length; i++) {
        temp[b[i]] = true;
      }
      for (var i = 0; i < a.length; i++) {
        if (temp[a[i]]) ret.push(a[i]);
      }

      return ret;
    };

    function indexOf(arr, el) {
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] === el) return i;
      }
      return -1;
    }
  }, {}], 4: [function (require, module, exports) {
    'use strict';

    module.exports = function (x) {
      var type = typeof x === "undefined" ? "undefined" : _typeof(x);
      return x !== null && (type === 'object' || type === 'function');
    };
  }, {}], 5: [function (require, module, exports) {
    /**
     * lodash 4.1.3 (Custom Build) <https://lodash.com/>
     * Build: `lodash modularize exports="npm" -o ./`
     * Copyright jQuery Foundation and other contributors <https://jquery.org/>
     * Released under MIT license <https://lodash.com/license>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     */

    /** Used for built-in method references. */
    var objectProto = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty = objectProto.hasOwnProperty;

    /**
     * Assigns `value` to `key` of `object` if the existing value is not equivalent
     * using [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
     * for equality comparisons.
     *
     * @private
     * @param {Object} object The object to modify.
     * @param {string} key The key of the property to assign.
     * @param {*} value The value to assign.
     */
    function assignValue(object, key, value) {
      var objValue = object[key];
      if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) || value === undefined && !(key in object)) {
        object[key] = value;
      }
    }

    /**
     * This base implementation of `_.zipObject` which assigns values using `assignFunc`.
     *
     * @private
     * @param {Array} props The property identifiers.
     * @param {Array} values The property values.
     * @param {Function} assignFunc The function to assign values.
     * @returns {Object} Returns the new object.
     */
    function baseZipObject(props, values, assignFunc) {
      var index = -1,
          length = props.length,
          valsLength = values.length,
          result = {};

      while (++index < length) {
        var value = index < valsLength ? values[index] : undefined;
        assignFunc(result, props[index], value);
      }
      return result;
    }

    /**
     * This method is like `_.fromPairs` except that it accepts two arrays,
     * one of property identifiers and one of corresponding values.
     *
     * @static
     * @memberOf _
     * @since 0.4.0
     * @category Array
     * @param {Array} [props=[]] The property identifiers.
     * @param {Array} [values=[]] The property values.
     * @returns {Object} Returns the new object.
     * @example
     *
     * _.zipObject(['a', 'b'], [1, 2]);
     * // => { 'a': 1, 'b': 2 }
     */
    function zipObject(props, values) {
      return baseZipObject(props || [], values || [], assignValue);
    }

    /**
     * Performs a
     * [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
     * comparison between two values to determine if they are equivalent.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'user': 'fred' };
     * var other = { 'user': 'fred' };
     *
     * _.eq(object, object);
     * // => true
     *
     * _.eq(object, other);
     * // => false
     *
     * _.eq('a', 'a');
     * // => true
     *
     * _.eq('a', Object('a'));
     * // => false
     *
     * _.eq(NaN, NaN);
     * // => true
     */
    function eq(value, other) {
      return value === other || value !== value && other !== other;
    }

    module.exports = zipObject;
  }, {}], 6: [function (require, module, exports) {
    'use strict';

    var dotProp = require('dot-prop');
    var difference = require('difference');
    var intersect = require('intersect');
    var zipObject = require('lodash.zipobject');

    function create() {
      var defaultState = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var state = defaultState;
      var watchers = [];

      /**
       * Get a store value by path/key
       *
       * @param {String} path
       * @return value
       */
      function get(path) {
        return dotProp.get(state, path);
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

        var values = paths.map(get);

        return zipObject(paths, values);
      }

      /**
       * Notify/update watcher functions for given paths
       *
       * @param {Array} paths
       */
      function notifyWatchersOnPaths(paths) {
        var expandedPaths = _expandNestedPaths(paths);

        watchers.map(function (watcher) {
          var hasPath = intersect(expandedPaths, watcher.paths).length > 0;

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
        var paths = _pathsArray(path);

        // Get all paths to notify for updates if given an object
        if ((typeof value === "undefined" ? "undefined" : _typeof(value)) === 'object') {
          var oldKeys = _deepKeys(get(path), path);
          var removedKeys = void 0;

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
        dotProp.set(state, path, value);
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
      function watch(paths, callback) {
        paths = _pathsArray(paths);

        watchers.push({
          callback: callback,
          paths: paths
        });
      }

      /**
       * Clear/remove specific watcher by callback function
       */
      function unwatch(callback) {
        var index = watchers.findIndex(function (w) {
          return w.callback === callback;
        });

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
        get: get,
        getAll: getAll,
        reset: reset,
        set: set,
        setAll: setAll,
        setSilent: setSilent,
        watch: watch,
        unwatch: unwatch,
        unwatchAll: unwatchAll
      };
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

        if ((typeof value === "undefined" ? "undefined" : _typeof(value)) === 'object') {
          acc.push.apply(acc, _deepKeys(value, prefix ? prefix + '.' + key : key));
        } else {
          acc.push(prefix ? prefix + '.' + key : key);
        }

        return acc;
      }, []);
    }

    module.exports = {
      create: create
    };
  }, { "difference": 1, "dot-prop": 2, "intersect": 3, "lodash.zipobject": 5 }] }, {}, [6]);
