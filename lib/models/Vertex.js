'use strict';

import Schema from './Schema';
import VertexCollection from './VertexCollection';


class Vertex {

  /**
   * Vertex Constructor
   * @param className
   * @param schema
   * @param superClass
   * @param connection
   */
  constructor (className, schema, superClass, connection) {
    this.superClass = superClass || 'V';

    if (!schema instanceof Schema && Vertex.superClass != 'V') {
      throw new TypeError('Schema must be instance of Schema')
    }

    this.schema = schema || null;
    this.className = className;
    Vertex.collection = new VertexCollection(className, schema, connection);

    Vertex.collection.inflate(this);
    this._data = {}
  }

  set data  (data)  { this._data = data}
  get data  ()      { return this._data}

  /**
   * Create a vertex on the graph
   * @param done Callback function
   * @returns {*}
   */
  save (done) {
    if(this.isValid(this.data)) {
      Vertex.collection.gm.database.insert().into(this.className).set(this.data).one()
          .then((record) => done(null, Vertex.collection.inflate(record)));
    } else {
      // Return errors if schema is not valid
      return done(this.schema.errors);
    }
  }

  /**
   * Delete the vertex instance
   * @param done
   */
  delete(done) {
    Vertex.collection.gm.record.delete(this.rid).then(done);
  }

  /**
   * Check if the data of the object is valid
   * @param data Data of the vertex
   * @returns {Boolean}
   */
  isValid(data) {

    if (this.schema === null) {
      return true;
    }

    return  this.schema.validate(data);
  }
}

export default Vertex;
