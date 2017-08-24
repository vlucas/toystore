# Toystore.js

Lightweight central store of state with the ability to watch for and react to
specific property changes

**Think "toy" as in small. Not "toy" as in "not production ready". This thing is
ready to rock at well under 2KB minified and gzipped.**

## Installation

```
npm install toystore --save
```

## Usage

Create a new store instance with the initial store values:
```javascript
const toystore = require('toystore');

let store = toystore.create({
  foo: 'bar',
  user: {
    email: 'user@example.com',
    id: 1,
  }
});

module.exports = store;
```

Get store values anywhere in your app, even nested keys:

```javascript
const store = require('./mystore');

function renderUserEmail() {
  return store.get('user.email');
}
```

Watch for changes on specific keys and react to them:
```javascript
const store = require('./mystore');

store.watch(['user.email'], updateUserEmail);
```

Update store values from anywhere in your app:
```javascript
const store = require('./mystore');

function fetchUser() {
  return fetch('/myapi/users/1')
    .then(json => {
      store.set('user', {
        email: json.data.email,
        id: json.id,
      });
    });
}
```

## Usage With React

If you use React and want to bind your React components to automatically
re-render on store key changes, use the
 [toystore-react](https://github.com/vlucas/toystore-react) package.

## API

After you create a store instance using `toystore.create()`, the resulting
store object has the following methods:

### get(path)

Get a single store value from the provided `path`. This can use periods for
nesting, i.e. `user.email`.

```javascript
store.get('user.email'); // user@example.com
```

### getAll(paths = null)

Returns an object with key/value pairs of all the keys requested. The provided
`paths` argument must be an array.

If you do not provide any arguments, the entire store object will be returned.

```javascript
store.getAll(['is_cool', 'is_quality']); // { is_cool: true, is_quality: true }
```

### set(path, value)

Set a single store value to the provided `path`. This can use periods for
nesting, i.e. `user.email`.

```javascript
store.set('user.email', 'user@example.com');
```

### setSilent(path, value)

Same as `set`, but *will not notify watchers that the key has been updated*.

```javascript
store.setSilent('user.email', 'user@example.com');
```

### setAll(object)

Takes an object with key/value pairs of all the keys and values to be set. Will
only notify watchers of updates once - after all keys have been set.

```javascript
store.setAll({ is_cool: true, is_quality: true });
```

### reset(object)

Reset the whole store to the provided object. Commonly used for testing and/or
resetting the store to the default state.

```javascript
store.reset({ is_cool: true, is_quality: true, user: false });
```

### watch(paths, callback)

Watch provided `paths` for changes, and execute `callback` when those values
change.

This method is very useful to seamlessly react to data changes in the
store without having to create events or other mechanisms to update views or
content mannually after updating store values.

The `callback` function will receive an object with key/value pairs of the new
store values after the triggered change.

```javascript
store.watch(['user'], updateUserInfo);
store.watch(['mode'], changeMode);
store.watch(['router.url'], (newValues) => navigateToPage(newValues.router.url));
```

### unwatch(callback)

Unregisters only the provided callback that has been added with `watcher`.

```javascript
store.unwatch(updateUserInfo); // Remove updateUserInfo only
```

### unwatchAll()

Removes all registered watchers.

```javascript
store.unwatchAll(); // Removes ALL watchers
```
