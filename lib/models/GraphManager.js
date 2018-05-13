import OrientDB from 'orientjs';
import { isEmpty, find, toLower, keys, reject, forEach, difference, map } from 'lodash-es';
import GraphConfigurationSchema from './../config/configSchema';
import GraphError from './../exception';

let instances = {};

class GraphManager {
  constructor(connection, configuration) {
    let validator = GraphConfigurationSchema.validate(configuration);

    if (validator.error) {
      throw new GraphError('CONFIGURATION_SCHEMA_ERROR', 'Invalid configuration schema', {errors: validator.error});
    }

    this.connection = connection || 'default';

    if (configuration.connections[this.connection] === undefined) {
      throw new GraphError('CONNECTION_NOT_FOUND', 'Connection "' + this.connection + '" not defined in configuration');
    }

    this.config = configuration.connections[this.connection];
    this.server = OrientDB(this.config.server);

    this.databaseSynchronized = false;
    this.createdClasses = {};
  }

  async createDatabaseIfNotExist() {
    if (this.databaseSynchronized) {
      return null;
    }

    const dbs = await this.server.list();

    if (isEmpty(dbs) === false) {
      this.database = find(dbs, (db) => {
        return db.name === this.config.database.name;
      });
    }

    this.databaseSynchronized = true;
    if (!this.database) {
      this.database = await this.server.create(this.config.database);
    }

    return this.database;
  }

  async createClassIfNotExist(name, superClass) {
    if (this.database) {
      const classes = await this.database.class.list();

      let existsClassName = false;
      if (isEmpty(classes) === false) {
        existsClassName = find(classes, (cls) => toLower(cls.name) === toLower(name));
      }

      if (!existsClassName) {
        await this.database.class.create(name, superClass);
      }

      this.createdClasses[name] = {
        created: true,
        sync: false
      };

      return this.createdClasses[name];
    } else {
      throw new Error('database undefined');
    }
  }

  async syncClassProperties(name, schema) {
    if (this.createdClasses[name] === undefined || this.createdClasses[name].sync === true) {
      return;
    }

    const GraphClass = await this.database.class.get(name);
    const properties = await GraphClass.property.list();

    const schemaProperties = keys(schema.structure);
    const classProperties = isEmpty(properties)
      ? schemaProperties
      : reject(schemaProperties, (prop) => {
        return undefined !== find(properties, (p) => toLower(p.name) === toLower(prop));
      });

    // Save the properties
    forEach(classProperties, (prop) => GraphClass.property.create({
      name: prop,
      type: schema.structure[prop].type
    }));

    // Properties to be removed
    const toBeDeleted = difference(
      map(properties, (p) => p.name),
      schemaProperties
    );

    forEach(toBeDeleted, (prop) => GraphClass.property.drop(prop));

    this.createdClasses[name].sync = true;

    // Create index of new properties
    await Promise.all(map(
      keys(classProperties),
      prop => {
        if (schema.structure[prop].index !== undefined) {
          return this.database.index.create({
            name: name + '.' + prop,
            type: schema.structure[prop].index
          });
        } else {
          return Promise.resolve();
        }
      }
    ));

    return this.createdClasses[name];
  }

  static getInstance(connection, configuration) {
    if (connection !== undefined && instances[connection] === undefined) {
      instances[connection] = new GraphManager(connection, configuration);
    }

    // noinspection JSAnnotator
    return instances[connection];
  }
}

export const getInstance = function(connection, configuration) {
  return GraphManager.getInstance(connection, configuration);
};
