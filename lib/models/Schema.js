'use strict';

import Joi from 'joi';
import SchemaValidator from 'validate';
import GraphError  from './../exception';
import _ from 'lodash';

const toDate = (value) => new Date(value);

const ORIENTDB_TYPES_MAP = {
  'decimal': {
    type: 'number',
    formatter: parseFloat
  },
  'float': {
    type: 'number',
    formatter: parseFloat
  },
  'integer': {
    type: 'number',
    formatter: parseInt
  },
  'double': {
    type: 'number',
    formatter: parseFloat
  },
  'short': {
    type: 'number',
    formatter: parseInt
  },
  'date': {
    type: 'object',
    formatter: toDate
  },
  'datetime': {
    type: 'object',
    formatter: toDate
  },
  'string': 'string',
  'boolean': 'boolean',
};

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
    this.validator = SchemaValidator(_.mapValues(_.cloneDeep(this.structure), (field) => {
      delete field['index'];
      let fieldType = ORIENTDB_TYPES_MAP[field['type']];
      
      if (fieldType == undefined){
        throw new GraphError('VERTEX_SCHEMA_ERROR', 'Invalid field type', {errors: [`Type ${field['type']} is not supported by rieluz`]});
      }
      
      field['type'] = fieldType.type != undefined ? fieldType.type : fieldType;
      return field;
    }));

    this.errors = null;
  }

  validate(obj) {

    const keys = Object.keys(obj);
    for (let key in keys) {
      const value = keys[key];
      const field = this.structure[value];

      const fieldType = ORIENTDB_TYPES_MAP[field.type];

      if (obj.hasOwnProperty(value) && fieldType.formatter != undefined) {
        const formatter = fieldType.formatter;
        obj[value] = formatter(obj[value])
      }
    }

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

