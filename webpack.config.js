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
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: 'rieluz',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: path.join(__dirname, 'lib'),
      },
      {
        test: /\.js$/,
        loader: ['babel-loader', 'eslint-loader'],
        include: path.join(__dirname, 'lib'),
        exclude: /node_modules/,
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
