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
> Every connection configuration is similar to the [OrientJS](https://github.com/orientechnologies/orientjs) configuration schema.

Can be specify as many connection as needed. Every connection is identify by its name.

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
import * as rieluz from 'rieluz';

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

export default rieluz.Vertex('Person', personSchema, 'default');
```
For the schema validation was used validate node js package. [Read more](https://www.npmjs.com/package/validate)

The third parameter is the connection that model will use. If it is not specified rieluz will take 'default'

## Vertex Class

### Save a node in the Graph by instantiating of the model
```js
let jimmy = new Person({id: "1", name: "Jimmy", age: 21});
if (jimmy.isValid()){

    jimmy.save((err, vertex) => {
        if (err) {
            console.log('Some error ocurred');
            return;
        }    
        console.log('Node with name Jimmy was created!!')
    });
} else {
    console.log(jimmy.schema.errors);
}
```
### Delete a node
```js
jimmy.delete((err, result) => {
    if (err) {
        console.log('Some error ocurred');
        return;
    }    
    console.log('Node with name Jimmy was deleted!!')
})
```
## Other way
Every model have a property *collection* that can be used.
### Save a node in the Graph
```js
let data = {id: "1", name: "Jimmy", age: 21}
let jimmy = Person.collection.create(data, (err, vertex) => {
   if (err) {
       console.log('Some error ocurred');
       return;
   }    
   console.log('Node with name Jimmy was created!!')
});
```

### Upsert a node
The node will be updated if it already exist in the database otherwise will be created
```js
let data = {id: "1", name: "Jimmy", age: 21}
let jimmy = Person.collection.upsert(data, (err, vertex) => {
   if (err) {
       console.log('Some error ocurred');
       return;
   }    
   console.log('Everything goes well')
});
```

### Link two nodes in the Graph

createEdge takes 4 arguments: 
<ol>
 <li>label: The class of the edge</li>
 <li>from: RID of the FROM node</li>
 <li>to: RID of the TO node</li>
 <li>done: Error-based callback</li>
</ol>
```js
Person.collection.createEdge('friend_of', jimmy.rid, joe.rid, (err, edge) => {
    //Do something with the edge in here
});
```

### Delete an edge

```js
Person.collection.deleteEdge('friend_of', jimmy.rid, joe.rid, (err, count) => {
    //Do something with count of deleted edges
});
```

### Find a record

```js
Person.collection.findOne({id: "1"}, (err, vertex) => {
    //vertex will be an instance of Person
});
```

### Raw query

```js
Person.collection.query("select from person where id = :id", {id: "1"}, (err, results) => {
    // the results schema can change due to the fetch strategy
});
```


### Query Builder
Use qb in the same way that object db in [OrientJS](https://github.com/orientechnologies/orientjs)
```js
let qb = Person.collection.getQueryBuilder();
```


# Issues
Please let me know about any bug or recommendation in [here](https://github.com/joelmcs6/rieluz/issues)