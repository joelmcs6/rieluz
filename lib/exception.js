'use strict';

var GraphError = function(name, message, meta) {
    this.name = name;
    this.message =message;
    this.meta = meta || {};

    this.toString = () => `${this.name}: ${this.message}`;
};

export default GraphError;
