'use strict';

const toystore = require('../src/index');

let store;
let storeDefaults = {
  books: [],
  foo: 'bar',
  nullValue: null,
  themeSettings: null,
  user: {
    email: 'user@example.com',
    id: 1,
  },
};

describe('store', () => {
  beforeEach(() => {
    store = toystore.create(storeDefaults);
  });

  describe('get', () => {
    it('should get the desired value at the top level', () => {
      let actual = store.get('foo');
      let expected = 'bar';

      expect(actual).toBe(expected);
    });

    it('should get the desired value for a nested key', () => {
      let actual = store.get('user.id');
      let expected = 1;

      expect(actual).toBe(expected);
    });

    it('should be able to get null value', () => {
      let actual = store.get('nullValue');
      let expected = null;

      expect(actual).toBe(expected);
    });

    it('should throw exception for key that is not known', () => {
      expect(() => {
        let actual = store.get('keyNotSet');
      }).toThrow(new Error('[toystore] Requested store key "keyNotSet" was not found in store.'));
    });

    it('should return an immutable object reference', () => {
      let user = store.get('user');

      user.id = 42; // should not change value for next call

      let actual = store.get('user.id');
      let expected = 1;

      expect(actual).toBe(expected);
    });

    it('should return an immutable array reference', () => {
      let books = store.get('books');

      // should not change value for next call
      books.push('Bible');

      let actual = store.get('books');
      let expected = [];

      expect(actual).toEqual(expected);
    });

    it('should return an immutable value reference', () => {
      let nullValue = store.get('nullValue');

      // should not change value for next call
      nullValue = false;

      let actual = store.get('nullValue');
      let expected = null;

      expect(actual).toEqual(expected);
    });
  });

  describe('getAll', () => {
    it('should get all the desired values with key paths', () => {
      let actual = store.getAll(['foo', 'user.email']);
      let expected = {
        'foo': 'bar',
        'user.email': 'user@example.com',
      };

      expect(actual).toEqual(expected);
    });

    it('should return the whole store with no arguments', () => {
      let actual = store.getAll();

      expect(actual).toEqual(storeDefaults);
    });

    it('should return an immutable object reference by key', () => {
      let values = store.getAll(['user']);

      values.user.id = 42; // should not change value for next call

      let actual = store.get('user.id');
      let expected = 1;

      expect(actual).toBe(expected);
    });

    it('should return an immutable store when given no paths', () => {
      let values = store.getAll();

      values.user.id = 42; // should not change value for next call

      let actual = store.get('user.id');
      let expected = 1;

      expect(actual).toBe(expected);
    });
  });

  describe('reset', () => {
    it('should reset store to initial value with no arguments', () => {
      store.set('foo', 'baz');
      store.reset();

      let actual = store.get('foo');
      let expected = 'bar';

      expect(actual).toBe(expected);
    });

    it('should reset store to initial value with no arguments and nested key', () => {
      store.set('user.id', 42);
      store.reset();

      let actual = store.get('user.id');
      let expected = 1;

      expect(actual).toBe(expected);
    });

    it('should reset store to provided value when given', () => {
      store.set('foo', 'baz');
      store.reset({ foo: 'qux' });

      let actual = store.get('foo');
      let expected = 'qux';

      expect(actual).toBe(expected);
    });

    it('should reset store to provided value when given', () => {
      let renderCount = 0;

      // Setup watcher
      store.watch(['foo'], (newValue) => {

        if (renderCount === 0) {
          expect(newValue['foo']).toEqual('qux');
        } else {
          expect(newValue['foo']).toEqual('bar');
        }

        renderCount++;
      });
      store.set('foo', 'qux');

      store.reset(); // will trigger watchers

      let expected = 2;

      expect(renderCount).toBe(expected);
    });
  });

  describe('set', () => {
    it('should set the desired value at the top level', () => {
      store.set('foo', 'baz');

      let actual = store.get('foo');
      let expected = 'baz';

      expect(actual).toBe(expected);
    });

    it('should not set value or trigger watch if object is same as original and options.compare is true', () => {
      let count = 0;
      let options = { compare: true }

      store.watch(['food'], () => ++count);
      store.set('food', {test: 'original data'}, options);
      store.set('food', {test: 'original data'}, options);

      expect(count).toBe(1);
    });

    it('should not set value or trigger watch parent watcher if child values are the same as original and options.compare is true', () => {
      let count = 0;
      let options = { compare: true }

      store.watch(['food'], () => ++count);
      store.set('food', {test: 'original data'}, options);
      store.set('food.test', 'original data', options);

      expect(count).toBe(1);
    });

    it('should not set value or trigger watch if string is same as original and options.compare is true', () => {
      let count = 0;
      let options = { compare: true }

      store.watch(['food'], () => ++count);
      store.set('food', 'test', options);
      store.set('food', 'test', options);

      expect(count).toBe(1);
    });

    it('should not set value or trigger watch if boolean is same as original and options.compare is true', () => {
      let count = 0;
      let options = { compare: true }

      store.watch(['food'], () => ++count);
      store.set('food', true, options);
      store.set('food', true, options);

      expect(count).toBe(1);
    });

    it('should not set value or trigger watch if number is same as original and options.compare is true', () => {
      let count = 0;
      let options = { compare: true }

      store.watch(['food'], () => ++count);
      store.set('food', 123, options);
      store.set('food', 123, options);

      expect(count).toBe(1);
    });

    it('should not set value or trigger watch if array is same as original and options.compare is true', () => {
      let count = 0;
      let options = { compare: true }

      store.watch(['food'], () => ++count);
      store.set('food', [1, '2'], options);
      store.set('food', [1, '2'], options);

      expect(count).toBe(1);
    });

    it('should set value and trigger watch even if value is same as original, when options.compare is false', () => {
      let count = 0;
      let options = { compare: false }

      store.watch(['food'], () => ++count);
      store.set('food', {test: 'original data'}, options);
      store.set('food', {test: 'original data'}, options);

      expect(count).toBe(2);
    });

    it('should set value and trigger watch for parent watcher if chlid values are changed and options.compare is true', () => {
      let count = 0;
      let options = { compare: true }

      store.watch(['food'], () => ++count);
      store.set('food', {test: 'original data'}, options);
      store.set('food.test', 'newer data', options);

      expect(count).toBe(2);
    });

    it('should set value and trigger watch if object is changed and options.compare is true', () => {
      let count = 0;
      let options = { compare: true }

      store.watch(['food'], () => ++count);
      store.set('food', {test: 'original data'}, options);
      store.set('food', {test: 'data has changed'}, options);

      expect(count).toBe(2);
    });

    it('should set value and trigger watch if string is changed and options.compare is true', () => {
      let count = 0;
      let options = { compare: true }

      store.watch(['food'], () => ++count);
      store.set('food', 'test', options);
      store.set('food', 'new test', options);

      expect(count).toBe(2);
    });

    it('should set value and trigger watch if boolean is changed and options.compare is true', () => {
      let count = 0;
      let options = { compare: true }

      store.watch(['food'], () => ++count);
      store.set('food', true, options);
      store.set('food', false, options);

      expect(count).toBe(2);
    });

    it('should set value and trigger watch if number is changed and options.compare is true', () => {
      let count = 0;
      let options = { compare: true }

      store.watch(['food'], () => ++count);
      store.set('food', 123, options);
      store.set('food', 1234, options);

      expect(count).toBe(2);
    });

    it('should set value and trigger watch if array is changed and options.compare is true', () => {
      let count = 0;
      let options = { compare: true }

      store.watch(['food'], () => ++count);
      store.set('food', [1, 2], options);
      store.set('food', [1, '2'], options);

      expect(count).toBe(2);
    });

    it('should get the desired value for a nested key', () => {
      store.set('user.id', 2);

      let actual = store.get('user.id');
      let expected = 2;

      expect(actual).toBe(expected);
    });

    it('should be able to set null value', () => {
      store.set('nullValue', null);

      let actual = store.get('nullValue');
      let expected = null;

      expect(actual).toBe(expected);
    });

    it('should not unset key when set is called with undefined (should set it to null instead)', () => {
      store.set('foo', undefined);

      let actual = store.get('foo');
      let expected = null;

      expect(actual).toBe(expected);
    });

    it('should be able to set array value', () => {
      let books = [
        { title: 'One Book' },
        { title: 'Two Book' },
        { title: 'Red Book' },
        { title: 'Blue Book' },
      ];

      store.set('books', books);

      let actual = store.get('books');
      let expected = books;

      expect(actual[0]).toEqual(expected[0]);
    });

    it('should be able to set complex object', () => {
      let themeSettings = {
        "currentSettings": {
          "type": "Buffer",
            "data": [
              123,
              125
            ]
        }
      };

      store.set('themeSettings', themeSettings);

      let actual = store.get('themeSettings');
      let expected = themeSettings;

      expect(actual).toEqual(expected);
    });

    it('should throw error when trying to set a function value', () => {
      expect(() => {
        store.set('function', function () {});
      }).toThrow(new Error('[toystore] Cannot set "function" with value type "function". All store values must be serializable.'));
    });
  });

  describe('setAll', () => {
    it('should set all the desired values a the given paths', () => {
      store.setAll({
        'foo': 'baz',
        'user.id': 2,
      });

      let actual = store.get('foo');
      let expected = 'baz';
      let actual2 = store.get('user.id');
      let expected2 = 2;

      expect(actual).toBe(expected);
      expect(actual2).toBe(expected2);
    });

    it('should only trigger a watcher ONCE after a setAll - not once per individual key set', () => {
      let count = 0;

      store.watch(['foo', 'user.id'], () => ++count);
      store.setAll({
        'foo': 'baz',
        'user.id': 2,
      });

      let actual = store.get('foo');
      let expected = 'baz';
      let actual2 = store.get('user.id');
      let expected2 = 2;

      expect(actual).toBe(expected);
      expect(actual2).toBe(expected2);
      expect(count).toBe(1);
    });

    it('should not unset key when set is called with undefined (should set it to null instead)', () => {
      store.setAll({
        'foo': undefined
      });

      let actual = store.get('foo');
      let expected = null;

      expect(actual).toBe(expected);
    });

    it('should throw error when trying to set a function value', () => {
      expect(() => {
        store.setAll({
          'function': function () {}
        });
      }).toThrow(new Error('[toystore] Cannot set "function" with value type "function". All store values must be serializable.'));
    });
  });

  describe('setSilent', () => {
    it('should NOT trigger any watcher callbacks', () => {
      let actual = 0;

      store.watch('user.id', () => ++actual);
      store.setSilent('user.id', 42);

      let expected = 0;

      expect(actual).toBe(expected);
    });
  });

  describe('watch', () => {
    it('should watch for changes on a single key at the top level', () => {
      let actual = 0;

      store.watch('foo', () => ++actual);
      store.set('foo', 'baz');
      store.set('foo', 'bax');

      let expected = 2;

      expect(actual).toBe(expected);
    });

    it('should watch for changes on a single nested key', () => {
      let actual = 0;

      store.watch('user.id', () => ++actual);
      store.set('user.id', 42);

      let expected = 1;

      expect(actual).toBe(expected);
    });

    it('should watch for changes on multiple provided key paths', () => {
      let actual = 0;

      store.watch(['foo', 'user.id'], () => ++actual);
      store.set('foo', 'qux');
      store.set('user.id', 2);

      let expected = 2;

      expect(actual).toBe(expected);
    });

    it('should trigger callback if one key changes in watched path but others do not', () => {
      let actual = 0;

      store.watch(['foo', 'user.id'], () => ++actual);
      store.set('foo', 'qux');
      store.set('new_key', 'new_value');

      let expected = 1;

      expect(actual).toBe(expected);
    });

    it('should trigger watcher callback with new values from provided keys as first argument', (done) => {
      let expected = {
        'foo': 'baz',
        'user.id': 2,
      };

      store.watch(['foo', 'user.id'], (actual) => {
        expect(actual).toEqual(expected);
        done();
      });

      store.setAll(expected);
    });

    it('should trigger multiple watchers if watching the same key', () => {
      let actual = 0;

      store.watch(['foo'], () => ++actual);
      store.watch(['foo'], () => ++actual);
      store.set('foo', 'qux');

      let expected = 2;

      expect(actual).toBe(expected);
    });

    it('should trigger the higher priority watcher first', () => {
      let actual = '';

      store.watch(['user.email'], () => {
        actual += '1';
      });

      store.watch(['user'], () => {
        actual += '2';
      }, { priority: 99999 });

      store.watch(['user'], () => {
        actual += '3';
      }, { priority: -1 });

      store.set('user.email', 'user2@example.com');

      let expected = '213';

      expect(actual).toBe(expected);
    });

    it('should trigger an update when root key is changed with a watched nested key', () => {
      let actual = 0;

      store.watch('user.id', () => ++actual);
      store.set('user', {
        email: 'bar@baz.com',
        id: 2,
      });

      let expected = 1;

      expect(actual).toBe(expected);
    });

    it('should trigger an update when root key is removed with a watched nested key', () => {
      let actual = 0;

      store.watch('user.id', () => ++actual);
      store.set('user', {
        email: 'bar@baz.com'
        // id is omitted!
      });

      let expected = 1;

      expect(actual).toBe(expected);
    });

    it('should trigger an update when nested key is changed with a watched root key', () => {
      let actual = 0;

      store.watch('user', () => ++actual);
      store.set('user.email', 'bar@baz.com');

      let expected = 1;

      expect(actual).toBe(expected);
    });

    it('should not trigger an update when updating a sibling nested key', () => {
      let actual = 0;

      store.watch(['user.email'], () => ++actual);
      store.set('user.id', 2);

      let expected = 0;

      expect(actual).toBe(expected);
    });

    it('should execute callbacks async when async option is set', (done) => {
      let actual = 0;

      store.watch(['foo'], () => actual++, { async: true });
      store.set('foo', 2);

      let expected = 1;

      setTimeout(() => {
        expect(actual).toBe(expected);
        done();
      }, 10);
    });
  });

  describe('watchAll', () => {
    it('should watch for any and all changes on any key', () => {
      let actual = 0;

      store.watchAll(() => ++actual);
      store.set('foo', 'baz');
      store.set('foo', 'bax');

      let expected = 2;

      expect(actual).toBe(expected);
    });

    it('should only fire once with a setAll()', () => {
      let actual = 0;

      store.watchAll(() => ++actual);
      store.setAll({
        'foo': 'baz',
        'user': {
          'email': 'foo@bar.com',
          'id': 2,
        },
      });

      let expected = 1;

      expect(actual).toBe(expected);
    });
  });

  describe('watchOnce', () => {
    it('should watch for changes only once, and then unwatch itself', () => {
      let actual = 0;

      store.watchOnce('foo', () => ++actual);
      store.set('foo', 'baz');
      store.set('foo', 'bax');

      let expected = 1;

      expect(actual).toBe(expected);
    });

    it('should not recurse in a loop when setting the key it is watching once', () => {
      let actual = 0;

      store.watchOnce('foo', () => {
        store.set('foo', 'another value');
        ++actual;
      });
      store.set('foo', 'baz');
      store.set('foo', 'bax');

      let expected = 1;

      expect(actual).toBe(expected);
    });
  });

  describe('unset', () => {
    it('should unset key at path', () => {
      store.unset('foo');

      expect(() => {
        let actual = store.get('foo');
      }).toThrow(new Error('[toystore] Requested store key "foo" was not found in store.'));
    });
  });

  describe('unwatch', () => {
    it('should not error when there are no watchers', () => {
      let actual = 0;
      let callback = () => ++actual;

      store.watch('foo', callback);

      store.unwatch(callback);

      let expected = 0;

      expect(actual).toBe(expected);
    });

    it('should be able to unwatch by given id', () => {
      let actual = 0;
      let callback = () => ++actual;
      let id = store.watch('foo', callback);

      store.unwatch(id);
      store.set('foo', 'buzz');

      let expected = 0;

      expect(actual).toBe(expected);
    });
  });
});
