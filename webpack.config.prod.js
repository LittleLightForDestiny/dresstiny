const path = require('path');
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const HTMLWebpackPluginConfig = new HtmlWebpackPlugin({
	template: __dirname + '/src/index.html',
	path: "dist",
	filename: 'index.html',
	inject: 'body'
})

const CopyWebpackPlugin = require("copy-webpack-plugin");
const CopyWebpackPluginConfig = new CopyWebpackPlugin([{
	from: "src/lib",
	to: "lib"
}, {
	from: "src/assets",
	to: "assets"
}]);
module.exports = {
	entry: ['./src/ts/index.ts', './src/scss/main.scss'],
	devtool: 'inline-source-map',
	module: {
		rules: [{
			test: /\.tsx?$/,
			use: 'ts-loader',
			exclude: /node_modules/
		}, {
			test: /scss\/.*?\.scss$/,
			use: [{
					loader: 'file-loader',
					options: {
						name: '[name].css',
						outputPath: 'assets/css/'
					}
				},
				{
					loader: 'extract-loader'
				},
				{
					loader: 'css-loader'
				},
				{
					loader: 'postcss-loader'
				},
				{
					loader: 'sass-loader'
				}
			],
			exclude: [/node_modules/, /ts/]
		}, {
			test: /ts\/.*?\.scss$/,
			use: [
				'vue-style-loader',
				'css-loader',
				'sass-loader'
			]
		}, {
			test: /\.vue?$/,
			use: 'vue-loader',
			exclude: /node_modules/
		}]
	},
	resolve: {
		alias: {
			'vue$': 'vue/dist/vue.esm.js'
		},
		extensions: ['.tsx', '.ts', '.js', '.vue']
	},
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist')
	},
	plugins: [
		HTMLWebpackPluginConfig,
		CopyWebpackPluginConfig,
		new VueLoaderPlugin(),
		new webpack.DefinePlugin({
			'process.env': {
				NODE_ENV: '"production"'
			}
		})
	]
};
