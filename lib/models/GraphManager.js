'use strict';

import OrientDB from 'orientjs';
import _ from 'lodash';
import config from 'config';
import async from 'async';
import GraphConfigurationSchema  from './../config/configSchema';
import GraphError from './../exception';

let instances = {};


class GraphManager {
  constructor(connection) {

    let configuration = config.get('orientdb');

    let validator = GraphConfigurationSchema.validate(configuration);

    if (validator.error) {
      throw new GraphError('CONFIGURATION_SCHEMA_ERROR', 'Invalid configuration schema', {errors: validator.error});
    }

    this.connection = connection || 'default';

    if (configuration.connections[this.connection] === undefined) {
      throw new GraphError('CONNECTION_NOT_FOUND','Connection "' + this.connection + '" not defined in configuration')
    }

    this.config = configuration.connections[this.connection];
    this.server = OrientDB(this.config.server);

    this.databaseSynchronized = false;
    this.createdClasses = {};
  }

  createDatabaseIfNotExist(done) {

    if (this.databaseSynchronized) { return done(null) }

    this.server.list().then((dbs) => {
      if (_.isEmpty(dbs) == false) {
        this.database = _.find(dbs, (db) => {
          return db.name == this.config.database.name
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
        let className = undefined;
        if (_.isEmpty(classes) == false) {
          className = _.find(classes, (cls) => cls.name == name )
        }

        if (className === undefined) {
          this.database.class.create(name, superClass).then((cc) => {
            this.createdClasses[name] = {
              created: true,
              sync: false
            };
            done(null, this.createdClasses[name]);
          });
        } else {
          this.createdClasses[name] = {
            created: true,
            sync: false
          };
          done(null, this.createdClasses[name]);
        }
      });
    }else {
      done('database undefined');
    }
  }

  syncClassProperties(name, schema, done) {

    if (this.createdClasses[name] === undefined || this.createdClasses[name].sync === true) { return; }

    this.database.class.get(name).then((GraphClass) => {
      GraphClass.property.list().then((properties) => {
        let schemaProperties = _.keys(schema.structure);

        let classProperties = _.isEmpty(properties) ? schemaProperties : _.reject(schemaProperties, (prop) => {
          return undefined !== _.find(properties, (p) => p.name == prop);
        });

        // Save the properties
        _.forEach(classProperties, (prop) => {
          GraphClass.property.create({
            name: prop,
            type: schema.structure[prop].type
          });
        });

        // To be removed
        let toBeDeleted = _.difference(_.map(properties, (p) => p.name), schemaProperties);

        // Remove every property
        _.forEach(toBeDeleted, (prop) => {
          GraphClass.property.drop(prop);
        });

        this.createdClasses[name].sync = true;


        // Create index of new properties
        async.map(classProperties, (prop, cb) => {
          if (schema.structure[prop].index != undefined) {
            this.database.index.create({
              name: name + '.' + prop,
              type: schema.structure[prop].index
            }).then((index) => cb(null, index));
          }
          else{
            cb(null, false);
          }
        }, (err, results) => done(err, this.createdClasses[name]));
      });
    });
  }

  static getInstance(connection){
    if (connection !== undefined && instances[connection] === undefined) {
      instances[connection] = new GraphManager(connection);
    }

    //noinspection JSAnnotator
    return instances[connection];
  }
}

export const getInstance = function(connection) {
  return GraphManager.getInstance(connection)
};

