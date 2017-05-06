module.exports = [
	{
		test: /\.js$/,
		exclude: /node_modules/,
		loader: 'babel-loader'
	},
	{
		test: /node_modules[\\\/](utilities|rxjs-animation-loop)[\\\/].*\.js$/,
		loader: 'babel-loader'
	},
	{
		test: /\.json$/,
		loader: 'json-loader'
	},
	{
		test: /images[\/\\][\w\-]+\.png$/,
		loader: 'url-loader?limit=20000'
	}
];
