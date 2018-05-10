'use strict';

const webpack = require('webpack');
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');

module.exports = {
  entry: './lib/index.js',
  target: 'node',
  externals: [nodeExternals({
    whitelist: [/^lodash-es/]
  })],
  mode: 'production',
  optimization: {
    minimize: true
  },
  performance: {
    hints: false
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: 'rieluz',
    libraryTarget: 'commonjs'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: path.join(__dirname, 'lib'),
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    }),
    new LodashModuleReplacementPlugin()
  ]
};
