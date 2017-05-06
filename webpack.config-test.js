var webpack = require('webpack');
var loaders = require('./webpack.loaders.js');
var path    = require('path');

module.exports = {
	devtool: 'source-map',
	module: {
		loaders: loaders
	},
	output: {
		// source-map support for IntelliJ/WebStorm
		devtoolModuleFilenameTemplate:         '[absolute-resource-path]',
		devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]'
	},
	target: 'node',
	externals: [
		require('webpack-node-externals')({
			whitelist: ['utilities']
		})
	],
	plugins: [
		new webpack.ContextReplacementPlugin(
			/angular[\\\/]core[\\\/](esm[\\\/]src|src)[\\\/]linker/,
			path.resolve('./src'),
			{}
		),
		new webpack.ContextReplacementPlugin(
			/power-assert-formatter[\\\/]lib/,
			path.resolve('./src'),
			{}
		)
	]
};
