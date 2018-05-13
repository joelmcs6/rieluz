import * as GraphManager from './GraphManager';

class VertexCollection {
  constructor(className, schema, connection) {
    this.conn = connection;
    this._gm = null;

    this.className = className;
    this.schema = schema;
  }

  /**
   * Get Graph Manager connected instance.
   * @returns GraphManager
   */
  gm() {
    if (!this._gm) {
      this._gm = GraphManager.getInstance(this.conn);
    }

    return this._gm;
  }

  /**
   * Updates or create a vertex on database
   * @param criteria
   * @param data
   * @returns {Promise.<*>}
   */
  async upsert(criteria, data) {
    // Validate data before the upset
    if (!this.schema.validate(data)) {
      throw new Error(`Invalid schema data: ${JSON.stringify(this.schema.errors)}`);
    }

    let record = await this.gm()
      .database
      .update(this.className)
      .set(data)
      .upsert(criteria)
      .return('after @this')
      .one();

    return this.inflate(record);
  }

  /**
   * Inflates the record to a Vertex object
   * @param record
   * @returns {*}
   */
  inflate(record) {
    if (record === undefined) {
      return record;
    }

    let vertex = {
      rid: record['@rid'].toString()
    };

    for (let propertyName in this.schema.structure) {
      vertex[propertyName] = record[propertyName];
    }

    return vertex;
  }

  /**
   * Create a new vertex in database
   * @param data
   * @returns {Promise.<*>}
   */
  async create(data) {
    // Validate data
    if (!this.schema.validate(data)) {
      throw new Error(`Invalid schema data: ${JSON.stringify(this.schema.errors)}`);
    }

    let record = await this.gm().database
      .insert()
      .into(this.className)
      .set(data)
      .one();

    return this.inflate(record);
  }

  /**
   * Delete vertex matching with criteria
   * @param criteria
   * @returns {Promise.<*>}
   */
  delete(criteria) {
    return this.gm().database
      .delete('VERTEX')
      .from(this.className)
      .where(criteria)
      .one();
  }

  /**
   * Returns first vertex matching with criteria
   * @param criteria
   * @returns {Promise.<*>}
   */
  async findOne(criteria) {
    let record = await this.gm().database
      .select()
      .from(this.className)
      .where(criteria)
      .one();

    return this.inflate(record);
  }

  /**
   * Create or update an edge
   * @param label
   * @param from
   * @param to
   * @param data
   * @returns {Promise.<*>}
   */
  async upsertEdge(label, from, to, data) {
    const edge = await this.gm().database
      .select()
      .from('E')
      .where({ in: to, out: from })
      .one();

    if (!edge) {
      return this.createEdge(label, from, to, data);
    } else {
      return this.gm().database
        .update(edge['@rid'].toString())
        .set(data)
        .one();
    }
  }

  /**
   * Create an edge
   * @param label
   * @param from
   * @param to
   * @param data
   * @returns {Promise.<*>}
   */
  createEdge(label, from, to, data) {
    return this.gm().database
      .create('EDGE', label)
      .set(data)
      .from(from)
      .to(to)
      .one();
  }

  /**
   * Delete edge
   * @param _class Optional, by default is null.
   * @param from
   * @param to
   * @returns {Promise.<*>}
   */
  deleteEdge(_class = null, from, to) {
    return this.gm().database
      .delete('EDGE', _class)
      .from(from)
      .to(to)
      .scalar();
  }

  /**
   * Execute query in database
   * @param query
   * @param params
   * @returns {Promise.<*>}
   */
  query(query, params) {
    return this.gm().database
      .query(query, { params: params });
  }

  getQueryBuilder() {
    return this.gm().database;
  }
}

export default VertexCollection;
