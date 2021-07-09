import path from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';

module.exports = {
	// `eval()` not allowed in background scripts, source map generates `eval`s.
	devtool: false,
	entry: {
		content_script: './src/content_scripts/App.tsx',
		background_script: './src/background_scripts/index.ts'
	},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, './src/dist/'),
	},
	resolve: {
		extensions: [".tsx", ".ts", ".js", ".json"],
	},
	module: {
		rules: [
			// all files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'
			{
				test: /\.tsx?$/,
				use: ["ts-loader"],
				exclude: /node_modules/
			},
			{
				test: /\.css$/i,
				exclude: /node_modules/,
				use: [
					MiniCssExtractPlugin.loader,
					'css-loader',
					// 'style-loader'
				]
			},
		],
	},
	optimization: {
		nodeEnv: 'production', // only minify in production
		minimizer: [
			new CssMinimizerPlugin(), // minify css
			new TerserPlugin({
				terserOptions: {
					format: {
						ascii_only: true,
					}
				}
			}), // minify js 
		],
	},
	plugins: [
		new CleanWebpackPlugin(),
		new MiniCssExtractPlugin(),
	],
};