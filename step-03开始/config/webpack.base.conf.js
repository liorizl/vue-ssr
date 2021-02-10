const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const isProduction = process.env.NODE_ENV === 'production'

module.exports = {
    mode: 'development',

    resolve: {
        extensions: ['.js', '.vue']
    },

    output: {
        path: path.resolve(__dirname, '../dist'),
        filename: '[name].bundle.js',
    },
    devServer: {
        contentBase: '../dist'
    },
    module: {
        rules: [{
                test: /\.vue$/,
                use: ['vue-loader']
            },
            {
                test: /\.js$/,
                use: 'babel-loader'
            },
            // {
            //     test: /\.css$/,
            //     use: ['vue-style-loader', 'css-loader'],
            // }
        ]
    },

    plugins: [
        // new ExtractTextPlugin({ filename: 'common.[chunkhash].css' }), 
        new VueLoaderPlugin()
    ]
    // plugins: isProduction
    // // 确保添加了此插件！
    // ? [new ExtractTextPlugin({ filename: 'common.[chunkhash].css' }), new VueLoaderPlugin()]
    // : [new VueLoaderPlugin()]
};