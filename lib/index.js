'use strict';

import async from 'async';
import * as GraphManager from './models/GraphManager';
import VertexCollection from './models/VertexCollection';
import {default as ParentSchema} from './models/Schema';
import {default as ParentVertex} from './models/Vertex';

let models = {};

/**
 * Creates a class Model inherit from Vertex
 *
 * @param className
 * @param schema
 * @param superClass
 * @param connection
 * @returns {{new(*): {isValid: (function(*=): Boolean), delete: (function(*=)), save: (function(*): *), data, data}, new(*=, *=, *=, *=): {isValid: (function(*=): Boolean), delete: (function(*=)), save: (function(*): *), data, data}}|*}
 * @constructor
 */
export var Vertex = function(className, schema, superClass, connection) {
  superClass = superClass || 'V';
  connection = connection || 'default';

  let identifier = superClass + '_' + className;

  if (models[identifier] === undefined) {

    models[identifier] = {
      'classObject': class extends ParentVertex {
        constructor(data) {
          super(className, schema, superClass, connection);
          this.data = data;
        }
      },
      'className': className,
      'connection': connection,
      'superClass': superClass,
      'schema': schema
    };

    models[identifier]['classObject']['collection'] = new VertexCollection(className, schema, connection);
  }

  return models[identifier].classObject;
};

/**
 * Create a new instance of Schema class
 *
 * @param structure
 * @returns {Schema}
 * @constructor
 */
export var Schema = function(structure){
  return new ParentSchema(structure);
};

/**
 * Exports Graph Manager
 */
export var gm = GraphManager;

/**
 * Connect to databse in config. Create or Update database schema if needed.
 *
 * @param config
 * @param done
 */
export var connect = function(config, done) {

  let boot_connections = [];

  for (let key in config.connections) {
    if (config.connections.hasOwnProperty(key)) {
      boot_connections.push((cb) => {
        let gm = GraphManager.getInstance(key);
        gm.createDatabaseIfNotExist(cb)
      });
    }
  }

  async.series(boot_connections, (err) => {
    if (err) return done(err);

    // Create or Update every model in Graph
    let tasks = [];
    for (let key in models) {
      let item = models[key];

      tasks.push((cb) => {
        let gm = GraphManager.getInstance(item.connection);
        gm.createClassIfNotExist(item.className, item.superClass, (err) => {
          gm.syncClassProperties(item.className, item.schema, cb)
        });

      });
    }

    async.series(tasks, done);
  });
};
