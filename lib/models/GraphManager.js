import OrientDB from 'orientjs';
import async from 'async';
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

  createDatabaseIfNotExist(done) {
    if (this.databaseSynchronized) {
      return done(null);
    }

    this.server.list().then((dbs) => {
      if (isEmpty(dbs) === false) {
        this.database = find(dbs, (db) => {
          return db.name === this.config.database.name;
        });
      }

      this.databaseSynchronized = true;
      if (this.database === undefined) {
        this.server.create(this.config.database).then((db) => {
          this.database = db;
          done(null, this.database);
        });
      } else {
        done(null, this.database);
      }
    });
  }

  createClassIfNotExist(name, superClass, done) {
    if (this.database !== undefined) {
      this.database.class.list().then((classes) => {
        let className;

        if (isEmpty(classes) === false) {
          className = find(classes, (cls) => toLower(cls.name) === toLower(name));
        }

        if (!className) {
          this.database.class.create(name, superClass).then((cc) => {
            this.createdClasses[name] = {
              created: true,
              sync: false
            };

            return done(null, this.createdClasses[name]);
          });
        } else {
          this.createdClasses[name] = {
            created: true,
            sync: false
          };

          return done(null, this.createdClasses[name]);
        }
      });
    } else {
      return done('database undefined');
    }
  }

  syncClassProperties(name, schema, done) {
    if (this.createdClasses[name] === undefined || this.createdClasses[name].sync === true) {
      return;
    }

    this.database.class.get(name).then((GraphClass) => {
      GraphClass.property.list().then((properties) => {
        let schemaProperties = keys(schema.structure);

        let classProperties = isEmpty(properties) ? schemaProperties : reject(schemaProperties, (prop) => {
          return undefined !== find(properties, (p) => toLower(p.name) === toLower(prop));
        });

        // Save the properties
        forEach(classProperties, (prop) => {
          GraphClass.property.create({
            name: prop,
            type: schema.structure[prop].type
          });
        });

        // To be removed
        let toBeDeleted = difference(map(properties, (p) => p.name), schemaProperties);

        // Remove every property
        forEach(toBeDeleted, (prop) => {
          GraphClass.property.drop(prop);
        });

        this.createdClasses[name].sync = true;

        // Create index of new properties
        async.map(classProperties, (prop, cb) => {
          if (schema.structure[prop].index !== undefined) {
            this.database.index.create({
              name: name + '.' + prop,
              type: schema.structure[prop].index
            }).then((index) => cb(null, index));
          } else {
            return cb(null, false);
          }
        }, (err, results) => done(err, this.createdClasses[name]));
      });
    });
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
