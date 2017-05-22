var webpack           = require('webpack');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var loaders           = require('./webpack.loaders.js');
var path              = require('path');

module.exports = {
	devtool: 'source-map',
	context: __dirname + '/src',
	entry: {
		'test-app/index':   [ 'babel-polyfill', './test-app/index.js' ],
		'demo-app/index':   [ 'babel-polyfill', 'zone.js/dist/zone.js', './demo-app/index.js' ]
	},
	output: {
		path: __dirname + '/dist',
		filename: '[name].js',
		// library: 'ProjectName',
		// libraryTarget: 'umd',
		sourceMapFilename: '[file].map',
		/* source-map support for IntelliJ/WebStorm */
		devtoolModuleFilenameTemplate:         '[absolute-resource-path]',
		devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]'
	},
	module: {
		loaders: loaders
	},
	plugins: [
		new webpack.optimize.OccurrenceOrderPlugin(),
		new CopyWebpackPlugin([
			{ from: 'test-app/index.html', to: 'test-app/index.html' },
			{ from: 'demo-app/index.html', to: 'demo-app/index.html' }
		]),
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
