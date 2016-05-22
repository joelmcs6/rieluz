'use strict';

import Joi from 'joi';
import SchemaValidator from 'validate';
import GraphError  from './../exception';
import _ from 'lodash';

const VertexClassSchema = Joi.object().pattern(/^[$A-Z_][0-9A-Z_$]*$/i, Joi.object().keys({
  type: Joi.string().required(),
  index: Joi.string().default(null),
  match: Joi.string().default(null),
  message: Joi.string().default('There is an error')
}));


class Schema {
  constructor(structure) {
    this.structure = structure;

    // Validate the structure of model
    let validator = VertexClassSchema.validate(structure);
    if (validator.error) {
      throw new GraphError('VERTEX_SCHEMA_ERROR', 'Invalid vertex schema', {errors: validator.error});
    }
    // Create validator removing keys not allowed.
    // Index is the only not allowed key
    this.validator = SchemaValidator(_.mapValues(structure, (field) => {
      delete field['index'];
      return field;
    }));

    this.errors = null;
  }

  validate(obj) {
    let errors = this.validator.validate(obj);

    this.errors = _.map(errors, (item) => {
      item['field'] = item.path;
      delete item['path'];
      return item;
    });

    return _.isEmpty(this.errors);
  }
}

export default Schema;

