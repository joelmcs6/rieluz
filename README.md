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
> Every connection configuration is similar to the [OrientJS](https://github.com/orientechnologies/orientjs) configuration schema.

Can be specify as many connection as needed. Every connection is identify by its name.

By every connection declared in configuration is set an instance of the GraphManager.


## Connect the client
```js
import { connect } from 'rieluz';

rieluz.connect(config)
  .catch(e => console.error(`Error connecting to orientdb: ${e.message}`));
```
This is the way of boot connections to OrientDB database. If database is not created, Rieluz will create the database and the declared models schema.

## Create a model schema
Let's create a person model
```js
import { Schema, Vertex } from 'rieluz';

const personSchema = Schema({
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

export default Vertex('Person', personSchema, 'default');
```
For the schema validation was used validate node js package. [Read more](https://www.npmjs.com/package/validate)

The third parameter is the connection that model will use. If it is not specified rieluz will take 'default'

## Supported data types in **RIELUZ** and its map in Javascript
| Rieluz Type (same as OrientDB)| Javascript|
| ----------------------------- | --------- |
| decimal                       | number    |
| float                         | number    |
| integer                       | number    |
| double                        | number    |
| short                         | number    |
| date                          | object    |
| datetime                      | object    |
| string                        | string    |
| boolean                       | boolean   |

> **IMPORTANT**
> The properties type must be declared as one of the types above

## Vertex Class

### Save a node in the Graph by instantiating of the model
```js
let jimmy = new Person({ id: "1", name: "Jimmy", age: 21 });
if (jimmy.isValid()) {
    jimmy.save()
      .then(vertex => console.log(vertext))
      .catch(e => console.error(`Error saving: ${e.message}`));
} else {
    console.log(jimmy.schema.errors);
}
```

### Delete a node
```js
jimmy.delete()
  .then(result => console.log('Node removed'))
  .catch(e => console.error(`Error removing node: ${e.message}`));
```

## Other way
Every model have a property *collection* that can be used.
### Save a node in the Graph
```js
let data = { id: "1", name: "Jimmy", age: 21 };
Person.collection.create(data)
  .then(vertex => console.log(vertex))
  .catch(e => console.error(`Error creating node: ${e.message}`));
```

### Upsert a node
The node will be updated if it already exist in the database otherwise will be created
```js
let data = { id: "1", name: "Jimmy", age: 21 };
Person.collection.upsert(data)
  .then(vertex => console.log(vertex))
  .catch(e => console.error(`Error updating node: ${e.message}`));
```

### Link two nodes in the Graph

createEdge takes 4 arguments: 
* label: The class of the edge
* from: RID of the FROM node
* to: RID of the TO node
* done: Error-based callback

```js
Person.collection.createEdge('friend_of', jimmy.rid, joe.rid)
  .then(edge => console.log(edge))
  .catch(e => console.error(`Error creating relationship: ${e.message}`));
```

### Delete an edge

```js
Person.collection.deleteEdge('friend_of', jimmy.rid, joe.rid)
  .then(count => console.log(`Total relationships removed: ${count}`))
  .catch(e => console.error(`Error removing relationship: ${e.message}`));
```
To remove all edges between one node and other, no matter its class, pass null or undefined as class parameter
```js
Person.collection.deleteEdge(null, jimmy.rid, joe.rid)
  .then(count => console.log(`All relationships removed: ${count}`))
  .catch(e => console.error(`Error removing relationships: ${e.message}`));
```
### Find a record

```js
Person.collection.findOne({ id: "1" })
  .then(vertex => console.log(vertex))
  .catch(e => console.error(`Error finding the node: ${e.message}`));
```

### Raw query

```js
Person.collection.query("select from person where id = :id", { id: "1" })
  .then(results => console.log(results))
  .catch(e => console.error(`Error querying: ${e.message}`));
```


### Query Builder
Use qb in the same way that object db in [OrientJS](https://github.com/orientechnologies/orientjs)
```js
let qb = Person.collection.getQueryBuilder();
```


# Issues
Please let me know about any bug or recommendation in [here](https://github.com/joelmcs6/rieluz/issues)