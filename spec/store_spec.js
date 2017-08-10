'use strict';

const toystore = require('../src/index');

let store;
let storeDefaults = {
  foo: 'bar',
  user: {
    email: 'user@example.com',
    id: 1,
  }
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
  });

  describe('set', () => {
    it('should set the desired value at the top level', () => {
      store.set('foo', 'baz');

      let actual = store.get('foo');
      let expected = 'baz';

      expect(actual).toBe(expected);
    });

    it('should get the desired value for a nested key', () => {
      store.set('user.id', 2);

      let actual = store.get('user.id');
      let expected = 2;

      expect(actual).toBe(expected);
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
      store.set('user.email', 'user@disposeamail.com');

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
});
