# rieluz

> **IMPORTANT**: Rieluz is not recommended for production environment yet. This is a work in progress.

# Installation
Install via npm

```sh
npm install rieluz
```

# How to use

## Configuration
```js
orientdb: {
  connections: {
    default: {
      server: {
        host: '127.0.0.1',
        port: 2424,
        username: 'orientdbUser',
        password: 'orientdbPassword',
        servers: [
          {host: '127.0.0.1', port: 2425}
        ]
      },
      database: {
        name: 'databaseName',
        username: 'orientdbUser',
        password: 'orientdbPassword',
        type: 'graph',
        storage: 'plocal'
      }
    }
  }
}
```
> **IMPORTANT**
> Rieluz configuration must have the key "orientdb".
> Every connection configuration is similar to the orientJS configuration schema.

You can specify as many connection as you want. Every connection is identify by its name.

By every connection declared in configuration is set an instance of the GraphManager.


## Connect the client
```js
import const rieluz from 'rieluz';

rieluz.connect(config, (err) => done);

```
This is the way of boot connections to OrientDB database. If database is not created, Rieluz will create the database and the declared models schema.

## Create a model schema
Let's create a person model
```js
import const rieluz from 'rieluz';

const personSchema = rieluz.Schema({
  id: {
    type: 'string',
    index: 'UNIQUE_HASH_INDEX'
  },
  name: {
    type: 'string'
  },
  age: {
    type: 'integer'
  }
});

export default rieluz.Vertex('Person', personSchema);
```
For the schema validation was used validate nodejs package. Read more about this in here...

## Make queries
To be written...s
