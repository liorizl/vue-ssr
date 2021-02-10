const { merge } = require('webpack-merge')
const path = require('path')
const webpack = require('webpack')
const base = require('./webpack.base.conf')
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin')
// const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = merge(base, {
    entry: {
        client: ['webpack-hot-middleware/client?reload=true', path.resolve(__dirname, '../entry-client.js')]
    },
    devtool: 'source-map',
    output: {
        publicPath: '/dist/'
    },
    optimization: {
        runtimeChunk: {
            // 别名
            name: 'manifest',
        },
        splitChunks: {
            chunks: 'all',
            minChunks: Infinity
        },
    },
    
    plugins: [
        // new HtmlWebpackPlugin({
        //     template: path.resolve(__dirname, '../index.html'),
        //     filename: 'index.html'
        // }),
        new VueSSRClientPlugin(), 
        new webpack.HotModuleReplacementPlugin()
    ]
})