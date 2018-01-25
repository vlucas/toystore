# Toystore.js

Lightweight central store of state with the ability to watch for and react to
specific property changes

**Think "toy" as in small.** This thing is ready to rock at just a hair over
2kb minified and gzipped.

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


Control the order watchers fire using priority weightings. The default priority is 0. Negative numbers can be used to push watchers to the end.
```javascript
const store = require('./mystore');

store.watch(['user'], secondTask);
store.watch(['user'], firstTask, { priority: 10 });
store.watch(['user'], thirdTask, { priority: -1 });

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

NOTE: This will trigger all watchers because all keys will change, so if you
also want to remove all the watchers before using reset(), call
**unwatchAll()**.

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

### watchAll(callback)

Similar to `watch`, but provided `callback` will execute whenever any key in
the whole store is changed. Will only be fired once when `setAll` is used with
multiple keys.

```javascript
store.watchAll(renderApp); // Will execute when *any* key changes
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
