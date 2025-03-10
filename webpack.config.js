const {join} = require( 'path' );
const HtmlWebpackPlugin = require('html-webpack-plugin');

/**
 * @type {import('webpack').Configuration}
 */
module.exports = { 
    mode: 'development',
    entry: join( __dirname, 'src', 'index' ),
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        path: join( __dirname, 'dist' ),
        filename: '[name].min.js',
        clean: true,
        publicPath: '/'
    },
    module: {
        rules: [
            {
            test: /\.css$/i,
            use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
              },
        ],
    },
    devtool: 'inline-source-map',
    devServer: {
        static: join( __dirname, 'public' ),
        hot: true
    },
    plugins: [
        new HtmlWebpackPlugin({ title: 'Development' })
    ],
    optimization: {
        runtimeChunk: 'single'
    }
}