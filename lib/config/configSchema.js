'use strict';

import Joi from 'joi';

const ConnectionServerSchema = Joi.object().keys({
  host: Joi.string().required(),
  port: Joi.number().integer().required(),
  username: Joi.string().required(),
  password: Joi.string().required(),
  servers: Joi.array().items(Joi.object().keys({
    host: Joi.string().required(),
    port: Joi.number().integer().required()
  }))
});

const ConnectionDatabaseSchema = Joi.object().keys({
  name: Joi.string().required(),
  username: Joi.string().required(),
  password: Joi.string().required(),
  type: Joi.string().default('graph'),
  storage: Joi.string().default('plocal')
});

const GraphConfigurationSchema = Joi.object().keys({
  connections: Joi.object().pattern(/^[$A-Z_][0-9A-Z_$]*$/i, Joi.object().keys({
    server: ConnectionServerSchema,
    database: ConnectionDatabaseSchema
  }))
});

export default GraphConfigurationSchema;
