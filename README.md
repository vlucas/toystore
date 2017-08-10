# Toystore.js

Lightweight central store of state with the ability to watch for and react to
specific property changes

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
