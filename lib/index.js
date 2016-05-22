'use strict';

import async from 'async';
import * as GraphManager from './models/GraphManager';
import VertexCollection from './models/VertexCollection';
import {default as ParentSchema} from './models/Schema';
import {default as ParentVertex} from './models/Vertex';

let models = {};


class Rieluz {

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
  static Vertex (className, schema, superClass, connection) {
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
  }

  /**
   * Create a new instance of Schema class
   *
   * @param structure
   * @returns {Schema}
   * @constructor
   */
  static Schema(structure) {
    return new ParentSchema(structure);
  }

  /**
   * Connect to databse in config. Create or Update database schema if needed.
   *
   * @param config
   * @param done
   */
  static connect(config, done) {

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
}

Rieluz.gm = GraphManager;

export default Rieluz
