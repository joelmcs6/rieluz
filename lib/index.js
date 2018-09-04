import { map, keys } from 'lodash-es';
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
export const Vertex = function(className, schema, superClass, connection) {
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
 * Connect to database in config. Create or Update database schema if needed.
 * @param config
 */
export const connect = async function(config) {
  // Create connections.
  await Promise.all(map(
    keys(config.connections),
    connection => GraphManager.getInstance(connection, config).createDatabaseIfNotExist()
  ));

  // Create model structures.
  return Promise.all(map(
    keys(models),
    async model => {
      const item = models[model];
      const gm = GraphManager.getInstance(item.connection, config);
      await gm.createClassIfNotExist(item.className, item.superClass);
      await gm.syncClassProperties(item.className, item.schema);
    }
  ));
};

export default { Vertex, Schema, connect };
