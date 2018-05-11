import async from 'async';
import * as GraphManager from './models/GraphManager';
import VertexCollection from './models/VertexCollection';
import ParentSchema from './models/Schema';
import ParentVertex from './models/Vertex';

let models = {};

/**
 * Creates a class Model inherit from Vertex
 * @param className
 * @param schema
 * @param superClass
 * @param connection
 * @constructor
 */
export let Vertex = function(className, schema, superClass, connection) {
  superClass = superClass || 'V';
  connection = connection || 'default';

  let identifier = superClass + '_' + className;

  if (models[identifier] === undefined) {

    models[identifier] = {
      classObject: class extends ParentVertex {
        constructor(data) {
          super(className, schema, superClass, connection);
          this.data = data;
        }
      },
      className: className,
      connection: connection,
      superClass: superClass,
      schema: schema
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
export const Schema = function(structure){
  return new ParentSchema(structure);
};

/**
 * Exports Graph Manager
 */
export let gm = GraphManager;

/**
 * Connect to databse in config. Create or Update database schema if needed.
 * @param config
 * @param done
 */
export const connect = function(config, done) {
  let boot_connections = [];

  for (let key in config.connections) {
    if (config.connections.hasOwnProperty(key)) {
      boot_connections.push((cb) => {
        let gm = GraphManager.getInstance(key, config);
        gm.createDatabaseIfNotExist(cb);
      });
    }
  }

  async.series(boot_connections, (err) => {
    if (err) {
      return done(err);
    }

    // Create or Update every model in Graph
    let tasks = [];
    for (let key in models) {
      let item = models[key];

      tasks.push((cb) => {
        let gm = GraphManager.getInstance(item.connection, config);

        // eslint-disable-line handle-callback-err
        gm.createClassIfNotExist(item.className, item.superClass, () => {
          gm.syncClassProperties(item.className, item.schema, cb);
        });
      });
    }

    async.series(tasks, done);
  });
};
